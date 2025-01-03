"""
Logging middleware for FastAPI.
"""
import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logger import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging request and response information.
    """
    slow_request_threshold = 1.0  # Slow request threshold in seconds

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        # Log request started
        logger.info({
            "type": "request_started",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_host": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "content_length": request.headers.get("content-length", 0),
        })

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time

            # Log request completed
            log_data = {
                "type": "request_completed",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration": duration,
                "client_host": request.client.host if request.client else None,
                "query_params": dict(request.query_params),
                "user_agent": request.headers.get("user-agent"),
                "content_length": request.headers.get("content-length", 0),
                "response_size": response.headers.get("content-length", 0),
            }

            if duration > self.slow_request_threshold:
                log_data["performance_warning"] = "Slow request detected"
                logger.warning(log_data)
            else:
                logger.info(log_data)

            return response

        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error({
                "type": "request_failed",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "duration": duration,
                "client_host": request.client.host if request.client else None,
                "query_params": dict(request.query_params),
                "user_agent": request.headers.get("user-agent"),
                "error": str(e),
                "error_type": e.__class__.__name__,
            })
            raise
