"""
Core Dependencies

This module contains FastAPI dependencies for authentication and authorization.
"""

from fastapi import Request, HTTPException, status, Depends
from .config import Config as Settings, get_settings

async def verify_express_origin(
    request: Request,
    settings: Settings = Depends(get_settings)
) -> bool:
    """
    Verify that the request comes from the authorized Express.js server.
    
    Args:
        request: The FastAPI request object
        settings: Application settings
        
    Returns:
        True if request is from Express.js
        
    Raises:
        HTTPException: If authentication fails
    """
    # Verify API key
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != settings.EXPRESS_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    
    # Verify origin
    origin = request.headers.get("origin")
    if origin and origin != str(settings.EXPRESS_SERVER_URL):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid origin"
        )
    
    return True
