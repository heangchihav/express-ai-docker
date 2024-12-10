import logging
import socket
import json
from logging.handlers import SocketHandler
from typing import Any, Dict
import os

class LogstashFormatter(logging.Formatter):
    def __init__(self):
        super(LogstashFormatter, self).__init__()

    def format(self, record: logging.LogRecord) -> str:
        message: Dict[str, Any] = {}

        # Add basic fields
        message.update({
            '@timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'path': record.pathname,
            'type': 'fastapi'
        })

        # Add exception info if present
        if record.exc_info:
            message['exception'] = self.formatException(record.exc_info)

        # Add the message
        if isinstance(record.msg, dict):
            message.update(record.msg)
        else:
            message['message'] = record.getMessage()

        # Add extra fields
        if hasattr(record, 'props'):
            message.update(record.props)

        return json.dumps(message)

class LogstashHandler(SocketHandler):
    def __init__(self, host: str, port: int):
        super(LogstashHandler, self).__init__(host, port)
        self.formatter = LogstashFormatter()

    def makeSocket(self) -> socket.socket:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((self.host, self.port))
        return s

def setup_logger() -> logging.Logger:
    logger = logging.getLogger("fastapi")
    logger.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Logstash handler
    logstash_host = os.getenv('LOGSTASH_HOST', 'logstash')
    logstash_port = int(os.getenv('LOGSTASH_PORT', 5000))
    
    try:
        logstash_handler = LogstashHandler(logstash_host, logstash_port)
        logger.addHandler(logstash_handler)
    except Exception as e:
        logger.error(f"Failed to connect to Logstash: {e}")

    return logger

# Create logger instance
logger = setup_logger()
