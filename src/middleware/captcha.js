/**
 * CAPTCHA Middleware
 * Google reCAPTCHA v2 Integration
 */

const { RecaptchaV2 } = require('express-recaptcha');

// Initialize reCAPTCHA
// You'll need to set RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY in .env
// Get keys from: https://www.google.com/recaptcha/admin
const recaptcha = new RecaptchaV2(
  process.env.RECAPTCHA_SITE_KEY || 'your-site-key',
  process.env.RECAPTCHA_SECRET_KEY || 'your-secret-key'
);

/**
 * Verify reCAPTCHA Response
 * Call this middleware after form submission
 */
const verifyCaptcha = (req, res, next) => {
  // Skip CAPTCHA in development if keys not set
  if (
    process.env.NODE_ENV === 'development' &&
    (!process.env.RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY === 'your-site-key')
  ) {
    console.warn('⚠️  CAPTCHA verification skipped in development (keys not configured)');
    return next();
  }

  recaptcha.verify(req, (error) => {
    if (error) {
      console.error('CAPTCHA verification failed:', error);

      // Return error based on route type
      if (req.path.includes('/signup')) {
        return res.status(400).render('auth/signup', {
          title: 'Sign Up',
          error: 'Please complete the CAPTCHA verification',
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

    next();
  });
};

/**
 * Middleware to provide CAPTCHA site key to views
 */
const provideCaptchaKey = (req, res, next) => {
  res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || null;
  next();
};

module.exports = {
  recaptcha,
  verifyCaptcha,
  provideCaptchaKey
};
