/**
 * Express Application Factory
 * Creates and configures the Express application
 */

const express = require('express');
const path = require('path');

const { setupMiddleware, setupPostWebhookMiddleware } = require('./middleware');
const { registerWebhookRoutes, registerAllRoutes } = require('./routes');
const { setupErrorHandlers, setupProcessErrorHandlers } = require('./errorHandler');
const { getShutdownState } = require('./startup');

const { sequelize } = require('../config/database');
const envValidator = require('../config/envValidator');

/**
 * Create and configure Express application
 * @param {Object} sentryService - Initialized Sentry service
 * @returns {Express} Configured Express application
 */
function createApp(sentryService) {
  const app = express();
  const publicPath = path.join(__dirname, '..', '..', 'public');

  // Validate environment
  envValidator.validate({ strict: true });

  // Setup process error handlers
  setupProcessErrorHandlers();

  // Setup pre-webhook middleware
  setupMiddleware(app, {
    sentryService,
    getShutdownState,
    publicPath
  });

  // Register webhook routes (before body parser)
  registerWebhookRoutes(app);

  // Setup post-webhook middleware
  setupPostWebhookMiddleware(app, publicPath);

  // Register all other routes
  registerAllRoutes(app, sequelize);

  // Setup error handlers (must be last)
  setupErrorHandlers(app, sentryService);

  return app;
}

module.exports = { createApp };
