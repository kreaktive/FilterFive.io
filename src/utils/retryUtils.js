/**
 * Retry Utilities
 * Provides exponential backoff retry functionality for external service calls
 */

const logger = require('../services/logger');

// Twilio error codes that should NOT be retried (permanent failures)
const NON_RETRYABLE_TWILIO_CODES = [
  // Invalid number errors
  21211, // Invalid 'To' phone number
  21212, // Invalid 'From' phone number
  21214, // 'To' number not valid mobile
  21217, // Invalid phone number format
  21219, // 'To' phone number not verified
  21614, // 'To' number is not a valid mobile number

  // Account/configuration errors
  21408, // Permission denied
  21610, // Unsubscribed recipient (opted out)
  21611, // Trial account destination restriction
  21612, // Trial account limitation

  // Message content errors
  21602, // Message body is required
  21604, // Message body too long
  21606, // From number is required
  21617, // Invalid messaging service SID

  // Blacklist errors
  21610, // Blacklisted - unsubscribed recipient
];

// HTTP status codes that are retryable (transient server errors)
const RETRYABLE_HTTP_CODES = [429, 500, 502, 503, 504];

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
const isRetryableError = (error) => {
  // Twilio errors have a code property - check non-retryable list
  if (error.code && typeof error.code === 'number') {
    if (NON_RETRYABLE_TWILIO_CODES.includes(error.code)) {
      return false;
    }
    // Twilio rate limiting is retryable
    if (error.code === 20429) {
      return true;
    }
  }

  // HTTP status codes
  if (error.status && RETRYABLE_HTTP_CODES.includes(error.status)) {
    return true;
  }

  // Network errors are retryable
  const networkErrorCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN'];
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }

  // Error message patterns that indicate transient issues
  const transientPatterns = [
    /timeout/i,
    /temporarily unavailable/i,
    /rate limit/i,
    /too many requests/i,
    /service unavailable/i,
    /connection reset/i,
  ];

  if (error.message && transientPatterns.some(pattern => pattern.test(error.message))) {
    return true;
  }

  // Default: don't retry unknown errors (safer)
  return false;
};

/**
 * Calculate exponential backoff delay with jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay cap in milliseconds
 * @returns {number} Delay in milliseconds
 */
const calculateBackoff = (attempt, baseDelay = 1000, maxDelay = 30000) => {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (0-1 second) to prevent thundering herd
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a function with retry logic
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 3)
 * @param {number} options.baseDelay - Base delay for backoff (default: 1000ms)
 * @param {number} options.maxDelay - Maximum delay (default: 30000ms)
 * @param {Function} options.shouldRetry - Custom function to determine if should retry
 * @param {Object} options.context - Context for logging
 * @returns {Promise<any>} Result from fn
 */
const withRetry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = isRetryableError,
    context = {}
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts - 1;
      const canRetry = shouldRetry(error);

      // Log the failure
      if (logger && logger.warn) {
        logger.warn('Operation failed', {
          ...context,
          attempt: attempt + 1,
          maxAttempts,
          errorCode: error.code,
          errorMessage: error.message,
          willRetry: !isLastAttempt && canRetry
        });
      }

      // If last attempt or error is not retryable, throw immediately
      if (isLastAttempt || !canRetry) {
        throw error;
      }

      // Calculate and apply backoff delay
      const delay = calculateBackoff(attempt, baseDelay, maxDelay);

      if (logger && logger.debug) {
        logger.debug('Retrying after delay', {
          ...context,
          attempt: attempt + 1,
          delayMs: Math.round(delay)
        });
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
};

/**
 * Create a retry wrapper for a specific service
 * @param {string} serviceName - Name of the service for logging
 * @param {Object} defaultOptions - Default retry options
 * @returns {Function} Retry wrapper function
 */
const createRetryWrapper = (serviceName, defaultOptions = {}) => {
  return (fn, options = {}) => {
    return withRetry(fn, {
      ...defaultOptions,
      ...options,
      context: {
        service: serviceName,
        ...defaultOptions.context,
        ...options.context
      }
    });
  };
};

module.exports = {
  withRetry,
  isRetryableError,
  calculateBackoff,
  sleep,
  createRetryWrapper,
  NON_RETRYABLE_TWILIO_CODES,
  RETRYABLE_HTTP_CODES
};
