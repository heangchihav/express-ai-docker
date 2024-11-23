# FastAPI Security Service

A high-security FastAPI microservice with ML-powered anomaly detection and advanced security features.

## Features

- 🛡️ ML-powered anomaly detection
- 🔒 Advanced request pattern analysis
- 📊 Real-time risk scoring
- 🚫 Automatic IP blocking
- 📝 Comprehensive logging
- ⚡ High performance middleware
- 🔄 CORS support
- 🌐 RESTful API endpoints

## Project Structure

```
fastapi/
├── src/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           └── security.py
│   ├── config/
│   │   └── settings.py
│   ├── core/
│   │   └── security/
│   │       ├── models.py
│   │       └── service.py
│   ├── middleware/
│   │   └── security.py
│   └── main.py
├── tests/
├── .env
├── .env.example
├── requirements.txt
└── README.md
```

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   .\venv\Scripts\activate   # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and configure your settings:
   ```bash
   cp .env.example .env
   ```

## Configuration

The service is highly configurable through environment variables:

- `DEBUG`: Enable/disable debug mode
- `HOST`: Server host
- `PORT`: Server port
- `SECRET_KEY`: Secret key for security features
- `RISK_SCORE_THRESHOLD`: Threshold for suspicious activity
- `MAX_SUSPICIOUS_COUNT`: Maximum allowed suspicious activities
- `REQUEST_WINDOW_SECONDS`: Time window for request analysis
- `RESET_WINDOW_SECONDS`: Time window for resetting counters
- `RATE_LIMIT`: Rate limit per minute
- `CORS_ORIGINS`: Allowed CORS origins
- `LOG_LEVEL`: Logging level

## Running the Service

Development:
```bash
cd src
uvicorn main:app --reload
```

Production:
```bash
cd src
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, access the API documentation at:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## Security Features

### ML-Powered Anomaly Detection
- Real-time request pattern analysis
- Feature extraction from request patterns
- TensorFlow-based risk scoring

### Request Analysis
- IP-based tracking
- Pattern recognition
- Suspicious activity detection
- Automatic IP blocking

### Security Headers
- Request ID tracking
- Risk score exposure
- Standard security headers

## Development

### Code Style
```bash
black .
isort .
mypy .
```

### Testing
```bash
pytest
```

## License

MIT License - see LICENSE file for details
