/**
 * POS Settings Routes
 * Settings management for POS integrations
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  disconnectPos,
  updateLocations,
  toggleTestMode,
  updateTestPhone,
  confirmConsent,
  refreshLocations,
  getTransactions,
  sendTestSms,
  getTestSmsRemaining,
  createWebhookIntegration,
  regenerateWebhookApiKey,
  createStripeIntegration,
  createWooCommerceIntegration
} = require('../controllers/posSettingsController');

// All routes require authentication
router.use(requireAuth);

// Disconnect integration
router.post('/pos/disconnect/:provider', disconnectPos);

// Update enabled locations
router.post('/pos/locations', updateLocations);

// Toggle test mode
router.post('/pos/test-mode', toggleTestMode);

// Update test phone number
router.post('/pos/test-phone', updateTestPhone);

// Confirm SMS consent
router.post('/pos/consent', confirmConsent);

// Refresh locations from provider
router.post('/pos/refresh-locations', refreshLocations);

// Get transactions (JSON for AJAX)
router.get('/pos/transactions', getTransactions);

// Send test SMS
router.post('/pos/send-test-sms', sendTestSms);

// Get test SMS remaining count
router.get('/pos/test-sms-remaining', getTestSmsRemaining);

// Create Zapier/Custom Webhook integration
router.post('/pos/webhook/create', createWebhookIntegration);

// Regenerate API key for webhook integration
router.post('/pos/webhook/regenerate-key', regenerateWebhookApiKey);

// Create Stripe POS integration
router.post('/pos/stripe/create', createStripeIntegration);

// Create WooCommerce integration
router.post('/pos/woocommerce/create', createWooCommerceIntegration);

module.exports = router;
