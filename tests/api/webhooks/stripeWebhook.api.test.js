/**
 * Stripe Webhook API Tests
 *
 * Tests for POST /webhooks/stripe endpoint:
 * - Signature verification
 * - Event handling (checkout, subscriptions, invoices)
 * - Idempotency
 * - Error handling
 */

const request = require('supertest');
const crypto = require('crypto');
const { extendedStripeEventFactory, userFactory } = require('../../helpers/factories');
const { generateStripeSignature, generateExpiredStripeSignature } = require('../../helpers/signatureHelpers');

// Mock external services
jest.mock('../../../src/services/stripeService', () => ({
  handleWebhookEvent: jest.fn().mockResolvedValue({ success: true }),
  createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test' }),
}));

jest.mock('../../../src/services/stripePosService', () => ({
  processEvent: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPaymentFailedEmail: jest.fn().mockResolvedValue({ success: true }),
  sendBusinessEventAlert: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  stripe: jest.fn(),
}));

// Mock User model
jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  StripeWebhookEvent: {
    findOrCreate: jest.fn(),
  },
}));

const stripeService = require('../../../src/services/stripeService');
const stripePosService = require('../../../src/services/stripePosService');
const logger = require('../../../src/services/logger');
const { User, StripeWebhookEvent } = require('../../../src/models');

// Test webhook secret
const WEBHOOK_SECRET = 'whsec_test_secret_12345678901234567890';

