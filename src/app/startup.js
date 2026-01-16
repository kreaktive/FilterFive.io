/**
 * Server Startup & Lifecycle
 * Handles server startup, cron jobs, and graceful shutdown
 */

const logger = require('../services/logger');
const { sequelize, testConnection } = require('../config/database');
const cacheService = require('../services/cacheService');

// Cron job initializers
const { initDailySnapshotsCron } = require('../cron/daily-snapshots');
const { initTrialNotificationsCron } = require('../cron/trial-notifications');
const { initAbandonedCheckoutCron } = require('../cron/abandoned-checkout');
const { initTokenCleanupCron } = require('../cron/token-cleanup');

// Queue initializers
const { initProcessor: initPosSmsQueue } = require('../queues/posSmsQueue');

// Shutdown configuration
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds max
const DRAIN_TIMEOUT = 10000;    // 10 seconds to drain connections

// State
let server = null;
let isShuttingDown = false;
const activeConnections = new Set();

/**
 * Get current shutdown state
 */
function getShutdownState() {
  return isShuttingDown;
}

/**
 * Track active connections for graceful draining
 */
function connectionTracker(socket) {
  activeConnections.add(socket);
  socket.on('close', () => {
    activeConnections.delete(socket);
  });
}

/**
 * Initialize cron jobs
 */
function initCronJobs() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    logger.info('Initializing cron jobs...');
    initDailySnapshotsCron();
    initTrialNotificationsCron();
    initAbandonedCheckoutCron();
    initTokenCleanupCron();
    logger.info('All cron jobs scheduled');
  } else {
    logger.warn('Cron jobs disabled (set ENABLE_CRON=true to enable in development)');
  }
}

/**
 * Initialize Redis-dependent services
 */
async function initRedisServices() {
  if (!process.env.REDIS_URL) {
    logger.warn('Redis services disabled (REDIS_URL not configured)');
    return;
  }

  // Initialize POS SMS Bull queue processor
  logger.info('Initializing POS SMS queue processor...');
  initPosSmsQueue();
  logger.info('POS SMS queue processor initialized');

  // Initialize Redis cache
  logger.info('Initializing Redis cache service...');
  const connected = await cacheService.connect();
  if (connected) {
    logger.info('Redis cache service connected');
  } else {
    logger.warn('Redis cache service failed to connect - caching disabled');
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal, sentryService) {
  if (isShuttingDown) {
    logger.warn(`${signal} received but already shutting down - ignoring`);
    return;
  }

  isShuttingDown = true;
  logger.warn(`${signal} received - starting graceful shutdown...`);

  const forceShutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out - forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Stop accepting new connections
  const serverClosed = new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed - no new connections accepted');
        resolve();
      });
    } else {
      resolve();
    }
  });

  try {
    await serverClosed;

    // Drain existing connections
    if (activeConnections.size > 0) {
      logger.info(`Draining ${activeConnections.size} active connections...`);

      activeConnections.forEach((socket) => {
        if (!socket.destroyed) {
          socket.end();
        }
      });

      const drainStartTime = Date.now();
      while (activeConnections.size > 0 && (Date.now() - drainStartTime) < DRAIN_TIMEOUT) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (activeConnections.size > 0) {
        logger.warn(`Force closing ${activeConnections.size} remaining connections`);
        activeConnections.forEach((socket) => {
          if (!socket.destroyed) {
            socket.destroy();
          }
        });
      }

      logger.info('All connections drained');
    }

    // Flush Sentry
    if (sentryService.isEnabled()) {
      await sentryService.flush(2000);
      logger.info('Sentry events flushed');
    }

    // Close Redis
    if (cacheService.isAvailable()) {
      await cacheService.disconnect();
      logger.info('Redis cache connection closed');
    }

    // Close database
    await sequelize.close();
    logger.info('Database connection closed');

    clearTimeout(forceShutdownTimer);
    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceShutdownTimer);
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
}

/**
 * Start the server
 */
async function startServer(app, sentryService) {
  const PORT = process.env.PORT || 3000;

  try {
    const isConnected = await testConnection();

    if (!isConnected) {
      logger.error('Failed to connect to database. Server not started.');
      process.exit(1);
    }

    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development'
      });

      // Track connections for graceful shutdown
      server.on('connection', connectionTracker);

      // Initialize services
      initCronJobs();
      initRedisServices();
    });

    // Setup shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', sentryService));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', sentryService));

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

module.exports = {
  startServer,
  getShutdownState
};
