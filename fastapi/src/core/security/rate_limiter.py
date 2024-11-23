from typing import Dict, Optional
import time
from datetime import datetime
import logging
from collections import defaultdict
from ...config.settings import settings

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        self.request_counts: Dict[str, Dict[float, int]] = defaultdict(lambda: defaultdict(int))
        self.blocked_until: Dict[str, float] = {}
        self.violation_counts: Dict[str, int] = defaultdict(int)
        
    def is_rate_limited(self, ip_address: str) -> bool:
        """Check if an IP is currently rate limited"""
        current_time = time.time()
        
        # Check if IP is blocked
        if ip_address in self.blocked_until:
            if current_time < self.blocked_until[ip_address]:
                return True
            else:
                del self.blocked_until[ip_address]
                self.violation_counts[ip_address] = 0
        
        # Clean up old request counts
        self._cleanup_old_requests(ip_address, current_time)
        
        # Count recent requests
        recent_requests = sum(
            count for timestamp, count in self.request_counts[ip_address].items()
            if current_time - timestamp <= settings.RATE_LIMIT_WINDOW
        )
        
        # Check if rate limit exceeded
        if recent_requests >= settings.RATE_LIMIT_MAX_REQUESTS:
            self._handle_violation(ip_address, current_time)
            return True
            
        return False
        
    def add_request(self, ip_address: str):
        """Record a new request for the IP"""
        current_time = time.time()
        self.request_counts[ip_address][current_time] += 1
        
    def _cleanup_old_requests(self, ip_address: str, current_time: float):
        """Remove request counts older than the window"""
        if ip_address in self.request_counts:
            self.request_counts[ip_address] = {
                timestamp: count
                for timestamp, count in self.request_counts[ip_address].items()
                if current_time - timestamp <= settings.RATE_LIMIT_WINDOW
            }
            
    def _handle_violation(self, ip_address: str, current_time: float):
        """Handle rate limit violation"""
        self.violation_counts[ip_address] += 1
        
        # Calculate block duration based on violation count
        block_duration = min(
            settings.RATE_LIMIT_BASE_BLOCK_DURATION * (2 ** (self.violation_counts[ip_address] - 1)),
            settings.RATE_LIMIT_MAX_BLOCK_DURATION
        )
        
        self.blocked_until[ip_address] = current_time + block_duration
        
        logger.warning(
            f"Rate limit exceeded for IP {ip_address}. "
            f"Blocked for {block_duration} seconds. "
            f"Violation count: {self.violation_counts[ip_address]}"
        )
        
    def get_remaining_requests(self, ip_address: str) -> int:
        """Get remaining requests allowed for an IP"""
        if self.is_rate_limited(ip_address):
            return 0
            
        current_time = time.time()
        recent_requests = sum(
            count for timestamp, count in self.request_counts[ip_address].items()
            if current_time - timestamp <= settings.RATE_LIMIT_WINDOW
        )
        
        return max(0, settings.RATE_LIMIT_MAX_REQUESTS - recent_requests)
        
    def get_block_expiry(self, ip_address: str) -> Optional[float]:
        """Get when the IP block expires"""
        return self.blocked_until.get(ip_address)
        
    def reset_ip(self, ip_address: str):
        """Reset rate limiting for an IP"""
        if ip_address in self.request_counts:
            del self.request_counts[ip_address]
        if ip_address in self.blocked_until:
            del self.blocked_until[ip_address]
        if ip_address in self.violation_counts:
            del self.violation_counts[ip_address]
            
    def get_stats(self) -> Dict:
        """Get rate limiting statistics"""
        current_time = time.time()
        return {
            "total_tracked_ips": len(self.request_counts),
            "currently_blocked": len(self.blocked_until),
            "high_violation_ips": len([ip for ip, count in self.violation_counts.items() if count > 3]),
            "total_violations": sum(self.violation_counts.values()),
            "timestamp": datetime.utcnow().isoformat()
        }

# Create singleton instance
rate_limiter = RateLimiter()
