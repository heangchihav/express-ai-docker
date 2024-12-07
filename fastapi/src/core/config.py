"""
Core Configuration

This module handles application configuration using environment variables.
"""

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "FastAPI Security Service"
    DEBUG: bool = Field(False, env="DEBUG")
    
    # Express.js Integration
    EXPRESS_API_KEY: str = Field(..., env="EXPRESS_API_KEY")
    EXPRESS_SERVER_URL: str = Field(..., env="EXPRESS_SERVER_URL")
    
    # Security Settings
    MAX_BODY_SIZE: int = Field(10000, env="MAX_BODY_SIZE")
    RATE_LIMIT_PER_MINUTE: int = Field(100, env="RATE_LIMIT_PER_MINUTE")
    
    # JWT Settings
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Model Settings
    MODEL_PATH: str = Field("/app/models/security_model.pkl", env="MODEL_PATH")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"  # Allow extra fields in .env file

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
