"""
Logging middleware for FastAPI.
"""
import time
import uuid
import json
from typing import Callable, Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logger import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Enhanced middleware for logging request and response information.
    """
    slow_request_threshold = 1.0  # Slow request threshold in seconds
    sensitive_headers = {'authorization', 'cookie', 'x-api-key'}
    max_body_size = 10000  # Maximum body size to log in bytes

    def sanitize_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """Sanitize sensitive information from headers."""
        sanitized = {}
        for key, value in headers.items():
            if key.lower() in self.sensitive_headers:
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        return sanitized

    async def get_request_body(self, request: Request) -> Dict[str, Any]:
        """Get request body if it's JSON and not too large."""
        if request.headers.get('content-type') == 'application/json':
            try:
                body_bytes = await request.body()
                if len(body_bytes) <= self.max_body_size:
                    return json.loads(body_bytes)
                return {'message': 'Body too large to log'}
            except Exception:
                return {'message': 'Could not parse JSON body'}
        return {'message': 'Non-JSON body'}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        start_time = time.perf_counter()
        process_time_start = time.process_time()

        # Log request started
        request_log = {
            "type": "request_started",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_host": request.client.host if request.client else None,
            "headers": self.sanitize_headers(dict(request.headers)),
            "query_params": dict(request.query_params),
            "client_info": {
                "host": request.client.host if request.client else None,
                "port": request.client.port if request.client else None,
            }
        }

        # Add request body for JSON requests
        if request.method in ['POST', 'PUT', 'PATCH']:
            request_log['body'] = await self.get_request_body(request)

        logger.info(request_log)

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time
            process_time = time.process_time() - process_time_start

            # Log request completed
            response_log = {
                "type": "request_completed",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "performance": {
                    "duration": duration,
                    "process_time": process_time,
                    "is_slow": duration > self.slow_request_threshold
                },
                "client_host": request.client.host if request.client else None,
                "query_params": dict(request.query_params),
                "response_headers": self.sanitize_headers(dict(response.headers)),
                "response_size": response.headers.get("content-length", 0)
            }

            if duration > self.slow_request_threshold:
                response_log["warning"] = f"Slow request detected: {duration:.2f}s"
                logger.warning(response_log)
            else:
                logger.info(response_log)

            return response

        except Exception as e:
            duration = time.perf_counter() - start_time
            process_time = time.process_time() - process_time_start

            # Log error details
            error_log = {
                "type": "request_failed",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error": {
                    "type": type(e).__name__,
                    "message": str(e),
                },
                "performance": {
                    "duration": duration,
                    "process_time": process_time
                }
            }
            logger.error(error_log, exc_info=True)
            raise
