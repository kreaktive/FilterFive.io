/**
 * CSRF Protection Middleware
 * Simple session-based CSRF token implementation
 *
 * This replaces the csrf-csrf library which has issues with "null" origin
 */

const crypto = require('crypto');
const logger = require('../services/logger');

/**
 * Generate a CSRF token tied to the session
 * @param {Object} req - Express request object
 * @param {boolean} forceNew - Force generation of a new token
 * @returns {Object} { token, isNew } - The token and whether it was newly generated
 */
const generateToken = (req, forceNew = false) => {
  if (!req.session) {
    throw new Error('Session required for CSRF protection');
  }

  let isNew = false;
  // Generate a new token if none exists in session
  if (!req.session.csrfToken || forceNew) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    isNew = true;
  }

  return { token: req.session.csrfToken, isNew };
};

/**
 * Rotate CSRF token (call after login/logout for extra security)
 * Prevents session fixation attacks where attacker knows the CSRF token
 */
const rotateToken = (req) => {
  if (!req.session) {
    return null;
  }

  // Generate new token
  req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  logger.info('CSRF token rotated', { sessionId: req.session.id?.substring(0, 8) || 'unknown' });
  return req.session.csrfToken;
};

/**
 * Validate CSRF token from request against session
 */
const validateToken = (req) => {
  const sessionToken = req.session?.csrfToken;
  const requestToken = req.body?._csrf ||
                       req.headers['x-csrf-token'] ||
                       req.headers['csrf-token'] ||
                       req.query?._csrf;

  if (!sessionToken || !requestToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sessionToken),
      Buffer.from(requestToken)
    );
  } catch {
    return false;
  }
};

/**
 * Middleware to generate and provide CSRF token to views
 * Ensures token is persisted to session store before proceeding
 */
const provideCsrfToken = (req, res, next) => {
  try {
    const { token, isNew } = generateToken(req);
    res.locals.csrfToken = token;

    // Log session info for debugging
    logger.info('CSRF token provided', {
      path: req.path,
      sessionId: req.session?.id?.substring(0, 8) || 'none',
      tokenPreview: token.substring(0, 8) + '...',
      isNew,
      hasSessionSave: typeof req.session?.save === 'function'
    });

    // If a new token was generated, explicitly save the session
    // to ensure it's persisted before the response is sent
    if (isNew && req.session.save) {
      req.session.save((err) => {
        if (err) {
          logger.error('Error saving session with CSRF token', { error: err.message });
        } else {
          logger.info('Session saved with new CSRF token', {
            sessionId: req.session?.id?.substring(0, 8) || 'none'
          });
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    logger.error('Error generating CSRF token', { error: error.message });
    next(error);
  }
};

/**
 * Routes that should skip CSRF protection
 */
const csrfExemptPaths = [
  '/webhooks',           // Stripe webhooks
  '/api/webhooks',       // POS webhooks
  '/api/v1/hooks',       // Zapier/API ingestion
  '/api/auth',           // POS OAuth callbacks
  '/health',             // Health check endpoint
  '/dashboard/upload'    // File upload (multipart/form-data - CSRF token not parsed before multer)
];

/**
 * CSRF protection middleware
 */
const conditionalCsrf = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check if path is exempt
  const isExempt = csrfExemptPaths.some(path => req.path.startsWith(path));
  if (isExempt) {
    return next();
  }

  // Validate CSRF token
  if (!validateToken(req)) {
    // Detailed debug logging
    const sessionToken = req.session?.csrfToken;
    const bodyToken = req.body?._csrf;
    const headerToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];

    logger.warn('CSRF token validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      hasSession: !!req.session,
      sessionId: req.session?.id?.substring(0, 8) || 'none',
      sessionKeys: req.session ? Object.keys(req.session).join(',') : 'none',
      hasSessionToken: !!sessionToken,
      sessionTokenPreview: sessionToken ? sessionToken.substring(0, 8) + '...' : 'none',
      hasBodyToken: !!bodyToken,
      bodyTokenPreview: bodyToken ? bodyToken.substring(0, 8) + '...' : 'none',
      hasHeaderToken: !!headerToken,
      headerTokenPreview: headerToken ? headerToken.substring(0, 8) + '...' : 'none',
      tokensMatch: sessionToken && bodyToken ? sessionToken === bodyToken : false,
      origin: req.headers.origin || 'none',
      contentType: req.headers['content-type'] || 'none',
      bodyKeys: req.body ? Object.keys(req.body).join(',') : 'empty',
      hasCookie: !!req.headers.cookie,
      cookiePreview: req.headers.cookie ? req.headers.cookie.substring(0, 50) + '...' : 'none'
    });

    // For AJAX requests, return JSON error
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({
        error: 'Invalid security token. Please refresh the page and try again.'
      });
    }

    // For regular form submissions, redirect back with error
    req.session.errorMessage = 'Your session has expired. Please refresh and try again.';
    const referer = req.get('Referer');
    return res.redirect(referer || '/dashboard');
  }

  next();
};

/**
 * CSRF error handler (for compatibility - errors now handled in conditionalCsrf)
 */
const csrfErrorHandler = (err, req, res, next) => {
  next(err);
};

// For compatibility with existing code
const doubleCsrfProtection = conditionalCsrf;
// Wrapper that returns just the token string for backward compatibility
const generateCsrfToken = (req) => generateToken(req).token;

module.exports = {
  provideCsrfToken,
  doubleCsrfProtection,
  conditionalCsrf,
  csrfErrorHandler,
  generateCsrfToken,
  rotateToken
};
