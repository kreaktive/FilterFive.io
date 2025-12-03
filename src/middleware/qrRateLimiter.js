/**
 * QR Rate Limiter Middleware
 */
const rateLimit = require('express-rate-limit');

const qrRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('error', {
      title: 'Too Many Requests',
      message: 'Please try again in 30 seconds.',
      error: { status: 429 }
    });
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

module.exports = { qrRateLimiter };
