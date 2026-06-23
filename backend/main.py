import os
import shutil
import math
from datetime import datetime
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import backend.config as config
from backend.database import db
from backend.models import ReportResponse, StatusUpdate, HotspotResponse
from backend.ai_service import analyze_civic_issue

app = FastAPI(
    title="Smart Civic Guardian API",
    description="Backend API for AI-powered urban issue detection and hotspot mapping in Dombivli",
    version="1.0.0"
)

# Import uuid for secure filename generation
import uuid

# Configure CORS so the React frontend can make requests securely
# We restrict allowed origins to local development servers to prevent cross-site request forgery/hijacking
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://127.0.0.1"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory to serve images statically
app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR), name="uploads")

# Haversine distance helper to calculate distance between two coordinates in meters
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Radius of the Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Civic Guardian API. Visit /docs for documentation."}

@app.get("/api/reports", response_model=List[ReportResponse])
def get_reports():
    """Retrieve all reports from the database."""
    return db.get_all_reports()

@app.post("/api/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    title: str = Form(...),
    category: str = Form(...),
    description: str = Form(""),
    latitude: float = Form(...),
    longitude: float = Form(...),
    reporter_name: str = Form("Anonymous User"),
    severity: str = Form("medium"),
    image: UploadFile = File(None)
):
    """
    Create a new report. Handles image file upload, triggers AI analysis,
    and stores the report in the database.
    """
    # 1. Input sanitization: Coordinate boundary checks
    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180."
        )

    # Clean string inputs to prevent basic Cross-Site Scripting (XSS)
    title = title.replace("<", "&lt;").replace(">", "&gt;").strip()
    description = description.replace("<", "&lt;").replace(">", "&gt;").strip()
    reporter_name = reporter_name.replace("<", "&lt;").replace(">", "&gt;").strip()

    # 2. Save uploaded image file if provided
    image_url = None
    ai_confidence = 0.0
    ai_analysis = None
    
    if image:
        # A. File size limit enforcement (5MB)
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Megabytes
        contents = await image.read(MAX_FILE_SIZE + 1)
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum allowed size is 5MB."
            )
        await image.seek(0)  # Reset read pointer

        # B. Content-Type (MIME) validation
        ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed."
            )

        # C. File extension validation & secure filename generation
        # This completely mitigates Directory Traversal attacks (e.g. filename like ../../etc/passwd)
        orig_ext = os.path.splitext(image.filename)[1].lower()
        if orig_ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .gif are allowed."
            )
        
        filename = f"{uuid.uuid4()}{orig_ext}"
        file_path = os.path.join(config.UPLOAD_DIR, filename)
        
        # Save file to disk
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            # Formulate the URL path
            image_url = f"/uploads/{filename}"
            
            # 2. Run AI Analysis
            ai_result = analyze_civic_issue(file_path, category)
            ai_confidence = ai_result.get("confidence", 0.8)
            ai_analysis = ai_result
            
            # Update category and severity if AI refined it
            if "category" in ai_result:
                category = ai_result["category"]
            if "severity" in ai_result:
                severity = ai_result["severity"]
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image upload or AI analysis failed: {str(e)}"
            )
    else:
        # No image uploaded - create a mock AI analysis for completeness
        ai_analysis = {
            "category": category,
            "confidence": 0.5,
            "severity": severity,
            "explanation": "No image uploaded. Classified based on user reporting metadata.",
            "detected_details": ["Reporter metadata provided"],
            "action_recommendation": "Dispatch area inspector to verify report details."
        }

    # 3. Save to database
    report_data = {
        "title": title,
        "category": category,
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
        "image_url": image_url,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "ai_confidence": ai_confidence,
        "ai_analysis": ai_analysis,
        "reporter_name": reporter_name,
        "severity": severity
    }
    
    try:
        saved_report = db.create_report(report_data)
        return saved_report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save report: {str(e)}"
        )

@app.put("/api/reports/{report_id}/status")
def update_status(report_id: str, payload: StatusUpdate):
    """Update the status of a reported issue (Admin/Authority action)."""
    success = db.update_report_status(report_id, payload.status)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or status update failed."
        )
    return {"message": f"Report status updated to '{payload.status}' successfully."}

