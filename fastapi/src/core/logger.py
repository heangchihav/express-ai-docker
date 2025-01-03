import logging
import os
from pythonjsonlogger import jsonlogger

# Ensure the logs directory exists
LOG_DIR = os.path.join(os.getcwd(), "logs")
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Create a logger
logger = logging.getLogger("fastapi")
logger.setLevel(logging.INFO)

# File handler to write logs to logs/app.log
file_handler = logging.FileHandler(os.path.join(LOG_DIR, "app.log"))
file_handler.setLevel(logging.INFO)

# JSON formatter for logs
json_formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(message)s'
)
file_handler.setFormatter(json_formatter)

# Add the file handler to the logger
logger.addHandler(file_handler)

# Console handler for debugging
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(console_handler)

# Prevent propagation to root logger
logger.propagate = False
