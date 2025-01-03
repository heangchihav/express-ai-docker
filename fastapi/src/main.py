"""
This is the main entry point for the FastAPI application.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter.depends import RateLimiter  # Example for rate limiting
from src.core.config import get_settings
from src.core.logger import logger
from src.middleware.logging import LoggingMiddleware
from src.api.v1.security.router import router as security_router
from src.api.v1.health.router import router as health_router
from src.api.v1.test.router import router as test_router

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    # Validate CORS origins
    trusted_origins = [origin.strip() for origin in settings.CORS_ORIGINS if origin.strip()]
    if not trusted_origins:
        raise ValueError("No valid trusted origins found in CORS_ORIGINS.")

    # Initialize logger
    logger.info("FastAPI application starting up", extra={"timestamp": "2024-12-20T13:12:07+07:00"})

    # Initialize FastAPI app
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        docs_url=settings.DOCS_URL,
        redoc_url=settings.REDOC_URL,
        debug=settings.DEBUG if settings.DEBUG else False
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=trusted_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add LoggingMiddleware
    app.add_middleware(LoggingMiddleware)

    # Include routers
    app.include_router(
        security_router,
        prefix="/api/v1",
        tags=["security"],
        dependencies=[Depends(RateLimiter(times=5, seconds=60))]
    )
    app.include_router(health_router, prefix="/api/v1", tags=["health"])
    app.include_router(test_router, prefix="/api/v1/test", tags=["test"])

    # Startup and shutdown events
    @app.on_event("startup")
    async def startup_event():
        logger.info("FastAPI application is starting up.", extra={"settings": settings.dict()})

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("FastAPI application is shutting down.")

    @app.get("/test-log")
    async def test_log():
        """Test endpoint to verify logging."""
        logger.info("Test log message from /test-log endpoint", extra={"endpoint": "/test-log"})
        return {"message": "Log message sent"}

    return app

# Create the FastAPI application instance
app = create_app()
