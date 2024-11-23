import pytest
from fastapi.testclient import TestClient
import time
from datetime import datetime
from src.core.security.models import RequestPattern, UserActivity
from src.core.security.service import SecurityService
import numpy as np

@pytest.fixture
def security_service():
    return SecurityService()

@pytest.fixture
def sample_request_pattern():
    return RequestPattern(
        method="GET",
        path="/api/v1/test",
        timestamp=time.time(),
        headers={"User-Agent": "test-agent"}
    )

def test_risk_prediction(security_service):
    """Test risk prediction for normal activity"""
    activity = UserActivity(ip_address="127.0.0.1")
    risk_score = security_service.predict_risk(activity)
    assert 0 <= risk_score <= 1

def test_suspicious_activity_detection(security_service, sample_request_pattern):
    """Test detection of suspicious activity patterns"""
    ip = "192.168.1.1"
    
    # Simulate rapid requests
    for _ in range(20):
        security_service.analyze_request(ip, sample_request_pattern)
    
    activity = security_service.get_or_create_activity(ip)
    assert activity.risk_score > 0.5
    assert activity.suspicious_count > 0

def test_ip_blocking(security_service, sample_request_pattern):
    """Test IP blocking after suspicious activity"""
    ip = "192.168.1.2"
    
    # Simulate highly suspicious activity
    for _ in range(50):
        security_service.analyze_request(ip, sample_request_pattern)
    
    assert security_service.is_blocked(ip)

def test_pattern_recognition(security_service):
    """Test request pattern recognition"""
    ip = "192.168.1.3"
    activity = security_service.get_or_create_activity(ip)
    
    patterns = [
        RequestPattern(method="GET", path="/api/v1/test", timestamp=time.time(), headers={}),
        RequestPattern(method="POST", path="/api/v1/test", timestamp=time.time(), headers={}),
        RequestPattern(method="GET", path="/api/v1/test", timestamp=time.time(), headers={})
    ]
    
    for pattern in patterns:
        security_service.analyze_request(ip, pattern)
    
    assert len(activity.patterns) == 2  # Two unique patterns

def test_feature_extraction(security_service):
    """Test ML feature extraction"""
    ip = "192.168.1.4"
    activity = security_service.get_or_create_activity(ip)
    current_time = time.time()
    
    features = security_service._extract_features(activity, current_time)
    assert isinstance(features, np.ndarray)
    assert features.shape == (1, 5)

def test_activity_reset(security_service, sample_request_pattern):
    """Test activity reset after window expiration"""
    ip = "192.168.1.5"
    activity = security_service.get_or_create_activity(ip)
    
    # Add some activity
    security_service.analyze_request(ip, sample_request_pattern)
    
    # Simulate time passing
    activity.last_reset = time.time() - 4000  # Past the reset window
    
    # Next request should reset counters
    security_service.analyze_request(ip, sample_request_pattern)
    assert activity.suspicious_count == 0
    assert len(activity.patterns) == 1
