from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import time

app = FastAPI()

# Dictionary to store user activity
user_activity = {}

# Middleware to detect unusual activity
@app.middleware("http")
async def detect_unusual_activity(request: Request, call_next):
    user_ip = request.client.host
    current_time = time.time()

    # Track request times for each user IP
    if user_ip not in user_activity:
        user_activity[user_ip] = []
    
    user_activity[user_ip].append(current_time)

    # Remove requests older than 10 seconds
    user_activity[user_ip] = [t for t in user_activity[user_ip] if t > current_time - 10]

    # If too many requests are made in a short period, flag as unusual
    if len(user_activity[user_ip]) > 5:
        return JSONResponse(
            {"error": "Unusual activity detected, rate limit exceeded."},
            status_code=429
        )

    response = await call_next(request)
    return response

# Sample route
@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}

# Additional routes can be added here
@app.get("/example")
async def example_route():
    return {"message": "This is an example route!"}

# Run this file directly to start the server (optional)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
