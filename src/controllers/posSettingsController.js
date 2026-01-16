/**
 * POS Settings Controller
 * Handles POS integration settings and management
 */

const PosIntegration = require('../models/PosIntegration');
const PosLocation = require('../models/PosLocation');
const PosTransaction = require('../models/PosTransaction');
const squareOAuthService = require('../services/squareOAuthService');
const shopifyOAuthService = require('../services/shopifyOAuthService');
const User = require('../models/User');
const smsService = require('../services/smsService');
const { normalizePhone, validatePhone } = require('../utils/phone');
const crypto = require('crypto');
const logger = require('../services/logger');

// Valid providers list
const VALID_PROVIDERS = ['square', 'shopify', 'zapier', 'webhook', 'clover', 'stripe_pos', 'woocommerce'];

// Helper to check if provider is valid
const isValidProvider = (provider) => VALID_PROVIDERS.includes(provider);

/**
 * Get POS settings data for rendering
 * (Used by dashboard settings controller)
 */
const getPosSettingsData = async (userId) => {
  // Get integrations with locations
  const integrations = await PosIntegration.findAll({
    where: { userId },
    include: [{
      model: PosLocation,
      as: 'locations'
    }]
  });

  // Get recent transactions (last 50)
  const recentTransactions = await PosTransaction.findAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    limit: 50
  });

  // Find specific integrations by provider
  const getIntegration = (provider) => integrations.find(i => i.provider === provider);

  const squareIntegration = getIntegration('square');
  const shopifyIntegration = getIntegration('shopify');
  const zapierIntegration = getIntegration('zapier');
  const webhookIntegration = getIntegration('webhook');
  const cloverIntegration = getIntegration('clover');
  const stripeIntegration = getIntegration('stripe_pos');
  const woocommerceIntegration = getIntegration('woocommerce');

  // Group by category for accordion UI
  const integrationsByCategory = {
    pos: {
      name: 'Point of Sale (In-Store)',
      integrations: [
        { provider: 'square', name: 'Square', integration: squareIntegration, requiresOAuth: true },
        { provider: 'clover', name: 'Clover', integration: cloverIntegration, requiresOAuth: true }
      ]
    },
    ecommerce: {
      name: 'E-Commerce (Online)',
      integrations: [
        { provider: 'shopify', name: 'Shopify', integration: shopifyIntegration, requiresOAuth: true },
        { provider: 'woocommerce', name: 'WooCommerce', integration: woocommerceIntegration, requiresOAuth: false },
        { provider: 'stripe_pos', name: 'Stripe', integration: stripeIntegration, requiresOAuth: false }
      ]
    },
    automation: {
      name: 'Automation & Custom',
      integrations: [
        { provider: 'zapier', name: 'Zapier', integration: zapierIntegration, requiresOAuth: false },
        { provider: 'webhook', name: 'Custom Webhook', integration: webhookIntegration, requiresOAuth: false }
      ]
    }
  };

  return {
    integrations,
    integrationsByCategory,
    // Keep individual for backwards compatibility
    squareIntegration,
    shopifyIntegration,
    zapierIntegration,
    webhookIntegration,
    cloverIntegration,
    stripeIntegration,
    woocommerceIntegration,
    recentTransactions
  };
};

/**
 * Disconnect a POS integration
 * POST /dashboard/settings/pos/disconnect/:provider
 */
