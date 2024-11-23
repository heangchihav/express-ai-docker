from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # Application Settings
    PROJECT_NAME: str = "FastAPI Security Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    RISK_SCORE_THRESHOLD: float = 0.8
    MAX_SUSPICIOUS_COUNT: int = 5
    REQUEST_WINDOW_SECONDS: float = 10.0
    RESET_WINDOW_SECONDS: float = 3600.0
    
    # Rate Limiting Settings
    RATE_LIMIT_WINDOW: float = 60.0  # Time window in seconds
    RATE_LIMIT_MAX_REQUESTS: int = 100  # Max requests per window
    RATE_LIMIT_BASE_BLOCK_DURATION: float = 300.0  # Base blocking duration (5 minutes)
    RATE_LIMIT_MAX_BLOCK_DURATION: float = 86400.0  # Max blocking duration (24 hours)
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT", "60"))
    
    # ML Model Settings
    MODEL_RETRAIN_INTERVAL: float = 3600.0  # Retrain interval in seconds
    MODEL_SAVE_PATH: str = "models"
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080"
    ]
    
    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()
