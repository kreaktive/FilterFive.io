/**
 * Middleware Configuration
 * Centralizes all Express middleware setup
 */

const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const logger = require('../services/logger');
const { requestId } = require('../middleware/requestId');
const { cspNonceMiddleware, buildCspDirectives } = require('../middleware/cspNonce');
const { provideCsrfToken, conditionalCsrf } = require('../middleware/csrf');
const { appRootRedirect, blockMarketingOnApp, redirectAuthToApp } = require('../middleware/domainRouter');

/**
 * Configure security middleware (Helmet with CSP)
 */
function setupSecurityMiddleware(app) {
  // CSP nonce middleware - generates unique nonce per request
  app.use(cspNonceMiddleware);

  // Helmet security headers with dynamic CSP
  // IMPORTANT: This middleware must recreate CSP directives per-request to include dynamic nonce
  app.use((req, res, next) => {
    // Build fresh CSP directives with current nonce
    const cspConfig = {
      contentSecurityPolicy: {
        directives: buildCspDirectives(req.cspNonce)
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true
    };

    // Apply helmet with dynamic config
    helmet(cspConfig)(req, res, next);
  });
}

/**
 * Configure CORS
 */
function setupCors(app) {
  const allowedOrigins = [
    'https://morestars.io',
    'https://www.morestars.io',
    'https://app.morestars.io',
    process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
    process.env.NODE_ENV !== 'production' ? 'http://localhost:3001' : null,
  ].filter(Boolean);

  app.use(cors({
    origin: function(origin, callback) {
      // Same-origin requests (browser doesn't send Origin header) are allowed
      if (!origin) return callback(null, true);

      // Handle 'null' origin: don't throw error (which blocks form POSTs)
      // Instead, just don't allow CORS access - browser will handle appropriately
      // This can happen with certain browsers, extensions, or privacy modes
      if (origin === 'null') {
        // Allow through without CORS headers - let the request proceed
        // The browser will block JS from reading cross-origin responses anyway
        return callback(null, false);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        // Don't throw error - just don't allow CORS
        // Throwing causes 500 errors even for legitimate form POSTs
        logger.warn('CORS origin not in allowlist', { origin });
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
  }));
}

/**
 * Configure compression
 */
function setupCompression(app) {
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['accept'] === 'text/event-stream') {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

/**
 * Configure session middleware
 */
function setupSession(app) {
  app.use(session({
    store: new pgSession({
      conString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

/**
 * Configure static file serving
 */
function setupStatic(app, publicPath) {
  const express = require('express');
  app.use(express.static(publicPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '30d' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.includes('.min.')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
}

/**
 * Setup all middleware in correct order
 * @param {Express} app - Express application
 * @param {Object} options - Configuration options
 * @param {Object} options.sentryService - Sentry service instance
 * @param {Function} options.getShutdownState - Function to check shutdown state
 * @param {string} options.publicPath - Path to public directory
 */
function setupMiddleware(app, options) {
  const { sentryService, getShutdownState, publicPath } = options;

  // 1. Sentry (must be first)
  app.use(sentryService.requestHandler());
  app.use(sentryService.tracingHandler());

  // 2. Request ID for tracing
  app.use(requestId);

  // 3. Trust proxy
  app.set('trust proxy', 1);

  // 4. Security (CSP, Helmet)
  setupSecurityMiddleware(app);

  // 5. Compression
  setupCompression(app);

  // 6. CORS
  setupCors(app);

  // 7. Request logging
  app.use(morgan(
    process.env.NODE_ENV === 'production'
      ? ':remote-addr :method :url :status :response-time ms'
      : 'dev',
    { stream: logger.stream }
  ));

  // 8. Graceful shutdown check
  app.use((req, res, next) => {
    if (getShutdownState()) {
      res.set('Connection', 'close');
      res.set('Retry-After', '30');
      return res.status(503).json({
        error: 'Server is shutting down',
        retryAfter: 30
      });
    }
    next();
  });

  // 9. View engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  // 10. Global template variables
  app.locals.isProduction = process.env.NODE_ENV === 'production';
  app.locals.currentYear = new Date().getFullYear();
  app.locals.assetVersion = require('../../package.json').version;
}

/**
 * Setup post-webhook middleware (after webhook routes, before other routes)
 */
function setupPostWebhookMiddleware(app, publicPath) {
  // Body parser (after webhooks which need raw body)
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Request timeout
  app.use((req, res, next) => {
    req.setTimeout(30000, () => {
      if (!res.headersSent) {
        logger.warn('Request timeout', { path: req.path, method: req.method });
        res.status(408).json({ error: 'Request timeout' });
      }
    });
    next();
  });

  // Current path for SEO
  app.use((req, res, next) => {
    res.locals.currentPath = req.originalUrl;
    next();
  });

  // Session middleware
  setupSession(app);

  // Static files
  setupStatic(app, publicPath);

  // CSRF protection
  app.use(conditionalCsrf);
  app.use(provideCsrfToken);

  // Domain routing
  app.use(appRootRedirect);
  app.use(redirectAuthToApp);
  app.use(blockMarketingOnApp);
}

module.exports = {
  setupMiddleware,
  setupPostWebhookMiddleware
};
