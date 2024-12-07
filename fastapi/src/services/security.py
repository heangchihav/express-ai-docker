"""
Security Service

This module contains the business logic for security threat analysis.
"""

from fastapi import Request
from src.schemas.security import SecurityCheckRequest, SecurityCheckResponse
from src.core.config import get_settings

class SecurityService:
    """Service for analyzing security threats in incoming requests."""
    
    async def analyze_request(
        self,
        request: Request,
        check_request: SecurityCheckRequest
    ) -> dict:
        """
        Analyze a request for potential security threats.
        
        Args:
            request: The FastAPI request object
            check_request: The security check request data
            
        Returns:
            Dictionary containing security analysis results
        """
        settings = get_settings()
        threat_details = {}
        threat_level = "Low"
        
        # Check body size
        if check_request.body:
            body_size = len(str(check_request.body))
            if body_size > settings.MAX_BODY_SIZE:
                threat_details["body_size"] = f"Body size {body_size} exceeds limit of {settings.MAX_BODY_SIZE}"
                threat_level = "Medium"
        
        # Check for suspicious headers
        suspicious_headers = self._check_suspicious_headers(check_request.headers)
        if suspicious_headers:
            threat_details["suspicious_headers"] = suspicious_headers
            threat_level = "High" if len(suspicious_headers) > 2 else "Medium"
        
        # Check for suspicious paths
        if self._is_suspicious_path(check_request.path):
            threat_details["suspicious_path"] = f"Suspicious path pattern detected: {check_request.path}"
            threat_level = "High"
        
        is_threat = bool(threat_details)
        
        return {
            "is_threat": is_threat,
            "threat_level": threat_level if is_threat else "Low",
            "details": threat_details,
            "recommendations": self._get_recommendations(threat_details) if is_threat else {}
        }
    
    def _check_suspicious_headers(self, headers: dict) -> dict:
        """Check for suspicious headers."""
        suspicious = {}
        
        # List of potentially dangerous headers
        dangerous_headers = [
            "x-forwarded-for",
            "x-real-ip",
            "x-remote-addr",
            "x-originating-ip",
            "x-remote-ip"
        ]
        
        for header in dangerous_headers:
            if header in headers.keys():
                suspicious[header] = "Potentially dangerous header detected"
                
        return suspicious
    
    def _is_suspicious_path(self, path: str) -> bool:
        """Check if the path contains suspicious patterns."""
        suspicious_patterns = [
            "../",
            "..\\",
            "exec",
            "eval",
            "system",
            "/etc/",
            "cmd",
            "powershell"
        ]
        
        return any(pattern in path.lower() for pattern in suspicious_patterns)
    
    def _get_recommendations(self, threat_details: dict) -> dict:
        """Generate security recommendations based on threats."""
        recommendations = {}
        
        if "body_size" in threat_details:
            recommendations["body_size"] = "Consider implementing request size limits at the reverse proxy level"
            
        if "suspicious_headers" in threat_details:
            recommendations["headers"] = "Review and sanitize incoming headers, consider implementing a whitelist"
            
        if "suspicious_path" in threat_details:
            recommendations["path"] = "Implement strict path validation and consider using a web application firewall"
            
        return recommendations
