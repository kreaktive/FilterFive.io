/**
 * POS Auth Routes
 * OAuth flows for Square and Shopify
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  initiateSquareOAuth,
  handleSquareCallback,
  initiateShopifyOAuth,
  handleShopifyCallback
} = require('../controllers/posAuthController');

// Square OAuth
router.get('/square/connect', requireAuth, initiateSquareOAuth);
router.get('/square/callback', handleSquareCallback); // No auth - OAuth redirect

// Shopify OAuth
router.get('/shopify/connect', requireAuth, initiateShopifyOAuth);
router.get('/shopify/callback', handleShopifyCallback); // No auth - OAuth redirect

module.exports = router;
