/**
 * Error Handling
 * Centralizes all error handling for the application
 */

const logger = require('../services/logger');
const { csrfErrorHandler } = require('../middleware/csrf');

/**
 * Setup error handlers (must be last in middleware chain)
 */
function setupErrorHandlers(app, sentryService) {
  // 404 handler - noindex prevents search engines from indexing 404 pages
  app.use((req, res, next) => {
    res.status(404).render('404', {
      title: 'Page Not Found - MoreStars',
      description: 'The page you are looking for could not be found.',
      noindex: true
    });
  });

  // CSRF error handler
  app.use(csrfErrorHandler);

  // Sentry error handler
  app.use(sentryService.errorHandler());

  // General error handler
  app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path
    });
    res.status(500).send('Something went wrong!');
  });
}

/**
 * Setup global process error handlers
 */
function setupProcessErrorHandlers() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || String(reason),
      stack: reason?.stack
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - shutting down', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = {
  setupErrorHandlers,
  setupProcessErrorHandlers
};