@app.get("/api/hotspots", response_model=List[HotspotResponse])
def get_hotspots():
    """
    Groups reports spatially to identify 'hotspots' (problem areas).
    Calculates clusters of issues that are within 600 meters of each other.
    """
    reports = db.get_all_reports()
    
    # Simple spatial clustering (distance threshold = 600 meters)
    THRESHOLD_METERS = 600.0
    clusters = []
    
    for report in reports:
        # Skip resolved reports as they no longer present active hotspots
        if report.get("status") == "resolved":
            continue
            
        lat = report["latitude"]
        lon = report["longitude"]
        
        # Check if report belongs to any existing cluster
        added_to_cluster = False
        for cluster in clusters:
            # We compare with the cluster center
            dist = haversine_distance(lat, lon, cluster["lat_sum"]/cluster["count"], cluster["lon_sum"]/cluster["count"])
            if dist <= THRESHOLD_METERS:
                cluster["reports"].append(report)
                cluster["lat_sum"] += lat
                cluster["lon_sum"] += lon
                cluster["count"] += 1
                added_to_cluster = True
                break
                
        if not added_to_cluster:
            # Create a new cluster
            clusters.append({
                "reports": [report],
                "lat_sum": lat,
                "lon_sum": lon,
                "count": 1
            })
            
    # Format clusters into Hotspot responses (only if they have 2 or more reports)
    # This acts as a hotspot filter
    hotspots = []
    for idx, cluster in enumerate(clusters):
        if cluster["count"] < 2:
            continue  # Needs at least 2 issues to be considered a hotspot
            
        center_lat = cluster["lat_sum"] / cluster["count"]
        center_lon = cluster["lon_sum"] / cluster["count"]
        
        # Calculate category breakdown
        breakdown = {}
        for r in cluster["reports"]:
            cat = r["category"]
            breakdown[cat] = breakdown.get(cat, 0) + 1
            
        # Find primary issue
        primary = max(breakdown, key=breakdown.get)
        
        # Determine overall severity (critical/high/medium/low) based on severity count
        severity_points = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        total_points = sum(severity_points.get(r.get("severity", "medium"), 2) for r in cluster["reports"])
        avg_points = total_points / cluster["count"]
        
        overall_severity = "medium"
        if avg_points >= 3.2:
            overall_severity = "critical"
        elif avg_points >= 2.5:
            overall_severity = "high"
        elif avg_points >= 1.5:
            overall_severity = "medium"
        else:
            overall_severity = "low"
            
        # AI-style description of the hotspot based on categories and count
        location_desc = f"Area near latitude {center_lat:.4f}, longitude {center_lon:.4f}"
        if center_lat > 19.22:
            location_desc = "Dombivli East (Station Road / Phadke Road area)"
        elif center_lat < 19.215 and center_lon > 73.09:
            location_desc = "Kalyan-Shilphata Road Corridor"
        elif center_lat < 19.215 and center_lon < 73.08:
            location_desc = "Dombivli West (Gupte Road / Garibachawada area)"
        else:
            location_desc = "Thakurli / Central Dombivli grid"
            
        description = (
            f"AI Prediction: High strain detected in {location_desc}. "
            f"Clustering of {cluster['count']} active {primary} issues indicates infrastructural degradation. "
            f"Maintenance routing priority is recommended."
        )
        
        hotspots.append({
            "id": f"hotspot_{idx+1}",
            "latitude": center_lat,
            "longitude": center_lon,
            "radius_meters": THRESHOLD_METERS - 100.0,
            "issue_count": cluster["count"],
            "category_breakdown": breakdown,
            "primary_issue": primary,
            "description": description,
            "severity": overall_severity
        })
        
    return hotspots

