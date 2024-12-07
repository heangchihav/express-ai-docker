import requests
import json

def test_security_check():
    # FastAPI endpoint
    fastapi_url = "http://localhost:8000/api/v1/security/check"
    
    # Test request data
    test_data = {
        "method": "POST",
        "path": "/api/users",
        "headers": {
            "content-type": "application/json",
            "user-agent": "Mozilla/5.0"
        },
        "body": {
            "username": "test_user",
            "email": "test@example.com"
        }
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "your_express_api_key_here"  # Use your actual API key from .env
    }
    
    try:
        # Make request to FastAPI
        response = requests.post(fastapi_url, json=test_data, headers=headers)
        
        # Print response details
        print(f"Status Code: {response.status_code}")
        print("Response Headers:", json.dumps(dict(response.headers), indent=2))
        print("Response Body:", json.dumps(response.json(), indent=2))
        
        return response.status_code == 200
        
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")
        return False

if __name__ == "__main__":
    print("Testing FastAPI-Express Integration...")
    success = test_security_check()
    print(f"\nIntegration Test {'Passed' if success else 'Failed'}")
