/**
 * QR Rate Limiter Middleware
 *
 * Purpose: Prevent spam/abuse of QR code feedback system
 * Strategy: Limit 1 feedback per 5 minutes per business per IP
 * Trade-off: Accept some false positives (shared IPs) for simplicity
 */

const rateLimit = require('express-rate-limit');

/**
 * QR Rate Limiter
 * Limits: 1 feedback request per 30 seconds per business per IP
 */
const qrRateLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // 1 request per window per key

  // Generate unique key combining IP + businessId
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const businessId = req.params.businessId || 'unknown';
    return `qr_${businessId}_${ip}`;
  },

  // Custom message for rate limit exceeded
  handler: (req, res) => {
    console.warn(`⚠️  QR rate limit exceeded - IP: ${req.ip}, Business: ${req.params.businessId}`);

    res.status(429).render('error', {
      title: 'Too Many Requests',
      message: 'You\'ve already submitted feedback recently. Please try again in 30 seconds.',
      error: { status: 429 }
    });
  },

  // Skip successful requests (only count when they actually scan)
  skipSuccessfulRequests: false,

  // Don't count failed requests (errors)
  skipFailedRequests: true,

  standardHeaders: true,  // Return rate limit info in headers
  legacyHeaders: false    // Disable X-RateLimit-* headers
});

module.exports = { qrRateLimiter };
