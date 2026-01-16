const { User } = require('../models');
const logger = require('../services/logger');

// Middleware to ensure user is authenticated and has super_admin role
const requireSuperAdmin = async (req, res, next) => {
  try {
    // Check if user is logged in
    if (!req.session || !req.session.userId) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You must be logged in to access this page.',
        error: { status: 403 }
      });
    }

    // Fetch user from database
    const user = await User.findByPk(req.session.userId);

    if (!user) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'User not found.',
        error: { status: 403 }
      });
    }

    // SECURITY: Check if user account is active
    if (!user.isActive) {
      logger.warn('Inactive user attempted super admin access', { userId: user.id });
      req.session.destroy();
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'Your account has been deactivated.',
        error: { status: 403 }
      });
    }

    // Check if user is super_admin
    if (user.role !== 'super_admin') {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page. Super Admin access required.',
        error: { status: 403 }
      });
    }

    // Attach user to request for downstream use
    req.user = user;
    next();

  } catch (error) {
    logger.error('Error in requireSuperAdmin middleware', { error: error.message });
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Something went wrong.',
      error: { status: 500 }
    });
  }
};

module.exports = {
  requireSuperAdmin
};
