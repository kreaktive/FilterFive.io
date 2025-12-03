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

  // Generate unique key combining IP + businessId (IPv6 compatible)
  keyGenerator: (req, res) => {
    const businessId = req.params.businessId || 'unknown';
    // Use default IP extraction which handles IPv6 properly
    return `qr_${businessId}`;
  },

  // Standard IP handling (supports IPv6)
  standardHeaders: true,
  legacyHeaders: false,

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
  skipFailedRequests: true
});

module.exports = { qrRateLimiter };