const disconnectPos = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.params;

    if (!isValidProvider(provider)) {
      req.session.posError = 'Invalid provider.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration) {
      req.session.posError = `No ${provider} integration found.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Revoke access based on provider type
    if (provider === 'square') {
      await squareOAuthService.revokeAccess(integration);
    } else if (provider === 'shopify') {
      await shopifyOAuthService.revokeAccess(integration);
    } else if (provider === 'clover') {
      // TODO: Add cloverOAuthService.revokeAccess when implemented
      integration.isActive = false;
      integration.setAccessToken(null);
      await integration.save();
    } else {
      // For non-OAuth providers (zapier, webhook, stripe_pos, woocommerce)
      // Just deactivate and clear credentials
      integration.isActive = false;
      integration.setApiKey(null);
      integration.setConsumerKey(null);
      integration.setConsumerSecret(null);
      await integration.save();
    }

    const providerNames = {
      square: 'Square',
      shopify: 'Shopify',
      zapier: 'Zapier',
      webhook: 'Custom Webhook',
      clover: 'Clover',
      stripe_pos: 'Stripe',
      woocommerce: 'WooCommerce'
    };
    req.session.posSuccess = `Successfully disconnected from ${providerNames[provider] || provider}.`;
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error disconnecting POS', { error: error.message });
    req.session.posError = 'Failed to disconnect. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Update enabled locations
 * POST /dashboard/settings/pos/locations
 */
const updateLocations = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider, locations } = req.body;

    if (!isValidProvider(provider)) {
      req.session.posError = 'Invalid provider.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration) {
      req.session.posError = `No ${provider} integration found.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Parse locations array (comes as string or array from form)
    let enabledLocationIds = [];
    if (locations) {
      if (Array.isArray(locations)) {
        enabledLocationIds = locations;
      } else {
        enabledLocationIds = [locations];
      }
    }

    // S4 fix: Validate that all submitted location IDs belong to user's integration
    // This prevents IDOR attacks where attacker submits other users' location IDs
    if (enabledLocationIds.length > 0) {
      const validLocations = await PosLocation.findAll({
        where: {
          posIntegrationId: integration.id,
          externalLocationId: enabledLocationIds
        },
        attributes: ['externalLocationId']
      });

      const validLocationIds = validLocations.map(l => l.externalLocationId);

      // Filter to only valid location IDs (whitelist approach)
      enabledLocationIds = enabledLocationIds.filter(id => validLocationIds.includes(id));

      // Log if any invalid IDs were submitted (potential attack attempt)
      const invalidIds = enabledLocationIds.filter(id => !validLocationIds.includes(id));
      if (invalidIds.length > 0) {
        logger.warn('Invalid location IDs submitted', {
          userId,
          provider,
          invalidIds
        });
      }
    }

    // Update all locations - disable all first, then enable selected
    await PosLocation.update(
      { isEnabled: false },
      { where: { posIntegrationId: integration.id } }
    );

    if (enabledLocationIds.length > 0) {
      await PosLocation.update(
        { isEnabled: true },
        {
          where: {
            posIntegrationId: integration.id,
            externalLocationId: enabledLocationIds
          }
        }
      );
    }

    req.session.posSuccess = 'Location settings updated.';
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error updating locations', { error: error.message });
    req.session.posError = 'Failed to update locations. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Toggle test mode
 * POST /dashboard/settings/pos/test-mode
 */
const toggleTestMode = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider, testMode } = req.body;

    if (!isValidProvider(provider)) {
      req.session.posError = 'Invalid provider.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration) {
      req.session.posError = `No ${provider} integration found.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    integration.testMode = testMode === 'on' || testMode === 'true' || testMode === true;
    await integration.save();

    const modeText = integration.testMode ? 'Test mode enabled' : 'Live mode enabled';
    req.session.posSuccess = modeText;
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error toggling test mode', { error: error.message });
    req.session.posError = 'Failed to update mode. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Update test phone number
 * POST /dashboard/settings/pos/test-phone
 */
const updateTestPhone = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider, testPhoneNumber } = req.body;

    if (!isValidProvider(provider)) {
      req.session.posError = 'Invalid provider.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration) {
      req.session.posError = `No ${provider} integration found.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Validate and normalize phone
    if (testPhoneNumber) {
      const phoneResult = validatePhone(testPhoneNumber);
      if (!phoneResult.valid) {
        req.session.posError = phoneResult.error;
        return res.redirect('/dashboard/settings?tab=pos');
      }
      integration.testPhoneNumber = phoneResult.normalized;
    } else {
      integration.testPhoneNumber = null;
    }
    await integration.save();

    req.session.posSuccess = 'Test phone number updated.';
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error updating test phone', { error: error.message });
    req.session.posError = 'Failed to update phone number. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Confirm SMS consent
 * POST /dashboard/settings/pos/consent
 */
const confirmConsent = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider, consent } = req.body;

    if (!isValidProvider(provider)) {
      req.session.posError = 'Invalid provider.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration) {
      req.session.posError = `No ${provider} integration found.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    integration.consentConfirmed = consent === 'on' || consent === 'true' || consent === true;
    await integration.save();

    if (integration.consentConfirmed) {
      req.session.posSuccess = 'SMS consent confirmed. POS integration is now active.';
    } else {
      req.session.posSuccess = 'SMS consent updated. Note: SMS will not be sent until consent is confirmed.';
    }
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error confirming consent', { error: error.message });
    req.session.posError = 'Failed to update consent. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Refresh locations from POS provider
 * POST /dashboard/settings/pos/refresh-locations
 */
const refreshLocations = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.body;

    if (!isValidProvider(provider)) {
      req.session.posError = 'Invalid provider.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration) {
      req.session.posError = `No ${provider} integration found.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Sync locations
    if (provider === 'square') {
      await squareOAuthService.syncLocations(integration);
    } else {
      await shopifyOAuthService.syncLocations(integration);
    }

    req.session.posSuccess = 'Locations refreshed successfully.';
    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error refreshing locations', { error: error.message });
    req.session.posError = 'Failed to refresh locations. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Get transactions JSON (for AJAX pagination)
 * GET /dashboard/settings/pos/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { page = 1, limit = 20, status } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (status && status !== 'all') {
      where.smsStatus = status;
    }

    const { count, rows } = await PosTransaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      transactions: rows.map(t => ({
        id: t.id,
        customerName: t.customerName || 'N/A',
        customerPhone: t.getMaskedPhone(),
        purchaseAmount: t.purchaseAmount ? `$${parseFloat(t.purchaseAmount).toFixed(2)}` : 'N/A',
        locationName: t.locationName || 'N/A',
        status: t.smsStatus,
        statusLabel: t.getStatusLabel(),
        createdAt: t.createdAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching transactions', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Test SMS rate limiting constants
const TEST_SMS_LIMIT = 5; // Max test SMS per day

/**
 * Check if test SMS counter should be reset (new day)
 * Returns the current valid count after potential reset
 */
const getTestSmsCount = async (user) => {
  const now = new Date();
  const resetAt = user.testSmsResetAt ? new Date(user.testSmsResetAt) : null;

  // Check if we need to reset (no reset date, or reset was yesterday or earlier)
  const needsReset = !resetAt ||
    resetAt.toDateString() !== now.toDateString();

  if (needsReset) {
    // Reset counter for new day
    await user.update({
      testSmsCount: 0,
      testSmsResetAt: now
    });
    return 0;
  }

  return user.testSmsCount || 0;
};

/**
 * Get remaining test SMS count for a user
 * GET /dashboard/settings/pos/test-sms-remaining
 */
const getTestSmsRemaining = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const used = await getTestSmsCount(user);
    const remaining = Math.max(0, TEST_SMS_LIMIT - used);

    return res.json({
      success: true,
      remaining,
      limit: TEST_SMS_LIMIT,
      used
    });
  } catch (error) {
    logger.error('Error getting test SMS remaining', { error: error.message });
    return res.json({ success: true, remaining: TEST_SMS_LIMIT, limit: TEST_SMS_LIMIT, used: 0 });
  }
};

/**
 * Send test SMS
 * POST /dashboard/settings/pos/send-test-sms
 */
const sendTestSms = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Get user for business name and review link
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check rate limit using database
    const currentCount = await getTestSmsCount(user);
    if (currentCount >= TEST_SMS_LIMIT) {
      logger.warn('Test SMS rate limit exceeded', { userId, count: currentCount });
      return res.status(429).json({
        success: false,
        error: `Daily limit of ${TEST_SMS_LIMIT} test SMS reached. Try again tomorrow.`,
        remaining: 0,
        limit: TEST_SMS_LIMIT
      });
    }

    if (!user.reviewUrl) {
      return res.status(400).json({ success: false, error: 'Please set your Google Review URL in General settings first' });
    }

    // Validate and normalize phone to E.164 format
    const phoneResult = validatePhone(phone);
    if (!phoneResult.valid) {
      return res.status(400).json({ success: false, error: phoneResult.error });
    }
    const normalizedPhone = phoneResult.normalized;

    // Generate test message using user's tone preference
    const message = smsService.getSmsMessage(
      'Test Customer',
      user.businessName,
      user.reviewUrl,
      user.smsMessageTone || 'friendly',
      user.smsMessageTone === 'custom' ? user.customSmsMessage : null
    );

    // Send the SMS - sendSMS returns { messageSid, status, to } on success, throws on error
    const result = await smsService.sendSMS(normalizedPhone, message);

    if (result && result.messageSid) {
      // Increment counter in database (only after successful send)
      const newCount = currentCount + 1;
      await user.update({ testSmsCount: newCount });
      const remaining = Math.max(0, TEST_SMS_LIMIT - newCount);

      logger.info('Test SMS sent', { phone: normalizedPhone, userId, messageSid: result.messageSid, remaining });
      return res.json({
        success: true,
        messageSid: result.messageSid,
        remaining,
        limit: TEST_SMS_LIMIT
      });
    } else {
      return res.status(500).json({ success: false, error: 'Failed to send SMS - no message ID returned' });
    }
  } catch (error) {
    logger.error('Error sending test SMS', { error: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create/Enable a Zapier or Custom Webhook integration
 * POST /dashboard/settings/pos/webhook/create
 */
const createWebhookIntegration = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.body;

    if (!['zapier', 'webhook'].includes(provider)) {
      req.session.posError = 'Invalid webhook provider.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Check if integration already exists
    let integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (integration && integration.isActive) {
      req.session.posError = `${provider === 'zapier' ? 'Zapier' : 'Custom Webhook'} integration already exists.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Generate unique API key (32 characters)
    const apiKey = crypto.randomBytes(16).toString('hex');

    // Generate webhook secret for signature verification
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Generate unique webhook URL path
    const webhookUrlPath = crypto.randomBytes(8).toString('hex');

    if (integration) {
      // Reactivate existing integration
      integration.isActive = true;
      integration.setApiKey(apiKey);
      integration.webhookSecret = webhookSecret;
      integration.webhookUrl = webhookUrlPath;
      integration.connectedAt = new Date();
      await integration.save();
    } else {
      // Create new integration
      integration = await PosIntegration.create({
        userId,
        provider,
        isActive: true,
        testMode: true,
        consentConfirmed: false,
        webhookUrl: webhookUrlPath,
        webhookSecret,
        connectedAt: new Date()
      });
      integration.setApiKey(apiKey);
      await integration.save();
    }

    req.session.posSuccess = `${provider === 'zapier' ? 'Zapier' : 'Custom Webhook'} integration created! Check the setup guide for configuration details.`;
    req.session.newWebhookApiKey = apiKey; // Pass API key to show once
    res.redirect('/dashboard/settings?tab=pos&setup=' + provider);
  } catch (error) {
    logger.error('Error creating webhook integration', { error: error.message });
    req.session.posError = 'Failed to create integration. Please try again.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Regenerate API key for webhook integration
 * POST /dashboard/settings/pos/webhook/regenerate-key
 */
const regenerateWebhookApiKey = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.body;

    if (!['zapier', 'webhook'].includes(provider)) {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    // Generate new API key
    const newApiKey = crypto.randomBytes(16).toString('hex');
    integration.setApiKey(newApiKey);
    await integration.save();

    return res.json({ success: true, apiKey: newApiKey });
  } catch (error) {
    logger.error('Error regenerating API key', { error: error.message });
    return res.status(500).json({ success: false, error: 'Failed to regenerate API key' });
  }
};

/**
 * Create/Enable Stripe POS integration
 * POST /dashboard/settings/pos/stripe/create
 */
const createStripeIntegration = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { triggerOnCheckout, triggerOnTerminal } = req.body;

    // Check if integration already exists
    let integration = await PosIntegration.findOne({
      where: { userId, provider: 'stripe_pos' }
    });

    if (integration && integration.isActive) {
      // Update settings
      integration.triggerOnCheckout = triggerOnCheckout === 'on' || triggerOnCheckout === true;
      integration.triggerOnTerminal = triggerOnTerminal === 'on' || triggerOnTerminal === true;
      await integration.save();
      req.session.posSuccess = 'Stripe integration settings updated.';
    } else if (integration) {
      // Reactivate
      integration.isActive = true;
      integration.triggerOnCheckout = triggerOnCheckout === 'on' || triggerOnCheckout === true;
      integration.triggerOnTerminal = triggerOnTerminal === 'on' || triggerOnTerminal === true;
      integration.connectedAt = new Date();
      await integration.save();
      req.session.posSuccess = 'Stripe integration enabled.';
    } else {
      // Create new
      integration = await PosIntegration.create({
        userId,
        provider: 'stripe_pos',
        isActive: true,
        testMode: true,
        consentConfirmed: false,
        triggerOnCheckout: triggerOnCheckout === 'on' || triggerOnCheckout === true,
        triggerOnTerminal: triggerOnTerminal === 'on' || triggerOnTerminal === true,
        connectedAt: new Date()
      });
      req.session.posSuccess = 'Stripe integration created.';
    }

    res.redirect('/dashboard/settings?tab=pos');
  } catch (error) {
    logger.error('Error creating Stripe integration', { error: error.message });
    req.session.posError = 'Failed to create Stripe integration.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Show webhook setup guide page
 * GET /dashboard/webhook-setup?provider=zapier|webhook
 */
const showWebhookSetup = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { provider } = req.query;

    if (!['zapier', 'webhook'].includes(provider)) {
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Get the integration
    const integration = await PosIntegration.findOne({
      where: { userId, provider }
    });

    if (!integration || !integration.isActive) {
      req.session.posError = `No active ${provider === 'zapier' ? 'Zapier' : 'Custom Webhook'} integration found. Please create one first.`;
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Get user for business name
    const user = await User.findByPk(userId);

    // Build webhook URL
    const baseUrl = process.env.APP_URL || 'https://app.morestars.io';
    const webhookUrl = `${baseUrl}/api/webhooks/inbound/${integration.webhookUrl}`;

    // Get API key (decrypt)
    const apiKey = integration.getApiKey();

    // Check if this is first time showing (API key just generated)
    const showApiKey = req.session.newWebhookApiKey || false;
    delete req.session.newWebhookApiKey;

    res.render('dashboard/webhook-setup', {
      title: `${provider === 'zapier' ? 'Zapier' : 'Custom Webhook'} Setup Guide - MoreStars`,
      provider,
      providerName: provider === 'zapier' ? 'Zapier' : 'Custom Webhook',
      integration,
      webhookUrl,
      apiKey,
      showApiKey,
      user,
      testMode: integration.testMode,
      consentConfirmed: integration.consentConfirmed
    });
  } catch (error) {
    logger.error('Error showing webhook setup', { error: error.message });
    req.session.posError = 'Failed to load webhook setup page.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Create/Enable WooCommerce integration
 * POST /dashboard/settings/pos/woocommerce/create
 */
const createWooCommerceIntegration = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { storeUrl, consumerKey, consumerSecret } = req.body;

    if (!storeUrl || !consumerKey || !consumerSecret) {
      req.session.posError = 'Store URL, Consumer Key, and Consumer Secret are required.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Normalize store URL
    let normalizedUrl = storeUrl.trim().toLowerCase();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    // Remove trailing slash
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    // Check if integration already exists
    let integration = await PosIntegration.findOne({
      where: { userId, provider: 'woocommerce' }
    });

    // Generate webhook secret for this integration
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    if (integration) {
      // Update existing
      integration.isActive = true;
      integration.storeUrl = normalizedUrl;
      integration.setConsumerKey(consumerKey.trim());
      integration.setConsumerSecret(consumerSecret.trim());
      integration.webhookSecret = webhookSecret;
      integration.connectedAt = new Date();
      await integration.save();
    } else {
      // Create new
      integration = await PosIntegration.create({
        userId,
        provider: 'woocommerce',
        isActive: true,
        testMode: true,
        consentConfirmed: false,
        storeUrl: normalizedUrl,
        webhookSecret,
        connectedAt: new Date()
      });
      integration.setConsumerKey(consumerKey.trim());
      integration.setConsumerSecret(consumerSecret.trim());
      await integration.save();
    }

    req.session.posSuccess = 'WooCommerce integration created! See the setup guide to configure webhooks in your store.';
    res.redirect('/dashboard/settings?tab=pos&setup=woocommerce');
  } catch (error) {
    logger.error('Error creating WooCommerce integration', { error: error.message });
    req.session.posError = 'Failed to create WooCommerce integration.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

/**
 * Show WooCommerce webhook setup guide page
 * GET /dashboard/woocommerce-setup
 */
const showWooCommerceSetup = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get the integration
    const integration = await PosIntegration.findOne({
      where: { userId, provider: 'woocommerce' }
    });

    if (!integration || !integration.isActive) {
      req.session.posError = 'No active WooCommerce integration found. Please connect your store first.';
      return res.redirect('/dashboard/settings?tab=pos');
    }

    // Get user for business name
    const user = await User.findByPk(userId);

    // Build webhook URL
    const baseUrl = process.env.APP_URL || 'https://app.morestars.io';
    const webhookUrl = `${baseUrl}/api/webhooks/woocommerce`;

    res.render('dashboard/woocommerce-setup', {
      title: 'WooCommerce Setup Guide - MoreStars',
      integration,
      webhookUrl,
      webhookSecret: integration.webhookSecret,
      storeUrl: integration.storeUrl,
      user,
      testMode: integration.testMode,
      consentConfirmed: integration.consentConfirmed
    });
  } catch (error) {
    logger.error('Error showing WooCommerce setup', { error: error.message });
    req.session.posError = 'Failed to load WooCommerce setup page.';
    res.redirect('/dashboard/settings?tab=pos');
  }
};

module.exports = {
  getPosSettingsData,
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
  createWooCommerceIntegration,
  showWebhookSetup,
  showWooCommerceSetup
};
