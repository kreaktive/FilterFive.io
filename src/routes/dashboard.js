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
  sendTestSms
} = require('../controllers/dashboardController');

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

module.exports = router;
