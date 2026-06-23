# Smart Civic Guardian – AI-Powered Urban Issue Detection

Smart Civic Guardian is a modern, data-driven civic management and reporting system built specifically for the **Kalyan-Dombivli** region. It empowers citizens to report civic infrastructure issues (potholes, waterlogging, garbage accumulation, traffic congestion, broken streetlights, and illegal dumping) and utilizes AI to analyze reports, calculate spatial hotspots, and predict urban maintenance strain.

---

## 🚀 Key Features

1. **Interactive Live Map (Leaflet)**
   - Custom dark-theme map centering around Dombivli (`19.2183° N, 73.0867° E`).
   - Category-specific color-coded pins (Red for potholes, Yellow for garbage, etc.).
   - Interactive popups showing the issue description, photos, and live resolution status.
   - **Heatmap Toggle** that blends active issue coordinates into a glowing density overlay.

2. **AI Multimodal Diagnostics (Gemini & YOLOv8)**
   - **Gemini API:** Performs deep visual classification of uploaded pictures, extracting visual clues, determining severity, and listing official action recommendations.
   - **YOLOv8 Local Model:** Runs a local object detector to count traffic congestion indicators (cars, rickshaws) or waste materials.
   - **Fail-safe Fallback:** Fallback heuristics activate when API keys or heavy packages are unavailable, guaranteeing immediate local execution.

3. **AI Hotspot Predictions**
   - Implements a Haversine clustering algorithm that groups reports within 600 meters of each other.
   - Highlights clustered zones on the map with glowing transparent circle overlays.
   - Predicts infrastructural strain and highlights priority road/maintenance corridors.

4. **Municipal Authority Dashboard**
   - Administration console to track, filter, and inspect reports.
   - Live status workflow updates (Pending $\rightarrow$ Investigating $\rightarrow$ In Progress $\rightarrow$ Resolved).
   - "Inspect Panel" displaying detailed visual logs, confidence scores, and recommendations.

5. **Built-in Dombivli Civic Simulator**
   - Instant simulation seeder to populate the map with 12 mock issues (representing waterlogging on Shilphata Road, potholes outside Dombivli East Station, and darkness on Gupte Road) to quickly test analytics.

---

## 📂 Project Structure

```text
Smart Civic Guardian/
├── backend/
│   ├── data/                 # SQLite local fallback DB & uploads
│   ├── main.py               # FastAPI server & Hotspots Clustering API
│   ├── database.py           # MongoDB driver + SQLite Fallback Layer
│   ├── ai_service.py         # Gemini API & YOLOv8 image detection
│   ├── config.py             # Environment configurations
│   ├── models.py             # Pydantic schemas
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend Docker instructions
├── frontend/
│   ├── src/
│   │   ├── components/       # Map, Form, Insights, Authority, Simulator
│   │   ├── App.jsx           # Main state coordinator & shell
│   │   ├── index.css         # Dark glassmorphism styling
│   │   └── main.jsx          # Entry point
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite config proxy settings
│   └── Dockerfile            # Multi-stage production Nginx Dockerfile
├── docker-compose.yml        # Orchestration script (DB + Backend + Frontend)
└── README.md                 # Project guide
```

---

## 🛠️ Local Developer Setup

To run the application locally on your machine, follow these instructions:

### 1. Start the Backend API (FastAPI)
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. *(Optional)* Add your Gemini API Key in a `.env` file inside the `backend` folder:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: If no key is set, the application will automatically fall back to mock AI analysis, allowing full testing.*
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
6. Verify the backend is active at `http://127.0.0.1:8000/` and view documentation at `http://127.0.0.1:8000/docs`.

### 2. Start the Frontend (Vite + React)
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 🐳 Running with Docker

To containerize the application and run the frontend, backend, and MongoDB database together:

1. Make sure you have Docker installed and running.
2. In the root directory, start the containers:
   ```bash
   docker-compose up --build
   ```
3. The frontend will be served at `http://localhost` (Port 80) and the backend API will run at `http://localhost/api` (proxied by Nginx).
