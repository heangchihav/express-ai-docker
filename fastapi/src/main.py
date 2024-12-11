"""
This is the main entry point for the FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import get_settings
from src.core.logger import logger
from src.middleware.logging import LoggingMiddleware
from src.api.v1.security.router import router as security_router
from src.api.v1.health.router import router as health_router
from src.api.v1.test.router import router as test_router

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    # Initialize FastAPI app
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        docs_url=settings.DOCS_URL,
        redoc_url=settings.REDOC_URL,
        debug=settings.DEBUG
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add logging middleware
    app.add_middleware(LoggingMiddleware)

    # Include routers
    app.include_router(
        security_router,
        prefix="/api/v1"
    )
    
    app.include_router(
        health_router,
        prefix="/api/v1"
    )
    
    app.include_router(
        test_router,
        prefix="/api/v1"
    )

    @app.on_event("startup")
    async def startup_event():
        logger.info({
            "event": "startup",
            "message": "FastAPI application starting up",
            "settings": {
                "project_name": settings.PROJECT_NAME,
                "debug": settings.DEBUG,
                "api_prefix": settings.API_V1_PREFIX,
            }
        })
    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info({
            "event": "shutdown",
            "message": "FastAPI application shutting down"
        })
        
    return app

app = create_app()
