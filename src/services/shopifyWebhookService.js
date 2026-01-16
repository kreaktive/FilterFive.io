/**
 * Shopify Webhook Service
 * Handles webhook HMAC verification and order processing
 */

const crypto = require('crypto');
const PosIntegration = require('../models/PosIntegration');
const PosLocation = require('../models/PosLocation');
const PosWebhookEvent = require('../models/PosWebhookEvent');
const posSmsService = require('./posSmsService');
const logger = require('./logger');

class ShopifyWebhookService {
  constructor() {
    this.apiSecret = process.env.SHOPIFY_API_SECRET;
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   * @param {Buffer} rawBody - Raw request body
   * @param {string} hmacHeader - X-Shopify-Hmac-SHA256 header (base64)
   * @returns {boolean} Valid signature
   */
  verifySignature(rawBody, hmacHeader) {
    // SECURITY FIX: Never bypass signature verification
    // Previously returned true when secret not configured, allowing forged webhooks
    if (!this.apiSecret) {
      logger.error('SECURITY: SHOPIFY_API_SECRET not configured - rejecting webhook');
      return false; // REJECT - never allow unsigned webhooks
    }

    if (!hmacHeader) {
      return false;
    }

    const calculatedHmac = crypto
      .createHmac('sha256', this.apiSecret)
      .update(rawBody)
      .digest('base64');

    // Constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hmacHeader),
        Buffer.from(calculatedHmac)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract shop domain from webhook headers
   * @param {object} headers - Request headers
   * @returns {string} Shop domain
   */
  getShopDomain(headers) {
    return headers['x-shopify-shop-domain'];
  }

  /**
   * Process incoming webhook event
   * @param {object} payload - Webhook payload (order data)
   * @param {string} topic - Webhook topic (e.g., orders/create)
   * @param {string} shopDomain - Shop domain from headers
   * @returns {object} Processing result
   */
  async processEvent(payload, topic, shopDomain) {
    // Generate event ID from order ID + topic
    const eventId = `${payload.id}-${topic}`;

    logger.info('Processing Shopify webhook', { topic, eventId, shopDomain });

    // Check idempotency
    const alreadyProcessed = await PosWebhookEvent.isProcessed('shopify', eventId);
    if (alreadyProcessed) {
      logger.info('Skipping duplicate Shopify event', { eventId });
      return { skipped: true, reason: 'duplicate' };
    }

    // Route to appropriate handler
    let result;
    switch (topic) {
      case 'orders/create':
        result = await this.handleOrderCreated(payload, shopDomain);
        break;

      case 'app/uninstalled':
        result = await this.handleAppUninstalled(payload, shopDomain);
        break;

      default:
        logger.info('Unhandled Shopify topic', { topic });
        result = { skipped: true, reason: 'unhandled_topic' };
    }

    // Mark as processed
    await PosWebhookEvent.markProcessed('shopify', eventId, topic);

    return result;
  }

  /**
   * Handle orders/create webhook
   */
  async handleOrderCreated(order, shopDomain) {
    const orderId = order.id;
    const customer = order.customer;
    const locationId = order.location_id;

    // Find integration by shop domain
    const integration = await PosIntegration.findOne({
      where: {
        provider: 'shopify',
        shopDomain,
        isActive: true
      }
    });

    if (!integration) {
      logger.info('No active Shopify integration found', { shopDomain });
      return { skipped: true, reason: 'no_integration' };
    }

    // Check if location is enabled (if location_id exists)
    if (locationId) {
      const location = await PosLocation.findOne({
        where: {
          posIntegrationId: integration.id,
          externalLocationId: locationId.toString(),
          isEnabled: true
        }
      });

      if (!location) {
        logger.info('Location not enabled', { locationId, integrationId: integration.id });
        // Log and skip
        await posSmsService.logTransaction({
          userId: integration.userId,
          posIntegrationId: integration.id,
          externalTransactionId: orderId.toString(),
          customerName: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : null,
          customerPhone: customer?.phone || null,
          purchaseAmount: order.total_price ? parseFloat(order.total_price) : null,
          locationName: null,
          smsStatus: 'skipped_location_disabled',
          skipReason: 'Location not enabled'
        });
        return { skipped: true, reason: 'location_disabled' };
      }
    }

    // Check for customer phone number
    let customerPhone = null;
    let customerName = null;

    if (customer) {
      customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      customerPhone = customer.phone;
    }

    // Also check shipping/billing address for phone
    if (!customerPhone && order.shipping_address?.phone) {
      customerPhone = order.shipping_address.phone;
    }
    if (!customerPhone && order.billing_address?.phone) {
      customerPhone = order.billing_address.phone;
    }

    if (!customerPhone) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: orderId.toString(),
        customerName,
        customerPhone: null,
        purchaseAmount: order.total_price ? parseFloat(order.total_price) : null,
        locationName: this.getLocationName(order),
        smsStatus: 'skipped_no_phone',
        skipReason: 'Customer has no phone number'
      });
      return { skipped: true, reason: 'no_phone_number' };
    }

    // Process the transaction for SMS
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: orderId.toString(),
      customerName,
      customerPhone,
      purchaseAmount: order.total_price ? parseFloat(order.total_price) : null,
      locationName: this.getLocationName(order)
    });

    return result;
  }

  /**
   * Handle app/uninstalled webhook
   */
  async handleAppUninstalled(payload, shopDomain) {
    const integration = await PosIntegration.findOne({
      where: {
        provider: 'shopify',
        shopDomain
      }
    });

    if (integration) {
      logger.info('Shopify app uninstalled', { shopDomain });
      integration.isActive = false;
      integration.accessTokenEncrypted = null;
      await integration.save();
    }

    return { processed: true, action: 'app_uninstalled' };
  }

  /**
   * Extract location name from order
   */
  getLocationName(order) {
    // Try to get location name from various sources
    if (order.location_id && order.fulfillments?.length > 0) {
      const fulfillment = order.fulfillments[0];
      if (fulfillment.location_id) {
        return `Location ${fulfillment.location_id}`;
      }
    }
    return order.source_name || 'Online';
  }
}

module.exports = new ShopifyWebhookService();
