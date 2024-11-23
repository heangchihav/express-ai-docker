from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.security.rate_limiter import rate_limiter
import time
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        
        # Check rate limit
        if rate_limiter.is_rate_limited(client_ip):
            block_expiry = rate_limiter.get_block_expiry(client_ip)
            if block_expiry:
                wait_time = int(block_expiry - time.time())
                raise HTTPException(
                    status_code=429,
                    detail={
                        "message": "Too many requests",
                        "wait_seconds": wait_time
                    }
                )
        
        # Add request to counter
        rate_limiter.add_request(client_ip)
        
        # Get remaining requests
        remaining = rate_limiter.get_remaining_requests(client_ip)
        
        # Process the request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Limit"] = str(rate_limiter.settings.RATE_LIMIT_MAX_REQUESTS)
        
        if block_expiry := rate_limiter.get_block_expiry(client_ip):
            response.headers["X-RateLimit-Reset"] = str(int(block_expiry))
        
        return response
