/**
 * POS Auth Controller
 * Handles OAuth flows for Square and Shopify
 */

const squareOAuthService = require('../services/squareOAuthService');
const shopifyOAuthService = require('../services/shopifyOAuthService');
const logger = require('../services/logger');

/**
 * Initiate Square OAuth flow
 * GET /api/auth/square/connect
 */
const initiateSquareOAuth = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect('/dashboard/login');
    }

    const { url, state } = squareOAuthService.getAuthorizationUrl(userId);

    // Store state in session for verification (optional additional security)
    req.session.squareOAuthState = state;

    res.redirect(url);
  } catch (error) {
    logger.error('Error initiating Square OAuth', { error: error.message });
    req.session.posError = 'Failed to connect to Square. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Handle Square OAuth callback
 * GET /api/auth/square/callback
 */
const handleSquareCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.error('Square OAuth error', { error, errorDescription: error_description });
      req.session.posError = error_description || 'Square authorization was denied.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    if (!code || !state) {
      req.session.posError = 'Invalid callback parameters.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Exchange code for tokens
    const { userId, tokens } = await squareOAuthService.handleCallback(code, state);

    // Create or update integration
    await squareOAuthService.createOrUpdateIntegration(userId, tokens);

    // Set success message
    req.session.posSuccess = 'Successfully connected to Square! Please select which locations to enable.';
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error handling Square callback', { error: error.message });
    req.session.posError = 'Failed to complete Square connection. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Initiate Shopify OAuth flow
 * GET /api/auth/shopify/connect
 */
const initiateShopifyOAuth = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect('/dashboard/login');
    }

    const { shop } = req.query;
    if (!shop) {
      req.session.posError = 'Please enter your Shopify store URL.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    const { url, state, shopDomain } = shopifyOAuthService.getAuthorizationUrl(userId, shop);

    // Store state in session
    req.session.shopifyOAuthState = state;

    res.redirect(url);
  } catch (error) {
    logger.error('Error initiating Shopify OAuth', { error: error.message });
    req.session.posError = error.message || 'Failed to connect to Shopify. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Handle Shopify OAuth callback
 * GET /api/auth/shopify/callback
 */
const handleShopifyCallback = async (req, res) => {
  try {
    const { code, shop, state, hmac } = req.query;

    // Validate HMAC
    if (!shopifyOAuthService.validateCallback(req.query)) {
      logger.warn('Shopify HMAC validation failed');
      req.session.posError = 'Invalid callback signature.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    if (!code || !shop || !state) {
      req.session.posError = 'Invalid callback parameters.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Exchange code for tokens
    const { userId, shopDomain, tokens } = await shopifyOAuthService.handleCallback(code, shop, state);

    // Create or update integration
    await shopifyOAuthService.createOrUpdateIntegration(userId, shopDomain, tokens);

    // Set success message
    req.session.posSuccess = 'Successfully connected to Shopify! Please select which locations to enable.';
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error handling Shopify callback', { error: error.message });
    req.session.posError = error.message || 'Failed to complete Shopify connection. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

module.exports = {
  initiateSquareOAuth,
  handleSquareCallback,
  initiateShopifyOAuth,
  handleShopifyCallback
};
