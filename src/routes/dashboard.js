const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  showLogin,
  login,
  logout,
  showDashboard,
  showSettings,
  updateSettings,
  showQrCode,
  sendTestSms,
  regenerateApiKey,
  submitSupportRequest
} = require('../controllers/dashboardController');
const { showWebhookSetup, showWooCommerceSetup } = require('../controllers/posSettingsController');

// Public routes
router.get('/login', redirectIfAuthenticated, showLogin);
router.post('/login', redirectIfAuthenticated, loginLimiter, login);

// Protected routes
router.get('/logout', requireAuth, logout);
router.get('/', requireAuth, showDashboard);
router.get('/settings', requireAuth, showSettings);
router.post('/settings', requireAuth, updateSettings);
router.get('/qr', requireAuth, showQrCode);
router.post('/send-test-sms', requireAuth, sendTestSms);
router.post('/api-key/regenerate', requireAuth, regenerateApiKey);
router.post('/settings/support', requireAuth, submitSupportRequest);

// POS Guide page (simple render, no controller needed)
router.get('/pos-guide', requireAuth, (req, res) => {
  res.render('dashboard/pos-guide', {
    title: 'POS Integration Guide - MoreStars'
  });
});

// Webhook setup guide page (for Zapier/Custom webhook integrations)
router.get('/webhook-setup', requireAuth, showWebhookSetup);

// WooCommerce setup guide page
router.get('/woocommerce-setup', requireAuth, showWooCommerceSetup);

module.exports = router;
