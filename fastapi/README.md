# FastAPI Security Service

This service provides security analysis for Express.js applications using FastAPI and machine learning.

## Project Structure

```
fastapi/
├── src/                      # Source code
│   ├── api/                  # API endpoints
│   │   └── v1/
│   │       └── security/     # Security endpoints
│   ├── core/                 # Core functionality
│   │   ├── config.py        # Configuration
│   │   └── dependencies.py   # FastAPI dependencies
│   ├── schemas/             # Data models
│   │   └── security.py      # Security schemas
│   ├── services/            # Business logic
│   │   └── security.py      # Security service
│   └── main.py             # FastAPI app initialization
├── main.py                  # Application entry point
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
└── .env                    # Environment variables
```

## Features

- Express.js request analysis
- Security threat detection
- API key authentication
- CORS protection
- Request validation
- Suspicious path detection
- Body size limits
- Header analysis

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   python main.py
   ```

## Docker Setup

1. Build the image:
   ```bash
   docker build -t fastapi-security .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 --env-file .env fastapi-security
   ```

## Express.js Integration

1. Set environment variables in Express.js:
   ```env
   FASTAPI_URL=http://fastapi:8000
   FASTAPI_KEY=your_api_key_here
   ```

2. Use the security middleware:
   ```typescript
   import SecurityCheckMiddleware from './fastAPIMiddlewares/securityCheck';
   app.use(SecurityCheckMiddleware);
   ```

## API Documentation

When `DEBUG=True`, access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Security Checks

The service performs the following security checks:
1. Request body size validation
2. Suspicious header detection
3. Suspicious path detection
4. Origin verification
5. API key validation

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License