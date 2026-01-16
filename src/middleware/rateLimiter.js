/**
 * Rate Limiting Middleware
 * Prevents abuse of authentication and API endpoints
 */

const rateLimit = require('express-rate-limit');

/**
 * Validate IPv6 to handle edge case where express-rate-limit
 * requires explicit IPv6 handling for custom keyGenerators
 */
const getClientIp = (req) => {
  // Get IP from various sources (respecting proxies)
  const ip = req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    'unknown';
  return ip;
};

/**
 * Create a rate limit handler that renders an error page
 * @param {string} message - Error message to display
 * @returns {Function} Express handler function
 */
const createErrorPageHandler = (message) => (req, res) => {
  res.status(429).render('error', {
    title: 'Too Many Requests',
    error: {
      status: 429,
      message
    }
  });
};

/**
 * Create a rate limit handler that renders the login page with an error
 * @param {string} message - Error message to display
 * @returns {Function} Express handler function
 */
const createLoginPageHandler = (message) => (req, res) => {
  res.status(429).render('dashboard/login', {
    title: 'Login',
    error: message
  });
};

/**
 * Create a rate limit handler that returns JSON
 * @param {string} message - Error message to return
 * @returns {Function} Express handler function
 */
const createJsonHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    error: message
  });
};

/**
 * Signup Rate Limiter
 * Limit: 5 signup attempts per IP per hour
 */
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 signup attempts per IP per hour
  message: 'Too many signup attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: createErrorPageHandler('Too many signup attempts. Please try again in an hour.')
});

/**
 * Login Rate Limiter
 * Limit: 10 login attempts per IP per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: createLoginPageHandler('Too many login attempts. Please try again in 15 minutes.')
});

/**
 * Password Reset Rate Limiter
 * Limit: 3 password reset requests per IP per hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: createErrorPageHandler('Too many password reset attempts. Please try again in an hour.')
});

/**
 * Email Verification Resend Limiter
 * Limit: 3 resend requests per IP per hour
 */
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many verification email requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorPageHandler('Too many verification email requests. Please try again in an hour.')
});

/**
 * API Rate Limiter
 * Limit: 100 requests per IP per hour, or 200 requests per user per hour
 * User-based limits are more generous since we know who they are
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // More generous limits for authenticated users
    return req.session?.userId ? 200 : 100;
  },
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.session?.userId ? `user:${req.session.userId}` : getClientIp(req);
  },
  handler: createJsonHandler('Too many API requests. Please try again later.'),
  validate: { xForwardedForHeader: false }
});

/**
 * CSV Upload Rate Limiter
 * Limit: 10 uploads per user per hour (user-based, not IP-based)
 * Prevents abuse of CSV processing which is resource-intensive
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many upload attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID since uploads require authentication
    return req.session?.userId ? `user:${req.session.userId}` : getClientIp(req);
  },
  handler: createErrorPageHandler('Too many upload attempts. Please try again in an hour.'),
  validate: { xForwardedForHeader: false }
});

/**
 * QR Code Scan Rate Limiter
 * Limit: 30 scans per IP per 15 minutes
 * Prevents abuse while allowing legitimate bulk scanning
 */
const qrScanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many QR code scans from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: createErrorPageHandler('Too many requests. Please try again in a few minutes.')
});

/**
 * SMS Send Rate Limiter
 * Limit: 50 SMS requests per user per hour
 * Prevents abuse of SMS sending which costs money
 */
const smsSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many SMS requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.session?.userId ? `user:${req.session.userId}` : getClientIp(req);
  },
  handler: createJsonHandler('Too many SMS requests. Please try again later.'),
  validate: { xForwardedForHeader: false }
});

module.exports = {
  signupLimiter,
  loginLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
  apiLimiter,
  uploadLimiter,
  qrScanLimiter,
  smsSendLimiter,
  // Export factory functions for custom handlers
  createErrorPageHandler,
  createLoginPageHandler,
  createJsonHandler
};
