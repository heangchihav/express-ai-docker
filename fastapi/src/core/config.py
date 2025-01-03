"""
Core Configuration

This module handles application configuration using environment variables.
"""

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings

class AppConfig(BaseSettings):
    """
    Core application configuration.

    Attributes:
        API_V1_PREFIX (str): Prefix for API version 1 endpoints.
        PROJECT_NAME (str): Name of the project.
        VERSION (str): Application version.
        DESCRIPTION (str): Short description of the application.
        DOCS_URL (str): URL path for API documentation.
        REDOC_URL (str): URL path for ReDoc documentation.
    """
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "FastAPI Security Service"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI Security Service with Elasticsearch logging integration"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"

class RuntimeConfig(BaseSettings):
    """
    Runtime-related configuration.

    Attributes:
        DEBUG (bool): Debug mode toggle.
        PORT (int): Port the application listens on.
    """
    DEBUG: bool = Field(False, env="DEBUG")
    PORT: int = Field(8000, env="PORT")

class SecurityConfig(BaseSettings):
    """
    Security and request-related configuration.

    Attributes:
        CORS_ORIGINS (list[str]): Allowed origins for CORS.
        MAX_BODY_SIZE (int): Maximum allowed body size for requests (in KB).
        RATE_LIMIT_PER_MINUTE (int): Maximum number of requests allowed per minute.
    """
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://example.com", "http://anotherdomain.com"], env="CORS_ORIGINS")  # Configurable via environment
    MAX_BODY_SIZE: int = Field(100, env="MAX_BODY_SIZE")
    RATE_LIMIT_PER_MINUTE: int = Field(100, env="RATE_LIMIT_PER_MINUTE")
    SLOW_REQUEST_THRESHOLD: float = Field(1.0, env="SLOW_REQUEST_THRESHOLD")
class ExternalServicesConfig(BaseSettings):
    """
    Configuration for external services.

    Attributes:
        EXPRESS_API_KEY (str): API key for the external ExpressJS service.
        EXPRESS_SERVER_URL (str): Base URL for the ExpressJS server.
    """
    EXPRESS_API_KEY: str = Field(..., env="EXPRESS_API_KEY")  # Sourced from environment variables; required for security
    EXPRESS_SERVER_URL: str = Field("<PLACEHOLDER_URL>", env="EXPRESS_SERVER_URL")  # Use placeholder and ensure environment-specific overrides

class Config(AppConfig, RuntimeConfig, SecurityConfig, ExternalServicesConfig):
    """
    Consolidated application configuration.

    This class inherits from all configuration sub-classes and includes
    settings for environment handling.

    Attributes:
        case_sensitive (bool): Whether environment variable names are case-sensitive.
        env_file (str): Name of the environment file.
        extra (str): How to handle extra fields in the environment file.
    """
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "forbid"  # Prevent unintentional issues by disallowing extra fields explicitly

def get_settings() -> Config:
    """
    Get settings instance.

    This function does not use caching to ensure configuration changes
    during runtime (if needed) are applied dynamically.

    Returns:
        Config: Consolidated configuration instance with all application settings.
    """
    return Config()
