"""
Security Schemas

This module defines the Pydantic models for security-related requests and responses.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class SecurityCheckRequest(BaseModel):
    """Request model for security checks."""
    body: Optional[Dict[str, Any]] = Field(None, description="Request body to analyze")
    headers: Dict[str, str] = Field(..., description="Request headers to analyze")
    path: str = Field(..., description="Request path to analyze")
    method: str = Field(..., description="HTTP method used")
    
class SecurityCheckResponse(BaseModel):
    """Response model for security check results."""
    is_threat: bool = Field(..., description="Whether the request is considered a threat")
    threat_level: str = Field(..., description="Low, Medium, or High")
    details: Dict[str, Any] = Field(..., description="Detailed analysis results")
    recommendations: Optional[Dict[str, str]] = Field(None, description="Security recommendations")
