import winston from 'winston';
import path from 'path';
import { secret } from './secret'; // Make sure this imports your environment settings correctly

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
  return secret.NODE_ENV === 'development' ? 'debug' : 'warn';
};

// Define colors for each log level for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors); // Apply the colors to winston

// Custom format function to handle object logging properly
const formatMessage = (info: any) => {
  // Display objects in a readable format
  return typeof info.message === 'object'
    ? `${info.timestamp} ${info.level}: ${JSON.stringify(info.message, null, 2)}`
    : `${info.timestamp} ${info.level}: ${info.message}`;
};

// Define formats for console and file outputs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), // Timestamp formatting
  winston.format.colorize({ all: true }), // Colorize all log entries for better readability
  winston.format.printf(formatMessage) // Custom message formatting
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(formatMessage) // File format without colorization
);

// Set up transports for logging to console and separate files by level
const transports = [
  new winston.transports.Console({
    format: consoleFormat, // Use console-specific formatting
  }),
  // Error logs transport
  new winston.transports.File({
    level: 'error',
    filename: path.join('logs', 'error.log'), // Error log file path
    format: fileFormat,
    maxsize: 5242880, // 5MB max file size
    maxFiles: 5, // Maximum 5 rotated files
  }),
  // Warn logs transport
  new winston.transports.File({
    level: 'warn',
    filename: path.join('logs', 'warn.log'), // Warning log file path
    format: fileFormat,
    maxsize: 5242880, // 5MB max file size
    maxFiles: 5,
  }),
  // Info logs transport
  new winston.transports.File({
    level: 'info',
    filename: path.join('logs', 'info.log'), // Info log file path
    format: fileFormat,
    maxsize: 5242880, // 5MB max file size
    maxFiles: 5,
  }),
  // HTTP logs transport
  new winston.transports.File({
    level: 'http',
    filename: path.join('logs', 'http.log'), // HTTP log file path
    format: fileFormat,
    maxsize: 5242880, // 5MB max file size
    maxFiles: 5,
  }),
  // Debug logs transport
  new winston.transports.File({
    level: 'debug',
    filename: path.join('logs', 'debug.log'), // Debug log file path
    format: fileFormat,
    maxsize: 5242880, // 5MB max file size
    maxFiles: 5,
  }),
];

// Create the main logger with the defined settings
const Logger = winston.createLogger({
  level: level(), // Set dynamic log level
  levels, // Attach custom log levels
  format: fileFormat, // Use file format for default log configuration
  transports, // Include all defined transports
  defaultMeta: { service: 'user-service' }, // Add default meta data to all log entries
});

export default Logger; // Export the main logger for use throughout the application

// Optional specific logger for errors, using only the error level
export const errorLogger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB max size
      maxFiles: 5,
    }),
  ],
});
