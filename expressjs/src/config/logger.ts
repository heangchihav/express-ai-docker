import winston from 'winston';
import path from 'path';
import { secret } from './secret';
import * as LogstashTransport from 'winston-logstash';

// Define log levels with priorities
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Set the logging level based on the environment
const level = () => {
  return secret.nodeEnv === 'development' ? 'debug' : 'warn';
};

// Define colors for each log level for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Custom format function to handle object logging properly
const formatMessage = (info: any) => {
  if (typeof info.message === 'object') {
    return `${info.timestamp} ${info.level}: ${JSON.stringify(info.message, null, 2)}`;
  }
  return `${info.timestamp} ${info.level}: ${info.message}`;
};

// Define formats for console and file outputs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(formatMessage)
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(formatMessage)
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Create Logstash transport with retry options
const logstashOptions: LogstashTransport.LogstashOptions = {
  port: 5000,
  host: 'logstash',
  node_name: 'expressjs',
  ssl_enable: false,
  max_connect_retries: -1, // -1 for infinite retries
  timeout_connect_retries: 1000, // Time to wait between retries in ms
  retries: 2, // Number of times to retry per connection attempt
  transport: LogstashTransport.TransportType.Tcp // Use TCP instead of UDP
};

// Set up base transports for logging to console and files
const baseTransports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: level()
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat
  })
];

// Create the logger instance
const Logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: baseTransports
});

// Add Logstash transport separately with error handling
try {
  const logstashTransport = new LogstashTransport.Logstash(logstashOptions);
  
  // Handle connection errors
  logstashTransport.on('error', (err) => {
    console.error('Logstash connection error:', err);
  });

  // Handle successful connection
  logstashTransport.on('connect', () => {
    console.log('Successfully connected to Logstash');
  });

  Logger.add(logstashTransport as unknown as winston.transport);
} catch (error) {
  console.error('Error setting up Logstash transport:', error);
}

// Create error logger for express-winston
export const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'express-error.log')
    })
  ]
});

export default Logger;
