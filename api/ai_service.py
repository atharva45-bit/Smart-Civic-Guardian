import os
import json
import logging
from PIL import Image
import api.config as config

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civic_guardian_ai")

# 1. Graceful import & initialization of YOLOv8
YOLO_AVAILABLE = False
yolo_model = None

try:
    from ultralytics import YOLO
    # Load model (downloads yolov8n.pt if not present in CWD or backend)
    # We load yolov8n.pt (Nano version, very fast and light, approx 6MB)
    logger.info("Initializing YOLOv8 model...")
    yolo_model = YOLO("yolov8n.pt")
    YOLO_AVAILABLE = True
    logger.info("YOLOv8 initialized successfully!")
except Exception as e:
    logger.warning(f"YOLOv8 could not be initialized (ultralytics/torch might not be installed): {e}. Falling back to mock object detection.")

# 2. Configure Gemini API
GEMINI_AVAILABLE = False
if config.GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=config.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
        logger.info("Gemini API configured successfully!")
    except Exception as e:
        logger.warning(f"Failed to configure Gemini API: {e}")
else:
    logger.info("No GEMINI_API_KEY found in configuration. Gemini analysis will be mocked.")

def run_local_yolo(image_input) -> dict:
    """Runs local YOLOv8 to detect COCO objects and infers indicators for civic issues."""
    if not YOLO_AVAILABLE or yolo_model is None:
        return {"objects_detected": [], "indicators": {}}
        
    try:
        # YOLOv8 accepts file paths, PIL Images, or tensors directly
        results = yolo_model(image_input, verbose=False)
        detected = []
        indicators = {
            "traffic_density": 0,
            "trash_indicators": 0,
            "streetlight_indicators": 0
        }
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                label = yolo_model.names[class_id]
                conf = float(box.conf[0])
                detected.append({"label": label, "confidence": conf})
                
                # Check for traffic indicators (cars, buses, trucks, motorcycles)
                if label in ["car", "bus", "truck", "motorcycle"]:
                    indicators["traffic_density"] += 1
                # Check for garbage indicators (handbag, bottle, cup, backpack)
                elif label in ["bottle", "cup", "handbag", "suitcase"]:
                    indicators["trash_indicators"] += 1
                # Check for streetlights (YOLOv8 COCO has "traffic light", "stop sign", "fire hydrant")
                elif label in ["traffic light"]:
                    indicators["streetlight_indicators"] += 1
                    
        return {
            "objects_detected": detected[:10], # limit to top 10
            "indicators": indicators
        }
    except Exception as e:
        logger.error(f"YOLO execution failed: {e}")
        return {"objects_detected": [], "indicators": {}}

def run_gemini_analysis(image_input, category_hint: str) -> dict:
    """Uses Gemini API to analyze the image and return a structured analysis of the civic issue."""
    if not GEMINI_AVAILABLE:
        return {}
        
    try:
        # Load the image depending on whether it is a path, stream, or PIL Image object
        if isinstance(image_input, str):
            img = Image.open(image_input)
        elif hasattr(image_input, "read"):
            # Reset seek pointer just in case
            if hasattr(image_input, "seek"):
                image_input.seek(0)
            img = Image.open(image_input)
        else:
            img = image_input
            
        # Prepare the model (using gemini-1.5-flash for speed and lower latency)
        model_name = "gemini-1.5-flash"
        model = genai.GenerativeModel(model_name)
        
        prompt = f"""
        Analyze this image uploaded by a citizen reporting a civic issue in the Kalyan-Dombivli region.
        The user has categorized this issue as: '{category_hint}'.
        
        Determine if the image represents any of these categories:
        1. pothole (potholes/damaged roads)
        2. garbage (garbage dumps/illegal waste piling)
        3. streetlight (broken, dark, or leaning streetlights)
        4. waterlogging (flooding, clogged drains, water accumulation)
        5. traffic (traffic congestion, gridlocks, blocked lanes)
        6. illegal_dumping (construction debris, dumping of soil/chemicals)
        7. other (any other infrastructure issue)
        
        Respond ONLY with a valid JSON object matching the following structure:
        {{
            "category": "pothole | garbage | streetlight | waterlogging | traffic | illegal_dumping | other",
            "confidence": 0.95, // float between 0.0 and 1.0
            "severity": "low | medium | high | critical",
            "explanation": "Brief explanation of what is visible and why it was classified.",
            "detected_details": ["detail 1", "detail 2"], // list of specific observations
            "action_recommendation": "What the civic authority should do immediately"
        }}
        
        Provide the response strictly as raw JSON. Do not write anything outside of the JSON block. Do not include markdown formatting like ```json.
        """
        
        response = model.generate_content([prompt, img])
        response_text = response.text.strip()
        
        # Clean markdown formatting if model output it
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        analysis = json.loads(response_text)
        return analysis
    except Exception as e:
        logger.error(f"Gemini API analysis failed: {e}")
        return {}

