/**
 * Subscription Routes
 * Handles subscription management, checkout, and billing
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const {
  showSubscription,
  createCheckout,
  checkoutSuccess,
  checkoutCancel,
  cancelSubscription,
  reactivateSubscription,
  customerPortal
} = require('../controllers/subscriptionController');

// All subscription routes require authentication
router.use(requireAuth);

// Subscription management page
router.get('/', showSubscription);

// Create checkout session
router.post('/checkout', createCheckout);

// Checkout success/cancel pages
router.get('/success', checkoutSuccess);
router.get('/cancel', checkoutCancel);

// Cancel subscription
router.post('/cancel-subscription', cancelSubscription);

// Reactivate subscription
router.post('/reactivate', reactivateSubscription);

// Stripe customer portal
router.get('/portal', customerPortal);

module.exports = router;
