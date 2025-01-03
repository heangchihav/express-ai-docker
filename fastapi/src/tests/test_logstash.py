import socket
import json
import sys

def test_logstash_connection(host='logstash', port=5000):
    try:
        # Create a socket object
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)  # Set a timeout of 5 seconds
        
        # Try to resolve the hostname
        try:
            print(f"Attempting to resolve hostname {host}...")
            ip_address = socket.gethostbyname(host)
            print(f"Resolved {host} to {ip_address}")
        except socket.gaierror as e:
            print(f"Failed to resolve hostname {host}: {e}")
            return False
        
        # Connect to the server
        print(f"Attempting to connect to {host}:{port}...")
        sock.connect((host, port))
        print("Successfully connected!")
        
        # Create test messages
        messages = [
            {
                "@timestamp": "2024-12-20T13:00:00+07:00",
                "message": "Test message 1 from FastAPI",
                "level": "INFO",
                "service": "fastapi-app",
                "environment": "development"
            },
            {
                "@timestamp": "2024-12-20T13:00:01+07:00",
                "message": "Test message 2 from FastAPI",
                "level": "INFO",
                "service": "fastapi-app",
                "environment": "development"
            }
        ]
        
        # Send each message
        for message in messages:
            print(f"Sending test message: {message}")
            # Add newline to end of JSON string for json_lines codec
            message_str = json.dumps(message) + "\n"
            sock.sendall(message_str.encode())
            print("Message sent successfully!")
        
        # Close the socket
        sock.close()
        print("Connection closed.")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_logstash_connection()
