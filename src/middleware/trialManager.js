/**
 * Trial Management Middleware
 * Handles trial status checks and access control for Phase 2 hybrid trial model
 */

const { User } = require('../models');

/**
 * Check trial status and attach to request
 * Loads user data and calculates trial state
 */
const checkTrialStatus = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return next();
    }

    const user = await User.findByPk(req.session.userId);

    if (!user) {
      return next();
    }

    // Attach user and trial info to request
    req.user = user;
    req.trialStatus = {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

    next();
  } catch (error) {
    console.error('Error checking trial status:', error);
    next(error);
  }
};

/**
 * Require active trial or subscription for dashboard access
 * Blocks access during soft lock and hard lock
 */
const requireActiveTrial = async (req, res, next) => {
  try {
    // Load trial status if not already loaded
    if (!req.trialStatus) {
      await checkTrialStatus(req, res, () => {});
    }

    // Super admins bypass trial checks
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    // Allow access if subscription is active
    if (req.trialStatus && req.trialStatus.hasActiveSubscription) {
      return next();
    }

    // Allow access if trial is active
    if (req.trialStatus && req.trialStatus.isActive) {
      return next();
    }

    // Block access if trial expired (soft lock or hard lock)
    if (req.trialStatus && (req.trialStatus.isInGracePeriod || req.trialStatus.isHardLocked)) {
      return res.render('dashboard/trial-expired', {
        title: 'Trial Expired - FilterFive',
        user: req.user,
        trialStatus: req.trialStatus,
        isGracePeriod: req.trialStatus.isInGracePeriod,
        isHardLocked: req.trialStatus.isHardLocked
      });
    }

    // Default: allow access (shouldn't reach here in normal flow)
    next();
  } catch (error) {
    console.error('Error in requireActiveTrial:', error);
    next(error);
  }
};

/**
 * Check if SMS sending is allowed based on trial/subscription limits
 * Used by SMS sending functionality
 */
const canSendSms = async (req, res, next) => {
  try {
    // Load trial status if not already loaded
    if (!req.trialStatus) {
      await checkTrialStatus(req, res, () => {});
    }

    // Super admins bypass limits
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    // Check if user can send SMS
    if (req.trialStatus && req.trialStatus.canSendSms) {
      return next();
    }

    // Block SMS sending
    return res.status(403).json({
      success: false,
      error: 'SMS limit reached',
      message: 'You have reached your SMS limit. Please upgrade to send more messages.',
      smsUsageCount: req.user.smsUsageCount,
      smsUsageLimit: req.user.smsUsageLimit
    });
  } catch (error) {
    console.error('Error in canSendSms:', error);
    next(error);
  }
};

/**
 * Determine if review redirect should be blocked
 * Used by QR controller during grace period and hard lock
 *
 * Returns redirect block info:
 * - shouldBlock: boolean
 * - reason: 'trial_expired' | 'grace_period' | 'hard_locked'
 */
const getRedirectBlockStatus = (user) => {
  // Active subscription: never block
  if (user.subscriptionStatus === 'active') {
    return { shouldBlock: false, reason: null };
  }

  // Active trial: never block
  if (user.isTrialActive()) {
    return { shouldBlock: false, reason: null };
  }

  // Hard lock: block all redirects
  if (user.isHardLocked()) {
    return { shouldBlock: true, reason: 'hard_locked' };
  }

  // Grace period: block redirects for 4-5 star reviews
  if (user.isInGracePeriod()) {
    return { shouldBlock: true, reason: 'grace_period' };
  }

  // Default: block if trial expired
  return { shouldBlock: true, reason: 'trial_expired' };
};

module.exports = {
  checkTrialStatus,
  requireActiveTrial,
  canSendSms,
  getRedirectBlockStatus
};
