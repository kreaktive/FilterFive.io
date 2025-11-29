/**
 * CAPTCHA Middleware
 * Google reCAPTCHA v3 Integration (Score-based)
 */

const axios = require('axios');

/**
 * Verify reCAPTCHA v3 Response
 * Call this middleware after form submission
 */
const verifyCaptcha = async (req, res, next) => {
  // Skip CAPTCHA in development if keys not set
  if (
    process.env.NODE_ENV === 'development' &&
    (!process.env.RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY === 'your-site-key')
  ) {
    console.warn('⚠️  CAPTCHA verification skipped in development (keys not configured)');
    return next();
  }

  try {
    // Get token from request body
    const token = req.body['g-recaptcha-response'];

    if (!token) {
      console.error('CAPTCHA token missing');

      if (req.path.includes('/signup')) {
        return res.status(400).render('auth/signup', {
          title: 'Sign Up',
          error: 'CAPTCHA verification failed. Please try again.',
          businessName: req.body.businessName || '',
          email: req.body.email || '',
          recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
        });
      }

      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.'
      });
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
      console.error('CAPTCHA verification failed:', response.data);

      if (req.path.includes('/signup')) {
        return res.status(400).render('auth/signup', {
          title: 'Sign Up',
          error: 'CAPTCHA verification failed. Please try again.',
          businessName: req.body.businessName || '',
          email: req.body.email || '',
          recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
        });
      }

      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.'
      });
    }

    // Check score (0.0 = bot, 1.0 = human)
    // For signup, we use a threshold of 0.5
    const scoreThreshold = 0.5;

    if (score < scoreThreshold) {
      console.warn(`CAPTCHA score too low: ${score} (threshold: ${scoreThreshold})`);

      if (req.path.includes('/signup')) {
        return res.status(400).render('auth/signup', {
          title: 'Sign Up',
          error: 'Suspicious activity detected. Please try again later.',
          businessName: req.body.businessName || '',
          email: req.body.email || '',
          recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Suspicious activity detected. Please try again later.'
      });
    }

    console.log(`✓ CAPTCHA verified - Score: ${score}, Action: ${action}`);
    next();

  } catch (error) {
    console.error('CAPTCHA verification error:', error.message);

    // In case of error, allow through (fail open) but log it
    console.warn('⚠️  CAPTCHA verification error - allowing request through');
    next();
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
