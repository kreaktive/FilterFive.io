/**
 * Square Webhook Service
 * Handles webhook signature verification and payment processing
 */

const crypto = require('crypto');
const PosIntegration = require('../models/PosIntegration');
const PosLocation = require('../models/PosLocation');
const PosWebhookEvent = require('../models/PosWebhookEvent');
const squareOAuthService = require('./squareOAuthService');
const posSmsService = require('./posSmsService');
const logger = require('./logger');

class SquareWebhookService {
  constructor() {
    this.signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    this.notificationUrl = `${process.env.APP_URL}/api/webhooks/square`;
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   * @param {Buffer} rawBody - Raw request body
   * @param {string} signature - x-square-hmacsha256-signature header
   * @returns {boolean} Valid signature
   */
  verifySignature(rawBody, signature) {
    // SECURITY FIX: Never bypass signature verification
    // Previously returned true when key not configured, allowing forged webhooks
    if (!this.signatureKey) {
      logger.error('SECURITY: SQUARE_WEBHOOK_SIGNATURE_KEY not configured - rejecting webhook');
      return false; // REJECT - never allow unsigned webhooks
    }

    if (!signature) {
      return false;
    }

    // Square signature = HMAC-SHA256(signatureKey + notificationUrl + body)
    const payload = this.notificationUrl + rawBody.toString();
    const expectedSignature = crypto
      .createHmac('sha256', this.signatureKey)
      .update(payload)
      .digest('base64');

    // Constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Process incoming webhook event
   * @param {object} event - Webhook event payload
   * @returns {object} Processing result
   */
  async processEvent(event) {
    const eventId = event.event_id;
    const eventType = event.type;
    const merchantId = event.merchant_id;

    logger.info('Processing Square webhook', { eventType, eventId });

    // Check idempotency
    const alreadyProcessed = await PosWebhookEvent.isProcessed('square', eventId);
    if (alreadyProcessed) {
      logger.info('Skipping duplicate Square event', { eventId });
      return { skipped: true, reason: 'duplicate' };
    }

    // Route to appropriate handler
    let result;
    switch (eventType) {
      case 'payment.created':
      case 'payment.updated':
        result = await this.handlePaymentEvent(event);
        break;

      case 'order.created':
      case 'order.updated':
        result = await this.handleOrderEvent(event);
        break;

      case 'refund.created':
      case 'refund.updated':
        result = await this.handleRefundEvent(event);
        break;

      case 'customer.created':
      case 'customer.updated':
        result = await this.handleCustomerEvent(event);
        break;

      case 'location.created':
      case 'location.updated':
        result = await this.handleLocationEvent(event);
        break;

      case 'loyalty.account.created':
      case 'loyalty.account.updated':
      case 'loyalty.account.deleted':
        result = await this.handleLoyaltyEvent(event);
        break;

      case 'oauth.authorization.revoked':
        result = await this.handleOAuthRevoked(event);
        break;

      default:
        logger.info('Unhandled Square event type', { eventType });
        result = { skipped: true, reason: 'unhandled_event_type' };
    }

    // Mark as processed
    await PosWebhookEvent.markProcessed('square', eventId, eventType);

    return result;
  }

  /**
   * Handle payment.created or payment.updated events
   */
  async handlePaymentEvent(event) {
    const payment = event.data?.object?.payment;
    if (!payment) {
      return { skipped: true, reason: 'no_payment_data' };
    }

    // Only process completed payments
    if (payment.status !== 'COMPLETED') {
      return { skipped: true, reason: 'payment_not_completed', status: payment.status };
    }

    const merchantId = event.merchant_id;
    const locationId = payment.location_id;
    const customerId = payment.customer_id;
    const paymentId = payment.id;

    // Find integration by merchant ID
    const integration = await PosIntegration.findOne({
      where: {
        provider: 'square',
        merchantId,
        isActive: true
      }
    });

    if (!integration) {
      logger.info('No active Square integration found', { merchantId });
      return { skipped: true, reason: 'no_integration' };
    }

    // Check if location is enabled
    const location = await PosLocation.findOne({
      where: {
        posIntegrationId: integration.id,
        externalLocationId: locationId,
        isEnabled: true
      }
    });

    if (!location) {
      logger.info('Location not enabled', { locationId, integrationId: integration.id });
      return { skipped: true, reason: 'location_disabled' };
    }

    // If no customer ID, we can't get phone number
    if (!customerId) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: paymentId,
        customerName: null,
        customerPhone: null,
        purchaseAmount: payment.total_money ? payment.total_money.amount / 100 : null,
        locationName: location.locationName,
        smsStatus: 'skipped_no_phone',
        skipReason: 'No customer ID in payment'
      });
      return { skipped: true, reason: 'no_customer_id' };
    }

