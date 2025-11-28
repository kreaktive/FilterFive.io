const express = require('express');
const router = express.Router();
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');
const {
  showLogin,
  login,
  logout,
  showDashboard,
  showSettings,
  updateSettings
} = require('../controllers/dashboardController');

// Public routes
router.get('/login', redirectIfAuthenticated, showLogin);
router.post('/login', redirectIfAuthenticated, login);

// Protected routes
router.get('/logout', requireAuth, logout);
router.get('/', requireAuth, showDashboard);
router.get('/settings', requireAuth, showSettings);
router.post('/settings', requireAuth, updateSettings);

module.exports = router;
