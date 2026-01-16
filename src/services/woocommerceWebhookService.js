/**
 * WooCommerce Webhook Service
 * Handles incoming webhooks from WooCommerce stores for SMS review requests
 *
 * Listens for:
 * - order.created (when a new order is placed)
 * - order.completed (when an order is marked complete)
 *
 * WooCommerce webhook signature is HMAC-SHA256 of the payload using the webhook secret
 */

const crypto = require('crypto');
const PosIntegration = require('../models/PosIntegration');
const PosWebhookEvent = require('../models/PosWebhookEvent');
const posSmsService = require('./posSmsService');
const logger = require('./logger');

class WooCommerceWebhookService {
  /**
   * Verify webhook signature from WooCommerce
   * @param {Buffer|string} rawBody - Raw request body
   * @param {string} signature - X-WC-Webhook-Signature header
   * @param {string} secret - Webhook secret
   * @returns {boolean}
   */
  verifySignature(rawBody, signature, secret) {
    if (!signature || !secret) {
      return false;
    }

    try {
      const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString() : rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(bodyString, 'utf8')
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('WooCommerce signature verification error', { error: error.message });
      return false;
    }
  }

  /**
   * Process an incoming WooCommerce webhook event
   * @param {object} payload - Webhook payload (order data)
   * @param {string} topic - X-WC-Webhook-Topic header (e.g., 'order.created')
   * @param {string} source - X-WC-Webhook-Source header (store URL)
   * @param {PosIntegration} integration - The integration record
   * @returns {object} Processing result
   */
  async processEvent(payload, topic, source, integration) {
    const orderId = payload.id;
    const eventId = `woo_${orderId}_${topic}`;

    logger.info('Processing WooCommerce webhook', { topic, orderId, source });

    // Check idempotency
    const alreadyProcessed = await PosWebhookEvent.isProcessed('woocommerce', eventId);
    if (alreadyProcessed) {
      logger.info('Skipping duplicate WooCommerce event', { eventId });
      return { skipped: true, reason: 'duplicate' };
    }

    // Only process order.created or order.completed
    if (!['order.created', 'order.completed'].includes(topic)) {
      return { skipped: true, reason: 'unhandled_topic' };
    }

    // Extract customer phone from billing address
    const billing = payload.billing || {};
    const customerPhone = billing.phone;
    const customerName = [billing.first_name, billing.last_name].filter(Boolean).join(' ') || 'Customer';
    const customerEmail = billing.email;

    // Get order amount
    const amount = parseFloat(payload.total) || null;

    // If no phone, log and skip
    if (!customerPhone) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: String(orderId),
        customerName,
        customerPhone: null,
        purchaseAmount: amount,
        locationName: source || 'WooCommerce',
        smsStatus: 'skipped_no_phone',
        skipReason: 'No phone number in order billing'
      });

      // Mark as processed to avoid re-processing
      await PosWebhookEvent.markProcessed('woocommerce', eventId, topic);

      return { skipped: true, reason: 'no_phone_number' };
    }

    // Process the transaction (will handle cooldown, consent check, etc.)
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: String(orderId),
      customerName,
      customerPhone,
      purchaseAmount: amount,
      locationName: source || 'WooCommerce'
    });

    // Mark as processed
    await PosWebhookEvent.markProcessed('woocommerce', eventId, topic);

    return result;
  }

  /**
   * Find integration by store URL
   * @param {string} storeUrl - The WooCommerce store URL
   * @returns {PosIntegration|null}
   */
  async findIntegrationByStoreUrl(storeUrl) {
    if (!storeUrl) return null;

    // Normalize the URL for comparison
    let normalized = storeUrl.toLowerCase().trim();
    if (!normalized.startsWith('http')) {
      normalized = 'https://' + normalized;
    }
    normalized = normalized.replace(/\/$/, '');

    // Try to find by exact match first
    let integration = await PosIntegration.findOne({
      where: {
        provider: 'woocommerce',
        storeUrl: normalized,
        isActive: true
      }
    });

    if (integration) return integration;

    // Try without https://www.
    const withoutWww = normalized.replace('https://www.', 'https://');
    integration = await PosIntegration.findOne({
      where: {
        provider: 'woocommerce',
        storeUrl: withoutWww,
        isActive: true
      }
    });

    if (integration) return integration;

    // Try with https://www.
    const withWww = normalized.replace('https://', 'https://www.');
    integration = await PosIntegration.findOne({
      where: {
        provider: 'woocommerce',
        storeUrl: withWww,
        isActive: true
      }
    });

    return integration;
  }

  /**
   * Generate the webhook setup instructions for a user
   * @param {PosIntegration} integration
   * @returns {object} Setup instructions
   */
  getSetupInstructions(integration) {
    const webhookUrl = `${process.env.APP_URL || 'https://app.morestars.io'}/api/webhooks/woocommerce`;

    return {
      webhookUrl,
      webhookSecret: integration.webhookSecret,
      topics: ['order.created', 'order.completed'],
      instructions: [
        '1. In your WordPress admin, go to WooCommerce → Settings → Advanced → Webhooks',
        '2. Click "Add webhook"',
        '3. Set Status to "Active"',
        '4. Set Topic to "Order created" (repeat for "Order completed" if desired)',
        `5. Set Delivery URL to: ${webhookUrl}`,
        `6. Set Secret to: ${integration.webhookSecret}`,
        '7. Set API version to the latest available',
        '8. Click "Save webhook"'
      ]
    };
  }
}

module.exports = new WooCommerceWebhookService();
