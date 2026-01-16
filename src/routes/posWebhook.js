/**
 * POS Webhook Routes
 * Handles incoming webhooks from Square, Shopify, Zapier, and Custom integrations
 *
 * IMPORTANT: These routes use express.raw() for signature verification
 * They must be registered BEFORE body parser middleware in app.js
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const squareWebhookService = require('../services/squareWebhookService');
const shopifyWebhookService = require('../services/shopifyWebhookService');
const inboundWebhookService = require('../services/inboundWebhookService');
const woocommerceWebhookService = require('../services/woocommerceWebhookService');
const PosIntegration = require('../models/PosIntegration');
const logger = require('../services/logger');

/**
 * Square webhook endpoint
 * POST /api/webhooks/square
 */
router.post('/square', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const rawBody = req.body;

    // Verify signature
    if (!squareWebhookService.verifySignature(rawBody, signature)) {
      logger.warn('Square webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse JSON body
    let event;
    try {
      event = JSON.parse(rawBody.toString());
    } catch (parseError) {
      logger.error('Failed to parse Square webhook body', { error: parseError.message });
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Process event asynchronously (return 200 quickly)
    res.status(200).json({ received: true });

    // Process after responding
    try {
      await squareWebhookService.processEvent(event);
    } catch (processError) {
      logger.error('Error processing Square webhook', { error: processError.message });
      // Don't throw - we already returned 200
    }
  } catch (error) {
    logger.error('Square webhook error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Shopify webhook endpoint
 * POST /api/webhooks/shopify
 */
router.post('/shopify', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const rawBody = req.body;

    // Verify signature
    if (!shopifyWebhookService.verifySignature(rawBody, hmacHeader)) {
      logger.warn('Shopify webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse JSON body
    let payload;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch (parseError) {
      logger.error('Failed to parse Shopify webhook body', { error: parseError.message });
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Respond quickly (Shopify expects response within 5 seconds)
    res.status(200).json({ received: true });

    // Process after responding
    try {
      await shopifyWebhookService.processEvent(payload, topic, shopDomain);
    } catch (processError) {
      logger.error('Error processing Shopify webhook', { error: processError.message });
      // Don't throw - we already returned 200
    }
  } catch (error) {
    logger.error('Shopify webhook error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Inbound webhook endpoint for Zapier and Custom integrations
 * POST /api/webhooks/inbound/:urlPath
 *
 * This endpoint receives transaction data from external sources
 * and triggers SMS review requests.
 *
 * Authentication: X-API-Key header (required)
 * Optional: X-Webhook-Signature header for additional security
 */
router.post('/inbound/:urlPath', express.json(), async (req, res) => {
  try {
    const { urlPath } = req.params;
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-webhook-signature'];

    // Find integration by URL path
    const integration = await PosIntegration.findOne({
      where: {
        webhookUrl: urlPath,
        isActive: true,
        provider: { [Op.in]: ['zapier', 'webhook'] }
      }
    });

    if (!integration) {
      logger.warn('Inbound webhook: No integration found', { path: urlPath });
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Process the webhook
    const result = await inboundWebhookService.processWebhook({
      integration,
      payload: req.body,
      rawBody: JSON.stringify(req.body),
      signature,
      apiKey
    });

    // Handle errors
    if (result.error) {
      const statusCode = {
        'INVALID_API_KEY': 401,
        'INVALID_SIGNATURE': 401,
        'RATE_LIMIT': 429,
        'INVALID_PAYLOAD': 400
      }[result.code] || 400;

      return res.status(statusCode).json({
        error: result.message,
        code: result.code
      });
    }

    // Success
    res.status(200).json({
      success: true,
      eventId: result.eventId,
      queued: result.queued || false,
      skipped: result.skipped || false,
      reason: result.reason || null
    });

  } catch (error) {
    logger.error('Inbound webhook error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Inbound webhook test endpoint
 * GET /api/webhooks/inbound/:urlPath/test
 *
 * Returns webhook configuration (without sensitive data)
 * Useful for testing connectivity
 */
router.get('/inbound/:urlPath/test', async (req, res) => {
  try {
    const { urlPath } = req.params;

    const integration = await PosIntegration.findOne({
      where: {
        webhookUrl: urlPath,
        isActive: true,
        provider: { [Op.in]: ['zapier', 'webhook'] }
      }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.status(200).json({
      success: true,
      provider: integration.provider,
      active: integration.isActive,
      testMode: integration.testMode,
      consentConfirmed: integration.consentConfirmed,
      message: 'Webhook endpoint is ready to receive data'
    });

  } catch (error) {
    logger.error('Webhook test error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * WooCommerce webhook endpoint
 * POST /api/webhooks/woocommerce
 *
 * Receives order webhooks from WooCommerce stores.
 * Headers:
 * - X-WC-Webhook-Topic: order.created, order.completed, etc.
 * - X-WC-Webhook-Source: https://store-url.com
 * - X-WC-Webhook-Signature: HMAC-SHA256 signature
 */
router.post('/woocommerce', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-wc-webhook-signature'];
    const topic = req.headers['x-wc-webhook-topic'];
    const source = req.headers['x-wc-webhook-source'];
    const rawBody = req.body;

    logger.info('WooCommerce webhook received', { topic, source });

    // Find integration by source URL
    const integration = await woocommerceWebhookService.findIntegrationByStoreUrl(source);

    if (!integration) {
      logger.warn('WooCommerce webhook: No integration found', { source });
      return res.status(404).json({ error: 'Integration not found for this store' });
    }

    // Verify signature
    if (!woocommerceWebhookService.verifySignature(rawBody, signature, integration.webhookSecret)) {
      logger.warn('WooCommerce webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse JSON body
    let payload;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch (parseError) {
      logger.error('Failed to parse WooCommerce webhook body', { error: parseError.message });
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Respond quickly (WooCommerce expects quick response)
    res.status(200).json({ received: true });

    // Process after responding
    try {
      await woocommerceWebhookService.processEvent(payload, topic, source, integration);
    } catch (processError) {
      logger.error('Error processing WooCommerce webhook', { error: processError.message });
      // Don't throw - we already returned 200
    }
  } catch (error) {
    logger.error('WooCommerce webhook error', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
