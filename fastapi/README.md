# FastAPI Project

A modern web API project built with FastAPI, featuring a modular structure with security, health checks, and test endpoints.

## Project Structure

```
fastapi/
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── health/
│   │       ├── security/
│   │       └── test/
│   ├── core/
│   ├── middleware/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── venv/
├── requirements.txt
└── README.md
```

## Features

- Modular API structure with versioning (v1)
- Security endpoints with JWT authentication
- Health check endpoints
- Logging middleware
- Environment configuration
- API documentation with Swagger UI and ReDoc

## Requirements

- Python 3.x
- Virtual environment (venv)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fastapi
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the FastAPI server:
```bash
uvicorn src.main:app --reload
```

2. The server will start at `http://127.0.0.1:8000`

## API Documentation

- Swagger UI (OpenAPI): http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Available Endpoints

### API v1

- **Health Check**
  - GET `/api/v1/health` - Check API health status

- **Security**
  - Various security-related endpoints for authentication

- **Test**
  - Test endpoints for development purposes

## Dependencies

Main dependencies include:
- FastAPI>=0.104.1
- Uvicorn>=0.24.0
- Pydantic>=2.5.1
- Python-jose>=3.3.0
- Passlib>=1.7.4
- Python-multipart>=0.0.6
- Python-dotenv>=1.0.0
- Requests>=2.31.0

For a complete list of dependencies, see `requirements.txt`

## Development

The project follows a modular structure:
- `api/`: Contains all API endpoints organized by version
- `core/`: Core functionality, configurations, and dependencies
- `middleware/`: Custom middleware (e.g., logging)
- `schemas/`: Pydantic models for request/response validation
- `services/`: Business logic and services

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]