    // Fetch customer details to get phone number
    const accessToken = integration.getAccessToken();
    if (!accessToken) {
      return { skipped: true, reason: 'no_access_token' };
    }

    // Refresh token if needed
    if (integration.isTokenExpired()) {
      try {
        await squareOAuthService.refreshToken(integration);
      } catch (error) {
        logger.error('Failed to refresh Square token', { error: error.message });
        return { skipped: true, reason: 'token_refresh_failed' };
      }
    }

    const customer = await squareOAuthService.fetchCustomer(
      integration.getAccessToken(),
      customerId
    );

    if (!customer || !customer.phoneNumber) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: paymentId,
        customerName: customer ? `${customer.givenName || ''} ${customer.familyName || ''}`.trim() : null,
        customerPhone: null,
        purchaseAmount: payment.total_money ? payment.total_money.amount / 100 : null,
        locationName: location.locationName,
        smsStatus: 'skipped_no_phone',
        skipReason: 'Customer has no phone number'
      });
      return { skipped: true, reason: 'no_phone_number' };
    }

    // Process the transaction for SMS
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: paymentId,
      customerName: `${customer.givenName || ''} ${customer.familyName || ''}`.trim(),
      customerPhone: customer.phoneNumber,
      purchaseAmount: payment.total_money ? payment.total_money.amount / 100 : null,
      locationName: location.locationName
    });

    return result;
  }

  /**
   * Handle order.created or order.updated events
   * Orders often have better customer data than payments
   */
  async handleOrderEvent(event) {
    const order = event.data?.object?.order;
    if (!order) {
      return { skipped: true, reason: 'no_order_data' };
    }

    // Only process completed/paid orders
    if (order.state !== 'COMPLETED') {
      return { skipped: true, reason: 'order_not_completed', state: order.state };
    }

    const merchantId = event.merchant_id;
    const locationId = order.location_id;
    const customerId = order.customer_id;
    const orderId = order.id;

    // Find integration
    const integration = await PosIntegration.findOne({
      where: {
        provider: 'square',
        merchantId,
        isActive: true
      }
    });

    if (!integration) {
      return { skipped: true, reason: 'no_integration' };
    }

    // Check if location is enabled
    const location = await PosLocation.findOne({
      where: {
        posIntegrationId: integration.id,
        externalLocationId: locationId,
        isEnabled: true
      }
    });

    if (!location) {
      return { skipped: true, reason: 'location_disabled' };
    }

    // Check if we already processed this order (e.g., via payment event)
    const PosTransaction = require('../models/PosTransaction');
    const existingTransaction = await PosTransaction.findOne({
      where: {
        posIntegrationId: integration.id,
        externalTransactionId: orderId
      }
    });

    if (existingTransaction) {
      return { skipped: true, reason: 'already_processed' };
    }

    // If no customer ID, can't get phone
    if (!customerId) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: orderId,
        customerName: null,
        customerPhone: null,
        purchaseAmount: order.total_money ? order.total_money.amount / 100 : null,
        locationName: location.locationName,
        smsStatus: 'skipped_no_phone',
        skipReason: 'No customer ID in order'
      });
      return { skipped: true, reason: 'no_customer_id' };
    }

    // Refresh token if needed and fetch customer
    if (integration.isTokenExpired()) {
      try {
        await squareOAuthService.refreshToken(integration);
      } catch (error) {
        logger.error('Failed to refresh Square token', { error: error.message });
        return { skipped: true, reason: 'token_refresh_failed' };
      }
    }

    const customer = await squareOAuthService.fetchCustomer(
      integration.getAccessToken(),
      customerId
    );

    if (!customer || !customer.phoneNumber) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: orderId,
        customerName: customer ? `${customer.givenName || ''} ${customer.familyName || ''}`.trim() : null,
        customerPhone: null,
        purchaseAmount: order.total_money ? order.total_money.amount / 100 : null,
        locationName: location.locationName,
        smsStatus: 'skipped_no_phone',
        skipReason: 'Customer has no phone number'
      });
      return { skipped: true, reason: 'no_phone_number' };
    }

    // Process for SMS
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: orderId,
      customerName: `${customer.givenName || ''} ${customer.familyName || ''}`.trim(),
      customerPhone: customer.phoneNumber,
      purchaseAmount: order.total_money ? order.total_money.amount / 100 : null,
      locationName: location.locationName
    });

    return result;
  }

  /**
   * Handle refund.created or refund.updated events
   * Mark transactions as refunded to prevent SMS or update status
   */
  async handleRefundEvent(event) {
    const refund = event.data?.object?.refund;
    if (!refund) {
      return { skipped: true, reason: 'no_refund_data' };
    }

    // Only process completed refunds
    if (refund.status !== 'COMPLETED' && refund.status !== 'APPROVED') {
      return { skipped: true, reason: 'refund_not_completed', status: refund.status };
    }

    const paymentId = refund.payment_id;
    const orderId = refund.order_id;

    // Find the transaction by payment ID or order ID and mark as refunded
    const PosTransaction = require('../models/PosTransaction');

    const transaction = await PosTransaction.findOne({
      where: {
        externalTransactionId: paymentId || orderId
      }
    });

    if (transaction) {
      // If SMS is still pending, cancel it
      if (transaction.smsStatus === 'pending') {
        transaction.smsStatus = 'skipped_refunded';
        transaction.skipReason = 'Order was refunded';
        await transaction.save();
        logger.info('Cancelled pending SMS for refunded transaction', { transactionId: transaction.id });
      }
      return { processed: true, action: 'transaction_marked_refunded' };
    }

    // Log for tracking even if no matching transaction
    logger.info('Refund processed', { paymentId: paymentId || orderId });
    return { processed: true, action: 'refund_logged' };
  }

  /**
   * Handle customer.created or customer.updated events
   * Log for future reference (e.g., proactive customer database)
   */
  async handleCustomerEvent(event) {
    const customer = event.data?.object?.customer;
    if (!customer) {
      return { skipped: true, reason: 'no_customer_data' };
    }

    // For now, just log. Future: could store customer data for richer analytics
    logger.info('Square customer event', { eventType: event.type, customerId: customer.id });

    return { processed: true, action: 'customer_event_logged' };
  }

  /**
   * Handle location.created or location.updated events
   * Auto-sync locations for the merchant
   */
  async handleLocationEvent(event) {
    const locationData = event.data?.object?.location;
    if (!locationData) {
      return { skipped: true, reason: 'no_location_data' };
    }

    const merchantId = event.merchant_id;

    // Find integration
    const integration = await PosIntegration.findOne({
      where: {
        provider: 'square',
        merchantId,
        isActive: true
      }
    });

    if (!integration) {
      return { skipped: true, reason: 'no_integration' };
    }

    // Check if location already exists
    let location = await PosLocation.findOne({
      where: {
        posIntegrationId: integration.id,
        externalLocationId: locationData.id
      }
    });

    if (location) {
      // Update existing location name
      location.locationName = locationData.name || locationData.id;
      await location.save();
      logger.info('Updated Square location', { locationName: location.locationName });
    } else {
      // Create new location (disabled by default)
      location = await PosLocation.create({
        posIntegrationId: integration.id,
        externalLocationId: locationData.id,
        locationName: locationData.name || locationData.id,
        isEnabled: false
      });
      logger.info('Added new Square location (disabled by default)', { locationName: location.locationName });
    }

    return { processed: true, action: 'location_synced', locationId: location.id };
  }

  /**
   * Handle loyalty account events
   * Log for future features (e.g., different messaging for loyal customers)
   */
  async handleLoyaltyEvent(event) {
    const loyaltyAccount = event.data?.object?.loyalty_account;
    if (!loyaltyAccount) {
      return { skipped: true, reason: 'no_loyalty_data' };
    }

    // For now, just log. Future: could flag customers as loyalty members
    logger.info('Square loyalty event', { eventType: event.type, accountId: loyaltyAccount.id, customerId: loyaltyAccount.customer_id });

    return { processed: true, action: 'loyalty_event_logged' };
  }

  /**
   * Handle oauth.authorization.revoked event
   */
  async handleOAuthRevoked(event) {
    const merchantId = event.merchant_id;

    const integration = await PosIntegration.findOne({
      where: {
        provider: 'square',
        merchantId
      }
    });

    if (integration) {
      logger.info('Square OAuth revoked', { merchantId });
      integration.isActive = false;
      integration.accessTokenEncrypted = null;
      integration.refreshTokenEncrypted = null;
      await integration.save();
    }

    return { processed: true, action: 'oauth_revoked' };
  }
}

module.exports = new SquareWebhookService();
