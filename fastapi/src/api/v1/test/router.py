"""
Test router for demonstrating logging and Elasticsearch functionality.
"""
from fastapi import APIRouter, HTTPException
from src.core.logger import logger

router = APIRouter(
    prefix="/test",
    tags=["test"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def test_root():
    """
    Test endpoint that generates an info log.
    
    Returns:
        dict: A simple message indicating the test endpoint is working
    """
    logger.info({
        "event": "test_access",
        "message": "Test root endpoint accessed",
        "endpoint": "/test/"
    })
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
    logger.info({
        "event": "test_logging",
        "message": "Test logs endpoint accessed",
        "item_id": item_id,
        "endpoint": f"/test/logs/{item_id}"
    })
    
    if item_id < 0:
        logger.error({
            "event": "validation_error",
            "message": "Invalid item_id received",
            "item_id": item_id,
            "error": "item_id must be positive"
        })
        raise HTTPException(status_code=400, detail="item_id must be positive")
    
    return {"item_id": item_id, "message": "Test successful"}

@router.get("/error")
async def test_error():
    """
    Test endpoint that generates an error log.
    
    Returns:
        dict: Never returns as it always raises an exception
        
    Raises:
        HTTPException: Always raises a 500 error for testing
    """
    logger.error({
        "event": "test_error",
        "message": "Test error endpoint accessed",
        "error": "Intentional test error",
        "endpoint": "/test/error"
    })
    raise HTTPException(status_code=500, detail="Test error generated")
