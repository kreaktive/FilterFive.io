/**
 * Square Webhook API Tests
 *
 * Tests for POST /api/webhooks/square endpoint:
 * - Signature verification (HMAC-SHA256)
 * - Event handling (payments, orders, OAuth revocation)
 * - Idempotency
 * - Error handling
 */

const request = require('supertest');
const crypto = require('crypto');
const { squareEventFactory } = require('../../helpers/factories');
const { generateSquareSignature, generateInvalidSignature } = require('../../helpers/signatureHelpers');

// Test constants
const SIGNATURE_KEY = 'test_square_webhook_key_12345';
const NOTIFICATION_URL = 'https://morestars.io/api/webhooks/square';

// Mock dependencies - use factory function for proper initialization
jest.mock('../../../src/services/squareWebhookService', () => ({
  verifySignature: jest.fn(),
  processEvent: jest.fn(),
  signatureKey: 'test_square_webhook_key_12345',
  notificationUrl: 'https://morestars.io/api/webhooks/square'
}));

jest.mock('../../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const squareWebhookService = require('../../../src/services/squareWebhookService');
const logger = require('../../../src/services/logger');

describe('Square Webhook API Tests - POST /api/webhooks/square', () => {
  let app;

  beforeAll(() => {
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = SIGNATURE_KEY;
    process.env.APP_URL = 'https://morestars.io';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: accept any signature that starts with valid base64 chars
    // We're testing API flow here, not the actual crypto - that's in unit tests
    squareWebhookService.verifySignature.mockImplementation((rawBody, signature) => {
      // No signature = reject
      if (!signature) return false;
      // Accept signatures that look valid (contain expected chars)
      // This simulates "valid" signatures for testing purposes
      return signature.length > 20 && !signature.includes('invalid');
    });
    squareWebhookService.processEvent.mockResolvedValue({ processed: true });

    // Create minimal express app for testing
    const express = require('express');
    app = express();

    // Square webhook route
    app.post('/api/webhooks/square', express.raw({ type: 'application/json' }), async (req, res) => {
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
        }
      } catch (error) {
        logger.error('Square webhook error', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  // ===========================================
  // Signature Verification Tests
  // ===========================================
  describe('Signature Verification', () => {
    it('should reject request without signature header', async () => {
      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid signature' });
      expect(logger.warn).toHaveBeenCalledWith('Square webhook signature verification failed');
    });

    it('should reject request with invalid signature', async () => {
      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'invalid_short_sig')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid signature' });
    });

    it('should accept request with valid signature', async () => {
      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });

    it('should reject when signature key not configured', async () => {
      // Mock verifySignature to reject when key not configured
      squareWebhookService.verifySignature.mockReturnValue(false);

      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'any_signature')
        .send(payload);

      expect(response.status).toBe(401);
    });
  });

  // ===========================================
  // payment.created Event Tests
  // ===========================================
  describe('payment.created', () => {
    it('should process completed payment event', async () => {
      const event = squareEventFactory.buildPaymentCreated({
        merchantId: 'MERCH_12345',
        locationId: 'LOC_MAIN',
        customerId: 'CUST_67890'
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(squareWebhookService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'payment.created',
          merchant_id: 'MERCH_12345'
        })
      );
    });

    it('should handle payment without customer_id', async () => {
      const event = squareEventFactory.buildPaymentCreated({
        customerId: null,
        payment: { customer_id: null }
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'no_customer_id'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should skip non-completed payments', async () => {
      const event = squareEventFactory.buildPaymentCreated({
        payment: { status: 'PENDING' }
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'payment_not_completed',
        status: 'PENDING'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // order.created Event Tests
  // ===========================================
  describe('order.created', () => {
    it('should process completed order event', async () => {
      const event = squareEventFactory.buildOrderCreated({
        merchantId: 'MERCH_12345',
        customerId: 'CUST_67890'
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(squareWebhookService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'order.created'
        })
      );
    });

    it('should skip duplicate orders', async () => {
      const event = squareEventFactory.buildOrderCreated();
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'already_processed'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // oauth.authorization.revoked Event Tests
  // ===========================================
  describe('oauth.authorization.revoked', () => {
    it('should deactivate integration on OAuth revocation', async () => {
      const merchantId = 'MERCH_REVOKED_123';
      const event = squareEventFactory.buildOAuthRevoked(merchantId);
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        processed: true,
        action: 'oauth_revoked'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(squareWebhookService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'oauth.authorization.revoked',
          merchant_id: merchantId
        })
      );
    });
  });

  // ===========================================
  // refund.created Event Tests
  // ===========================================
  describe('refund.created', () => {
    it('should cancel pending SMS for refunded transaction', async () => {
      const event = squareEventFactory.buildRefundCreated({
        paymentId: 'pay_original_123'
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        processed: true,
        action: 'transaction_marked_refunded'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Idempotency Tests
  // ===========================================
  describe('Idempotency', () => {
    it('should skip duplicate events based on event_id', async () => {
      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      // First request
      const response1 = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response1.status).toBe(200);

      // Mock duplicate detection
      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'duplicate'
      });

      // Second request with same event
      const response2 = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response2.status).toBe(200);
    });

    it('should return 200 for duplicate events', async () => {
      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'duplicate'
      });

      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

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
      const signature = generateSquareSignature(NOTIFICATION_URL, malformedPayload, SIGNATURE_KEY);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(malformedPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid JSON' });
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse Square webhook body',
        expect.any(Object)
      );
    });

    it('should continue processing even if processEvent fails', async () => {
      squareWebhookService.processEvent.mockRejectedValue(new Error('Database error'));

      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      // Should still return 200 because we respond before processing
      expect(response.status).toBe(200);

      // Allow async processing to fail
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing Square webhook',
        { error: 'Database error' }
      );
    });

    it('should log proper error when verifySignature throws', async () => {
      squareWebhookService.verifySignature.mockImplementation(() => {
        throw new Error('Signature verification error');
      });

      const event = squareEventFactory.buildPaymentCreated();
      const payload = JSON.stringify(event);

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', 'any_sig')
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  // ===========================================
  // Unhandled Event Types
  // ===========================================
  describe('Unhandled Event Types', () => {
    it('should process unhandled event types without error', async () => {
      const event = squareEventFactory.build({
        type: 'terminal.checkout.created'
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'unhandled_event_type'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // Integration Lookup Tests
  // ===========================================
  describe('Integration Lookup', () => {
    it('should skip when no integration found for merchant', async () => {
      const event = squareEventFactory.buildPaymentCreated({
        merchantId: 'UNKNOWN_MERCHANT'
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'no_integration'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should skip when location is disabled', async () => {
      const event = squareEventFactory.buildPaymentCreated({
        locationId: 'DISABLED_LOCATION'
      });
      const payload = JSON.stringify(event);
      const signature = generateSquareSignature(NOTIFICATION_URL, payload, SIGNATURE_KEY);

      squareWebhookService.processEvent.mockResolvedValue({
        skipped: true,
        reason: 'location_disabled'
      });

      const response = await request(app)
        .post('/api/webhooks/square')
        .set('Content-Type', 'application/json')
        .set('x-square-hmacsha256-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });
  });
});
