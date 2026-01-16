/**
 * Auth Controller
 * Handles signup, email verification, and password reset
 */

const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');
const validation = require('../services/validationService');
const stripeService = require('../services/stripeService');
const logger = require('../services/logger');
const { invalidateUserSessionCache } = require('../middleware/auth');
const { rotateToken: rotateCsrfToken } = require('../middleware/csrf');
const { TRIAL_DURATION_DAYS } = require('../config/constants');

/**
 * Helper to get reCAPTCHA site key (null if CAPTCHA is disabled)
 */
const getRecaptchaSiteKey = () => {
  if (process.env.DISABLE_CAPTCHA === 'true') {
    return null;
  }
  return process.env.RECAPTCHA_SITE_KEY || null;
};

/**
 * GET /signup
 * Show signup form
 */
const showSignup = (req, res) => {
  res.render('auth/signup', {
    title: 'Sign Up - MoreStars',
    error: null,
    businessName: '',
    email: '',
    recaptchaSiteKey: getRecaptchaSiteKey()
  });
};

/**
 * POST /signup
 * Process signup form
 */
const signup = async (req, res) => {
  try {
    const { businessName, email, password } = req.body;

    // Sanitize inputs
    const sanitizedBusinessName = validation.sanitizeInput(businessName);
    const sanitizedEmail = email?.trim().toLowerCase();

    // Validate inputs
    const validationResult = validation.validateSignup(
      sanitizedBusinessName,
      sanitizedEmail,
      password
    );

    if (!validationResult.isValid) {
      return res.status(400).render('auth/signup', {
        title: 'Sign Up - MoreStars',
        error: validationResult.errors.join('. '),
        businessName: sanitizedBusinessName,
        email: sanitizedEmail,
        recaptchaSiteKey: getRecaptchaSiteKey()
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: sanitizedEmail } });

    if (existingUser) {
      // Check if the existing user hasn't verified their email yet
      const showResendOption = !existingUser.isVerified;

      return res.status(400).render('auth/signup', {
        title: 'Sign Up - MoreStars',
        error: 'An account with this email already exists',
        businessName: sanitizedBusinessName,
        email: sanitizedEmail,
        recaptchaSiteKey: getRecaptchaSiteKey(),
        showResendVerification: showResendOption,
        unverifiedEmail: showResendOption ? sanitizedEmail : null
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Set trial dates
    const trialStartsAt = new Date();
    const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    // Create user (password will be hashed by Sequelize hook)
    const newUser = await User.create({
      businessName: sanitizedBusinessName,
      email: sanitizedEmail,
      password: password,
      role: 'tenant',
      subscriptionStatus: 'trial',
      isVerified: false,
      isActive: true,
      verificationToken: verificationToken,
      verificationTokenExpires: verificationExpires,
      trialStartsAt: trialStartsAt,
      trialEndsAt: trialEndsAt
    });

    // Create Stripe customer (Phase 2: Subscription management)
    try {
      const stripeCustomer = await stripeService.createCustomer(newUser);
      await newUser.update({ stripeCustomerId: stripeCustomer.id });
      logger.stripe('customer_created', { userId: newUser.id });
    } catch (stripeError) {
      logger.error('Stripe customer creation failed', { userId: newUser.id, error: stripeError.message });
      // Don't block signup if Stripe fails - user can still use trial
    }

    // Send business event alert (non-blocking)
    emailService.sendBusinessEventAlert('new_signup', {
      businessName: sanitizedBusinessName,
      email: sanitizedEmail,
      userId: newUser.id,
      trialEnds: trialEndsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }).catch(err => logger.error('Business alert failed', { error: err.message }));

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        sanitizedEmail,
        sanitizedBusinessName,
        verificationToken
      );

      logger.auth('signup_success', null, true, { userId: newUser.id });

      // Redirect to "check your inbox" page
      res.render('auth/verify-pending', {
        title: 'Check Your Email',
        email: sanitizedEmail,
        businessName: sanitizedBusinessName
      });

    } catch (emailError) {
      logger.error('Verification email sending failed', { error: emailError.message });

      // User created but email failed - allow manual resend
      res.render('auth/verify-pending', {
        title: 'Check Your Email',
        email: sanitizedEmail,
        businessName: sanitizedBusinessName,
        emailError: true
      });
    }

  } catch (error) {
    logger.error('Signup error', { error: error.message });

    res.status(500).render('auth/signup', {
      title: 'Sign Up - MoreStars',
      error: 'An error occurred during signup. Please try again.',
      businessName: req.body.businessName || '',
      email: req.body.email || '',
      recaptchaSiteKey: getRecaptchaSiteKey()
    });
  }
};

/**
 * GET /verify/:token
 * Verify email address
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with valid token
    const user = await User.findOne({
      where: {
        verificationToken: token,
        isVerified: false
      }
    });

    if (!user) {
      return res.status(400).render('auth/verify-error', {
        title: 'Verification Failed',
        error: 'Invalid or expired verification link'
      });
    }

    // Check if token expired
    if (user.verificationTokenExpires < new Date()) {
      return res.status(400).render('auth/verify-error', {
        title: 'Verification Failed',
        error: 'Verification link has expired. Please request a new one.',
        email: user.email
      });
    }

    // Update user: mark as verified, clear token
    await user.update({
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    });

    // Invalidate any cached session data for this user
    await invalidateUserSessionCache(user.id);

    logger.auth('email_verified', null, true, { userId: user.id });

    // Send business event alert for verified email (non-blocking)
    emailService.sendBusinessEventAlert('email_verified', {
      businessName: user.businessName,
      email: user.email,
      userId: user.id
    }).catch(err => logger.error('Business alert failed', { error: err.message }));

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.businessName);
    } catch (emailError) {
      logger.error('Welcome email failed', { userId: user.id, error: emailError.message });
      // Don't block verification if welcome email fails
    }

    // Auto-login: Regenerate session first to prevent session fixation (S1 fix)
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regeneration failed during verification', { error: err.message, userId: user.id });
        // Still show success page but without auto-login
        return res.render('auth/verify-success', {
          title: 'Welcome to MoreStars!',
          businessName: user.businessName,
          dashboardUrl: '/dashboard/login',
          message: 'Please log in to continue.'
        });
      }

      // Set session data AFTER regeneration
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.businessName = user.businessName;

      // Rotate CSRF token after authentication to prevent session fixation attacks
      rotateCsrfToken(req);

      // Save session explicitly before rendering
      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error('Session save failed during verification', { error: saveErr.message, userId: user.id });
        }

        // Redirect to dashboard with welcome message
        res.render('auth/verify-success', {
          title: 'Welcome to MoreStars!',
          businessName: user.businessName,
          dashboardUrl: '/dashboard'
        });
      });
    });

  } catch (error) {
    logger.error('Email verification error', { error: error.message });

    res.status(500).render('auth/verify-error', {
      title: 'Verification Failed',
      error: 'An error occurred during verification. Please try again.'
    });
  }
};

/**
 * POST /resend-verification
 * Resend verification email
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find unverified user
    const user = await User.findOne({
      where: {
        email: sanitizedEmail,
        isVerified: false
      }
    });

    if (!user) {
      // Don't reveal if user exists (security)
      return res.json({
        success: true,
        message: 'If an account exists, a verification email has been sent'
      });
    }

    // Reuse existing token if still valid, otherwise generate new one
    let verificationToken = user.verificationToken;
    const tokenStillValid = user.verificationToken &&
                            user.verificationTokenExpires &&
                            user.verificationTokenExpires > new Date();

    if (!tokenStillValid) {
      // Generate new token only if current one is expired or missing
      verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      await user.update({
        verificationToken: verificationToken,
        verificationTokenExpires: verificationExpires
      });
    }

    // Send email with current valid token
    await emailService.sendVerificationEmail(
      sanitizedEmail,
      user.businessName,
      verificationToken
    );

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    logger.error('Resend verification error', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};

/**
 * GET /forgot-password
 * Show forgot password form
 */
const showForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    error: null,
    success: null
  });
};

