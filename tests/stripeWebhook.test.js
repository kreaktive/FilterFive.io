/**
 * Stripe Webhook Handling Tests
 * Tests for subscription lifecycle event processing
 */

describe('Stripe Webhook Handling', () => {
  // Mock user update tracking
  let userUpdates = [];

  // Mock user finder
  const mockFindUser = (finder) => {
    return {
      id: 1,
      email: 'test@example.com',
      businessName: 'Test Business',
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      subscriptionStatus: 'trial',
      smsUsageCount: 5,
      smsUsageLimit: 10,
      marketingStatus: 'trial',
      update: async (data) => {
        userUpdates.push(data);
        Object.assign(mockFindUser(finder), data);
        return mockFindUser(finder);
      }
    };
  };

  beforeEach(() => {
    userUpdates = [];
  });

  describe('checkout.session.completed', () => {
    const handleCheckoutCompleted = async (session, findUserById) => {
      const userId = parseInt(session.metadata.userId);
      const plan = session.metadata.plan;

      const user = await findUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      await user.update({
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        smsUsageCount: 0,
        smsUsageLimit: 1000,
        marketingStatus: 'active'
      });
    };

    test('activates subscription from checkout', async () => {
      const session = {
        customer: 'cus_new123',
        subscription: 'sub_new123',
        metadata: { userId: '1', plan: 'monthly' }
      };

      await handleCheckoutCompleted(session, () => mockFindUser());

      expect(userUpdates[0]).toEqual({
        stripeCustomerId: 'cus_new123',
        stripeSubscriptionId: 'sub_new123',
        subscriptionPlan: 'monthly',
        subscriptionStatus: 'active',
        smsUsageCount: 0,
        smsUsageLimit: 1000,
        marketingStatus: 'active'
      });
    });

    test('handles annual plan', async () => {
      const session = {
        customer: 'cus_new123',
        subscription: 'sub_new123',
        metadata: { userId: '1', plan: 'annual' }
      };

      await handleCheckoutCompleted(session, () => mockFindUser());

      expect(userUpdates[0].subscriptionPlan).toBe('annual');
    });

    test('resets SMS count on subscription', async () => {
      const session = {
        customer: 'cus_new123',
        subscription: 'sub_new123',
        metadata: { userId: '1', plan: 'monthly' }
      };

      await handleCheckoutCompleted(session, () => mockFindUser());

      expect(userUpdates[0].smsUsageCount).toBe(0);
      expect(userUpdates[0].smsUsageLimit).toBe(1000);
    });

    test('throws error for missing user', async () => {
      const session = {
        customer: 'cus_new123',
        subscription: 'sub_new123',
        metadata: { userId: '999', plan: 'monthly' }
      };

      await expect(
        handleCheckoutCompleted(session, () => null)
      ).rejects.toThrow('User not found: 999');
    });
  });

  describe('customer.subscription.updated', () => {
    const handleSubscriptionUpdated = async (subscription, findUserBySubscription) => {
      const user = await findUserBySubscription(subscription.id);
      if (!user) {
        console.warn(`User not found for subscription: ${subscription.id}`);
        return;
      }

      let subscriptionStatus = 'active';
      if (subscription.status === 'past_due') {
        subscriptionStatus = 'past_due';
      } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        subscriptionStatus = 'cancelled';
      }

      await user.update({
        subscriptionStatus: subscriptionStatus,
        subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000)
      });
    };

    test('updates to active status', async () => {
      const subscription = {
        id: 'sub_test123',
        status: 'active',
        current_period_end: 1735689600 // 2025-01-01
      };

      await handleSubscriptionUpdated(subscription, () => mockFindUser());

      expect(userUpdates[0].subscriptionStatus).toBe('active');
    });

    test('updates to past_due status', async () => {
      const subscription = {
        id: 'sub_test123',
        status: 'past_due',
        current_period_end: 1735689600
      };

      await handleSubscriptionUpdated(subscription, () => mockFindUser());

      expect(userUpdates[0].subscriptionStatus).toBe('past_due');
    });

    test('updates to cancelled status for canceled', async () => {
      const subscription = {
        id: 'sub_test123',
        status: 'canceled',
        current_period_end: 1735689600
      };

      await handleSubscriptionUpdated(subscription, () => mockFindUser());

      expect(userUpdates[0].subscriptionStatus).toBe('cancelled');
    });

    test('updates to cancelled status for unpaid', async () => {
      const subscription = {
        id: 'sub_test123',
        status: 'unpaid',
        current_period_end: 1735689600
      };

      await handleSubscriptionUpdated(subscription, () => mockFindUser());

      expect(userUpdates[0].subscriptionStatus).toBe('cancelled');
    });

    test('updates period end date', async () => {
      const subscription = {
        id: 'sub_test123',
        status: 'active',
        current_period_end: 1735689600
      };

      await handleSubscriptionUpdated(subscription, () => mockFindUser());

      expect(userUpdates[0].subscriptionPeriodEnd).toEqual(new Date(1735689600 * 1000));
    });

    test('handles missing user gracefully', async () => {
      const subscription = { id: 'sub_unknown', status: 'active', current_period_end: 1735689600 };

      // Should not throw
      await handleSubscriptionUpdated(subscription, () => null);

      expect(userUpdates).toHaveLength(0);
    });
  });

  describe('customer.subscription.deleted', () => {
    const handleSubscriptionDeleted = async (subscription, findUserBySubscription) => {
      const user = await findUserBySubscription(subscription.id);
      if (!user) {
        console.warn(`User not found for subscription: ${subscription.id}`);
        return;
      }

      await user.update({
        subscriptionStatus: 'cancelled',
        marketingStatus: 'churned',
        smsUsageLimit: 10
      });
    };

    test('cancels subscription and reverts limits', async () => {
      const subscription = { id: 'sub_test123' };

      await handleSubscriptionDeleted(subscription, () => mockFindUser());

      expect(userUpdates[0]).toEqual({
        subscriptionStatus: 'cancelled',
        marketingStatus: 'churned',
        smsUsageLimit: 10
      });
    });

    test('marks user as churned', async () => {
      const subscription = { id: 'sub_test123' };

      await handleSubscriptionDeleted(subscription, () => mockFindUser());

      expect(userUpdates[0].marketingStatus).toBe('churned');
    });

    test('reverts SMS limit to trial level', async () => {
      const subscription = { id: 'sub_test123' };

      await handleSubscriptionDeleted(subscription, () => mockFindUser());

      expect(userUpdates[0].smsUsageLimit).toBe(10);
    });
  });

  describe('invoice.payment_succeeded', () => {
    const handlePaymentSucceeded = async (invoice, findUserByCustomer) => {
      const user = await findUserByCustomer(invoice.customer);
      if (!user) {
        console.warn(`User not found for Stripe customer: ${invoice.customer}`);
        return;
      }

      await user.update({
        smsUsageCount: 0,
        subscriptionStatus: 'active',
        marketingStatus: 'active'
      });
    };

    test('resets SMS usage on successful payment', async () => {
      const invoice = { customer: 'cus_test123' };

      await handlePaymentSucceeded(invoice, () => mockFindUser());

      expect(userUpdates[0].smsUsageCount).toBe(0);
    });

    test('ensures subscription is active', async () => {
      const invoice = { customer: 'cus_test123' };

      await handlePaymentSucceeded(invoice, () => mockFindUser());

      expect(userUpdates[0].subscriptionStatus).toBe('active');
      expect(userUpdates[0].marketingStatus).toBe('active');
    });
  });

  describe('invoice.payment_failed', () => {
    const handlePaymentFailed = async (invoice, findUserByCustomer) => {
      const user = await findUserByCustomer(invoice.customer);
      if (!user) {
        console.warn(`User not found for Stripe customer: ${invoice.customer}`);
        return;
      }

      await user.update({
        subscriptionStatus: 'past_due',
        marketingStatus: 'trial_expired'
      });
    };

    test('marks subscription as past_due', async () => {
      const invoice = { customer: 'cus_test123' };

      await handlePaymentFailed(invoice, () => mockFindUser());

      expect(userUpdates[0].subscriptionStatus).toBe('past_due');
    });

    test('updates marketing status', async () => {
      const invoice = { customer: 'cus_test123' };

      await handlePaymentFailed(invoice, () => mockFindUser());

      expect(userUpdates[0].marketingStatus).toBe('trial_expired');
    });
  });

  describe('Event routing', () => {
    const handleWebhookEvent = async (event, handlers) => {
      switch (event.type) {
        case 'checkout.session.completed':
          return handlers.checkoutCompleted(event.data.object);
        case 'customer.subscription.created':
          return handlers.subscriptionCreated(event.data.object);
        case 'customer.subscription.updated':
          return handlers.subscriptionUpdated(event.data.object);
        case 'customer.subscription.deleted':
          return handlers.subscriptionDeleted(event.data.object);
        case 'invoice.payment_succeeded':
          return handlers.paymentSucceeded(event.data.object);
        case 'invoice.payment_failed':
          return handlers.paymentFailed(event.data.object);
        default:
          return { handled: false, type: event.type };
      }
    };

    test('routes checkout.session.completed', async () => {
      let called = false;
      const handlers = {
        checkoutCompleted: () => { called = true; }
      };

      await handleWebhookEvent(
        { type: 'checkout.session.completed', data: { object: {} } },
        handlers
      );

      expect(called).toBe(true);
    });

    test('routes customer.subscription.updated', async () => {
      let called = false;
      const handlers = {
        subscriptionUpdated: () => { called = true; }
      };

      await handleWebhookEvent(
        { type: 'customer.subscription.updated', data: { object: {} } },
        handlers
      );

      expect(called).toBe(true);
    });

    test('routes invoice.payment_failed', async () => {
      let called = false;
      const handlers = {
        paymentFailed: () => { called = true; }
      };

      await handleWebhookEvent(
        { type: 'invoice.payment_failed', data: { object: {} } },
        handlers
      );

      expect(called).toBe(true);
    });

    test('returns unhandled for unknown events', async () => {
      const result = await handleWebhookEvent(
        { type: 'unknown.event.type', data: { object: {} } },
        {}
      );

      expect(result.handled).toBe(false);
      expect(result.type).toBe('unknown.event.type');
    });
  });
});
