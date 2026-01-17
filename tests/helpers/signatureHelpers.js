/**
 * Signature Helpers for Webhook Testing
 *
 * Utilities for generating valid webhook signatures for:
 * - Stripe (HMAC-SHA256 with timestamp)
 * - Square (HMAC-SHA256 with notification URL)
 * - Shopify (HMAC-SHA256)
 */

const crypto = require('crypto');

/**
 * Generate a valid Stripe webhook signature
 * @param {string|Buffer} payload - Raw request body
 * @param {string} secret - Webhook signing secret
 * @param {number} timestamp - Unix timestamp (optional, defaults to now)
 * @returns {string} stripe-signature header value
 */
function generateStripeSignature(payload, secret, timestamp = null) {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const payloadString = typeof payload === 'string' ? payload : payload.toString();

  // Stripe signature format: t=timestamp,v1=signature
  const signedPayload = `${ts}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${ts},v1=${signature}`;
}

/**
 * Generate an invalid/expired Stripe signature (for testing rejection)
 * @param {string|Buffer} payload - Raw request body
 * @param {string} secret - Webhook signing secret
 * @param {number} expiredTimestamp - Past timestamp for expired signature
 * @returns {string} stripe-signature header value
 */
function generateExpiredStripeSignature(payload, secret, expiredTimestamp = null) {
  // Default to 10 minutes ago (Stripe rejects signatures older than 5 minutes)
  const ts = expiredTimestamp || Math.floor(Date.now() / 1000) - 600;
  return generateStripeSignature(payload, secret, ts);
}

/**
 * Generate a valid Square webhook signature
 * @param {string} notificationUrl - The webhook endpoint URL
 * @param {string|Buffer} body - Raw request body
 * @param {string} signatureKey - Square webhook signature key
 * @returns {string} x-square-hmacsha256-signature header value
 */
function generateSquareSignature(notificationUrl, body, signatureKey) {
  const bodyString = typeof body === 'string' ? body : body.toString();
  const payload = notificationUrl + bodyString;

  return crypto
    .createHmac('sha256', signatureKey)
    .update(payload)
    .digest('base64');
}

/**
 * Generate a valid Shopify webhook signature
 * @param {string|Buffer} body - Raw request body
 * @param {string} secret - Shopify API secret
 * @returns {string} x-shopify-hmac-sha256 header value
 */
function generateShopifySignature(body, secret) {
  const bodyBuffer = typeof body === 'string' ? Buffer.from(body) : body;

  return crypto
    .createHmac('sha256', secret)
    .update(bodyBuffer)
    .digest('base64');
}

/**
 * Generate an invalid signature (for testing rejection)
 * @returns {string} Random invalid signature
 */
function generateInvalidSignature() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Create Stripe webhook event payload
 * @param {string} eventType - Stripe event type (e.g., 'checkout.session.completed')
 * @param {object} data - Event data object
 * @param {object} options - Additional options (id, metadata, etc.)
 * @returns {object} Complete Stripe event object
 */
function createStripeEventPayload(eventType, data, options = {}) {
  return {
    id: options.id || `evt_${crypto.randomBytes(12).toString('hex')}`,
    object: 'event',
    api_version: '2023-10-16',
    created: options.created || Math.floor(Date.now() / 1000),
    type: eventType,
    livemode: options.livemode || false,
    pending_webhooks: options.pending_webhooks || 0,
    data: {
      object: {
        ...data,
        metadata: {
          ...(data.metadata || {}),
          ...(options.metadata || {})
        }
      }
    }
  };
}

/**
 * Create Square webhook event payload
 * @param {string} eventType - Square event type (e.g., 'payment.created')
 * @param {object} data - Event data object
 * @param {object} options - Additional options (merchantId, etc.)
 * @returns {object} Complete Square event object
 */
function createSquareEventPayload(eventType, data, options = {}) {
  return {
    event_id: options.eventId || `evt_${crypto.randomBytes(12).toString('hex')}`,
    merchant_id: options.merchantId || `MERCH_${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    type: eventType,
    created_at: options.createdAt || new Date().toISOString(),
    data: {
      type: eventType.split('.')[0], // e.g., 'payment' from 'payment.created'
      id: options.dataId || crypto.randomBytes(12).toString('hex'),
      object: data
    }
  };
}

/**
 * Create Shopify webhook event payload
 * @param {string} topic - Shopify topic (e.g., 'orders/create')
 * @param {object} data - Event data object
 * @param {object} options - Additional options (shopDomain, etc.)
 * @returns {object} Webhook payload and headers
 */
function createShopifyEventPayload(topic, data, options = {}) {
  const payload = {
    id: options.id || Math.floor(Math.random() * 10000000000),
    admin_graphql_api_id: options.graphqlId || `gid://shopify/Order/${options.id || 123}`,
    ...data
  };

  const headers = {
    'x-shopify-topic': topic,
    'x-shopify-shop-domain': options.shopDomain || 'test-store.myshopify.com',
    'x-shopify-api-version': options.apiVersion || '2024-01',
    'x-shopify-webhook-id': options.webhookId || crypto.randomBytes(16).toString('hex')
  };

  return { payload, headers };
}

module.exports = {
  // Signature generators
  generateStripeSignature,
  generateExpiredStripeSignature,
  generateSquareSignature,
  generateShopifySignature,
  generateInvalidSignature,

  // Payload creators
  createStripeEventPayload,
  createSquareEventPayload,
  createShopifyEventPayload
};
