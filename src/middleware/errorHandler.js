/**
 * Error Handler Middleware
 *
 * Provides consistent error responses across the application.
 * Handles different error types and formats responses appropriately
 * for API vs browser requests.
 */

const logger = require('../services/logger');

/**
 * Custom API Error class for structured error responses
 */
class ApiError extends Error {
  constructor(statusCode, message, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes from programming errors
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = 'CONFLICT', details = null) {
    return new ApiError(409, message, code, details);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') {
    return new ApiError(429, message, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code);
  }
}

/**
 * Format error response for API requests
 * @param {Error} err - The error object
 * @param {boolean} includeStack - Whether to include stack trace (dev only)
 * @returns {object} Formatted error response
 */
const formatApiError = (err, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred',
      code: err.code || 'UNKNOWN_ERROR'
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (includeStack && err.stack) {
    response.error.stack = err.stack;
  }

  return response;
};

/**
 * Determine if request expects JSON response
 * @param {Request} req - Express request object
 * @returns {boolean} True if JSON response expected
 */
const isApiRequest = (req) => {
  return (
    req.path.startsWith('/api/') ||
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.headers['content-type']?.includes('application/json')
  );
};

/**
 * Main error handler middleware
 * Should be registered LAST in the middleware chain
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code set
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error with context
  const errorContext = {
    error: err.message,
    code: err.code,
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.session?.userId,
    ip: req.ip
  };

  // Log as error for 5xx, warn for 4xx
  if (statusCode >= 500) {
    logger.error('Server error', { ...errorContext, stack: err.stack });
  } else if (statusCode >= 400) {
    logger.warn('Client error', errorContext);
  }

  // Already sent response, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  // API request - return JSON
  if (isApiRequest(req)) {
    const errorResponse = formatApiError(err, !isProduction);
    return res.status(statusCode).json(errorResponse);
  }

  // Browser request - render error page
  const errorData = {
    title: statusCode >= 500 ? 'Server Error' : 'Error',
    message: isProduction && statusCode >= 500
      ? 'Something went wrong. Please try again later.'
      : err.message,
    error: {
      status: statusCode,
      stack: isProduction ? null : err.stack
    }
  };

  // Try to render error template, fallback to plain text
  try {
    res.status(statusCode).render('error', errorData);
  } catch (renderError) {
    logger.error('Failed to render error page', { error: renderError.message });
    res.status(statusCode).send(`
      <h1>${errorData.title}</h1>
      <p>${errorData.message}</p>
    `);
  }
};

/**
 * 404 Not Found handler
 * Should be registered BEFORE error handler, AFTER all routes
 */
const notFoundHandler = (req, res, next) => {
  const err = ApiError.notFound(`Cannot ${req.method} ${req.path}`);
  next(err);
};

/**
 * Validation error formatter
 * Converts validation library errors to consistent format
 * @param {Array|object} errors - Validation errors
 * @returns {ApiError} Formatted validation error
 */
const validationError = (errors) => {
  const details = Array.isArray(errors)
    ? errors.map(e => ({ field: e.field || e.path, message: e.message || e.msg }))
    : [{ message: errors.message || String(errors) }];

  return ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
};

/**
 * Sequelize error formatter
 * Converts Sequelize errors to ApiError
 * @param {Error} err - Sequelize error
 * @returns {ApiError} Formatted error
 */
const sequelizeErrorFormatter = (err) => {
  // Unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return ApiError.conflict(`${field} already exists`, 'DUPLICATE_ENTRY', {
      field,
      value: err.errors?.[0]?.value
    });
  }

  // Validation error
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors?.map(e => ({
      field: e.path,
      message: e.message
    }));
    return ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
  }

  // Foreign key constraint
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiError.badRequest('Related resource not found', 'FOREIGN_KEY_ERROR');
  }

  // Connection error
  if (err.name === 'SequelizeConnectionError') {
    logger.error('Database connection error', { error: err.message });
    return ApiError.internal('Service temporarily unavailable', 'DATABASE_ERROR');
  }

  // Default - return as internal error
  return ApiError.internal('Database error', 'DATABASE_ERROR');
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  formatApiError,
  validationError,
  sequelizeErrorFormatter,
  isApiRequest
};
