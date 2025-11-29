/**
 * Rate Limiting Middleware
 * Prevents abuse of authentication endpoints
 */

const rateLimit = require('express-rate-limit');

/**
 * Signup Rate Limiter
 * Limit: 5 signup attempts per IP per hour
 */
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many signup attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).render('error', {
      title: 'Too Many Requests',
      error: {
        status: 429,
        message: 'Too many signup attempts. Please try again in an hour.'
      }
    });
  }
});

/**
 * Login Rate Limiter
 * Limit: 10 login attempts per IP per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    res.status(429).render('dashboard/login', {
      title: 'Login',
      error: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

/**
 * Password Reset Rate Limiter
 * Limit: 3 password reset requests per IP per hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).render('error', {
      title: 'Too Many Requests',
      error: {
        status: 429,
        message: 'Too many password reset attempts. Please try again in an hour.'
      }
    });
  }
});

/**
 * Email Verification Resend Limiter
 * Limit: 3 resend requests per IP per hour
 */
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many verification email requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('error', {
      title: 'Too Many Requests',
      error: {
        status: 429,
        message: 'Too many verification email requests. Please try again in an hour.'
      }
    });
  }
});

module.exports = {
  signupLimiter,
  loginLimiter,
  passwordResetLimiter,
  resendVerificationLimiter
};
