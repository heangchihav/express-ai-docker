import logging
import json
import socket
from datetime import datetime
from logging.handlers import SocketHandler
from typing import Any, Dict

class LogstashFormatter(logging.Formatter):
    def __init__(self):
        super(LogstashFormatter, self).__init__()

    def format(self, record: logging.LogRecord) -> str:
        message = {
            '@timestamp': datetime.utcnow().isoformat(),
            'type': 'fastapi',
            'service': 'fastapi-app',
            'level': record.levelname,
            'host': socket.gethostname(),
            'path': record.pathname,
            'line_number': record.lineno,
            'function': record.funcName,
            'message': record.getMessage()
        }

        if hasattr(record, 'props'):
            message.update(record.props)

        if record.exc_info:
            message['exception'] = self.formatException(record.exc_info)

        return json.dumps(message)

class CustomLogger(logging.Logger):
    def __init__(self, name: str, level: int = logging.NOTSET):
        super().__init__(name, level)
        self.props: Dict[str, Any] = {}

    def _log(self, level: int, msg: str, args: tuple, exc_info=None, extra=None, **kwargs):
        if extra is None:
            extra = {}
        if 'props' in extra:
            props = extra.pop('props')
            if isinstance(props, dict):
                extra['props'] = {**self.props, **props}
        super()._log(level, msg, args, exc_info, extra, **kwargs)

def setup_logging():
    logging.setLoggerClass(CustomLogger)
    logger = logging.getLogger('fastapi')
    logger.setLevel(logging.INFO)

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Logstash Handler
    logstash_handler = SocketHandler('logstash', 5000)
    logstash_handler.setFormatter(LogstashFormatter())
    logger.addHandler(logstash_handler)

    return logger

logger = setup_logging()
