/**
 * POS Webhook Routes Tests
 *
 * Tests the actual posWebhook.js routes file for coverage.
 * Tests:
 * - Square webhook endpoint
 * - Shopify webhook endpoint
 * - WooCommerce webhook endpoint
 * - Inbound webhook endpoint (Zapier/Custom)
 */

const express = require('express');
const request = require('supertest');

// Mock services before importing routes
jest.mock('../../src/services/squareWebhookService', () => ({
  verifySignature: jest.fn(),
  processEvent: jest.fn(),
}));

jest.mock('../../src/services/shopifyWebhookService', () => ({
  verifySignature: jest.fn(),
  processEvent: jest.fn(),
}));

jest.mock('../../src/services/woocommerceWebhookService', () => ({
  verifySignature: jest.fn(),
  processEvent: jest.fn(),
  findIntegrationByStoreUrl: jest.fn(),
}));

jest.mock('../../src/services/inboundWebhookService', () => ({
  processWebhook: jest.fn(),
}));

jest.mock('../../src/models/PosIntegration', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Import after mocks
const squareWebhookService = require('../../src/services/squareWebhookService');
const shopifyWebhookService = require('../../src/services/shopifyWebhookService');
const woocommerceWebhookService = require('../../src/services/woocommerceWebhookService');
const inboundWebhookService = require('../../src/services/inboundWebhookService');
const PosIntegration = require('../../src/models/PosIntegration');
const logger = require('../../src/services/logger');
const posWebhookRoutes = require('../../src/routes/posWebhook');

describe('POS Webhook Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create fresh express app for each test
    app = express();
    app.use('/api/webhooks', posWebhookRoutes);
  });

  // ============================================
  // Square Webhook Tests
  // ============================================
  describe('POST /api/webhooks/square', () => {
    const validSquareEvent = {
      merchant_id: 'merchant_123',
      type: 'payment.created',
      event_id: 'event_123',
      data: {
        type: 'payment',
        id: 'payment_123',
        object: {
          payment: {
            id: 'payment_123',
            status: 'COMPLETED',
            amount_money: { amount: 1000, currency: 'USD' },
          },
        },
      },
    };

    test('should return 401 when signature verification fails', async () => {
      squareWebhookService.verifySignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'invalid_signature')
        .send(JSON.stringify(validSquareEvent));

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
      expect(logger.warn).toHaveBeenCalledWith('Square webhook signature verification failed');
    });

    test('should return 400 for invalid JSON', async () => {
      squareWebhookService.verifySignature.mockReturnValue(true);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'valid_signature')
        .send('invalid json {{{');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid JSON');
    });

    test('should return 200 and process valid event', async () => {
      squareWebhookService.verifySignature.mockReturnValue(true);
      squareWebhookService.processEvent.mockResolvedValue({ processed: true });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'valid_signature')
        .send(JSON.stringify(validSquareEvent));

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(squareWebhookService.processEvent).toHaveBeenCalled();
      // Verify the event was parsed correctly
      const calledWith = squareWebhookService.processEvent.mock.calls[0][0];
      expect(calledWith.type).toBe('payment.created');
      expect(calledWith.event_id).toBe('event_123');
    });

    test('should handle process errors gracefully', async () => {
      squareWebhookService.verifySignature.mockReturnValue(true);
      squareWebhookService.processEvent.mockRejectedValue(new Error('Processing failed'));

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'valid_signature')
        .send(JSON.stringify(validSquareEvent));

      // Should still return 200 (responded before processing)
      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing Square webhook',
        expect.objectContaining({ error: 'Processing failed' })
      );
    });
  });

  // ============================================
  // Shopify Webhook Tests
  // ============================================
  describe('POST /api/webhooks/shopify', () => {
    const validShopifyOrder = {
      id: 123456789,
      email: 'customer@example.com',
      phone: '+15551234567',
      customer: {
        id: 987654321,
        email: 'customer@example.com',
        phone: '+15551234567',
        first_name: 'John',
        last_name: 'Doe',
      },
      line_items: [{ title: 'Product', quantity: 1, price: '29.99' }],
      total_price: '29.99',
      created_at: new Date().toISOString(),
    };

    test('should return 401 when signature verification fails', async () => {
      shopifyWebhookService.verifySignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'invalid_signature')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-shop.myshopify.com')
        .send(JSON.stringify(validShopifyOrder));

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
      expect(logger.warn).toHaveBeenCalledWith('Shopify webhook signature verification failed');
    });

    test('should return 400 for invalid JSON', async () => {
      shopifyWebhookService.verifySignature.mockReturnValue(true);

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'valid_signature')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-shop.myshopify.com')
        .send('not valid json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid JSON');
    });

    test('should return 200 and process valid order', async () => {
      shopifyWebhookService.verifySignature.mockReturnValue(true);
      shopifyWebhookService.processEvent.mockResolvedValue({ processed: true });

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'valid_signature')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-shop.myshopify.com')
        .send(JSON.stringify(validShopifyOrder));

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(shopifyWebhookService.processEvent).toHaveBeenCalled();
      // Verify correct arguments
      const [payload, topic, shopDomain] = shopifyWebhookService.processEvent.mock.calls[0];
      expect(payload.id).toBe(validShopifyOrder.id);
      expect(topic).toBe('orders/create');
      expect(shopDomain).toBe('test-shop.myshopify.com');
    });

    test('should handle process errors gracefully', async () => {
      shopifyWebhookService.verifySignature.mockReturnValue(true);
      shopifyWebhookService.processEvent.mockRejectedValue(new Error('Shopify processing failed'));

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'valid_signature')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test-shop.myshopify.com')
        .send(JSON.stringify(validShopifyOrder));

      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing Shopify webhook',
        expect.objectContaining({ error: 'Shopify processing failed' })
      );
    });
  });

  // ============================================
  // WooCommerce Webhook Tests
  // ============================================
  describe('POST /api/webhooks/woocommerce', () => {
    const validWooOrder = {
      id: 12345,
      order_key: 'wc_order_abc123',
      status: 'completed',
      billing: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '+15559876543',
      },
      line_items: [{ name: 'Product', quantity: 1, total: '49.99' }],
      total: '49.99',
      date_created: new Date().toISOString(),
    };

    const mockIntegration = {
      id: 1,
      userId: 100,
      provider: 'woocommerce',
      storeUrl: 'https://example-store.com',
      webhookSecret: 'woo_secret_123',
      isActive: true,
    };

    test('should return 404 when integration not found', async () => {
      woocommerceWebhookService.findIntegrationByStoreUrl.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/webhooks/woocommerce')
        .set('Content-Type', 'application/json')
        .set('x-wc-webhook-signature', 'some_signature')
        .set('x-wc-webhook-topic', 'order.completed')
        .set('x-wc-webhook-source', 'https://unknown-store.com')
        .send(JSON.stringify(validWooOrder));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Integration not found for this store');
    });

    test('should return 401 when signature verification fails', async () => {
      woocommerceWebhookService.findIntegrationByStoreUrl.mockResolvedValue(mockIntegration);
      woocommerceWebhookService.verifySignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/webhooks/woocommerce')
        .set('Content-Type', 'application/json')
        .set('x-wc-webhook-signature', 'invalid_signature')
        .set('x-wc-webhook-topic', 'order.completed')
        .set('x-wc-webhook-source', 'https://example-store.com')
        .send(JSON.stringify(validWooOrder));

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
    });

    test('should return 400 for invalid JSON', async () => {
      woocommerceWebhookService.findIntegrationByStoreUrl.mockResolvedValue(mockIntegration);
      woocommerceWebhookService.verifySignature.mockReturnValue(true);

      const response = await request(app)
        .post('/api/webhooks/woocommerce')
        .set('Content-Type', 'application/json')
        .set('x-wc-webhook-signature', 'valid_signature')
        .set('x-wc-webhook-topic', 'order.completed')
        .set('x-wc-webhook-source', 'https://example-store.com')
        .send('bad json {{');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid JSON');
    });

    test('should return 200 and process valid order', async () => {
      woocommerceWebhookService.findIntegrationByStoreUrl.mockResolvedValue(mockIntegration);
      woocommerceWebhookService.verifySignature.mockReturnValue(true);
      woocommerceWebhookService.processEvent.mockResolvedValue({ processed: true });

      const response = await request(app)
        .post('/api/webhooks/woocommerce')
        .set('Content-Type', 'application/json')
        .set('x-wc-webhook-signature', 'valid_signature')
        .set('x-wc-webhook-topic', 'order.completed')
        .set('x-wc-webhook-source', 'https://example-store.com')
        .send(JSON.stringify(validWooOrder));

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(woocommerceWebhookService.processEvent).toHaveBeenCalled();
      // Verify correct arguments
      const [payload, topic, source, integration] = woocommerceWebhookService.processEvent.mock.calls[0];
      expect(payload.id).toBe(validWooOrder.id);
      expect(topic).toBe('order.completed');
      expect(source).toBe('https://example-store.com');
      expect(integration.id).toBe(mockIntegration.id);
    });

    test('should handle process errors gracefully', async () => {
      woocommerceWebhookService.findIntegrationByStoreUrl.mockResolvedValue(mockIntegration);
      woocommerceWebhookService.verifySignature.mockReturnValue(true);
      woocommerceWebhookService.processEvent.mockRejectedValue(new Error('WooCommerce failed'));

      const response = await request(app)
        .post('/api/webhooks/woocommerce')
        .set('Content-Type', 'application/json')
        .set('x-wc-webhook-signature', 'valid_signature')
        .set('x-wc-webhook-topic', 'order.completed')
        .set('x-wc-webhook-source', 'https://example-store.com')
        .send(JSON.stringify(validWooOrder));

      expect(response.status).toBe(200);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(logger.error).toHaveBeenCalledWith(
        'Error processing WooCommerce webhook',
        expect.objectContaining({ error: 'WooCommerce failed' })
      );
    });
  });

  // ============================================
  // Inbound Webhook Tests (Zapier/Custom)
  // ============================================
  describe('POST /api/webhooks/inbound/:urlPath', () => {
    const mockIntegration = {
      id: 1,
      userId: 100,
      provider: 'zapier',
      webhookUrl: 'abc123',
      webhookSecret: 'secret_123',
      apiKey: 'api_key_xyz',
      isActive: true,
      testMode: false,
      consentConfirmed: true,
    };

    const validPayload = {
      phone: '+15551234567',
      name: 'Test Customer',
      email: 'test@example.com',
      amount: 99.99,
      orderId: 'order_123',
    };

    test('should return 404 when integration not found', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/webhooks/inbound/nonexistent')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'some_key')
        .send(validPayload);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Integration not found');
    });

    test('should return 401 for invalid API key', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      inboundWebhookService.processWebhook.mockResolvedValue({
        error: true,
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
      });

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'wrong_key')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_API_KEY');
    });

    test('should return 401 for invalid signature', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      inboundWebhookService.processWebhook.mockResolvedValue({
        error: true,
        code: 'INVALID_SIGNATURE',
        message: 'Invalid signature',
      });

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'api_key_xyz')
        .set('x-webhook-signature', 'bad_sig')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_SIGNATURE');
    });

    test('should return 429 for rate limit', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      inboundWebhookService.processWebhook.mockResolvedValue({
        error: true,
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded',
      });

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'api_key_xyz')
        .send(validPayload);

      expect(response.status).toBe(429);
      expect(response.body.code).toBe('RATE_LIMIT');
    });

    test('should return 400 for invalid payload', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      inboundWebhookService.processWebhook.mockResolvedValue({
        error: true,
        code: 'INVALID_PAYLOAD',
        message: 'Missing required field: phone',
      });

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'api_key_xyz')
        .send({ name: 'Test' }); // Missing phone

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_PAYLOAD');
    });

    test('should return 200 for successful webhook', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      inboundWebhookService.processWebhook.mockResolvedValue({
        eventId: 'evt_123',
        queued: true,
        skipped: false,
      });

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'api_key_xyz')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.eventId).toBe('evt_123');
      expect(response.body.queued).toBe(true);

      expect(inboundWebhookService.processWebhook).toHaveBeenCalledWith({
        integration: mockIntegration,
        payload: validPayload,
        rawBody: JSON.stringify(validPayload),
        signature: undefined,
        apiKey: 'api_key_xyz',
      });
    });

    test('should return 200 with skipped reason', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      inboundWebhookService.processWebhook.mockResolvedValue({
        eventId: 'evt_456',
        queued: false,
        skipped: true,
        reason: 'Duplicate transaction',
      });

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'api_key_xyz')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.skipped).toBe(true);
      expect(response.body.reason).toBe('Duplicate transaction');
    });

    test('should handle internal errors gracefully', async () => {
      PosIntegration.findOne.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'api_key_xyz')
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
      expect(logger.error).toHaveBeenCalledWith(
        'Inbound webhook error',
        expect.objectContaining({ error: 'Database connection failed' })
      );
    });

    test('should handle unknown error codes with 400', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      inboundWebhookService.processWebhook.mockResolvedValue({
        error: true,
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
      });

      const response = await request(app)
        .post('/api/webhooks/inbound/abc123')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'api_key_xyz')
        .send(validPayload);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('UNKNOWN_ERROR');
    });
  });

  // ============================================
  // Inbound Webhook Test Endpoint
  // ============================================
  describe('GET /api/webhooks/inbound/:urlPath/test', () => {
    const mockIntegration = {
      id: 1,
      provider: 'zapier',
      isActive: true,
      testMode: false,
      consentConfirmed: true,
    };

    test('should return 404 when integration not found', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/webhooks/inbound/nonexistent/test');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Integration not found');
    });

    test('should return 200 with integration info', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const response = await request(app)
        .get('/api/webhooks/inbound/abc123/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.provider).toBe('zapier');
      expect(response.body.active).toBe(true);
      expect(response.body.testMode).toBe(false);
      expect(response.body.consentConfirmed).toBe(true);
      expect(response.body.message).toBe('Webhook endpoint is ready to receive data');
    });

    test('should handle internal errors gracefully', async () => {
      PosIntegration.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/webhooks/inbound/abc123/test');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
      expect(logger.error).toHaveBeenCalledWith(
        'Webhook test error',
        expect.objectContaining({ error: 'Database error' })
      );
    });
  });

  // ============================================
  // Edge Cases and Error Handling
  // ============================================
  describe('Edge Cases', () => {
    test('Square webhook handles internal error', async () => {
      squareWebhookService.verifySignature.mockImplementation(() => {
        throw new Error('Internal verification error');
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'sig')
        .send(Buffer.from('{}'));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    test('Shopify webhook handles internal error', async () => {
      shopifyWebhookService.verifySignature.mockImplementation(() => {
        throw new Error('Internal verification error');
      });

      const response = await request(app)
        .post('/api/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('x-shopify-hmac-sha256', 'sig')
        .set('x-shopify-topic', 'orders/create')
        .set('x-shopify-shop-domain', 'test.myshopify.com')
        .send(Buffer.from('{}'));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    test('WooCommerce webhook handles internal error', async () => {
      woocommerceWebhookService.findIntegrationByStoreUrl.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .post('/api/webhooks/woocommerce')
        .set('Content-Type', 'application/json')
        .set('x-wc-webhook-signature', 'sig')
        .set('x-wc-webhook-topic', 'order.completed')
        .set('x-wc-webhook-source', 'https://store.com')
        .send(Buffer.from('{}'));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
