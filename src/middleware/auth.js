// Authentication middleware for protected dashboard routes

const logger = require('../services/logger');
const cacheService = require('../services/cacheService');

// Cache for frequently accessed user attributes (request-scoped)
const BASIC_ATTRIBUTES = ['id', 'email', 'businessName', 'isActive', 'isVerified', 'role'];
const SMS_ATTRIBUTES = ['smsUsageCount', 'smsUsageLimit'];
const SUBSCRIPTION_ATTRIBUTES = ['subscriptionStatus', 'subscriptionPlan', 'stripeCustomerId', 'trialStartsAt', 'trialEndsAt'];
const SETTINGS_ATTRIBUTES = ['reviewUrl', 'smsMessageTone', 'customSmsMessage', 'reviewValueEstimate'];
const FULL_ATTRIBUTES = [...BASIC_ATTRIBUTES, ...SMS_ATTRIBUTES, ...SUBSCRIPTION_ATTRIBUTES, ...SETTINGS_ATTRIBUTES];

// TTL for user session cache (short to ensure security checks happen frequently)
const USER_SESSION_TTL = 60; // 60 seconds

/**
 * Generate cache key for user session data
 */
const userSessionCacheKey = (userId) => `auth:user:${userId}`;

/**
 * Require authentication and verify user exists and is active
 * SECURITY FIX: Previously only checked session.userId without verifying
 * the user still exists or is active in the database
 * OPTIMIZATION: Uses Redis cache with short TTL to reduce DB lookups
 */
const requireAuth = async (req, res, next) => {
  // Check session exists
  if (!req.session || !req.session.userId) {
    logger.warn('requireAuth: No session or userId', {
      path: req.path,
      hasSession: !!req.session,
      sessionId: req.session?.id?.substring(0, 8) || 'none',
      sessionKeys: req.session ? Object.keys(req.session).join(',') : 'none',
      hasCookie: !!req.headers.cookie,
      cookiePreview: req.headers.cookie ? req.headers.cookie.substring(0, 50) + '...' : 'none'
    });

    // For AJAX requests, return JSON instead of redirect
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Session expired. Please refresh the page.' });
    }

    return res.redirect('/dashboard/login');
  }

  try {
    const { User } = require('../models');
    const userId = req.session.userId;
    const cacheKey = userSessionCacheKey(userId);

    // Try to get user from cache first
    let user = null;
    let fromCache = false;

    if (cacheService.isAvailable()) {
      const cachedUser = await cacheService.get(cacheKey);
      if (cachedUser) {
        // Reconstruct user object with cached data
        user = User.build(cachedUser, { isNewRecord: false });
        fromCache = true;
      }
    }

    // If not in cache, fetch from database
    if (!user) {
      user = await User.findByPk(userId, {
        attributes: BASIC_ATTRIBUTES
      });

      // Cache the user data for subsequent requests
      if (user && cacheService.isAvailable()) {
        await cacheService.set(cacheKey, user.toJSON(), USER_SESSION_TTL);
      }
    }

    // User deleted or deactivated - destroy session
    if (!user || !user.isActive) {
      logger.warn('Auth rejected: user inactive or deleted', {
        userId: req.session.userId,
        reason: !user ? 'user_not_found' : 'user_inactive'
      });
      req.session.destroy();
      return res.redirect('/dashboard/login?error=account_disabled');
    }

    // User not verified - destroy session
    if (!user.isVerified) {
      logger.warn('Auth rejected: user not verified', { userId: req.session.userId });
      req.session.destroy();
      return res.redirect('/dashboard/login?error=email_not_verified');
    }

    // Attach user to request for downstream use
    req.user = user;

    // Add lazy loader for additional attributes
    req.loadUserAttributes = async (attributeSet = 'full') => {
      if (req._userAttributesLoaded === attributeSet || req._userAttributesLoaded === 'full') {
        return req.user;
      }

      let attributes;
      switch (attributeSet) {
        case 'sms':
          attributes = [...BASIC_ATTRIBUTES, ...SMS_ATTRIBUTES];
          break;
        case 'subscription':
          attributes = [...BASIC_ATTRIBUTES, ...SUBSCRIPTION_ATTRIBUTES];
          break;
        case 'full':
        default:
          attributes = FULL_ATTRIBUTES;
      }

      const fullUser = await User.findByPk(req.session.userId, { attributes });
      if (fullUser) {
        req.user = fullUser;
        req._userAttributesLoaded = attributeSet;
      }
      return req.user;
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    res.redirect('/dashboard/login');
  }
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }

  next();
};

/**
 * Invalidate user session cache
 * Call this when user data changes (logout, account update, deactivation, etc.)
 * @param {number} userId - User ID to invalidate cache for
 */
const invalidateUserSessionCache = async (userId) => {
  if (cacheService.isAvailable()) {
    const cacheKey = userSessionCacheKey(userId);
    await cacheService.del(cacheKey);
    logger.info('User session cache invalidated', { userId });
  }
};

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
  invalidateUserSessionCache
};
