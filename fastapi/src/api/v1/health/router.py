"""
Health Check Router

This module provides health check endpoints for the FastAPI service.
"""

from fastapi import APIRouter, Request, Depends
from src.core.dependencies import verify_express_origin

router = APIRouter(
    tags=["health"]
)

@router.get("/health")
async def health_check():
    """Basic health check endpoint that doesn't require authentication."""
    return {"status": "healthy", "service": "fastapi"}

@router.get("/health/secure", dependencies=[Depends(verify_express_origin)])
async def secure_health_check(request: Request):
    """Secure health check endpoint that requires Express.js authentication."""
    return {
        "status": "healthy",
        "service": "fastapi",
        "client": request.client.host if request.client else None,
        "authenticated": True
    }
