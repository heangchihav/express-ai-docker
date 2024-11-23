from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
import time
from typing import Dict, List
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="FastAPI Security Service",
    description="Security and anomaly detection service",
    version="1.0.0"
)

# Configure logging with better format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize TensorFlow model for anomaly detection
def create_model():
    return tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(5,)),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dense(8, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])

model = create_model()

class UserActivity:
    def __init__(self):
        self.requests: List[float] = []
        self.patterns: Dict[str, int] = {}
        self.suspicious_count: int = 0
        self.last_reset: float = time.time()

    def clean_old_requests(self, current_time: float, window: float = 3600):
        """Clean requests older than the specified window"""
        self.requests = [t for t in self.requests if t > current_time - window]

    def add_pattern(self, pattern: str):
        """Add or increment a request pattern"""
        self.patterns[pattern] = self.patterns.get(pattern, 0) + 1

    def reset_counters(self, current_time: float):
        """Reset activity counters"""
        self.suspicious_count = 0
        self.patterns.clear()
        self.last_reset = current_time

    def get_stats(self) -> Dict:
        """Get current activity statistics"""
        return {
            "request_count": len(self.requests),
            "suspicious_count": self.suspicious_count,
            "unique_patterns": len(self.patterns)
        }

class SecurityService:
    def __init__(self, model):
        self.model = model
        self.user_activity: Dict[str, UserActivity] = {}

    def get_or_create_activity(self, user_ip: str) -> UserActivity:
        """Get or create user activity record"""
        if user_ip not in self.user_activity:
            self.user_activity[user_ip] = UserActivity()
        return self.user_activity[user_ip]

    def extract_features(self, activity: UserActivity, current_time: float) -> np.ndarray:
        """Extract features for anomaly detection"""
        request_count = len(activity.requests)
        time_window = 10.0
        recent_requests = [t for t in activity.requests if t > current_time - time_window]
        
        features = [
            len(recent_requests),  # Number of requests in last 10 seconds
            activity.suspicious_count,  # Number of suspicious activities
            len(activity.patterns),  # Number of unique patterns
            current_time - activity.last_reset,  # Time since last reset
            float(request_count)  # Total request count
        ]
        
        return np.array(features).reshape(1, -1)

    def predict_risk(self, activity: UserActivity, current_time: float) -> float:
        """Predict risk score for given activity"""
        features = self.extract_features(activity, current_time)
        return float(self.model.predict(features)[0][0])

    def process_request(self, user_ip: str, request_info: Dict) -> float:
        """Process a new request and return risk score"""
        current_time = time.time()
        activity = self.get_or_create_activity(user_ip)
        
        # Update activity
        activity.requests.append(current_time)
        activity.clean_old_requests(current_time)
        
        # Add pattern
        pattern = f"{request_info.get('method', 'UNKNOWN')}:{request_info.get('path', '/')}"
        activity.add_pattern(pattern)
        
        # Check for reset
        if current_time - activity.last_reset > 3600:
            activity.reset_counters(current_time)
        
        return self.predict_risk(activity, current_time)

    def get_ip_risk_score(self, user_ip: str) -> float:
        """Get IP risk score"""
        # TO DO: implement IP risk scoring logic
        return 0.0

    def analyze_request_pattern(self, request_data: Dict) -> float:
        """Analyze request pattern risk"""
        # TO DO: implement request pattern risk analysis logic
        return 0.0

    def analyze_payload(self, payload: Dict) -> float:
        """Analyze payload risk"""
        # TO DO: implement payload risk analysis logic
        return 0.0

    def analyze_headers(self, headers: Dict) -> float:
        """Analyze headers risk"""
        # TO DO: implement headers risk analysis logic
        return 0.0

    def analyze_method_path(self, method: str, path: str) -> float:
        """Analyze method and path risk"""
        # TO DO: implement method and path risk analysis logic
        return 0.0

    def get_risk_recommendation(self, risk_score: float, risk_factors: Dict) -> str:
        """Get risk recommendation"""
        # TO DO: implement risk recommendation logic
        return ""

# Initialize security service
security_service = SecurityService(model)

# Risk assessment endpoint
@app.post("/api/v1/security/risk-assessment")
async def risk_assessment(request_data: dict):
    try:
        user_ip = request_data.get('ip', '')
        risk_score = security_service.process_request(user_ip, request_data)
        
        # Analyze specific risk factors
        risk_factors = {
            "ip_risk": security_service.get_ip_risk_score(user_ip),
            "request_pattern_risk": security_service.analyze_request_pattern(request_data),
            "payload_risk": security_service.analyze_payload(request_data.get('body', {})),
            "header_risk": security_service.analyze_headers(request_data.get('headers', {})),
            "method_path_risk": security_service.analyze_method_path(
                request_data.get('method', ''), 
                request_data.get('path', '')
            )
        }
        
        # Calculate highest risk factor
        highest_risk_factor = max(risk_factors.items(), key=lambda x: x[1])
        
        return {
            "riskScore": float(risk_score),
            "threshold": 0.7,
            "timestamp": datetime.now().isoformat(),
            "requestId": str(time.time()),
            "riskFactors": risk_factors,
            "highestRiskFactor": {
                "factor": highest_risk_factor[0],
                "score": highest_risk_factor[1]
            },
            "details": {
                "ip": user_ip,
                "method": request_data.get('method', ''),
                "path": request_data.get('path', ''),
                "isBlocked": risk_score > 0.7,
                "recommendation": security_service.get_risk_recommendation(risk_score, risk_factors)
            }
        }
    except Exception as e:
        logger.error(f"Error processing risk assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    try:
        user_ip = request.client.host
        request_info = {
            "method": request.method,
            "path": request.url.path
        }
        
        risk_score = security_service.process_request(user_ip, request_info)
        
        # Handle high risk
        if risk_score > 0.8:
            activity = security_service.get_or_create_activity(user_ip)
            activity.suspicious_count += 1
            logger.warning(f"Suspicious activity detected from IP: {user_ip}")
            
            if activity.suspicious_count > 5:
                logger.error(f"Blocking suspicious IP: {user_ip}")
                return JSONResponse(
                    {"error": "Access denied due to suspicious activity"},
                    status_code=403
                )
        
        response = await call_next(request)
        return response
        
    except Exception as e:
        logger.error(f"Error in security middleware: {str(e)}")
        return JSONResponse(
            {"error": "Internal server error in security check"},
            status_code=500
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/v1/security/analyze")
async def analyze_request(request: Request):
    """Analyze request security status"""
    user_ip = request.client.host
    activity = security_service.get_or_create_activity(user_ip)
    risk_score = security_service.predict_risk(activity, time.time())
    
    return {
        "risk_score": risk_score,
        **activity.get_stats()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
