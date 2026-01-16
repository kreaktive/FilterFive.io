/**
 * CAPTCHA Middleware
 * Google reCAPTCHA v3 Integration (Score-based)
 */

const axios = require('axios');
const logger = require('../services/logger');

/**
 * Send CAPTCHA error response (consolidated helper)
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
function sendCaptchaError(req, res, message, statusCode = 400) {
  // HTML response for signup page
  if (req.path.includes('/signup')) {
    return res.status(statusCode).render('auth/signup', {
      title: 'Sign Up',
      error: message,
      businessName: req.body.businessName || '',
      email: req.body.email || '',
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
    });
  }

  // JSON response for API endpoints
  return res.status(statusCode).json({
    success: false,
    message
  });
}

/**
 * Verify reCAPTCHA v3 Response
 * Call this middleware after form submission
 */
const verifyCaptcha = async (req, res, next) => {
  // Skip CAPTCHA if disabled via environment variable
  if (process.env.DISABLE_CAPTCHA === 'true') {
    logger.warn('CAPTCHA verification disabled via DISABLE_CAPTCHA env var');
    return next();
  }

  // Skip CAPTCHA in development if keys not set
  if (
    process.env.NODE_ENV === 'development' &&
    (!process.env.RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY === 'your-site-key')
  ) {
    logger.warn('CAPTCHA verification skipped in development (keys not configured)');
    return next();
  }

  try {
    // Get token from request body
    const token = req.body['g-recaptcha-response'];

    if (!token) {
      logger.warn('CAPTCHA token missing');
      return sendCaptchaError(req, res, 'CAPTCHA verification failed. Please try again.');
    }

    // Verify token with Google
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await axios.post(verifyUrl, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      }
    });

    const { success, score, action } = response.data;

    // Check if verification was successful
    if (!success) {
      logger.warn('CAPTCHA verification failed', { response: response.data });
      return sendCaptchaError(req, res, 'CAPTCHA verification failed. Please try again.');
    }

    // Check score (0.0 = bot, 1.0 = human)
    // For signup, we use a threshold of 0.5
    const scoreThreshold = 0.5;

    if (score < scoreThreshold) {
      logger.warn('CAPTCHA score too low', { score, threshold: scoreThreshold });
      return sendCaptchaError(req, res, 'Suspicious activity detected. Please try again later.');
    }

    logger.debug('CAPTCHA verified', { score, action });
    next();

  } catch (error) {
    logger.error('CAPTCHA verification error', { error: error.message });
    // Fail closed - do NOT allow through on errors
    return sendCaptchaError(req, res, 'CAPTCHA verification failed. Please try again.', 500);
  }
};

/**
 * Middleware to provide CAPTCHA site key to views
 */
const provideCaptchaKey = (req, res, next) => {
  res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || null;
  next();
};

module.exports = {
  verifyCaptcha,
  provideCaptchaKey
};
