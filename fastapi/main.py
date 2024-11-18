from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
import time
from typing import Dict, List
import logging
from datetime import datetime

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize TensorFlow model for anomaly detection
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(5,)),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dense(8, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

# User activity storage with more features
class UserActivity:
    def __init__(self):
        self.requests: List[float] = []
        self.patterns: Dict[str, int] = {}
        self.suspicious_count: int = 0
        self.last_reset: float = time.time()

user_activity: Dict[str, UserActivity] = {}

def extract_features(activity: UserActivity, current_time: float) -> np.ndarray:
    """Extract features for anomaly detection"""
    request_count = len(activity.requests)
    time_window = 10.0
    recent_requests = [t for t in activity.requests if t > current_time - time_window]
    
    features = [
        len(recent_requests),  # Number of requests in last 10 seconds
        activity.suspicious_count,  # Number of suspicious activities
        len(activity.patterns),  # Number of unique patterns
        time.time() - activity.last_reset,  # Time since last reset
        float(request_count)  # Total request count
    ]
    
    return np.array(features).reshape(1, -1)

@app.middleware("http")
async def detect_unusual_activity(request: Request, call_next):
    try:
        user_ip = request.client.host
        current_time = time.time()
        
        # Initialize user activity if not exists
        if user_ip not in user_activity:
            user_activity[user_ip] = UserActivity()
        
        activity = user_activity[user_ip]
        activity.requests.append(current_time)
        
        # Clean old requests
        activity.requests = [t for t in activity.requests if t > current_time - 3600]  # Keep last hour
        
        # Extract pattern features
        pattern = f"{request.method}:{request.url.path}"
        activity.patterns[pattern] = activity.patterns.get(pattern, 0) + 1
        
        # Extract features and detect anomaly
        features = extract_features(activity, current_time)
        prediction = model.predict(features)[0][0]
        
        # Log suspicious activity
        if prediction > 0.8:  # Threshold for suspicious activity
            activity.suspicious_count += 1
            logger.warning(f"Suspicious activity detected from IP: {user_ip}")
            
            if activity.suspicious_count > 5:
                logger.error(f"Blocking suspicious IP: {user_ip}")
                return JSONResponse(
                    {"error": "Access denied due to suspicious activity"},
                    status_code=403
                )
        
        # Reset counters periodically
        if current_time - activity.last_reset > 3600:
            activity.suspicious_count = 0
            activity.patterns.clear()
            activity.last_reset = current_time
        
        response = await call_next(request)
        return response
        
    except Exception as e:
        logger.error(f"Error in anomaly detection: {str(e)}")
        return JSONResponse(
            {"error": "Internal server error in security check"},
            status_code=500
        )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your Express.js origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/analyze")
async def analyze_request(request: Request):
    user_ip = request.client.host
    if user_ip in user_activity:
        activity = user_activity[user_ip]
        features = extract_features(activity, time.time())
        risk_score = float(model.predict(features)[0][0])
        return {
            "risk_score": risk_score,
            "request_count": len(activity.requests),
            "suspicious_count": activity.suspicious_count,
            "unique_patterns": len(activity.patterns)
        }
    return {"error": "No activity data found"}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}

@app.get("/example")
async def example_route():
    return {"message": "This is an example route!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
