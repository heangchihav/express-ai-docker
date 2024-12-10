# FastAPI Service

This is a FastAPI service that provides AI processing capabilities and integrates with Express.js.

## Project Structure

```
fastapi/
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── health/
│   │       └── security/
│   ├── core/
│   │   ├── config.py
│   │   └── logger.py
│   ├── middleware/
│   │   └── logging.py
│   ├── schemas/
│   ├── services/
│   └── main.py
├── main.py
├── requirements.txt
└── Dockerfile
```

## Features

- **API Versioning**: Routes are versioned under `/api/v1`
- **Security**: JWT-based authentication and authorization
- **Logging**: Structured logging with ELK stack integration
- **Health Checks**: Endpoint monitoring and status checks
- **CORS**: Configured for Express.js integration
- **Environment Configuration**: Flexible settings management
- **Docker Support**: Containerized deployment
- **Type Safety**: Full type hints and Pydantic models
- **API Documentation**: Automatic OpenAPI/Swagger docs

## Getting Started

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- Access to ELK stack services

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
DEBUG=true
PORT=8000
API_V1_PREFIX=/api/v1

# Security
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Express.js Integration
EXPRESS_SERVER_URL=http://localhost:3000

# Logging
LOGSTASH_HOST=logstash
LOGSTASH_PORT=5000
```

### Running with Docker

```bash
# Build and start the services
docker-compose up --build

# Access the API documentation
open http://localhost:8000/docs
```

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the development server
python main.py
```

## API Documentation

When running in development mode, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

## Logging

The application uses structured logging that integrates with the ELK stack:

- Logs are sent to both console and Logstash
- JSON format for better searchability
- Request/response logging middleware
- Application events tracking
- Error tracking with stack traces

View logs in Kibana at `http://localhost:5601`

## Health Checks

The service provides health check endpoints:
- `GET /health`: Basic application health
- `GET /api/v1/health`: Detailed system status

## Integration with Express.js

This FastAPI service is designed to work alongside an Express.js application:
- Shared authentication
- CORS configuration
- Consistent logging
- Health monitoring

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.