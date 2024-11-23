from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.security.models import RequestPattern
from ..core.security.service import security_service
import logging
import time

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        ip_address = request.client.host
        
        try:
            # Skip security check for health endpoint
            if request.url.path.endswith("/health"):
                return await call_next(request)
            
            # Check if IP is blocked
            if security_service.is_blocked(ip_address):
                logger.warning(f"Blocked request from banned IP: {ip_address}")
                return HTTPException(
                    status_code=403,
                    detail="Access denied - IP is blocked"
                )
            
            # Create request pattern
            pattern = RequestPattern(
                method=request.method,
                path=request.url.path,
                timestamp=start_time,
                headers=dict(request.headers)
            )
            
            # Analyze request
            analysis = security_service.analyze_request(ip_address, pattern)
            
            # If blocked during analysis, deny request
            if analysis.blocked:
                logger.warning(f"Request blocked due to security analysis: {ip_address}")
                return HTTPException(
                    status_code=403,
                    detail=f"Access denied - {analysis.recommendation}"
                )
            
            # Add security info to request state
            request.state.security_analysis = analysis
            
            # Process request
            response = await call_next(request)
            
            # Add security headers
            response.headers["X-Request-ID"] = str(id(request))
            response.headers["X-Risk-Score"] = str(analysis.risk_score)
            
            # Log request details
            duration = time.time() - start_time
            logger.info(
                f"Request processed - IP: {ip_address}, "
                f"Path: {request.url.path}, "
                f"Risk Score: {analysis.risk_score:.2f}, "
                f"Duration: {duration:.2f}s"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error in security middleware: {str(e)}")
            return HTTPException(
                status_code=500,
                detail="Internal server error in security middleware"
            )
