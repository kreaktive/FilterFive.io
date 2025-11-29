/**
 * Auth Routes
 * Public authentication routes (signup, verification, password reset)
 */

const express = require('express');
const router = express.Router();
const { redirectIfAuthenticated } = require('../middleware/auth');
const { verifyCaptcha, provideCaptchaKey } = require('../middleware/captcha');
const {
  signupLimiter,
  passwordResetLimiter,
  resendVerificationLimiter
} = require('../middleware/rateLimiter');

const {
  showSignup,
  signup,
  verifyEmail,
  resendVerification,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword
} = require('../controllers/authController');

// Apply CAPTCHA key to all routes
router.use(provideCaptchaKey);

// Signup routes
router.get('/signup', redirectIfAuthenticated, showSignup);
router.post('/signup', redirectIfAuthenticated, signupLimiter, verifyCaptcha, signup);

// Email verification routes
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, resendVerification);

// Password reset routes
router.get('/forgot-password', redirectIfAuthenticated, showForgotPassword);
router.post('/forgot-password', redirectIfAuthenticated, passwordResetLimiter, forgotPassword);
router.get('/reset-password/:token', showResetPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
