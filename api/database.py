import sqlite3
import json
import logging
import uuid
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
import api.config as config

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civic_guardian_db")

class DatabaseManager:
    def __init__(self):
        self.use_sqlite = False
        self.mongo_client = None
        self.mongo_db = None
        self.sqlite_conn = None
        self.connect()

    def connect(self):
        try:
            logger.info(f"Attempting to connect to MongoDB at {config.MONGODB_URI}...")
            # We set a short timeout (2 seconds) so we don't hang startup if MongoDB is down
            self.mongo_client = MongoClient(config.MONGODB_URI, serverSelectionTimeoutMS=2000)
            # Trigger connection check
            self.mongo_client.server_info()
            self.mongo_db = self.mongo_client[config.DATABASE_NAME]
            self.use_sqlite = False
            logger.info("Successfully connected to MongoDB!")
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Falling back to SQLite database at {config.DB_FALLBACK_PATH}")
            self.use_sqlite = True
            self.init_sqlite()

    def init_sqlite(self):
        try:
            self.sqlite_conn = sqlite3.connect(config.DB_FALLBACK_PATH, check_same_thread=False)
            self.sqlite_conn.row_factory = sqlite3.Row
            cursor = self.sqlite_conn.cursor()
            
            # Create reports table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    description TEXT,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    image_url TEXT,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    ai_confidence REAL,
                    ai_analysis TEXT,
                    reporter_name TEXT,
                    severity TEXT NOT NULL
                )
            """)
            self.sqlite_conn.commit()
            logger.info("SQLite database initialized successfully.")
        except Exception as sqlite_err:
            logger.critical(f"Failed to initialize SQLite database: {sqlite_err}")
            raise sqlite_err

    def _get_sqlite_cursor(self):
        if not self.sqlite_conn:
            self.init_sqlite()
        return self.sqlite_conn.cursor()

    def get_all_reports(self):
        if not self.use_sqlite:
            try:
                reports = list(self.mongo_db.reports.find())
                for r in reports:
                    r["id"] = str(r["_id"])
                    del r["_id"]
                return reports
            except Exception as e:
                logger.error(f"MongoDB query failed, attempting SQLite fallback: {e}")
                self.use_sqlite = True
                self.init_sqlite()
        
        # SQLite implementation
        try:
            cursor = self._get_sqlite_cursor()
            cursor.execute("SELECT * FROM reports ORDER BY created_at DESC")
            rows = cursor.fetchall()
            reports = []
            for row in rows:
                report = dict(row)
                # Decode JSON strings
                if report.get("ai_analysis"):
                    try:
                        report["ai_analysis"] = json.loads(report["ai_analysis"])
                    except Exception:
                        pass
                reports.append(report)
            return reports
        except Exception as e:
            logger.error(f"SQLite select failed: {e}")
            return []

    def get_report_by_id(self, report_id: str):
        if not self.use_sqlite:
            try:
                from bson import ObjectId
                query = {"_id": report_id}
                # If it's a valid object ID, query it, otherwise check it as string
                try:
                    query = {"_id": ObjectId(report_id)}
                except Exception:
                    query = {"id": report_id}
                
                report = self.mongo_db.reports.find_one(query)
                if not report:
                    # check if id is string-based
                    report = self.mongo_db.reports.find_one({"id": report_id})
                
                if report:
                    report["id"] = str(report.get("_id", report.get("id")))
                    if "_id" in report:
                        del report["_id"]
                    return report
                return None
            except Exception as e:
                logger.error(f"MongoDB query by ID failed, trying SQLite: {e}")
                self.use_sqlite = True
                self.init_sqlite()
                
        # SQLite implementation
        try:
            cursor = self._get_sqlite_cursor()
            cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
            row = cursor.fetchone()
            if row:
                report = dict(row)
                if report.get("ai_analysis"):
                    try:
                        report["ai_analysis"] = json.loads(report["ai_analysis"])
                    except Exception:
                        pass
                return report
            return None
        except Exception as e:
            logger.error(f"SQLite select by ID failed: {e}")
            return None

    def create_report(self, report_data: dict) -> dict:
        if "id" not in report_data or not report_data["id"]:
            report_data["id"] = str(uuid.uuid4())
        
        if "created_at" not in report_data or not report_data["created_at"]:
            report_data["created_at"] = datetime.utcnow().isoformat()
            
        if "status" not in report_data or not report_data["status"]:
            report_data["status"] = "pending"

        if not self.use_sqlite:
            try:
                # Store with string ID
                result = self.mongo_db.reports.insert_one(report_data.copy())
                # Ensure the id is returned cleanly
                report_data["id"] = str(result.inserted_id)
                if "_id" in report_data:
                    del report_data["_id"]
                return report_data
            except Exception as e:
                logger.error(f"MongoDB insert failed, falling back to SQLite: {e}")
                self.use_sqlite = True
                self.init_sqlite()

        # SQLite implementation
        try:
            cursor = self.sqlite_conn.cursor()
            ai_analysis_str = json.dumps(report_data.get("ai_analysis", {}))
            
            cursor.execute("""
                INSERT INTO reports (
                    id, title, category, description, latitude, longitude, 
                    image_url, status, created_at, ai_confidence, ai_analysis, reporter_name, severity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report_data["id"],
                report_data["title"],
                report_data["category"],
                report_data.get("description", ""),
                report_data["latitude"],
                report_data["longitude"],
                report_data.get("image_url", ""),
                report_data["status"],
                report_data["created_at"],
                report_data.get("ai_confidence", 0.0),
                ai_analysis_str,
                report_data.get("reporter_name", "Anonymous User"),
                report_data.get("severity", "medium")
            ))
            self.sqlite_conn.commit()
            return report_data
        except Exception as e:
            logger.error(f"SQLite insert failed: {e}")
            raise e

    def update_report_status(self, report_id: str, status: str) -> bool:
        if not self.use_sqlite:
            try:
                from bson import ObjectId
                # Try updating by ObjectId or string ID
                query = {"id": report_id}
                try:
                    query = {"$or": [{"_id": ObjectId(report_id)}, {"id": report_id}]}
                except Exception:
                    pass
                
                result = self.mongo_db.reports.update_one(
                    query,
                    {"$set": {"status": status}}
                )
                if result.modified_count > 0:
                    return True
                # If mongodb update didn't match, check if it's there
                report = self.get_report_by_id(report_id)
                if report:
                    self.mongo_db.reports.update_one({"id": report["id"]}, {"$set": {"status": status}})
                    return True
                return False
            except Exception as e:
                logger.error(f"MongoDB update failed, trying SQLite: {e}")
                self.use_sqlite = True
                self.init_sqlite()

        # SQLite implementation
        try:
            cursor = self.sqlite_conn.cursor()
            cursor.execute("UPDATE reports SET status = ? WHERE id = ?", (status, report_id))
            self.sqlite_conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"SQLite update failed: {e}")
            return False

    def clear_all_reports(self) -> bool:
        """Helper to clear database - mostly for testing/reseeding"""
        if not self.use_sqlite:
            try:
                self.mongo_db.reports.delete_many({})
                return True
            except Exception:
                pass
        
        try:
            cursor = self.sqlite_conn.cursor()
            cursor.execute("DELETE FROM reports")
            self.sqlite_conn.commit()
            return True
        except Exception:
            return False

# Export a single global instance
db = DatabaseManager()
