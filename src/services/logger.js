/**
 * Centralized Logging Service
 * Uses Winston for structured logging with different transports for dev/prod
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level (for console output)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Custom format for console (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// JSON format for production (structured logs)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat
  })
);

// File transports (production only)
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Helper methods for common log patterns
logger.request = (method, path, statusCode, duration, meta = {}) => {
  logger.http(`${method} ${path} ${statusCode} ${duration}ms`, {
    type: 'request',
    method,
    path,
    statusCode,
    duration,
    ...meta
  });
};

logger.sms = (action, phone, meta = {}) => {
  logger.info(`SMS ${action}: ${phone.slice(-4)}`, {
    type: 'sms',
    action,
    phoneLast4: phone.slice(-4),
    ...meta
  });
};

logger.auth = (action, email, success, meta = {}) => {
  const logLevel = success ? 'info' : 'warn';
  logger[logLevel](`Auth ${action}: ${email}`, {
    type: 'auth',
    action,
    email,
    success,
    ...meta
  });
};

logger.cron = (job, status, meta = {}) => {
  logger.info(`Cron ${job}: ${status}`, {
    type: 'cron',
    job,
    status,
    ...meta
  });
};

logger.db = (operation, model, meta = {}) => {
  logger.debug(`DB ${operation}: ${model}`, {
    type: 'db',
    operation,
    model,
    ...meta
  });
};

logger.stripe = (event, meta = {}) => {
  logger.info(`Stripe: ${event}`, {
    type: 'stripe',
    event,
    ...meta
  });
};

// Export a stream for Morgan HTTP logging middleware
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
