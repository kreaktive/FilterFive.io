/**
 * @file stripePosService.test.js
 * @description Tests for Stripe POS service - checkout and terminal payment handling
 */

// Mock dependencies before requiring the service
jest.mock('stripe', () => {
  const mockStripe = {
    customers: {
      retrieve: jest.fn(),
    },
  };
  return jest.fn(() => mockStripe);
});

jest.mock('../../src/models/PosIntegration');
jest.mock('../../src/models/PosWebhookEvent');
jest.mock('../../src/models/User');
jest.mock('../../src/services/posSmsService');
jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const stripe = require('stripe')();
const PosIntegration = require('../../src/models/PosIntegration');
const PosWebhookEvent = require('../../src/models/PosWebhookEvent');
const User = require('../../src/models/User');
const posSmsService = require('../../src/services/posSmsService');
const logger = require('../../src/services/logger');
const stripePosService = require('../../src/services/stripePosService');

describe('StripePosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    PosWebhookEvent.isProcessed.mockResolvedValue(false);
    PosWebhookEvent.markProcessed.mockResolvedValue(true);
    posSmsService.processTransaction.mockResolvedValue({ smsQueued: true });
    posSmsService.logTransaction.mockResolvedValue({});
    // Default findAll returns empty array (no single integration fallback)
    PosIntegration.findAll.mockResolvedValue([]);
    PosIntegration.findOne.mockResolvedValue(null);
    User.findOne.mockResolvedValue(null);
  });

  // Helper to create mock integration
  const createMockIntegration = (overrides = {}) => ({
    id: 1,
    userId: 1,
    provider: 'stripe_pos',
    isActive: true,
    triggerOnCheckout: true,
    triggerOnTerminal: true,
    ...overrides,
  });

  // Helper to create mock checkout session event
  const createCheckoutEvent = (sessionOverrides = {}) => ({
    id: 'evt_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_123',
        mode: 'payment',
        customer: 'cus_123',
        customer_details: {
          email: 'john@example.com',
          phone: '+15551234567',
          name: 'John Doe',
        },
        amount_total: 4999,
        metadata: {},
        ...sessionOverrides,
      },
    },
  });

  // Helper to create mock payment intent event
  const createPaymentIntentEvent = (piOverrides = {}) => ({
    id: 'evt_456',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_123',
        customer: 'cus_123',
        amount: 4999,
        payment_method_types: ['card'],
        metadata: {},
        charges: { data: [] },
        ...piOverrides,
      },
    },
  });

  // Helper to create mock charge event
  const createChargeEvent = (chargeOverrides = {}) => ({
    id: 'evt_789',
    type: 'charge.succeeded',
    data: {
      object: {
        id: 'ch_123',
        customer: 'cus_123',
        amount: 4999,
        payment_intent: null,
        payment_method_details: { type: 'card' },
        billing_details: { phone: null, name: null },
        metadata: {},
        ...chargeOverrides,
      },
    },
  });

  // ============================================
  // processEvent Tests
  // ============================================
  describe('processEvent', () => {
    it('should route checkout.session.completed to handleCheckoutCompleted', async () => {
      const event = createCheckoutEvent();
      const mockIntegration = createMockIntegration();
      // Mock the fallback lookup to return single integration
      PosIntegration.findAll.mockResolvedValue([mockIntegration]);

      const result = await stripePosService.processEvent(event);

      expect(PosWebhookEvent.markProcessed).toHaveBeenCalledWith('stripe_pos', 'evt_123', 'checkout.session.completed');
      expect(result.smsQueued).toBeDefined();
    });

    it('should route payment_intent.succeeded to handlePaymentIntentSucceeded', async () => {
      const event = createPaymentIntentEvent({
        metadata: { customer_phone: '+15551234567' },
      });
      const mockIntegration = createMockIntegration();
      PosIntegration.findAll.mockResolvedValue([mockIntegration]);

      await stripePosService.processEvent(event);

      expect(PosWebhookEvent.markProcessed).toHaveBeenCalledWith('stripe_pos', 'evt_456', 'payment_intent.succeeded');
    });

    it('should route charge.succeeded to handleChargeSucceeded', async () => {
      const event = createChargeEvent({
        metadata: { customer_phone: '+15551234567' },
      });
      const mockIntegration = createMockIntegration();
      PosIntegration.findAll.mockResolvedValue([mockIntegration]);

      await stripePosService.processEvent(event);

      expect(PosWebhookEvent.markProcessed).toHaveBeenCalledWith('stripe_pos', 'evt_789', 'charge.succeeded');
    });

    it('should skip duplicate events', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(true);
      const event = createCheckoutEvent();

      const result = await stripePosService.processEvent(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('duplicate');
      expect(logger.info).toHaveBeenCalledWith('Skipping duplicate Stripe POS event', { eventId: 'evt_123' });
    });

    it('should skip unhandled event types', async () => {
      const event = {
        id: 'evt_999',
        type: 'customer.created',
        data: { object: {} },
      };

      const result = await stripePosService.processEvent(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('unhandled_event_type');
    });
  });

  // ============================================
  // handleCheckoutCompleted Tests
  // ============================================
  describe('handleCheckoutCompleted', () => {
    it('should skip subscription checkouts', async () => {
      const event = createCheckoutEvent({ mode: 'subscription' });

      const result = await stripePosService.handleCheckoutCompleted(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('subscription_checkout');
    });

    it('should skip non-payment mode checkouts', async () => {
      const event = createCheckoutEvent({ mode: 'setup' });

      const result = await stripePosService.handleCheckoutCompleted(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('not_payment_mode');
    });

    it('should skip when no integration found', async () => {
      const event = createCheckoutEvent();
      PosIntegration.findOne.mockResolvedValue(null);
      PosIntegration.findAll.mockResolvedValue([]);

      const result = await stripePosService.handleCheckoutCompleted(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_integration');
    });

    it('should skip when checkout trigger is disabled', async () => {
      const event = createCheckoutEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration({ triggerOnCheckout: false })]);

      const result = await stripePosService.handleCheckoutCompleted(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('checkout_trigger_disabled');
    });

    it('should fetch phone from Stripe customer if not in session', async () => {
      const event = createCheckoutEvent({
        customer_details: { email: 'john@example.com', name: 'John', phone: null },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockResolvedValue({ phone: '+15559876543', name: 'John Doe' });

      await stripePosService.handleCheckoutCompleted(event);

      expect(stripe.customers.retrieve).toHaveBeenCalledWith('cus_123');
      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15559876543',
        })
      );
    });

    it('should skip and log when no phone number available', async () => {
      const event = createCheckoutEvent({
        customer_details: { email: 'john@example.com', phone: null },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockResolvedValue({ phone: null });

      const result = await stripePosService.handleCheckoutCompleted(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
      expect(posSmsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_no_phone',
        })
      );
    });

    it('should process transaction with valid phone', async () => {
      const event = createCheckoutEvent();
      const integration = createMockIntegration();
      PosIntegration.findAll.mockResolvedValue([integration]);

      await stripePosService.handleCheckoutCompleted(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith({
        integration,
        externalTransactionId: 'cs_123',
        customerName: 'John Doe',
        customerPhone: '+15551234567',
        purchaseAmount: 49.99,
        locationName: 'Stripe Checkout',
      });
    });

    it('should handle Stripe customer retrieval error gracefully', async () => {
      const event = createCheckoutEvent({
        customer_details: { email: 'john@example.com', phone: null },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockRejectedValue(new Error('API error'));

      const result = await stripePosService.handleCheckoutCompleted(event);

      expect(logger.warn).toHaveBeenCalledWith('Could not fetch Stripe customer phone', expect.any(Object));
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
    });
  });

  // ============================================
  // handlePaymentIntentSucceeded Tests
  // ============================================
  describe('handlePaymentIntentSucceeded', () => {
    it('should detect terminal payment from payment_method_types', async () => {
      const event = createPaymentIntentEvent({
        payment_method_types: ['card_present'],
        metadata: { customer_phone: '+15551234567' },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);

      await stripePosService.handlePaymentIntentSucceeded(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          locationName: 'Stripe Terminal',
        })
      );
    });

    it('should detect terminal payment from charge payment_method_details', async () => {
      const event = createPaymentIntentEvent({
        charges: { data: [{ payment_method_details: { type: 'card_present' } }] },
        metadata: { customer_phone: '+15551234567' },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);

      await stripePosService.handlePaymentIntentSucceeded(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          locationName: 'Stripe Terminal',
        })
      );
    });

    it('should skip when no integration found', async () => {
      const event = createPaymentIntentEvent();
      PosIntegration.findOne.mockResolvedValue(null);
      PosIntegration.findAll.mockResolvedValue([]);

      const result = await stripePosService.handlePaymentIntentSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_integration');
    });

    it('should skip when terminal trigger is disabled for terminal payment', async () => {
      const event = createPaymentIntentEvent({
        payment_method_types: ['card_present'],
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration({ triggerOnTerminal: false })]);

      const result = await stripePosService.handlePaymentIntentSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('terminal_trigger_disabled');
    });

    it('should skip when checkout trigger is disabled for non-terminal payment', async () => {
      const event = createPaymentIntentEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration({ triggerOnCheckout: false })]);

      const result = await stripePosService.handlePaymentIntentSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('checkout_trigger_disabled');
    });

    it('should get phone from metadata', async () => {
      const event = createPaymentIntentEvent({
        metadata: { customer_phone: '+15551112222', customer_name: 'Jane Smith' },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);

      await stripePosService.handlePaymentIntentSucceeded(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15551112222',
          customerName: 'Jane Smith',
        })
      );
    });

    it('should get phone from Stripe customer when not in metadata', async () => {
      const event = createPaymentIntentEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockResolvedValue({
        phone: '+15553334444',
        name: 'Bob Wilson',
      });

      await stripePosService.handlePaymentIntentSucceeded(event);

      expect(stripe.customers.retrieve).toHaveBeenCalledWith('cus_123');
      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15553334444',
          customerName: 'Bob Wilson',
        })
      );
    });

    it('should skip and log when no phone available', async () => {
      const event = createPaymentIntentEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockResolvedValue({ phone: null });

      const result = await stripePosService.handlePaymentIntentSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
      expect(posSmsService.logTransaction).toHaveBeenCalled();
    });

    it('should handle Stripe customer retrieval error gracefully', async () => {
      const event = createPaymentIntentEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockRejectedValue(new Error('Customer not found'));

      const result = await stripePosService.handlePaymentIntentSucceeded(event);

      expect(logger.warn).toHaveBeenCalledWith('Could not fetch Stripe customer', { error: 'Customer not found' });
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
    });
  });

  // ============================================
  // handleChargeSucceeded Tests
  // ============================================
  describe('handleChargeSucceeded', () => {
    it('should skip if already processed via payment_intent', async () => {
      const event = createChargeEvent({ payment_intent: 'pi_123' });
      PosWebhookEvent.isProcessed.mockImplementation((provider, eventId) => {
        return Promise.resolve(eventId === 'pi_123');
      });

      const result = await stripePosService.handleChargeSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('already_processed_via_pi');
    });

    it('should detect terminal charge', async () => {
      const event = createChargeEvent({
        payment_method_details: { type: 'card_present' },
        metadata: { customer_phone: '+15551234567' },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);

      await stripePosService.handleChargeSucceeded(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          locationName: 'Stripe Terminal',
        })
      );
    });

    it('should skip when no integration found', async () => {
      const event = createChargeEvent();
      PosIntegration.findOne.mockResolvedValue(null);
      PosIntegration.findAll.mockResolvedValue([]);

      const result = await stripePosService.handleChargeSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_integration');
    });

    it('should skip when terminal trigger disabled for terminal charge', async () => {
      const event = createChargeEvent({
        payment_method_details: { type: 'card_present' },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration({ triggerOnTerminal: false })]);

      const result = await stripePosService.handleChargeSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('terminal_trigger_disabled');
    });

    it('should get phone from billing_details', async () => {
      const event = createChargeEvent({
        billing_details: { phone: '+15556667777', name: 'Alice Brown' },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);

      await stripePosService.handleChargeSucceeded(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15556667777',
        })
      );
    });

    it('should prefer metadata phone over billing_details', async () => {
      const event = createChargeEvent({
        metadata: { customer_phone: '+15551111111' },
        billing_details: { phone: '+15552222222' },
      });
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);

      await stripePosService.handleChargeSucceeded(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15551111111',
        })
      );
    });

    it('should get phone from Stripe customer as fallback', async () => {
      const event = createChargeEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockResolvedValue({
        phone: '+15558889999',
        name: 'Customer Name',
      });

      await stripePosService.handleChargeSucceeded(event);

      expect(stripe.customers.retrieve).toHaveBeenCalledWith('cus_123');
      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15558889999',
        })
      );
    });

    it('should skip and log when no phone available', async () => {
      const event = createChargeEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockResolvedValue({ phone: null });

      const result = await stripePosService.handleChargeSucceeded(event);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
      expect(posSmsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_no_phone',
          locationName: 'Stripe Charge',
        })
      );
    });

    it('should handle Stripe customer retrieval error gracefully', async () => {
      const event = createChargeEvent();
      PosIntegration.findAll.mockResolvedValue([createMockIntegration()]);
      stripe.customers.retrieve.mockRejectedValue(new Error('Customer not found'));

      const result = await stripePosService.handleChargeSucceeded(event);

      expect(logger.warn).toHaveBeenCalledWith('Could not fetch Stripe customer', { error: 'Customer not found' });
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
    });
  });

  // ============================================
  // findIntegrationForCheckout Tests
  // ============================================
  describe('findIntegrationForCheckout', () => {
    it('should find integration by metadata user_id', async () => {
      const session = {
        metadata: { morestars_user_id: '5' },
        customer: 'cus_123',
      };
      const mockIntegration = createMockIntegration();
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const result = await stripePosService.findIntegrationForCheckout(session);

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: { userId: 5, provider: 'stripe_pos', isActive: true },
      });
      expect(result).toBe(mockIntegration);
    });

    it('should find integration by Stripe customer ID', async () => {
      const session = {
        metadata: {},
        customer: 'cus_456',
      };
      const mockUser = { id: 10 };
      const mockIntegration = createMockIntegration();

      User.findOne.mockResolvedValue(mockUser);
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const result = await stripePosService.findIntegrationForCheckout(session);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_456' },
      });
      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: { userId: 10, provider: 'stripe_pos', isActive: true },
      });
      expect(result).toBe(mockIntegration);
    });

    it('should fallback to single integration lookup', async () => {
      const session = { metadata: {}, customer: null };
      const mockIntegration = createMockIntegration();

      PosIntegration.findOne.mockResolvedValue(null);
      PosIntegration.findAll.mockResolvedValue([mockIntegration]);

      const result = await stripePosService.findIntegrationForCheckout(session);

      expect(PosIntegration.findAll).toHaveBeenCalledWith({
        where: { provider: 'stripe_pos', isActive: true },
        limit: 2,
      });
      expect(result).toBe(mockIntegration);
    });
  });

  // ============================================
  // findIntegrationForPayment Tests
  // ============================================
  describe('findIntegrationForPayment', () => {
    it('should find integration by metadata user_id', async () => {
      const paymentIntent = {
        metadata: { morestars_user_id: '7' },
        customer: 'cus_123',
      };
      const mockIntegration = createMockIntegration();
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const result = await stripePosService.findIntegrationForPayment(paymentIntent);

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: { userId: 7, provider: 'stripe_pos', isActive: true },
      });
      expect(result).toBe(mockIntegration);
    });

    it('should find integration by customer when no metadata', async () => {
      const paymentIntent = { metadata: {}, customer: 'cus_789' };
      const mockUser = { id: 15 };
      const mockIntegration = createMockIntegration();

      User.findOne.mockResolvedValue(mockUser);
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await stripePosService.findIntegrationForPayment(paymentIntent);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_789' },
      });
    });
  });

  // ============================================
  // findIntegrationForCharge Tests
  // ============================================
  describe('findIntegrationForCharge', () => {
    it('should find integration by metadata user_id', async () => {
      const charge = {
        metadata: { morestars_user_id: '9' },
        customer: 'cus_123',
      };
      const mockIntegration = createMockIntegration();
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const result = await stripePosService.findIntegrationForCharge(charge);

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: { userId: 9, provider: 'stripe_pos', isActive: true },
      });
      expect(result).toBe(mockIntegration);
    });

    it('should find integration by customer when no metadata', async () => {
      const charge = { metadata: {}, customer: 'cus_999' };
      const mockUser = { id: 20 };
      const mockIntegration = createMockIntegration();

      User.findOne.mockResolvedValue(mockUser);
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await stripePosService.findIntegrationForCharge(charge);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_999' },
      });
    });
  });

  // ============================================
  // findSingleStripeIntegration Tests
  // ============================================
  describe('findSingleStripeIntegration', () => {
    it('should return integration when exactly one exists', async () => {
      const mockIntegration = createMockIntegration();
      PosIntegration.findAll.mockResolvedValue([mockIntegration]);

      const result = await stripePosService.findSingleStripeIntegration();

      expect(result).toBe(mockIntegration);
    });

    it('should return null when no integrations exist', async () => {
      PosIntegration.findAll.mockResolvedValue([]);

      const result = await stripePosService.findSingleStripeIntegration();

      expect(result).toBeNull();
    });

    it('should return null when multiple integrations exist', async () => {
      PosIntegration.findAll.mockResolvedValue([
        createMockIntegration({ id: 1 }),
        createMockIntegration({ id: 2 }),
      ]);

      const result = await stripePosService.findSingleStripeIntegration();

      expect(result).toBeNull();
    });

    it('should query with correct parameters', async () => {
      PosIntegration.findAll.mockResolvedValue([]);

      await stripePosService.findSingleStripeIntegration();

      expect(PosIntegration.findAll).toHaveBeenCalledWith({
        where: { provider: 'stripe_pos', isActive: true },
        limit: 2,
      });
    });
  });
});
