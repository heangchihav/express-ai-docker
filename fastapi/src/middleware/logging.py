import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logger import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Get request details
        method = request.method
        path = request.url.path
        query_params = dict(request.query_params)
        client_host = request.client.host if request.client else None

        response = None
        try:
            response = await call_next(request)
            status_code = response.status_code
            
            # Log successful request
            logger.info({
                'event': 'request_handled',
                'method': method,
                'path': path,
                'status_code': status_code,
                'duration': time.time() - start_time,
                'client_host': client_host,
                'query_params': query_params
            })
            
            return response
            
        except Exception as e:
            # Log failed request
            logger.error({
                'event': 'request_failed',
                'method': method,
                'path': path,
                'error': str(e),
                'client_host': client_host,
                'query_params': query_params
            }, exc_info=True)
            
            raise  # Re-raise the exception after logging