/**
 * POST /forgot-password
 * Process forgot password request
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const validationResult = validation.validatePasswordReset(email);

    if (!validationResult.isValid) {
      return res.status(400).render('auth/forgot-password', {
        title: 'Forgot Password',
        error: validationResult.errors.join('. '),
        success: null
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ where: { email: sanitizedEmail } });

    if (!user) {
      // Don't reveal if user exists (security)
      return res.render('auth/forgot-password', {
        title: 'Forgot Password',
        error: null,
        success: 'If an account exists, a password reset email has been sent'
      });
    }

    // Generate reset token
    // S5 fix: Reduced expiry from 1 hour to 30 minutes for better security
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordTokenExpires: resetExpires
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(
      sanitizedEmail,
      user.businessName,
      resetToken
    );

    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      error: null,
      success: 'Password reset instructions have been sent to your email'
    });

  } catch (error) {
    logger.error('Forgot password error', { error: error.message });

    res.status(500).render('auth/forgot-password', {
      title: 'Forgot Password',
      error: 'An error occurred. Please try again.',
      success: null
    });
  }
};

/**
 * GET /reset-password/:token
 * Show reset password form
 */
const showResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token exists and is valid
    const user = await User.findOne({
      where: {
        resetPasswordToken: token
      }
    });

    if (!user) {
      return res.status(400).render('auth/reset-error', {
        title: 'Invalid Link',
        error: 'Invalid or expired password reset link'
      });
    }

    // Check if expired
    if (user.resetPasswordTokenExpires < new Date()) {
      return res.status(400).render('auth/reset-error', {
        title: 'Link Expired',
        error: 'Password reset link has expired. Please request a new one.'
      });
    }

    res.render('auth/reset-password', {
      title: 'Reset Password',
      token: token,
      error: null
    });

  } catch (error) {
    logger.error('Show reset password error', { error: error.message });

    res.status(500).render('auth/reset-error', {
      title: 'Error',
      error: 'An error occurred. Please try again.'
    });
  }
};

/**
 * POST /reset-password/:token
 * Process password reset
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate passwords
    const validationResult = validation.validateNewPassword(password, confirmPassword);

    if (!validationResult.isValid) {
      return res.status(400).render('auth/reset-password', {
        title: 'Reset Password',
        token: token,
        error: validationResult.errors.join('. ')
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token
      }
    });

    if (!user) {
      return res.status(400).render('auth/reset-error', {
        title: 'Invalid Link',
        error: 'Invalid or expired password reset link'
      });
    }

    // Check if expired
    if (user.resetPasswordTokenExpires < new Date()) {
      return res.status(400).render('auth/reset-error', {
        title: 'Link Expired',
        error: 'Password reset link has expired. Please request a new one.'
      });
    }

    // Update password (will be hashed by Sequelize hook)
    await user.update({
      password: password,
      resetPasswordToken: null,
      resetPasswordTokenExpires: null
    });

    logger.auth('password_reset', null, true, { userId: user.id });

    // Show success page
    res.render('auth/reset-success', {
      title: 'Password Reset Successful',
      loginUrl: '/dashboard/login'
    });

  } catch (error) {
    logger.error('Reset password error', { error: error.message });

    res.status(500).render('auth/reset-error', {
      title: 'Error',
      error: 'An error occurred. Please try again.'
    });
  }
};

module.exports = {
  showSignup,
  signup,
  verifyEmail,
  resendVerification,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword
};
