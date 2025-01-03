"""
Test router for generating logs.
"""
import json
from fastapi import APIRouter, HTTPException
from src.core.logger import logger

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/test-logs")
async def test_logs():
    """
    Generate test logs of different levels.
    """
    # Generate debug log
    logger.debug(json.dumps({
        "type": "test_debug",
        "message": "This is a debug message",
        "endpoint": "/api/v1/test/test-logs"
    }))

    # Generate info log
    logger.info(json.dumps({
        "type": "test_info",
        "message": "This is an info message",
        "endpoint": "/api/v1/test/test-logs"
    }))

    # Generate warning log
    logger.warning(json.dumps({
        "type": "test_warning",
        "message": "This is a warning message",
        "endpoint": "/api/v1/test/test-logs"
    }))

    # Generate error log
    logger.error(json.dumps({
        "type": "test_error",
        "message": "This is an error message",
        "endpoint": "/api/v1/test/test-logs"
    }))

    # Generate exception
    try:
        raise ValueError("Test exception")
    except Exception as e:
        logger.error(json.dumps({
            "type": "test_exception",
            "message": str(e),
            "endpoint": "/api/v1/test/test-logs",
            "error": str(e),
            "error_type": e.__class__.__name__
        }))

    return {"message": "Logs generated successfully"}

@router.get("/")
async def test_root():
    """
    Test endpoint that generates an info log.
    
    Returns:
        dict: A simple message indicating the test endpoint is working
    """
    logger.info(json.dumps({
        "event": "test_access",
        "message": "Test root endpoint accessed",
        "endpoint": "/test/"
    }))
    return {"message": "Test endpoint working"}

@router.get("/logs/{item_id}")
async def test_logging(item_id: int):
    """
    Test endpoint that generates both info and error logs based on input.
    
    Args:
        item_id (int): A test ID to demonstrate parameter logging
        
    Returns:
        dict: The item_id and a success message
        
    Raises:
        HTTPException: If item_id is negative
    """
    # Log successful access
    logger.info(json.dumps({
        "event": "item_access",
        "message": f"Accessed item {item_id}",
        "endpoint": f"/logs/{item_id}",
        "item_id": item_id
    }))
    
    # Demonstrate error logging for negative IDs
    if item_id < 0:
        error_data = json.dumps({
            "event": "item_access_error",
            "message": "Invalid item ID",
            "endpoint": f"/logs/{item_id}",
            "item_id": item_id,
            "error": "Item ID cannot be negative"
        })
        logger.error(error_data)
        raise HTTPException(status_code=400, detail="Item ID cannot be negative")
    
    return {"item_id": item_id, "message": "Item accessed successfully"}

@router.get("/error")
async def test_error():
    """
    Test endpoint that generates an error log.
    
    Returns:
        dict: Never returns as it always raises an exception
        
    Raises:
        HTTPException: Always raises a 500 error for testing
    """
    error_data = json.dumps({
        "event": "test_error",
        "message": "Test error endpoint accessed",
        "endpoint": "/error",
        "error": "Intentional test error"
    })
    logger.error(error_data)
    raise HTTPException(status_code=500, detail="Test error")