@app.post("/api/simulate")
def seed_simulation_data():
    """Seeds the database with a rich set of realistic mock reports in Dombivli."""
    # Clear existing reports first to avoid duplicate seed issues
    db.clear_all_reports()
    
    # 12 mock reports centered around Dombivli
    mock_reports = [
        {
            "id": "mock_report_1",
            "title": "Severe Potholes near Dombivli East Station",
            "category": "pothole",
            "description": "Large cluster of deep potholes right outside the railway station entrance, causing heavy traffic and risk for bikes.",
            "latitude": 19.2185,
            "longitude": 73.0882,
            "image_url": None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.94,
            "ai_analysis": {
                "category": "pothole",
                "confidence": 0.94,
                "severity": "critical",
                "explanation": "Multiple large potholes filled with water observed in busy pedestrian zone. High hazard level.",
                "detected_details": ["Three potholes > 10cm depth", "Waterlogged cavities", "Station road traffic lane blocked"],
                "action_recommendation": "Dispatch rapid road patch team tonight."
            },
            "reporter_name": "Rohan Joshi",
            "severity": "critical"
        },
        {
            "id": "mock_report_2",
            "title": "Garbage Accumulation on Phadke Road",
            "category": "garbage",
            "description": "Massive pile of plastic bags and household waste left on the side of Phadke Road. It has been there for 3 days and smells terrible.",
            "latitude": 19.2198,
            "longitude": 73.0895,
            "image_url": None,
            "status": "investigating",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.89,
            "ai_analysis": {
                "category": "garbage",
                "confidence": 0.89,
                "severity": "high",
                "explanation": "Uncontrolled heap of garbage blocking the footpath. Plastic litter scattered.",
                "detected_details": ["Footpath blockage", "Organic food waste decay", "Plastic packaging"],
                "action_recommendation": "Send KDMC waste disposal vehicle."
            },
            "reporter_name": "Sneha Patil",
            "severity": "high"
        },
        {
            "id": "mock_report_3",
            "title": "Broken Streetlight near Gupte Road, Dombivli West",
            "category": "streetlight",
            "description": "Streetlight pole is leaning slightly and the light hasn't been working for a week. The street is completely pitch black at night.",
            "latitude": 19.2142,
            "longitude": 73.0821,
            "image_url": None,
            "status": "in_progress",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.82,
            "ai_analysis": {
                "category": "streetlight",
                "confidence": 0.82,
                "severity": "medium",
                "explanation": "Leaning streetlight pole with dead sodium vapor lamp. Wire casing is exposed.",
                "detected_details": ["Leaning pole", "Exposed wiring", "Dark street stretch"],
                "action_recommendation": "Electrical wiring maintenance and bulb replacement."
            },
            "reporter_name": "Amit Karande",
            "severity": "medium"
        },
        {
            "id": "mock_report_4",
            "title": "Severe Waterlogging near Kalyan-Shilphata Road",
            "category": "waterlogging",
            "description": "Following yesterday's heavy rain, the road near the Shilphata junction is completely flooded. Cars are stalling in 2 feet of water.",
            "latitude": 19.2081,
            "longitude": 73.0954,
            "image_url": None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.95,
            "ai_analysis": {
                "category": "waterlogging",
                "confidence": 0.95,
                "severity": "critical",
                "explanation": "Massive water logging over 150m road stretch. Water depth estimated at 40-50cm. Major highway congestion.",
                "detected_details": ["Flooded highway", "Stalled vehicles", "Clogged storm drain culvert"],
                "action_recommendation": "Clear storm drain culverts and deploy high capacity diesel water pumps."
            },
            "reporter_name": "Vikram Singh",
            "severity": "critical"
        },
        {
            "id": "mock_report_5",
            "title": "Traffic Gridlock at Shivaji Chowk",
            "category": "traffic",
            "description": "Complete gridlock due to a broken down auto-rickshaw and poorly timed signals. Vehicles haven't moved for 20 minutes.",
            "latitude": 19.2172,
            "longitude": 73.0858,
            "image_url": None,
            "status": "resolved",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.91,
            "ai_analysis": {
                "category": "traffic",
                "confidence": 0.91,
                "severity": "high",
                "explanation": "High vehicle congestion at primary junction Shivaji Chowk. Auto-rickshaw blockage observed.",
                "detected_details": ["Shivaji Chowk junction gridlock", "15+ autos and cars jammed"],
                "action_recommendation": "Deploy traffic police warden to clear roadblock."
            },
            "reporter_name": "Rajesh Mehta",
            "severity": "high"
        },
        {
            "id": "mock_report_6",
            "title": "Illegal Dumping of Construction Debris, Thakurli",
            "category": "illegal_dumping",
            "description": "A contractor dumped a whole truckload of concrete rubble and bricks right on the green belt space next to the railway line.",
            "latitude": 19.2251,
            "longitude": 73.0921,
            "image_url": None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.87,
            "ai_analysis": {
                "category": "illegal_dumping",
                "confidence": 0.87,
                "severity": "high",
                "explanation": "Concrete debris and cement dust piled on vegetation. Heavy vehicle tracks visible.",
                "detected_details": ["Construction bricks", "Cement rubble", "Environmental damage"],
                "action_recommendation": "Enforce municipal fine and send loader to clear debris."
            },
            "reporter_name": "Priyanka Nair",
            "severity": "high"
        },
        {
            "id": "mock_report_7",
            "title": "Clogged Drain and Water Accumulation, Gupte Road",
            "category": "waterlogging",
            "description": "The open drainage gutter is overflowing with plastic trash, causing smelly sewage water to leak onto Gupte Road.",
            "latitude": 19.2135,
            "longitude": 73.0809,
            "image_url": None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.88,
            "ai_analysis": {
                "category": "waterlogging",
                "confidence": 0.88,
                "severity": "high",
                "explanation": "Overflowing sewer water on street. High plastic clog density in drainage channels.",
                "detected_details": ["Drainage blockage", "Raw sewage outflow", "Footpath contamination"],
                "action_recommendation": "Clean drainage channel of plastic cups and bags."
            },
            "reporter_name": "Amit Karande",
            "severity": "high"
        },
        {
            "id": "mock_report_8",
            "title": "Potholes on Gupte Road, Dombivli West",
            "category": "pothole",
            "description": "Several medium-sized potholes have opened up near the corner of Gupte Road, causing autos to swerve dangerously.",
            "latitude": 19.2150,
            "longitude": 73.0815,
            "image_url": None,
            "status": "investigating",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.86,
            "ai_analysis": {
                "category": "pothole",
                "confidence": 0.86,
                "severity": "medium",
                "explanation": "Multiple surface pits on blacktop. Depth is ~5-8cm. Hazard for lightweight vehicles.",
                "detected_details": ["Potholes in row", "Auto-rickshaw collision hazard"],
                "action_recommendation": "Execute standard patch repair."
            },
            "reporter_name": "Karan Bhatia",
            "severity": "medium"
        },
        {
            "id": "mock_report_9",
            "title": "Garbage Dump near Kalyan-Shilphata Highway",
            "category": "garbage",
            "description": "Dump trucks have been unloading garbage in an open field near the Shilphata highway. It attracts stray dogs and cows, causing safety issues on the road.",
            "latitude": 19.2092,
            "longitude": 73.0968,
            "image_url": None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.90,
            "ai_analysis": {
                "category": "garbage",
                "confidence": 0.90,
                "severity": "high",
                "explanation": "Large-scale garbage pile near highway shoulder. Animals (stray dogs) foraging. Danger to high-speed traffic.",
                "detected_details": ["Open landfill style pile", "Dog pack gathering", "Highway proximity"],
                "action_recommendation": "Install fencing and clear garbage immediately."
            },
            "reporter_name": "Vikram Singh",
            "severity": "high"
        },
        {
            "id": "mock_report_10",
            "title": "Broken Streetlight on Station Road (East)",
            "category": "streetlight",
            "description": "The streetlight outside the main shopping complex has been flickering and is now dead, leaving the crowded footpath dark.",
            "latitude": 19.2192,
            "longitude": 73.0888,
            "image_url": None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.81,
            "ai_analysis": {
                "category": "streetlight",
                "confidence": 0.81,
                "severity": "medium",
                "explanation": "Inactive overhead LED luminaire in a commercial shopping zone.",
                "detected_details": ["Flickering/dead fixture", "Dense commercial crowd in dark"],
                "action_recommendation": "Replace LED driver board."
            },
            "reporter_name": "Rohan Joshi",
            "severity": "medium"
        },
        {
            "id": "mock_report_11",
            "title": "Severe Traffic Congestion on Phadke Road",
            "category": "traffic",
            "description": "Vehicles are gridlocked for over 500 meters due to double parking and loading trucks.",
            "latitude": 19.2205,
            "longitude": 73.0905,
            "image_url": None,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.87,
            "ai_analysis": {
                "category": "traffic",
                "confidence": 0.87,
                "severity": "high",
                "explanation": "Double-lane commercial traffic blockage. Delivery trucks obstructing road width.",
                "detected_details": ["Delivery vehicle block", "500m vehicle line"],
                "action_recommendation": "Restrict truck offloading to night hours."
            },
            "reporter_name": "Sneha Patil",
            "severity": "high"
        },
        {
            "id": "mock_report_12",
            "title": "Dangling Electric Wires, Dombivli West",
            "category": "streetlight",
            "description": "High-voltage electric wires have snapped and are hanging dangerously low over the street near the temple.",
            "latitude": 19.2155,
            "longitude": 73.0833,
            "image_url": None,
            "status": "in_progress",
            "created_at": datetime.utcnow().isoformat(),
            "ai_confidence": 0.93,
            "ai_analysis": {
                "category": "streetlight",
                "confidence": 0.93,
                "severity": "critical",
                "explanation": "Snapped utility wires hanging at a height of 1.5m above ground in a residential street. Highly critical hazard.",
                "detected_details": ["Low hanging power cables", "Temple road pedestrian zone"],
                "action_recommendation": "Shut down transformer power line and dispatch emergency repair team immediately."
            },
            "reporter_name": "Sunita Deshmukh",
            "severity": "critical"
        }
    ]
    
    # Save each report to the database
    seeded_count = 0
    for r in mock_reports:
        try:
            db.create_report(r)
            seeded_count += 1
        except Exception as e:
            logger.error(f"Failed to seed report {r['id']}: {e}")
            
    return {"message": f"Successfully cleared database and seeded {seeded_count} Dombivli reports."}
