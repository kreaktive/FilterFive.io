const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const { receiveCustomerData } = require('../controllers/ingestController');
const logger = require('../services/logger');

// Per-API-key rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per API key
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  validate: {
    xForwardedForHeader: false,
    keyGeneratorIpFallback: false
  },
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  }
});

/**
 * API Key authentication middleware
 * Only supports per-tenant API keys (ff_ prefix).
 * Legacy shared API_SECRET has been removed for security.
 */
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required. Use your tenant API key (starts with ff_)'
    });
  }

  // Only accept per-tenant API keys (starts with 'ff_')
  if (!apiKey.startsWith('ff_')) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key format. Use your tenant API key from the dashboard settings.'
    });
  }

  try {
    const tenant = await User.findOne({
      where: { apiKey, role: 'tenant', isActive: true }
    });

    if (!tenant) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Attach tenant to request - tenantId auto-derived from API key
    req.tenant = tenant;
    req.body.tenantId = tenant.id;
    return next();
  } catch (error) {
    logger.error('API key lookup error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// POST /api/v1/hooks/customer
router.post('/customer', apiRateLimiter, authenticateApiKey, receiveCustomerData);

module.exports = router;
