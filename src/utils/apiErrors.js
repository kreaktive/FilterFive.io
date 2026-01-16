/**
 * API Error Handling Utilities
 *
 * Provides consistent error handling across API endpoints with:
 * - Typed error classes for common scenarios
 * - Error wrapping for async route handlers
 * - Standardized error response formatting
 * - Sentry integration for error tracking
 */

const logger = require('../services/logger');
const sentryService = require('../services/sentryService');

/**
 * Base API Error class
 * Extends Error with additional properties for HTTP response
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes from programming errors

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * 400 Bad Request - Invalid input
 */
class BadRequestError extends ApiError {
  constructor(message = 'Invalid request', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

/**
 * 401 Unauthorized - Not authenticated
 */
class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden - Authenticated but not allowed
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
class NotFoundError extends ApiError {
  constructor(resource = 'Resource', message = null) {
    super(message || `${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
class ValidationError extends ApiError {
  constructor(errors = [], message = 'Validation failed') {
    super(message, 422, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
    this.errors = errors;
  }

  static fromValidationResult(result) {
    return new ValidationError(result.errors, result.message || 'Validation failed');
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
class RateLimitError extends ApiError {
  constructor(retryAfter = 60, message = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED', { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * 500 Internal Server Error - Unexpected error
 */
class InternalError extends ApiError {
  constructor(message = 'An unexpected error occurred') {
    super(message, 500, 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}

/**
 * 503 Service Unavailable - Dependency failure
 */
class ServiceUnavailableError extends ApiError {
  constructor(service = 'Service', message = null) {
    super(message || `${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Wrap an async route handler to automatically catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 *
 * @param {function} fn Async route handler
 * @returns {function} Wrapped handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Express error handler middleware for API routes
 * Formats errors consistently and logs them
 *
 * Usage: app.use('/api', routes, apiErrorHandler)
 */
function apiErrorHandler(err, req, res, next) {
  // Already sent response
  if (res.headersSent) {
    return next(err);
  }

  // Determine error details
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Handle known error types
  if (err.name === 'SequelizeValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = { errors: err.errors.map(e => ({ field: e.path, message: e.message })) };
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource already exists';
    details = { fields: err.fields };
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Referenced resource does not exist';
  }

  // Log error
  const logContext = {
    statusCode,
    code,
    path: req.path,
    method: req.method,
    userId: req.session?.userId,
    requestId: req.requestId
  };

  if (statusCode >= 500) {
    // Server errors - log full details and track in Sentry
    logger.error(message, { ...logContext, stack: err.stack });

    if (sentryService.isEnabled()) {
      sentryService.captureException(err, {
        tags: { api: true, path: req.path },
        extra: logContext
      });
    }

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
      message = 'An unexpected error occurred';
      details = null;
    }
  } else {
    // Client errors - log as warning
    logger.warn(message, logContext);
  }

  // Send response
  res.status(statusCode).json({
    error: message,
    code,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

/**
 * Create a success response helper
 *
 * @param {object} res Express response
 * @param {*} data Response data
 * @param {number} statusCode HTTP status code (default 200)
 */
function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data
  });
}

/**
 * Create an error response helper
 *
 * @param {object} res Express response
 * @param {string} message Error message
 * @param {number} statusCode HTTP status code (default 400)
 * @param {string} code Error code
 * @param {object} details Additional details
 */
function sendError(res, message, statusCode = 400, code = 'ERROR', details = null) {
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(details && { details })
  });
}

module.exports = {
  // Error classes
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,

  // Middleware and helpers
  asyncHandler,
  apiErrorHandler,
  sendSuccess,
  sendError
};
