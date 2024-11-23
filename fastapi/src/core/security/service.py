import tensorflow as tf
import numpy as np
from typing import Dict, Optional, List
import time
import logging
from datetime import datetime
from ...config.settings import settings
from .models import UserActivity, RequestPattern, SecurityAnalysis
from .ml_model import security_model
import aiohttp
import asyncio
import json

logger = logging.getLogger(__name__)

class SecurityService:
    def __init__(self):
        self.user_activities: Dict[str, UserActivity] = {}
        self.blocked_ips: Dict[str, float] = {}  # IP -> timestamp
        self.suspicious_patterns: Dict[str, int] = {}  # pattern -> count
        
    def get_or_create_activity(self, ip_address: str) -> UserActivity:
        """Get or create user activity record"""
        if ip_address not in self.user_activities:
            self.user_activities[ip_address] = UserActivity(ip_address=ip_address)
        return self.user_activities[ip_address]
        
    def _extract_features(self, activity: UserActivity, current_time: float) -> np.ndarray:
        """Extract features for anomaly detection"""
        request_count = len(activity.requests)
        recent_requests = [t for t in activity.requests 
                         if t > current_time - settings.REQUEST_WINDOW_SECONDS]
        
        features = [
            len(recent_requests),  # Number of requests in recent window
            activity.suspicious_count,  # Number of suspicious activities
            len(activity.patterns),  # Number of unique patterns
            current_time - activity.last_reset,  # Time since last reset
            float(request_count)  # Total request count
        ]
        
        return np.array(features).reshape(1, -1)
        
    def predict_risk(self, activity: UserActivity) -> float:
        """Predict risk score for given activity"""
        current_time = time.time()
        features = self._extract_features(activity, current_time)
        return security_model.predict_risk(features)
        
    def analyze_request(self, ip_address: str, pattern: RequestPattern) -> SecurityAnalysis:
        """Analyze a request and return security analysis"""
        activity = self.get_or_create_activity(ip_address)
        current_time = time.time()
        
        # Update activity
        activity.requests.append(current_time)
        activity.requests = [t for t in activity.requests 
                           if t > current_time - settings.RESET_WINDOW_SECONDS]
        
        # Add pattern
        pattern_key = f"{pattern.method}:{pattern.path}"
        activity.patterns[pattern_key] = activity.patterns.get(pattern_key, 0) + 1
        
        # Update global pattern tracking
        self.suspicious_patterns[pattern_key] = self.suspicious_patterns.get(pattern_key, 0) + 1
        
        # Check for reset
        if current_time - activity.last_reset > settings.RESET_WINDOW_SECONDS:
            activity.suspicious_count = 0
            activity.patterns.clear()
            activity.last_reset = current_time
        
        # Calculate risk
        risk_score = self.predict_risk(activity)
        activity.risk_score = risk_score
        
        # Update suspicious count and blocked status
        if risk_score > settings.RISK_SCORE_THRESHOLD:
            activity.suspicious_count += 1
            logger.warning(f"Suspicious activity detected from IP: {ip_address}")
            
            if activity.suspicious_count > settings.MAX_SUSPICIOUS_COUNT:
                activity.blocked = True
                self.blocked_ips[ip_address] = current_time
                logger.error(f"Blocking suspicious IP: {ip_address}")
        
        # Generate recommendation
        recommendation = self._generate_recommendation(activity)
        
        return SecurityAnalysis(
            risk_score=risk_score,
            request_count=len(activity.requests),
            suspicious_count=activity.suspicious_count,
            unique_patterns=len(activity.patterns),
            blocked=activity.blocked,
            recommendation=recommendation
        )
        
    def _generate_recommendation(self, activity: UserActivity) -> str:
        """Generate security recommendation based on activity"""
        if activity.blocked:
            return "IP is blocked due to suspicious activity"
        elif activity.risk_score > settings.RISK_SCORE_THRESHOLD:
            return "High risk activity detected - monitoring closely"
        elif activity.risk_score > 0.5:
            return "Moderate risk - continue monitoring"
        return "Low risk - no action needed"
        
    def is_blocked(self, ip_address: str) -> bool:
        """Check if an IP address is blocked"""
        # Check if IP is in blocked list
        if ip_address in self.blocked_ips:
            block_time = self.blocked_ips[ip_address]
            # Remove from blocked list if block duration has passed
            if time.time() - block_time > settings.RESET_WINDOW_SECONDS:
                del self.blocked_ips[ip_address]
                activity = self.user_activities.get(ip_address)
                if activity:
                    activity.blocked = False
                return False
            return True
            
        # Check activity status
        activity = self.user_activities.get(ip_address)
        return activity.blocked if activity else False
    
    async def report_high_risk_activity(self, ip_address: str, pattern: RequestPattern, analysis: SecurityAnalysis):
        """Report high-risk activity to security monitoring service"""
        try:
            # Prepare report data
            report = {
                "timestamp": datetime.utcnow().isoformat(),
                "ip_address": ip_address,
                "risk_score": analysis.risk_score,
                "request_pattern": {
                    "method": pattern.method,
                    "path": pattern.path,
                    "headers": pattern.headers
                },
                "activity_stats": {
                    "request_count": analysis.request_count,
                    "suspicious_count": analysis.suspicious_count,
                    "unique_patterns": analysis.unique_patterns
                }
            }
            
            # Log the report
            logger.warning(f"High risk activity report: {json.dumps(report)}")
            
            # Update ML model
            features = self._extract_features(self.user_activities[ip_address], time.time())
            labels = np.array([[1.0]])  # High risk activity
            security_model.update_model(features, labels)
            
        except Exception as e:
            logger.error(f"Error reporting high risk activity: {str(e)}")
    
    def get_threat_summary(self) -> Dict:
        """Get summary of current security threats"""
        current_time = time.time()
        
        # Count active threats
        high_risk_count = 0
        blocked_count = len(self.blocked_ips)
        total_suspicious = 0
        
        for activity in self.user_activities.values():
            if activity.risk_score > settings.RISK_SCORE_THRESHOLD:
                high_risk_count += 1
            total_suspicious += activity.suspicious_count
        
        # Get most common suspicious patterns
        sorted_patterns = sorted(
            self.suspicious_patterns.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "high_risk_ips": high_risk_count,
            "blocked_ips": blocked_count,
            "total_suspicious_activities": total_suspicious,
            "common_suspicious_patterns": dict(sorted_patterns),
            "active_sessions": len(self.user_activities)
        }

# Create singleton instance
security_service = SecurityService()
