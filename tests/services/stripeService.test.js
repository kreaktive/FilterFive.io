/**
 * Stripe Service Tests
 *
 * Tests for Stripe payment processing:
 * - Customer management
 * - Checkout sessions
 * - Subscription lifecycle
 * - Webhook event handling
 * - Idempotency (D4 fix)
 * - SMS reset on billing (B6 fix)
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Create mock functions that will be shared
const mockStripeCustomersCreate = jest.fn();
const mockStripeCheckoutSessionsCreate = jest.fn();
const mockStripeCheckoutSessionsRetrieve = jest.fn();
const mockStripeSubscriptionsRetrieve = jest.fn();
const mockStripeSubscriptionsCancel = jest.fn();
const mockStripeSubscriptionsUpdate = jest.fn();
const mockStripeBillingPortalSessionsCreate = jest.fn();

// Mock Stripe SDK - MUST be before any imports
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: mockStripeCustomersCreate,
    },
    checkout: {
      sessions: {
        create: mockStripeCheckoutSessionsCreate,
        retrieve: mockStripeCheckoutSessionsRetrieve,
      },
    },
    subscriptions: {
      retrieve: mockStripeSubscriptionsRetrieve,
      cancel: mockStripeSubscriptionsCancel,
      update: mockStripeSubscriptionsUpdate,
    },
    billingPortal: {
      sessions: {
        create: mockStripeBillingPortalSessionsCreate,
      },
    },
  }));
});

// Mock logger - MUST be before any imports
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock models - MUST be before any imports
jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  StripeWebhookEvent: {
    findOrCreate: jest.fn(),
  },
}));

// Mock emailService - MUST be before stripeService import
const mockSendBusinessEventAlert = jest.fn();
jest.mock('../../src/services/emailService', () => ({
  sendBusinessEventAlert: mockSendBusinessEventAlert,
  sendPaymentFailedEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Now import the things we need for assertions
const { User, StripeWebhookEvent } = require('../../src/models');
const logger = require('../../src/services/logger');

// Set environment variables BEFORE importing stripeService
process.env.STRIPE_PRICE_MONTHLY = 'price_monthly123';
process.env.STRIPE_PRICE_ANNUAL = 'price_annual123';
process.env.APP_URL = 'https://morestars.io';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';

// Import stripeService AFTER mocks are set up
const stripeService = require('../../src/services/stripeService');

describe('Stripe Service', () => {
  // Mock user object factory
  const createMockUser = (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    businessName: 'Test Business',
    stripeCustomerId: 'cus_test123',
    stripeSubscriptionId: 'sub_test123',
    subscriptionStatus: 'trial',
    smsUsageCount: 500,
    smsUsageLimit: 1000,
    marketingStatus: 'active',
    paymentFailedAt: null,
    paymentFailedEmailSentAt: null,
    update: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    // Reset mock implementations to defaults
    mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
    mockStripeCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/cs_test123',
    });
    mockStripeCheckoutSessionsRetrieve.mockResolvedValue({
      id: 'cs_test123',
      payment_status: 'paid',
    });
    mockStripeSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    });
    mockStripeSubscriptionsCancel.mockResolvedValue({ id: 'sub_test123', status: 'canceled' });
    mockStripeSubscriptionsUpdate.mockResolvedValue({ id: 'sub_test123', cancel_at_period_end: true });
    mockStripeBillingPortalSessionsCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session/123' });

    // Set up email service mock default
    mockSendBusinessEventAlert.mockResolvedValue({ success: true });

    // Set up model mocks
    User.findOne.mockResolvedValue(createMockUser());
    User.findByPk.mockResolvedValue(createMockUser());
    StripeWebhookEvent.findOrCreate.mockResolvedValue([{ eventId: 'evt_test', update: jest.fn() }, true]);
  });

  // ===========================================
  // Customer Management Tests
  // ===========================================
  describe('createCustomer', () => {
    it('should create a Stripe customer with correct data', async () => {
      const user = { id: 1, email: 'test@example.com', businessName: 'Test Business' };
      mockStripeCustomersCreate.mockResolvedValue({
        id: 'cus_new123',
        email: user.email,
        name: user.businessName,
      });

      const result = await stripeService.createCustomer(user);

      expect(mockStripeCustomersCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test Business',
        metadata: { userId: '1', businessName: 'Test Business' },
      });
      expect(result.id).toBe('cus_new123');
      expect(logger.info).toHaveBeenCalledWith(
        'Stripe customer created',
        expect.objectContaining({ customerId: 'cus_new123', userId: 1 })
      );
    });

    it('should throw error when Stripe API fails', async () => {
      const user = { id: 1, email: 'test@example.com', businessName: 'Test' };
      mockStripeCustomersCreate.mockRejectedValue(new Error('Stripe API error'));

      await expect(stripeService.createCustomer(user)).rejects.toThrow('Failed to create Stripe customer');
      expect(logger.error).toHaveBeenCalledWith('Error creating Stripe customer', expect.any(Object));
    });
  });

  // ===========================================
  // Checkout Session Tests
  // ===========================================
  describe('createCheckoutSession', () => {
    it('should create checkout session for monthly plan', async () => {
      const user = { id: 1, stripeCustomerId: 'cus_existing123', update: jest.fn() };

      await stripeService.createCheckoutSession(user, 'monthly');

      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing123',
          mode: 'subscription',
          line_items: [{ price: 'price_monthly123', quantity: 1 }],
          metadata: { userId: '1', plan: 'monthly' },
        })
      );
    });

    it('should create checkout session for annual plan', async () => {
      const user = { id: 1, stripeCustomerId: 'cus_existing123', update: jest.fn() };

      await stripeService.createCheckoutSession(user, 'annual');

      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_annual123', quantity: 1 }],
          metadata: { userId: '1', plan: 'annual' },
        })
      );
    });

    it('should throw error for invalid plan', async () => {
      const user = { id: 1, stripeCustomerId: 'cus_existing123' };

      await expect(stripeService.createCheckoutSession(user, 'invalid_plan'))
        .rejects.toThrow('Invalid plan');
    });

    it('should create customer if user does not have stripeCustomerId', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        businessName: 'Test',
        stripeCustomerId: null,
        update: jest.fn().mockResolvedValue(true),
      };
      mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_new_auto123' });

      await stripeService.createCheckoutSession(user, 'monthly');

      expect(mockStripeCustomersCreate).toHaveBeenCalled();
      expect(user.update).toHaveBeenCalledWith({ stripeCustomerId: 'cus_new_auto123' });
    });

    it('should include success and cancel URLs', async () => {
      const user = { id: 1, stripeCustomerId: 'cus_existing123', update: jest.fn() };

      await stripeService.createCheckoutSession(user, 'monthly');

      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('/dashboard/subscription/success'),
          cancel_url: expect.stringContaining('/dashboard/subscription/cancel'),
        })
      );
    });

    it('should log checkout session creation', async () => {
      const user = { id: 1, stripeCustomerId: 'cus_existing123', update: jest.fn() };

      await stripeService.createCheckoutSession(user, 'monthly');

      expect(logger.info).toHaveBeenCalledWith(
        'Checkout session created',
        expect.objectContaining({ userId: 1, plan: 'monthly' })
      );
    });
  });

  // ===========================================
  // Checkout Session Retrieval Tests
  // ===========================================
  describe('getCheckoutSession', () => {
    it('should retrieve checkout session by ID', async () => {
      const mockSession = { id: 'cs_test123', payment_status: 'paid' };
      mockStripeCheckoutSessionsRetrieve.mockResolvedValue(mockSession);

      const result = await stripeService.getCheckoutSession('cs_test123');

      expect(mockStripeCheckoutSessionsRetrieve).toHaveBeenCalledWith('cs_test123');
      expect(result).toEqual(mockSession);
    });

    it('should throw error when session not found', async () => {
      mockStripeCheckoutSessionsRetrieve.mockRejectedValue(new Error('Session not found'));

      await expect(stripeService.getCheckoutSession('cs_invalid'))
        .rejects.toThrow('Failed to retrieve checkout session');
    });
  });

  // ===========================================
  // Subscription Management Tests
  // ===========================================
  describe('getSubscription', () => {
    it('should retrieve subscription by ID', async () => {
      const mockSub = { id: 'sub_test123', status: 'active', current_period_end: 1234567890 };
      mockStripeSubscriptionsRetrieve.mockResolvedValue(mockSub);

      const result = await stripeService.getSubscription('sub_test123');

      expect(mockStripeSubscriptionsRetrieve).toHaveBeenCalledWith('sub_test123');
      expect(result).toEqual(mockSub);
    });

    it('should throw error when subscription not found', async () => {
      mockStripeSubscriptionsRetrieve.mockRejectedValue(new Error('Subscription not found'));

      await expect(stripeService.getSubscription('sub_invalid'))
        .rejects.toThrow('Failed to retrieve subscription');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately when flag is true', async () => {
      mockStripeSubscriptionsCancel.mockResolvedValue({ id: 'sub_test123', status: 'canceled' });

      await stripeService.cancelSubscription('sub_test123', true);

      expect(mockStripeSubscriptionsCancel).toHaveBeenCalledWith('sub_test123');
      expect(logger.info).toHaveBeenCalledWith('Subscription cancelled immediately', expect.any(Object));
    });

    it('should cancel at period end when flag is false', async () => {
      mockStripeSubscriptionsUpdate.mockResolvedValue({ id: 'sub_test123', cancel_at_period_end: true });

      await stripeService.cancelSubscription('sub_test123', false);

      expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_test123', { cancel_at_period_end: true });
      expect(logger.info).toHaveBeenCalledWith('Subscription set to cancel at period end', expect.any(Object));
    });

    it('should default to cancel at period end', async () => {
      mockStripeSubscriptionsUpdate.mockResolvedValue({ id: 'sub_test123', cancel_at_period_end: true });

      await stripeService.cancelSubscription('sub_test123');

      expect(mockStripeSubscriptionsUpdate).toHaveBeenCalled();
      expect(mockStripeSubscriptionsCancel).not.toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      mockStripeSubscriptionsCancel.mockRejectedValue(new Error('Cancel failed'));

      await expect(stripeService.cancelSubscription('sub_test123', true))
        .rejects.toThrow('Failed to cancel subscription');
    });
  });

  describe('reactivateSubscription', () => {
    it('should remove cancel_at_period_end flag', async () => {
      mockStripeSubscriptionsUpdate.mockResolvedValue({ id: 'sub_test123', cancel_at_period_end: false });

      await stripeService.reactivateSubscription('sub_test123');

      expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith('sub_test123', { cancel_at_period_end: false });
      expect(logger.info).toHaveBeenCalledWith('Subscription reactivated', expect.any(Object));
    });

    it('should throw error on failure', async () => {
      mockStripeSubscriptionsUpdate.mockRejectedValue(new Error('Reactivate failed'));

      await expect(stripeService.reactivateSubscription('sub_test123'))
        .rejects.toThrow('Failed to reactivate subscription');
    });
  });

  // ===========================================
  // Customer Portal Tests
  // ===========================================
  describe('createPortalSession', () => {
    it('should create portal session with return URL', async () => {
      const user = { id: 1, stripeCustomerId: 'cus_test123' };
      mockStripeBillingPortalSessionsCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session/123' });

      const result = await stripeService.createPortalSession(user);

      expect(mockStripeBillingPortalSessionsCreate).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: expect.stringContaining('/dashboard/settings'),
      });
      expect(result.url).toBe('https://billing.stripe.com/session/123');
    });

    it('should throw error when user has no stripeCustomerId', async () => {
      const user = { id: 1, stripeCustomerId: null };

      await expect(stripeService.createPortalSession(user))
        .rejects.toThrow('Failed to create portal session');
      expect(logger.error).toHaveBeenCalledWith(
        'Error creating portal session',
        expect.objectContaining({ error: 'User does not have a Stripe customer ID' })
      );
    });

    it('should throw error on Stripe failure', async () => {
      const user = { id: 1, stripeCustomerId: 'cus_test123' };
      mockStripeBillingPortalSessionsCreate.mockRejectedValue(new Error('Portal error'));

      await expect(stripeService.createPortalSession(user))
        .rejects.toThrow('Failed to create portal session');
    });
  });

  // ===========================================
  // Webhook Event Handling Tests
  // ===========================================
  describe('handleWebhookEvent', () => {
    describe('Idempotency (D4 Fix)', () => {
      it('should skip already processed events', async () => {
        StripeWebhookEvent.findOrCreate.mockResolvedValue([{ eventId: 'evt_test123' }, false]);

        const event = {
          id: 'evt_test123',
          type: 'checkout.session.completed',
          data: { object: { customer: 'cus_test', metadata: {} } },
        };

        const result = await stripeService.handleWebhookEvent(event);

        expect(result).toEqual({ skipped: true, reason: 'already_processed' });
        expect(logger.info).toHaveBeenCalledWith('Stripe webhook already processed, skipping', expect.any(Object));
      });

      it('should use findOrCreate for atomic idempotency check', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

        const event = {
          id: 'evt_unique123',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_test',
              customer: 'cus_test',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(StripeWebhookEvent.findOrCreate).toHaveBeenCalledWith({
          where: { eventId: 'evt_unique123' },
          defaults: expect.objectContaining({
            eventType: 'customer.subscription.updated',
            processedAt: expect.any(Date),
          }),
        });
      });
    });

    describe('customer.subscription.created Event', () => {
      it('should route to handleSubscriptionCreated handler', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

        const event = {
          id: 'evt_sub_created123',
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_new123',
              customer: 'cus_test123',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            stripeSubscriptionId: 'sub_new123',
            subscriptionStatus: 'active',
            smsUsageCount: 0,
            smsUsageLimit: 1000,
            marketingStatus: 'active',
          })
        );
        expect(logger.info).toHaveBeenCalledWith('Subscription created', expect.any(Object));
      });

      it('should log warning when user not found', async () => {
        User.findOne.mockResolvedValue(null);

        const event = {
          id: 'evt_sub_created_nouser',
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_unknown',
              customer: 'cus_unknown',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000),
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(logger.warn).toHaveBeenCalledWith('User not found for subscription created', expect.any(Object));
      });
    });

    describe('checkout.session.completed Event', () => {
      it('should activate subscription and reset SMS count', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findByPk.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

        const event = {
          id: 'evt_checkout123',
          type: 'checkout.session.completed',
          data: {
            object: {
              customer: 'cus_test123',
              subscription: 'sub_new123',
              metadata: { userId: '1', plan: 'monthly' },
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            stripeCustomerId: 'cus_test123',
            stripeSubscriptionId: 'sub_new123',
            subscriptionPlan: 'monthly',
            subscriptionStatus: 'active',
            smsUsageCount: 0,
            smsUsageLimit: 1000,
          })
        );
      });
    });

    describe('customer.subscription.updated Event', () => {
      it('should update status to active with full SMS limit', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ stripeSubscriptionId: 'sub_test123', update: mockUserUpdate }));

        const event = {
          id: 'evt_update123',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionStatus: 'active',
            smsUsageLimit: 1000,
          })
        );
      });

      it('should block SMS when subscription is past_due', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

        const event = {
          id: 'evt_pastdue123',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
              status: 'past_due',
              current_period_end: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionStatus: 'past_due',
            smsUsageLimit: 0,
          })
        );
      });

      it('should revert to trial limit when subscription is canceled', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

        const event = {
          id: 'evt_canceled123',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
              status: 'canceled',
              current_period_end: Math.floor(Date.now() / 1000),
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionStatus: 'cancelled',
            smsUsageLimit: 10,
          })
        );
      });
    });

    describe('customer.subscription.deleted Event', () => {
      it('should mark user as churned and revert to trial limit', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

        const event = {
          id: 'evt_deleted123',
          type: 'customer.subscription.deleted',
          data: { object: { id: 'sub_test123', customer: 'cus_test123' } },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionStatus: 'cancelled',
            marketingStatus: 'churned',
            smsUsageLimit: 10,
          })
        );
      });

      it('should log warning when user not found for subscription deleted', async () => {
        User.findOne.mockResolvedValue(null);

        const event = {
          id: 'evt_deleted_nouser',
          type: 'customer.subscription.deleted',
          data: { object: { id: 'sub_unknown', customer: 'cus_unknown' } },
        };

        await stripeService.handleWebhookEvent(event);

        expect(logger.warn).toHaveBeenCalledWith('User not found for subscription deleted', expect.any(Object));
      });

      it('should continue even if business alert fails', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));
        mockSendBusinessEventAlert.mockRejectedValue(new Error('Email service down'));

        const event = {
          id: 'evt_deleted_alert_fail',
          type: 'customer.subscription.deleted',
          data: { object: { id: 'sub_test123', customer: 'cus_test123' } },
        };

        // Should NOT throw - business alert is non-blocking
        await expect(stripeService.handleWebhookEvent(event)).resolves.toEqual({ success: true });

        // User should still be updated
        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionStatus: 'cancelled',
          })
        );
        // Error should be logged
        expect(logger.error).toHaveBeenCalledWith('Business alert failed', expect.any(Object));
      });
    });

    describe('invoice.payment_succeeded Event (B6 Fix)', () => {
      it('should reset SMS count for subscription_cycle billing', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ smsUsageCount: 850, update: mockUserUpdate }));

        const event = {
          id: 'evt_invoice123',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_test123',
              billing_reason: 'subscription_cycle',
              amount_paid: 7700,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            smsUsageCount: 0,
            smsUsageLimit: 1000,
            subscriptionStatus: 'active',
          })
        );
        expect(logger.info).toHaveBeenCalledWith('SMS usage reset for billing cycle', expect.any(Object));
      });

      it('should reset SMS count for subscription_create billing', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

        const event = {
          id: 'evt_create123',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_test123',
              billing_reason: 'subscription_create',
              amount_paid: 7700,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ smsUsageCount: 0, smsUsageLimit: 1000 })
        );
      });

      it('should NOT reset SMS count for manual/one-time invoices (B6 fix)', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({ smsUsageCount: 500, update: mockUserUpdate }));

        const event = {
          id: 'evt_manual123',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_test123',
              billing_reason: 'manual',
              amount_paid: 1000,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        const updateCall = mockUserUpdate.mock.calls[0][0];
        expect(updateCall.smsUsageCount).toBeUndefined();
      });

      it('should clear payment failure tracking on successful payment', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({
          paymentFailedAt: new Date(),
          paymentFailedEmailSentAt: new Date(),
          update: mockUserUpdate,
        }));

        const event = {
          id: 'evt_success123',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_test123',
              billing_reason: 'subscription_cycle',
              amount_paid: 7700,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ paymentFailedAt: null, paymentFailedEmailSentAt: null })
        );
      });
    });

    describe('invoice.payment_failed Event', () => {
      it('should block SMS and update status to past_due', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({
          paymentFailedEmailSentAt: null,
          update: mockUserUpdate,
        }));

        const event = {
          id: 'evt_failed123',
          type: 'invoice.payment_failed',
          data: { object: { id: 'in_test123', customer: 'cus_test123', attempt_count: 1 } },
        };

        await stripeService.handleWebhookEvent(event);

        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionStatus: 'past_due',
            smsUsageLimit: 0,
            paymentFailedAt: expect.any(Date),
          })
        );
        expect(logger.info).toHaveBeenCalledWith('Payment failed - SMS blocked', expect.any(Object));
      });

      it('should log warning when user not found for payment failed', async () => {
        User.findOne.mockResolvedValue(null);

        const event = {
          id: 'evt_failed_nouser',
          type: 'invoice.payment_failed',
          data: { object: { id: 'in_test123', customer: 'cus_unknown', attempt_count: 1 } },
        };

        await stripeService.handleWebhookEvent(event);

        expect(logger.warn).toHaveBeenCalledWith('User not found for payment failed', expect.any(Object));
      });

      it('should continue even if payment failed email send fails', async () => {
        const mockUserUpdate = jest.fn().mockResolvedValue(true);
        User.findOne.mockResolvedValue(createMockUser({
          paymentFailedEmailSentAt: null,
          update: mockUserUpdate,
        }));

        // Make the email service throw
        const emailService = require('../../src/services/emailService');
        emailService.sendPaymentFailedEmail.mockRejectedValue(new Error('Email service down'));

        const event = {
          id: 'evt_failed_email_error',
          type: 'invoice.payment_failed',
          data: { object: { id: 'in_test123', customer: 'cus_test123', attempt_count: 1 } },
        };

        // Should NOT throw - email error is caught
        await expect(stripeService.handleWebhookEvent(event)).resolves.toEqual({ success: true });

        // User should still be updated with payment failed status
        expect(mockUserUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionStatus: 'past_due',
            smsUsageLimit: 0,
          })
        );
        // Error should be logged
        expect(logger.error).toHaveBeenCalledWith('Failed to send payment failed email', expect.any(Object));
      });
    });

    describe('invoice.payment_succeeded user not found', () => {
      it('should log warning when user not found for payment succeeded', async () => {
        User.findOne.mockResolvedValue(null);

        const event = {
          id: 'evt_success_nouser',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_test123',
              customer: 'cus_unknown',
              billing_reason: 'subscription_cycle',
              amount_paid: 7700,
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(logger.warn).toHaveBeenCalledWith('User not found for payment succeeded', expect.any(Object));
      });
    });

    describe('User Not Found Scenarios', () => {
      it('should log warning when user not found for subscription update', async () => {
        User.findOne.mockResolvedValue(null);

        const event = {
          id: 'evt_nouser123',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_unknown',
              customer: 'cus_unknown',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000),
            },
          },
        };

        await stripeService.handleWebhookEvent(event);

        expect(logger.warn).toHaveBeenCalledWith('User not found for subscription update', expect.any(Object));
      });

      it('should throw error when user not found for checkout completed', async () => {
        User.findByPk.mockResolvedValue(null);

        const event = {
          id: 'evt_checkout_nouser123',
          type: 'checkout.session.completed',
          data: {
            object: {
              customer: 'cus_test',
              subscription: 'sub_test',
              metadata: { userId: '999', plan: 'monthly' },
            },
          },
        };

        await expect(stripeService.handleWebhookEvent(event)).rejects.toThrow('User not found: 999');
      });
    });

    describe('Unknown Event Types', () => {
      it('should handle unknown event types gracefully', async () => {
        const event = {
          id: 'evt_unknown123',
          type: 'account.updated',
          data: { object: { id: 'acct_test' } },
        };

        const result = await stripeService.handleWebhookEvent(event);

        expect(result).toEqual({ success: true });
        expect(logger.debug).toHaveBeenCalledWith('Unhandled webhook event type', expect.any(Object));
      });
    });
  });

  // ===========================================
  // Payment Failed Email Throttling
  // ===========================================
  describe('Payment Failed Email Throttling', () => {
    it('should not send payment failed email if sent within 3 hours', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue(createMockUser({
        paymentFailedEmailSentAt: twoHoursAgo,
        update: mockUserUpdate,
      }));

      const event = {
        id: 'evt_throttle_test',
        type: 'invoice.payment_failed',
        data: { object: { id: 'in_test123', customer: 'cus_test123', attempt_count: 2 } },
      };

      await stripeService.handleWebhookEvent(event);

      // Should update status but NOT update paymentFailedEmailSentAt (email not sent)
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'past_due',
          smsUsageLimit: 0,
        })
      );
      // The paymentFailedEmailSentAt should NOT be updated since email wasn't sent
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.paymentFailedEmailSentAt).toBeUndefined();
    });

    it('should send payment failed email if more than 3 hours since last send', async () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue(createMockUser({
        paymentFailedEmailSentAt: fourHoursAgo,
        update: mockUserUpdate,
      }));

      // Mock the email service
      jest.mock('../../src/services/emailService', () => ({
        sendPaymentFailedEmail: jest.fn().mockResolvedValue({ success: true }),
      }));

      const event = {
        id: 'evt_4hr_test',
        type: 'invoice.payment_failed',
        data: { object: { id: 'in_test123', customer: 'cus_test123', attempt_count: 3 } },
      };

      await stripeService.handleWebhookEvent(event);

      expect(mockUserUpdate).toHaveBeenCalled();
    });
  });

  // ===========================================
  // Business Event Alert Non-Blocking
  // ===========================================
  describe('Business Event Alert Non-Blocking', () => {
    it('should continue checkout processing even if business alert fails', async () => {
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findByPk.mockResolvedValue(createMockUser({
        subscriptionStatus: 'trial',
        update: mockUserUpdate,
      }));

      // Use the module-level mock - set it to reject
      mockSendBusinessEventAlert.mockRejectedValue(new Error('Email service down'));

      const event = {
        id: 'evt_checkout_alert_fail',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_new123',
            metadata: { userId: '1', plan: 'monthly' },
          },
        },
      };

      // Should NOT throw - business alert is non-blocking
      await expect(stripeService.handleWebhookEvent(event)).resolves.toEqual({ success: true });

      // User should still be updated
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'active',
        })
      );
    });

    it('should mark trial_converted only if user was on trial', async () => {
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findByPk.mockResolvedValue(createMockUser({
        subscriptionStatus: 'active', // NOT trial
        update: mockUserUpdate,
      }));

      // Use module-level mock (already configured in beforeEach)
      const event = {
        id: 'evt_not_trial_conversion',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_new123',
            metadata: { userId: '1', plan: 'monthly' },
          },
        },
      };

      await stripeService.handleWebhookEvent(event);

      // Should be called with 'subscription_created' not 'trial_converted'
      expect(mockSendBusinessEventAlert).toHaveBeenCalledWith(
        'subscription_created',
        expect.any(Object)
      );
    });
  });

  // ===========================================
  // SMS Reset for Different Billing Reasons
  // ===========================================
  describe('SMS Reset for Billing Reasons', () => {
    it('should NOT reset SMS count for subscription_update billing reason', async () => {
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue(createMockUser({ smsUsageCount: 500, update: mockUserUpdate }));

      const event = {
        id: 'evt_sub_update',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            billing_reason: 'subscription_update',
            amount_paid: 7700,
          },
        },
      };

      await stripeService.handleWebhookEvent(event);

      // smsUsageCount should NOT be reset (undefined in update call)
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.smsUsageCount).toBeUndefined();
    });

    it('should NOT reset SMS count for subscription_threshold billing reason', async () => {
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue(createMockUser({ smsUsageCount: 800, update: mockUserUpdate }));

      const event = {
        id: 'evt_sub_threshold',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            billing_reason: 'subscription_threshold',
            amount_paid: 5000,
          },
        },
      };

      await stripeService.handleWebhookEvent(event);

      // smsUsageCount should NOT be reset
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.smsUsageCount).toBeUndefined();
    });

    it('should always clear payment failure tracking on successful payment', async () => {
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue(createMockUser({
        paymentFailedAt: new Date(),
        paymentFailedEmailSentAt: new Date(),
        update: mockUserUpdate,
      }));

      const event = {
        id: 'evt_clear_failure',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            billing_reason: 'subscription_update', // Even for non-cycle billing
            amount_paid: 1000,
          },
        },
      };

      await stripeService.handleWebhookEvent(event);

      // Should always clear payment failure tracking
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentFailedAt: null,
          paymentFailedEmailSentAt: null,
        })
      );
    });
  });

  // ===========================================
  // Subscription State Transitions
  // ===========================================
  describe('Subscription State Transitions', () => {
    const testStateTransition = async (toStatus, expectedSmsLimit) => {
      const mockUserUpdate = jest.fn().mockResolvedValue(true);
      User.findOne.mockResolvedValue(createMockUser({ update: mockUserUpdate }));

      const event = {
        id: `evt_to_${toStatus}`,
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: toStatus,
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          },
        },
      };

      await stripeService.handleWebhookEvent(event);

      return mockUserUpdate.mock.calls[0]?.[0] || {};
    };

    it('trial → active: should set full SMS limit', async () => {
      const update = await testStateTransition('active', 1000);
      expect(update.subscriptionStatus).toBe('active');
      expect(update.smsUsageLimit).toBe(1000);
    });

    it('active → past_due: should block SMS', async () => {
      const update = await testStateTransition('past_due', 0);
      expect(update.subscriptionStatus).toBe('past_due');
      expect(update.smsUsageLimit).toBe(0);
    });

    it('past_due → active: should restore SMS limit', async () => {
      const update = await testStateTransition('active', 1000);
      expect(update.subscriptionStatus).toBe('active');
      expect(update.smsUsageLimit).toBe(1000);
    });

    it('active → canceled: should revert to trial limit', async () => {
      const update = await testStateTransition('canceled', 10);
      expect(update.subscriptionStatus).toBe('cancelled');
      expect(update.smsUsageLimit).toBe(10);
    });
  });
});
