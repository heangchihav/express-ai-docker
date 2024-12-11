"""
Security Router

This module handles the routing for security-related endpoints.
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from src.core.dependencies import verify_express_origin
from src.schemas.security import SecurityCheckRequest, SecurityCheckResponse
from src.services.security import SecurityService

router = APIRouter(
    prefix="/security",
    tags=["security"],
    dependencies=[Depends(verify_express_origin)]
)


"""endpoint /security/check"""

@router.post("/check", response_model=SecurityCheckResponse)
async def check_security(request: Request, check_request: SecurityCheckRequest):
    """
    Check incoming request for security threats
    """
    security_service = SecurityService()
    result = await security_service.analyze_request(request, check_request)
    return JSONResponse(content=result)