def run_mock_analysis(category_hint: str, yolo_results: dict) -> dict:
    """Generates a realistic mock AI response based on the category hint and YOLO results."""
    category = category_hint if category_hint in [
        "pothole", "garbage", "streetlight", "waterlogging", "traffic", "illegal_dumping"
    ] else "other"
    
    # Custom details based on category
    details = []
    severity = "medium"
    explanation = f"Detected a potential civic issue related to {category}."
    action = "Dispatch inspection team."
    confidence = 0.82
    
    if category == "pothole":
        details = ["Damaged road surface", "Asphalt crack", "Hazardous depression"]
        severity = "high"
        explanation = "Image shows structural road damage. Pothole poses immediate hazard to vehicles, particularly two-wheelers."
        action = "Fill pothole with cold-mix asphalt and level road surface."
        confidence = 0.88
    elif category == "garbage":
        details = ["Scattered solid waste", "Plastic waste pile", "Uncollected garbage bins"]
        severity = "medium"
        explanation = "Unregulated garbage piling detected on public street. Represents public hygiene hazard."
        action = "Send waste management vehicle for clearing and cleanup."
        confidence = 0.85
    elif category == "streetlight":
        details = ["Dark streetlight fixture", "Damaged pole connection", "Overgrown branches near wire"]
        severity = "medium"
        explanation = "Reported streetlight issue. May compromise street safety during night hours."
        action = "Schedule electrical utility technician to replace bulb/fixture."
        confidence = 0.78
    elif category == "waterlogging":
        details = ["Flooded road surface", "Muddy standing water", "Clogged storm drain inlet"]
        severity = "critical"
        explanation = "Significant waterlogging detected. Impedes traffic flow and poses risk of vector-borne diseases."
        action = "Clear drain inlets and deploy dewatering pump if necessary."
        confidence = 0.91
    elif category == "traffic":
        details = ["Heavy vehicle buildup", "Gridlock at intersection", "Slow moving queue"]
        severity = "high"
        explanation = f"High vehicle density observed. YOLO local detector found {yolo_results.get('indicators', {}).get('traffic_density', 0)} vehicles."
        action = "Optimize traffic signal timings or deploy traffic wardens."
        confidence = 0.89
    elif category == "illegal_dumping":
        details = ["Construction debris", "Piles of brick/concrete", "Soil dumping on roadside"]
        severity = "high"
        explanation = "Unauthorized dumping of heavy construction waste blocking public footpath."
        action = "Fines notification and removal of debris by municipal truck."
        confidence = 0.84
        
    return {
        "category": category,
        "confidence": confidence,
        "severity": severity,
        "explanation": explanation,
        "detected_details": details,
        "action_recommendation": action
    }

def analyze_civic_issue(image_input, category_hint: str) -> dict:
    """Main AI Service Entrypoint: Runs local YOLO, tries Gemini, falls back to smart mock if needed."""
    logger.info(f"Starting AI analysis on image stream with hint '{category_hint}'")
    
    # 1. Run local YOLOv8
    yolo_results = run_local_yolo(image_input)
    
    # 2. Try Gemini analysis
    gemini_results = {}
    if GEMINI_AVAILABLE:
        gemini_results = run_gemini_analysis(image_input, category_hint)
        
    # 3. Compile results: prefer Gemini, fallback to mock, supplement with YOLO detections
    if gemini_results and "category" in gemini_results:
        analysis = gemini_results
    else:
        logger.info("Gemini analysis unavailable or failed. Using smart mock classifier.")
        analysis = run_mock_analysis(category_hint, yolo_results)
        
    # Supplement with YOLO details
    if yolo_results.get("objects_detected"):
        analysis["yolo_objects"] = yolo_results["objects_detected"]
        
    logger.info(f"AI Analysis completed. Classified as {analysis.get('category')} with {analysis.get('confidence')} confidence.")
    return analysis
