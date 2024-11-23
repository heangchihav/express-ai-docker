from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class RequestPattern(BaseModel):
    method: str
    path: str
    timestamp: float
    headers: Dict[str, str]
    
class UserActivity(BaseModel):
    ip_address: str
    requests: List[float] = Field(default_factory=list)
    patterns: Dict[str, int] = Field(default_factory=dict)
    suspicious_count: int = 0
    last_reset: float = Field(default_factory=lambda: datetime.now().timestamp())
    blocked: bool = False
    risk_score: float = 0.0
    
    class Config:
        json_schema_extra = {
            "example": {
                "ip_address": "192.168.1.1",
                "requests": [1234567890.123],
                "patterns": {"GET:/api/v1/users": 1},
                "suspicious_count": 0,
                "last_reset": 1234567890.123,
                "blocked": False,
                "risk_score": 0.1
            }
        }

class SecurityAnalysis(BaseModel):
    risk_score: float
    request_count: int
    suspicious_count: int
    unique_patterns: int
    blocked: bool
    recommendation: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "risk_score": 0.1,
                "request_count": 10,
                "suspicious_count": 0,
                "unique_patterns": 2,
                "blocked": False,
                "recommendation": "No action needed",
                "timestamp": "2023-01-01T00:00:00Z"
            }
        }
