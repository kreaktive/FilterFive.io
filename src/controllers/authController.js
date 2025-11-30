/**
 * Auth Controller
 * Handles signup, email verification, and password reset
 */

const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');
const validation = require('../services/validationService');
const stripeService = require('../services/stripeService');

/**
 * GET /signup
 * Show signup form
 */
const showSignup = (req, res) => {
  res.render('auth/signup', {
    title: 'Sign Up - FilterFive',
    error: null,
    businessName: '',
    email: '',
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
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
        title: 'Sign Up - FilterFive',
        error: validationResult.errors.join('. '),
        businessName: sanitizedBusinessName,
        email: sanitizedEmail,
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: sanitizedEmail } });

    if (existingUser) {
      return res.status(400).render('auth/signup', {
        title: 'Sign Up - FilterFive',
        error: 'An account with this email already exists',
        businessName: sanitizedBusinessName,
        email: sanitizedEmail,
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Set trial dates
    const trialStartsAt = new Date();
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

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
      console.log(`✓ Stripe customer created: ${stripeCustomer.id} for user ${newUser.id}`);
    } catch (stripeError) {
      console.error('Stripe customer creation failed:', stripeError);
      // Don't block signup if Stripe fails - user can still use trial
    }

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        sanitizedEmail,
        sanitizedBusinessName,
        verificationToken
      );

      console.log(`✓ New user created: ${sanitizedEmail} (ID: ${newUser.id})`);

      // Redirect to "check your inbox" page
      res.render('auth/verify-pending', {
        title: 'Check Your Email',
        email: sanitizedEmail,
        businessName: sanitizedBusinessName
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // User created but email failed - allow manual resend
      res.render('auth/verify-pending', {
        title: 'Check Your Email',
        email: sanitizedEmail,
        businessName: sanitizedBusinessName,
        emailError: true
      });
    }

  } catch (error) {
    console.error('Signup error:', error);

    res.status(500).render('auth/signup', {
      title: 'Sign Up - FilterFive',
      error: 'An error occurred during signup. Please try again.',
      businessName: req.body.businessName || '',
      email: req.body.email || '',
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
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

    console.log(`✓ User verified: ${user.email} (ID: ${user.id})`);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.businessName);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't block verification if welcome email fails
    }

    // Auto-login: Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.businessName = user.businessName;

    // Redirect to dashboard with welcome message
    res.render('auth/verify-success', {
      title: 'Welcome to FilterFive!',
      businessName: user.businessName,
      dashboardUrl: '/dashboard'
    });

  } catch (error) {
    console.error('Email verification error:', error);

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

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.update({
      verificationToken: verificationToken,
      verificationTokenExpires: verificationExpires
    });

    // Send email
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
    console.error('Resend verification error:', error);

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
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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
    console.error('Forgot password error:', error);

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
    console.error('Show reset password error:', error);

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

    console.log(`✓ Password reset for: ${user.email}`);

    // Show success page
    res.render('auth/reset-success', {
      title: 'Password Reset Successful',
      loginUrl: '/dashboard/login'
    });

  } catch (error) {
    console.error('Reset password error:', error);

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
