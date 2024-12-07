"""
FastAPI Express Integration

This is the main entry point for the FastAPI application.
It uses a factory pattern to create and configure the application.
"""

from src.main import create_app
from src.core.config import Settings, get_settings

# Create FastAPI application
app = create_app()

if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
        access_log=True
    )
