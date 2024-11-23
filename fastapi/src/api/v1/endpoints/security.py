from fastapi import APIRouter, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from ....core.security.models import RequestPattern, SecurityAnalysis, UserActivity
from ....core.security.service import security_service
from ....config.settings import settings
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@router.post("/analyze", response_model=SecurityAnalysis)
async def analyze_request(request: Request, background_tasks: BackgroundTasks) -> SecurityAnalysis:
    """
    Analyze the security risk of the current request
    """
    try:
        # Extract request information
        ip_address = request.client.host
        headers = dict(request.headers)
        
        # Check if IP is already blocked
        if security_service.is_blocked(ip_address):
            raise HTTPException(
                status_code=403,
                detail="Access denied - IP is blocked"
            )
        
        # Create request pattern
        pattern = RequestPattern(
            method=request.method,
            path=request.url.path,
            timestamp=request.scope.get("time", 0.0),
            headers=headers
        )
        
        # Analyze request
        analysis = security_service.analyze_request(ip_address, pattern)
        
        # Schedule model update in background
        if analysis.risk_score > 0.9:
            background_tasks.add_task(
                security_service.report_high_risk_activity,
                ip_address,
                pattern,
                analysis
            )
        
        # If blocked during analysis, raise exception
        if analysis.blocked:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied - {analysis.recommendation}"
            )
            
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during security analysis"
        )

@router.get("/stats/{ip_address}")
async def get_ip_stats(ip_address: str) -> Dict:
    """
    Get security statistics for a specific IP address
    """
    try:
        activity = security_service.get_or_create_activity(ip_address)
        return {
            "ip_address": ip_address,
            "risk_score": activity.risk_score,
            "request_count": len(activity.requests),
            "suspicious_count": activity.suspicious_count,
            "unique_patterns": len(activity.patterns),
            "blocked": activity.blocked
        }
    except Exception as e:
        logger.error(f"Error getting IP stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching IP statistics"
        )

@router.post("/block/{ip_address}")
async def block_ip(ip_address: str, reason: Optional[str] = None):
    """
    Manually block an IP address
    """
    try:
        activity = security_service.get_or_create_activity(ip_address)
        activity.blocked = True
        activity.suspicious_count = settings.MAX_SUSPICIOUS_COUNT + 1
        
        logger.warning(f"Manual IP block: {ip_address}, Reason: {reason}")
        return {"status": "success", "message": f"IP {ip_address} has been blocked"}
    except Exception as e:
        logger.error(f"Error blocking IP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while blocking IP"
        )

@router.post("/unblock/{ip_address}")
async def unblock_ip(ip_address: str, reason: Optional[str] = None):
    """
    Unblock a previously blocked IP address
    """
    try:
        activity = security_service.get_or_create_activity(ip_address)
        activity.blocked = False
        activity.suspicious_count = 0
        activity.risk_score = 0.0
        
        logger.info(f"Manual IP unblock: {ip_address}, Reason: {reason}")
        return {"status": "success", "message": f"IP {ip_address} has been unblocked"}
    except Exception as e:
        logger.error(f"Error unblocking IP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while unblocking IP"
        )

@router.get("/threats")
async def get_threats(min_risk_score: float = 0.7) -> List[Dict]:
    """
    Get list of potential security threats
    """
    try:
        threats = []
        for ip, activity in security_service.user_activities.items():
            if activity.risk_score >= min_risk_score:
                threats.append({
                    "ip_address": ip,
                    "risk_score": activity.risk_score,
                    "suspicious_count": activity.suspicious_count,
                    "request_patterns": activity.patterns,
                    "blocked": activity.blocked
                })
        
        return sorted(threats, key=lambda x: x["risk_score"], reverse=True)
    except Exception as e:
        logger.error(f"Error fetching threats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching threats"
        )

@router.post("/reset/{ip_address}")
async def reset_ip_stats(ip_address: str):
    """
    Reset statistics for an IP address
    """
    try:
        activity = security_service.get_or_create_activity(ip_address)
        activity.requests.clear()
        activity.patterns.clear()
        activity.suspicious_count = 0
        activity.risk_score = 0.0
        activity.blocked = False
        activity.last_reset = datetime.now().timestamp()
        
        return {"status": "success", "message": f"Stats reset for IP {ip_address}"}
    except Exception as e:
        logger.error(f"Error resetting IP stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while resetting IP stats"
        )
