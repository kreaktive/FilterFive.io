/**
 * Webhook Routes
 * Handles external webhooks (Stripe, etc.)
 *
 * IMPORTANT: Webhooks need raw body for signature verification
 * These routes must be registered BEFORE express.json() middleware
 */

const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/subscriptionController');

// Stripe webhook
// Note: This route needs express.raw() middleware for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
