/**
 * MoreStars Application Entry Point
 *
 * This is the main entry point for the application.
 * All configuration is handled in src/app/ modules.
 */

require('dotenv').config();

// Initialize Sentry FIRST (before any other imports for best stack traces)
const sentryService = require('./src/services/sentryService');
sentryService.init();

// Create and configure Express app
const { createApp } = require('./src/app');
const app = createApp(sentryService);

// Start server
const { startServer } = require('./src/app/startup');
startServer(app, sentryService);

module.exports = app;
