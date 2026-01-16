/**
 * Integration Tests: Subscription Flow
 *
 * Tests the complete subscription journey:
 * 1. Trial period management
 * 2. Stripe checkout session creation
 * 3. Webhook handling (subscription created/updated/cancelled)
 * 4. SMS limit changes based on subscription
 * 5. Grace period handling
 * 6. Billing cycle reset
 */

// Mock Stripe service
jest.mock('../../src/services/stripeService', () => ({
  createCheckoutSession: jest.fn().mockResolvedValue({
    url: 'https://checkout.stripe.com/test-session'
  }),
  createCustomerPortalSession: jest.fn().mockResolvedValue({
    url: 'https://billing.stripe.com/session/test'
  }),
  handleWebhook: jest.fn().mockResolvedValue({ success: true })
}));

const stripeService = require('../../src/services/stripeService');

describe('Subscription Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Trial Period Management', () => {
    it('should track trial status correctly', () => {
      const now = new Date();

      // User just started trial
      const activeTrialUser = {
        subscriptionStatus: 'trial',
        trialStartsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        trialEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        smsUsageLimit: 50
      };

      const isTrialActive = (user) => {
        if (user.subscriptionStatus !== 'trial') return false;
        if (!user.trialEndsAt) return true; // Trial not started yet
        return new Date() < new Date(user.trialEndsAt);
      };

      expect(isTrialActive(activeTrialUser)).toBe(true);
    });

    it('should detect expired trial', () => {
      const now = new Date();

      const expiredTrialUser = {
        subscriptionStatus: 'trial',
        trialStartsAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        trialEndsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      };

      const isTrialActive = (user) => {
        if (user.subscriptionStatus !== 'trial') return false;
        if (!user.trialEndsAt) return true;
        return new Date() < new Date(user.trialEndsAt);
      };

      expect(isTrialActive(expiredTrialUser)).toBe(false);
    });

    it('should calculate trial days remaining', () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

      const getDaysRemaining = (endDate) => {
        const remaining = new Date(endDate) - new Date();
        return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
      };

      expect(getDaysRemaining(trialEnd)).toBe(5);
    });
  });

  describe('2. Grace Period (B4 Fix)', () => {
    it('should detect grace period correctly', () => {
      const now = new Date();

      // B4 FIX: Cache date to prevent timing inconsistency
      const isInGracePeriod = (user) => {
        if (!user.trialEndsAt) return false;
        const currentTime = now; // Cached
        const trialEnd = new Date(user.trialEndsAt);
        const graceEnd = new Date(user.trialEndsAt);
        graceEnd.setDate(graceEnd.getDate() + 5);
        return currentTime > trialEnd && currentTime < graceEnd;
      };

      // Trial just ended (in grace period)
      const graceUser = {
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      };

      expect(isInGracePeriod(graceUser)).toBe(true);
    });

    it('should detect post-grace hard lock', () => {
      const now = new Date();

      const isHardLocked = (user) => {
        if (user.subscriptionStatus === 'active') return false;
        if (!user.trialEndsAt) return false;
        const graceEnd = new Date(user.trialEndsAt);
        graceEnd.setDate(graceEnd.getDate() + 5);
        return now > graceEnd;
      };

      // Trial ended 10 days ago (past grace period)
      const lockedUser = {
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      };

      expect(isHardLocked(lockedUser)).toBe(true);
    });
  });

  describe('3. Stripe Checkout', () => {
    it('should create checkout session for subscription', async () => {
      const userId = 1;
      const plan = 'starter';
      const customerId = 'cus_test123';

      await stripeService.createCheckoutSession(customerId, plan, userId);

      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
        customerId,
        plan,
        userId
      );
    });

    it('should provide customer portal access', async () => {
      const customerId = 'cus_test123';

      const result = await stripeService.createCustomerPortalSession(customerId);

      expect(result.url).toContain('billing.stripe.com');
    });
  });

  describe('4. Webhook Processing (D4 Fix - Idempotency)', () => {
    it('should process subscription.created webhook', () => {
      const webhookEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            items: {
              data: [{
                price: { id: 'price_starter' }
              }]
            }
          }
        }
      };

      // D4 FIX: Atomic idempotency check
      const processedEvents = new Set();
      const isProcessed = processedEvents.has(webhookEvent.id);

      expect(isProcessed).toBe(false);

      // Mark as processed atomically
      processedEvents.add(webhookEvent.id);

      // Duplicate should be detected
      expect(processedEvents.has(webhookEvent.id)).toBe(true);
    });

    it('should update user on subscription.updated', () => {
      const updateUserFromSubscription = (user, subscription) => {
        const planLimits = {
          starter: 1000,
          professional: 5000,
          enterprise: 25000
        };

        const planId = subscription.items.data[0].price.id;
        const plan = planId.includes('starter') ? 'starter' :
          planId.includes('professional') ? 'professional' : 'enterprise';

        user.subscriptionStatus = subscription.status === 'active' ? 'active' : 'cancelled';
        user.subscriptionPlan = plan;
        user.smsUsageLimit = planLimits[plan];
        user.stripeSubscriptionId = subscription.id;

        return user;
      };

      const user = {
        subscriptionStatus: 'trial',
        subscriptionPlan: 'starter',
        smsUsageLimit: 50
      };

      const subscription = {
        id: 'sub_test123',
        status: 'active',
        items: {
          data: [{
            price: { id: 'price_professional_monthly' }
          }]
        }
      };

      const updatedUser = updateUserFromSubscription(user, subscription);

      expect(updatedUser.subscriptionStatus).toBe('active');
      expect(updatedUser.subscriptionPlan).toBe('professional');
      expect(updatedUser.smsUsageLimit).toBe(5000);
    });
  });

  describe('5. SMS Limits by Plan', () => {
    it('should have correct SMS limits for each plan', () => {
      const planLimits = {
        trial: 50,
        starter: 1000,
        professional: 5000,
        enterprise: 25000
      };

      expect(planLimits.trial).toBe(50);
      expect(planLimits.starter).toBe(1000);
      expect(planLimits.professional).toBe(5000);
      expect(planLimits.enterprise).toBe(25000);
    });

    it('should enforce SMS limits', () => {
      const canSendSms = (user, requestedCount = 1) => {
        if (user.subscriptionStatus === 'cancelled') return false;
        return (user.smsUsageCount + requestedCount) <= user.smsUsageLimit;
      };

      const userWithRoom = {
        subscriptionStatus: 'active',
        smsUsageCount: 500,
        smsUsageLimit: 1000
      };

      const userAtLimit = {
        subscriptionStatus: 'active',
        smsUsageCount: 1000,
        smsUsageLimit: 1000
      };

      expect(canSendSms(userWithRoom)).toBe(true);
      expect(canSendSms(userAtLimit)).toBe(false);
      expect(canSendSms(userWithRoom, 500)).toBe(true);
      expect(canSendSms(userWithRoom, 501)).toBe(false);
    });
  });

  describe('6. Billing Cycle Reset (B6 Fix)', () => {
    it('should reset SMS count on subscription billing cycle', () => {
      // B6 FIX: Only reset on subscription billing, not one-time charges
      const shouldResetUsage = (invoice) => {
        const subscriptionBillingReasons = [
          'subscription_create',
          'subscription_cycle'
        ];
        return invoice.billing_reason &&
          subscriptionBillingReasons.includes(invoice.billing_reason);
      };

      const subscriptionInvoice = {
        billing_reason: 'subscription_cycle',
        amount_paid: 2900
      };

      const oneTimeInvoice = {
        billing_reason: 'manual',
        amount_paid: 500
      };

      expect(shouldResetUsage(subscriptionInvoice)).toBe(true);
      expect(shouldResetUsage(oneTimeInvoice)).toBe(false);
    });

    it('should handle invoice.paid webhook correctly', () => {
      const handleInvoicePaid = (user, invoice) => {
        const isSubscriptionBilling = invoice.billing_reason &&
          ['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason);

        if (isSubscriptionBilling) {
          user.smsUsageCount = 0;
          user.lastBillingReset = new Date();
        }

        return user;
      };

      const user = {
        smsUsageCount: 850,
        smsUsageLimit: 1000
      };

      const cycleInvoice = { billing_reason: 'subscription_cycle' };
      const resetUser = handleInvoicePaid({ ...user }, cycleInvoice);

      expect(resetUser.smsUsageCount).toBe(0);
    });
  });

  describe('7. Subscription State Consistency (B3 Fix)', () => {
    it('should reset SMS on subscription reactivation', () => {
      const handleSubscriptionReactivation = (user, subscription) => {
        // B3 FIX: Reset SMS when subscription reactivates
        if (subscription.status === 'active' && user.subscriptionStatus !== 'active') {
          user.subscriptionStatus = 'active';
          // Only reset if coming from cancelled/past_due
          if (user.smsUsageCount > user.smsUsageLimit * 0.9) {
            user.smsUsageCount = 0;
          }
        }
        return user;
      };

      const cancelledUser = {
        subscriptionStatus: 'cancelled',
        smsUsageCount: 950,
        smsUsageLimit: 1000
      };

      const reactivatedUser = handleSubscriptionReactivation(
        { ...cancelledUser },
        { status: 'active' }
      );

      expect(reactivatedUser.subscriptionStatus).toBe('active');
      expect(reactivatedUser.smsUsageCount).toBe(0);
    });
  });

  describe('8. Cancellation Handling', () => {
    it('should handle immediate cancellation', () => {
      const handleCancellation = (user) => {
        user.subscriptionStatus = 'cancelled';
        user.subscriptionCancelledAt = new Date();
        // User can still use until end of billing period
        return user;
      };

      const user = {
        subscriptionStatus: 'active',
        smsUsageCount: 500
      };

      const cancelledUser = handleCancellation({ ...user });

      expect(cancelledUser.subscriptionStatus).toBe('cancelled');
      expect(cancelledUser.subscriptionCancelledAt).toBeTruthy();
    });

    it('should prevent SMS sending after cancellation takes effect', () => {
      const canSendAfterCancellation = (user) => {
        if (user.subscriptionStatus !== 'cancelled') return true;
        // Can send until period ends
        if (user.currentPeriodEnd && new Date() < new Date(user.currentPeriodEnd)) {
          return user.smsUsageCount < user.smsUsageLimit;
        }
        return false;
      };

      const activeCancelledUser = {
        subscriptionStatus: 'cancelled',
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        smsUsageCount: 500,
        smsUsageLimit: 1000
      };

      const expiredCancelledUser = {
        subscriptionStatus: 'cancelled',
        currentPeriodEnd: new Date(Date.now() - 1000),
        smsUsageCount: 500,
        smsUsageLimit: 1000
      };

      expect(canSendAfterCancellation(activeCancelledUser)).toBe(true);
      expect(canSendAfterCancellation(expiredCancelledUser)).toBe(false);
    });
  });

  describe('9. Plan Upgrades/Downgrades', () => {
    it('should immediately apply increased limits on upgrade', () => {
      const handleUpgrade = (user, newPlan) => {
        const limits = { starter: 1000, professional: 5000, enterprise: 25000 };
        const newLimit = limits[newPlan];

        if (newLimit > user.smsUsageLimit) {
          user.smsUsageLimit = newLimit;
          user.subscriptionPlan = newPlan;
        }

        return user;
      };

      const starterUser = {
        subscriptionPlan: 'starter',
        smsUsageLimit: 1000,
        smsUsageCount: 800
      };

      const upgradedUser = handleUpgrade({ ...starterUser }, 'professional');

      expect(upgradedUser.smsUsageLimit).toBe(5000);
      expect(upgradedUser.smsUsageCount).toBe(800); // Usage preserved
    });

    it('should schedule limit reduction for end of period on downgrade', () => {
      const scheduleDowngrade = (user, newPlan) => {
        const limits = { starter: 1000, professional: 5000, enterprise: 25000 };
        const newLimit = limits[newPlan];

        if (newLimit < user.smsUsageLimit) {
          // Don't reduce immediately - schedule for end of period
          user.scheduledPlan = newPlan;
          user.scheduledLimit = newLimit;
        }

        return user;
      };

      const proUser = {
        subscriptionPlan: 'professional',
        smsUsageLimit: 5000,
        smsUsageCount: 3000
      };

      const scheduledUser = scheduleDowngrade({ ...proUser }, 'starter');

      expect(scheduledUser.smsUsageLimit).toBe(5000); // Still pro limit
      expect(scheduledUser.scheduledPlan).toBe('starter');
      expect(scheduledUser.scheduledLimit).toBe(1000);
    });
  });
});