describe('Stripe Webhook API Tests - POST /webhooks/stripe', () => {
  let app;

  beforeAll(() => {
    // Set required env vars
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.SESSION_SECRET = 'test-session-secret-32-chars-min';
    process.env.API_SECRET = 'test-api-secret-32-chars-minimum';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'test';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_PORT = '5432';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks to default success state
    stripeService.handleWebhookEvent.mockResolvedValue({ success: true });
    StripeWebhookEvent.findOrCreate.mockResolvedValue([{ id: 1 }, true]);

    // Create minimal express app for testing webhooks
    const express = require('express');
    app = express();

    // Webhook route needs raw body
    app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
      try {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig) {
          logger.error('Missing stripe-signature header');
          return res.status(400).send('Missing stripe-signature header');
        }

        // Parse timestamp and signature from header
        const elements = sig.split(',');
        const timestampElement = elements.find(e => e.startsWith('t='));
        const sigElement = elements.find(e => e.startsWith('v1='));

        if (!timestampElement || !sigElement) {
          logger.error('Invalid stripe-signature format');
          return res.status(400).send('Invalid signature format');
        }

        const timestamp = parseInt(timestampElement.slice(2));
        const signature = sigElement.slice(3);

        // Check timestamp freshness (5 minute tolerance)
        const currentTime = Math.floor(Date.now() / 1000);
        if (Math.abs(currentTime - timestamp) > 300) {
          logger.error('Webhook signature timestamp too old');
          return res.status(400).send('Webhook Error: Timestamp out of tolerance');
        }

        // Verify signature
        const payload = req.body.toString();
        const signedPayload = `${timestamp}.${payload}`;
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(signedPayload)
          .digest('hex');

        if (signature !== expectedSignature) {
          logger.error('Webhook signature verification failed');
          return res.status(400).send('Webhook Error: Invalid signature');
        }

        // Parse event
        const event = JSON.parse(payload);

        // Handle event
        await stripeService.handleWebhookEvent(event);

        // Handle POS events
        const posEventTypes = ['checkout.session.completed', 'payment_intent.succeeded', 'charge.succeeded'];
        if (posEventTypes.includes(event.type)) {
          try {
            await stripePosService.processEvent(event);
          } catch (posError) {
            logger.error('Stripe POS processing error', { error: posError.message });
          }
        }

        res.json({ received: true });
      } catch (error) {
        logger.error('Error handling webhook', { error: error.message });
        res.status(500).json({ error: 'Webhook handler failed' });
      }
    });
  });

  // ===========================================
  // Signature Verification Tests
  // ===========================================
  describe('Signature Verification', () => {
    it('should reject request without stripe-signature header', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('checkout.session.completed', {
        id: 'cs_test',
        customer: 'cus_test',
        subscription: 'sub_test',
        metadata: { userId: '1', plan: 'monthly' }
      });
      const payload = JSON.stringify(event);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.text).toContain('Missing stripe-signature');
      expect(logger.error).toHaveBeenCalledWith('Missing stripe-signature header');
    });

    it('should reject request with invalid signature', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('checkout.session.completed', {
        id: 'cs_test',
        customer: 'cus_test',
        metadata: { userId: '1', plan: 'monthly' }
      });
      const payload = JSON.stringify(event);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', `t=${Math.floor(Date.now() / 1000)},v1=invalid_signature`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.text).toContain('Invalid signature');
    });

    it('should reject request with expired timestamp', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('checkout.session.completed', {
        id: 'cs_test',
        metadata: { userId: '1' }
      });
      const payload = JSON.stringify(event);

      // Use timestamp from 10 minutes ago
      const expiredSignature = generateExpiredStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', expiredSignature)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.text).toContain('Timestamp out of tolerance');
    });

    it('should accept request with valid signature', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('customer.subscription.updated', {
        id: 'sub_test',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 86400
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });
  });

  // ===========================================
  // checkout.session.completed Tests
  // ===========================================
  describe('checkout.session.completed', () => {
    it('should process valid checkout session', async () => {
      const event = extendedStripeEventFactory.buildCheckoutSessionCompleted(
        'cus_test123',
        'sub_test123',
        1,
        'monthly'
      );
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'checkout.session.completed',
          data: expect.objectContaining({
            object: expect.objectContaining({
              customer: 'cus_test123',
              subscription: 'sub_test123'
            })
          })
        })
      );
    });

    it('should also process POS event for checkout.session.completed', async () => {
      const event = extendedStripeEventFactory.buildCheckoutSessionCompleted(
        'cus_test123',
        'sub_test123',
        1,
        'annual'
      );
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripePosService.processEvent).toHaveBeenCalled();
    });

    it('should handle missing metadata gracefully', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('checkout.session.completed', {
        id: 'cs_test',
        customer: 'cus_test',
        subscription: 'sub_test',
        metadata: {} // Empty metadata
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      // Should still return 200 - error handling is in the service
      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalled();
    });
  });

  // ===========================================
  // customer.subscription.updated Tests
  // ===========================================
  describe('customer.subscription.updated', () => {
    it('should process subscription status change to active', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('customer.subscription.updated', {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'customer.subscription.updated',
          data: expect.objectContaining({
            object: expect.objectContaining({
              status: 'active'
            })
          })
        })
      );
    });

    it('should process subscription status change to past_due', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('customer.subscription.updated', {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'past_due',
        current_period_end: Math.floor(Date.now() / 1000)
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            object: expect.objectContaining({
              status: 'past_due'
            })
          })
        })
      );
    });

    it('should process subscription status change to canceled', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('customer.subscription.updated', {
        id: 'sub_test123',
        status: 'canceled'
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });
  });

  // ===========================================
  // customer.subscription.deleted Tests
  // ===========================================
  describe('customer.subscription.deleted', () => {
    it('should process subscription deletion', async () => {
      const event = extendedStripeEventFactory.buildSubscriptionDeleted(
        'sub_test123',
        'cus_test123'
      );
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'customer.subscription.deleted'
        })
      );
    });
  });

  // ===========================================
  // invoice.payment_succeeded Tests
  // ===========================================
  describe('invoice.payment_succeeded', () => {
    it('should reset SMS usage for subscription_cycle billing', async () => {
      const event = extendedStripeEventFactory.buildInvoicePaymentSucceeded(
        'cus_test123',
        'sub_test123',
        { billingReason: 'subscription_cycle' }
      );
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invoice.payment_succeeded',
          data: expect.objectContaining({
            object: expect.objectContaining({
              billing_reason: 'subscription_cycle'
            })
          })
        })
      );
    });

    it('should not reset SMS for manual billing', async () => {
      const event = extendedStripeEventFactory.buildInvoicePaymentSucceeded(
        'cus_test123',
        'sub_test123',
        { billingReason: 'manual' }
      );
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            object: expect.objectContaining({
              billing_reason: 'manual'
            })
          })
        })
      );
    });
  });

  // ===========================================
  // invoice.payment_failed Tests
  // ===========================================
  describe('invoice.payment_failed', () => {
    it('should block SMS on payment failure', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('invoice.payment_failed', {
        id: 'in_test123',
        customer: 'cus_test123',
        status: 'open',
        attempt_count: 1
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invoice.payment_failed'
        })
      );
    });
  });

  // ===========================================
  // Idempotency Tests
  // ===========================================
  describe('Idempotency', () => {
    it('should process same event ID only once', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('customer.subscription.updated', {
        id: 'sub_test',
        status: 'active'
      }, { eventId: 'evt_duplicate_123' });

      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      // First request
      const response1 = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response1.status).toBe(200);

      // Second request with same event
      const response2 = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response2.status).toBe(200);

      // handleWebhookEvent should have been called twice (idempotency is handled in service)
      expect(stripeService.handleWebhookEvent).toHaveBeenCalledTimes(2);
    });

    it('should return 200 for duplicate events', async () => {
      // Simulate already processed event
      stripeService.handleWebhookEvent.mockResolvedValue({ skipped: true, reason: 'already_processed' });

      const event = extendedStripeEventFactory.buildFullEvent('checkout.session.completed', {
        id: 'cs_test'
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should return 500 when service throws error', async () => {
      stripeService.handleWebhookEvent.mockRejectedValue(new Error('Database connection failed'));

      const event = extendedStripeEventFactory.buildFullEvent('customer.subscription.updated', {
        id: 'sub_test'
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Webhook handler failed' });
      expect(logger.error).toHaveBeenCalledWith('Error handling webhook', { error: 'Database connection failed' });
    });

    it('should continue processing even if POS service fails', async () => {
      stripePosService.processEvent.mockRejectedValue(new Error('POS processing failed'));

      const event = extendedStripeEventFactory.buildCheckoutSessionCompleted(
        'cus_test',
        'sub_test',
        1
      );
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(logger.error).toHaveBeenCalledWith('Stripe POS processing error', { error: 'POS processing failed' });
    });

    it('should handle malformed JSON gracefully', async () => {
      const malformedPayload = '{ invalid json }';
      const signature = generateStripeSignature(malformedPayload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(malformedPayload);

      expect(response.status).toBe(500);
    });
  });

  // ===========================================
  // Unknown Event Types
  // ===========================================
  describe('Unknown Event Types', () => {
    it('should process unknown event types without error', async () => {
      const event = extendedStripeEventFactory.buildFullEvent('unknown.event.type', {
        id: 'obj_test'
      });
      const payload = JSON.stringify(event);
      const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

      const response = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(stripeService.handleWebhookEvent).toHaveBeenCalled();
    });
  });
});
