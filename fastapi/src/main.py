"""
FastAPI Main Application

This is the main entry point for the FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import get_settings
from src.core.logger import logger
from src.middleware.logging import LoggingMiddleware
from src.api.v1.security.router import router as security_router
from src.api.v1.health.router import router as health_router

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="FastAPI service for AI processing",
        version="1.0.0",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if settings.DEBUG else None,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(settings.EXPRESS_SERVER_URL)],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add logging middleware
    app.add_middleware(LoggingMiddleware)

    # Include routers
    app.include_router(
        security_router,
        prefix=settings.API_V1_PREFIX
    )
    
    app.include_router(
        health_router,
        prefix=settings.API_V1_PREFIX
    )

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    @app.on_event("startup")
    async def startup_event():
        logger.info({
            "event": "startup",
            "message": "FastAPI application starting up",
            "settings": {
                "project_name": settings.PROJECT_NAME,
                "debug": settings.DEBUG,
                "api_prefix": settings.API_V1_PREFIX
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
