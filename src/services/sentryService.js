/**
 * Sentry Error Tracking Service
 *
 * Provides error monitoring and performance tracking for production.
 * Only initializes if SENTRY_DSN is configured.
 *
 * Free tier includes:
 * - 5,000 errors/month
 * - Performance monitoring
 * - Source maps support
 * - Issue tracking and alerts
 */

let Sentry = null;
let isInitialized = false;

/**
 * Initialize Sentry if DSN is configured
 * Must be called early in application startup (before routes)
 */
const init = (app = null) => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('Sentry DSN not configured - error tracking disabled');
    return false;
  }

  try {
    Sentry = require('@sentry/node');

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',

      // Sample rate for performance monitoring (10% in production)
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Don't send PII to Sentry
      sendDefaultPii: false,

      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove any potential secrets from the event
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-csrf-token'];
        }

        // Don't send 404s or expected errors
        const error = hint?.originalException;
        if (error?.status === 404 || error?.code === 'EBADCSRFTOKEN') {
          return null;
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'Load failed',
        'Request aborted',
        /^Timeout/
      ]
    });

    isInitialized = true;
    console.log('Sentry initialized successfully');

    return true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error.message);
    return false;
  }
};

/**
 * Get Sentry request handler middleware
 * In Sentry v10+, use setupExpressErrorHandler instead
 * For now, return a no-op middleware
 */
const requestHandler = () => {
  // Sentry v10 doesn't require a request handler middleware
  // It automatically instruments Express when initialized
  return (req, res, next) => next();
};

/**
 * Get Sentry tracing handler middleware
 * In Sentry v10+, tracing is automatic
 */
const tracingHandler = () => {
  // Sentry v10 doesn't require a tracing handler middleware
  // Tracing is automatic when initialized
  return (req, res, next) => next();
};

/**
 * Get Sentry error handler middleware
 * Add this AFTER all routes but BEFORE other error handlers
 */
const errorHandler = () => {
  if (!isInitialized || !Sentry) {
    return (err, req, res, next) => next(err);
  }

  // Sentry v10 uses setupExpressErrorHandler differently
  // Return a middleware that captures the error
  return (err, req, res, next) => {
    Sentry.captureException(err);
    next(err);
  };
};

/**
 * Manually capture an exception
 * @param {Error} error - The error to capture
 * @param {object} context - Additional context to attach
 */
const captureException = (error, context = {}) => {
  if (!isInitialized || !Sentry) {
    console.error('Sentry not initialized, logging error:', error.message);
    return;
  }

  Sentry.withScope((scope) => {
    // Add extra context
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email
      });
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
};

/**
 * Manually capture a message
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 * @param {object} context - Additional context to attach
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (!isInitialized || !Sentry) {
    console.log(`Sentry not initialized, logging message [${level}]:`, message);
    return;
  }

  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
};

/**
 * Set user context for current scope
 * @param {object} user - User information
 */
const setUser = (user) => {
  if (!isInitialized || !Sentry) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.businessName
  });
};

/**
 * Clear user context
 */
const clearUser = () => {
  if (!isInitialized || !Sentry) return;
  Sentry.setUser(null);
};

/**
 * Start a transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 */
const startTransaction = (name, op = 'task') => {
  if (!isInitialized || !Sentry) return null;
  return Sentry.startInactiveSpan({ name, op });
};

/**
 * Add breadcrumb for debugging
 * @param {object} breadcrumb - Breadcrumb data
 */
const addBreadcrumb = (breadcrumb) => {
  if (!isInitialized || !Sentry) return;
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Check if Sentry is initialized
 */
const isEnabled = () => isInitialized;

/**
 * Flush all pending events (call before process exit)
 * @param {number} timeout - Timeout in ms
 */
const flush = async (timeout = 2000) => {
  if (!isInitialized || !Sentry) return;
  await Sentry.flush(timeout);
};

module.exports = {
  init,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  startTransaction,
  addBreadcrumb,
  isEnabled,
  flush
};
