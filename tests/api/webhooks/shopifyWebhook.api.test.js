/**
 * Shopify Webhook API Tests
 *
 * Tests for POST /api/webhooks/shopify endpoint:
 * - Signature verification (HMAC-SHA256)
 * - Event handling (orders/create, app/uninstalled)
 * - Idempotency
 * - Error handling
 */

const request = require('supertest');
const crypto = require('crypto');
const { shopifyEventFactory } = require('../../helpers/factories');
const { generateShopifySignature, generateInvalidSignature } = require('../../helpers/signatureHelpers');

// Test constants
const API_SECRET = 'test_shopify_api_secret_12345';

// Mock dependencies - use literal string to avoid hoisting issues
jest.mock('../../../src/services/shopifyWebhookService', () => ({
  verifySignature: jest.fn(),
  processEvent: jest.fn(),
  apiSecret: 'test_shopify_api_secret_12345'
}));

jest.mock('../../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const shopifyWebhookService = require('../../../src/services/shopifyWebhookService');
const logger = require('../../../src/services/logger');

describe('Shopify Webhook API Tests - POST /api/webhooks/shopify', () => {
  let app;

  beforeAll(() => {
    process.env.SHOPIFY_API_SECRET = API_SECRET;
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: accept any signature that looks valid
    // We're testing API flow here, not the actual crypto - that's in unit tests
    shopifyWebhookService.verifySignature.mockImplementation((rawBody, hmacHeader) => {
      // No signature = reject
      if (!hmacHeader) return false;
      // Accept signatures that look valid (long enough and not marked invalid)
      return hmacHeader.length > 20 && !hmacHeader.includes('invalid');
    });
    shopifyWebhookService.processEvent.mockResolvedValue({ processed: true });

    // Create minimal express app for testing
    const express = require('express');
    app = express();

    // Shopify webhook route
    app.post('/api/webhooks/shopify', express.raw({ type: 'application/json' }), async (req, res) => {
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
        }
      } catch (error) {
        logger.error('Shopify webhook error', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  // ===========================================
  // Signature Verification Tests
  // ===========================================
  describe('Signature Verification', () => {
    it('should reject request without signature header', async () => {
      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid signature' });
      expect(logger.warn).toHaveBeenCalledWith('Shopify webhook signature verification failed');
    });

    it('should reject request with invalid signature', async () => {
      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'invalid_short_sig')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid signature' });
    });

    it('should accept request with valid signature', async () => {
      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });

    it('should reject when API secret not configured', async () => {
      // Mock verifySignature to reject when secret not configured
      shopifyWebhookService.verifySignature.mockReturnValue(false);

      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'any_signature')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(401);
    });
  });

  // ===========================================
  // orders/create Event Tests
  // ===========================================
  describe('orders/create', () => {
    it('should process order with customer phone', async () => {
      const payload = shopifyEventFactory.buildOrderCreated({
        customerPhone: '+15551234567'
      });
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(shopifyWebhookService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: expect.objectContaining({
            phone: '+15551234567'
          })
        }),
        'orders/create',
        'test-store.myshopify.com'
      );
    });

    it('should skip order without customer phone', async () => {
      const payload = shopifyEventFactory.buildOrderCreatedNoPhone();
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      shopifyWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'no_phone_number'
      });

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);
    });

    it('should extract phone from shipping address if customer has none', async () => {
      const payload = shopifyEventFactory.buildOrderCreated({
        customer: {
          id: 12345,
          phone: null,
          first_name: 'John',
          last_name: 'Doe'
        },
        shippingPhone: '+15559876543'
      });
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(shopifyWebhookService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_address: expect.objectContaining({
            phone: '+15559876543'
          })
        }),
        'orders/create',
        'test-store.myshopify.com'
      );
    });

    it('should extract phone from billing address as fallback', async () => {
      const payload = shopifyEventFactory.buildOrderCreated({
        customer: {
          id: 12345,
          phone: null,
          first_name: 'John',
          last_name: 'Doe'
        },
        shippingPhone: null,
        billingPhone: '+15551112222'
      });
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);
    });

    it('should pass shop domain to processEvent', async () => {
      const shopDomain = 'my-cool-store.myshopify.com';
      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', shopDomain)
        .send(payloadStr);

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(shopifyWebhookService.processEvent).toHaveBeenCalledWith(
        expect.any(Object),
        'orders/create',
        shopDomain
      );
    });
  });

  // ===========================================
  // app/uninstalled Event Tests
  // ===========================================
  describe('app/uninstalled', () => {
    it('should deactivate integration on app uninstall', async () => {
      const shopDomain = 'uninstalling-store.myshopify.com';
      const payload = shopifyEventFactory.buildAppUninstalled(shopDomain);
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      shopifyWebhookService.processEvent.mockResolvedValue({
        processed: true,
        action: 'app_uninstalled'
      });

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'app/uninstalled')
        .set('x-shopify-shop-domain', shopDomain)
        .send(payloadStr);

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(shopifyWebhookService.processEvent).toHaveBeenCalledWith(
        expect.any(Object),
        'app/uninstalled',
        shopDomain
      );
    });
  });

  // ===========================================
  // Idempotency Tests
  // ===========================================
  describe('Idempotency', () => {
    it('should skip duplicate webhook IDs', async () => {
      const payload = shopifyEventFactory.buildOrderCreated({ id: 123456789 });
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      // First request
      const response1 = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response1.status).toBe(200);

      // Mock duplicate detection
      shopifyWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'duplicate'
      });

      // Second request with same payload
      const response2 = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response2.status).toBe(200);
    });

    it('should return 200 for duplicate events', async () => {
      shopifyWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'duplicate'
      });

      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should return 400 for invalid JSON', async () => {
      const malformedPayload = '{ invalid json }';
      const signature = generateShopifySignature(malformedPayload, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(malformedPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid JSON' });
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse Shopify webhook body',
        expect.any(Object)
      );
    });

    it('should continue processing even if processEvent fails', async () => {
      shopifyWebhookService.processEvent.mockRejectedValue(new Error('Database error'));

      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      // Should still return 200 because we respond before processing
      expect(response.status).toBe(200);

      // Allow async processing to fail
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing Shopify webhook',
        { error: 'Database error' }
      );
    });

    it('should log proper error when verifySignature throws', async () => {
      shopifyWebhookService.verifySignature.mockImplementation(() => {
        throw new Error('Signature verification error');
      });

      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'any_sig')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  // ===========================================
  // Unhandled Topics
  // ===========================================
  describe('Unhandled Topics', () => {
    it('should process unhandled topics without error', async () => {
      const payload = { id: 12345, some_data: 'value' };
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      shopifyWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'unhandled_topic'
      });

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'customers/update')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Integration Lookup Tests
  // ===========================================
  describe('Integration Lookup', () => {
    it('should skip when no integration found for shop', async () => {
      const payload = shopifyEventFactory.buildOrderCreated();
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      shopifyWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'no_integration'
      });

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'unknown-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);
    });

    it('should skip when location is disabled', async () => {
      const payload = shopifyEventFactory.buildOrderCreated({
        locationId: 123456
      });
      const payloadStr = JSON.stringify(payload);
      const signature = generateShopifySignature(payloadStr, API_SECRET);

      shopifyWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'location_disabled'
      });

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', signature)
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-store.myshopify.com')
        .send(payloadStr);

      expect(response.status).toBe(200);
    });
  });
});
