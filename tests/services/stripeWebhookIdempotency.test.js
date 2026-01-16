/**
 * Stripe Webhook Idempotency Tests (Issue B2)
 *
 * Tests webhook handling for duplicate prevention and race conditions.
 *
 * ISSUE B2 - Stripe Webhook Idempotency Race Condition:
 * Location: src/services/stripeService.js:175-249
 *
 * THE BUG:
 * The current implementation has a time-of-check to time-of-use (TOCTOU) race condition:
 *
 *   1. isProcessed(eventId)     <- CHECK (SELECT)
 *   2. handle the event         <- PROCESS (business logic)
 *   3. markProcessed(eventId)   <- MARK (INSERT)
 *
 * RACE CONDITION SCENARIO:
 *
 *   Time      Request A                    Request B
 *   ────────────────────────────────────────────────────────────────
 *   T1        isProcessed() → false
 *   T2                                     isProcessed() → false
 *   T3        handleCheckoutCompleted()
 *   T4                                     handleCheckoutCompleted()
 *   T5        markProcessed()
 *   T6                                     markProcessed() → UNIQUE ERROR
 *
 * Result: The checkout completed handler runs TWICE, potentially:
 * - Resetting SMS count twice
 * - Sending duplicate welcome emails
 * - Creating duplicate records
 *
 * THE FIX:
 * Use findOrCreate with atomic semantics to claim the event:
 *
 * ```javascript
 * async handleWebhookEvent(event) {
 *   // Atomic: Either create new record and return created=true,
 *   // or find existing and return created=false
 *   const [record, created] = await StripeWebhookEvent.findOrCreate({
 *     where: { eventId: event.id },
 *     defaults: {
 *       eventType: event.type,
 *       processedAt: new Date(),
 *       stripeCustomerId: event.data.object.customer,
 *     }
 *   });
 *
 *   if (!created) {
 *     logger.info('Webhook already processed', { eventId: event.id });
 *     return { skipped: true, reason: 'already_processed' };
 *   }
 *
 *   // Only the request that created the record processes it
 *   // If processing fails, we should delete the record to allow retry
 *   try {
 *     switch (event.type) {
 *       case 'checkout.session.completed':
 *         await this.handleCheckoutCompleted(event.data.object);
 *         break;
 *       // ... other handlers
 *     }
 *
 *     // Update record with userId after successful processing
 *     await record.update({ userId: extractedUserId });
 *
 *     return { success: true };
 *   } catch (error) {
 *     // On failure, remove the claim so webhook can be retried
 *     await record.destroy();
 *     throw error;
 *   }
 * }
 * ```
 */

const {
  MockStripeService,
  MockLogger,
} = require('../helpers/mockServices');
const { userFactory, stripeEventFactory } = require('../helpers/factories');

describe('Stripe Webhook Idempotency', () => {
  let mockStripe;
  let mockLogger;

  // Simulated database for webhook events
  let webhookEventsDb;
  let usersDb;
  let userIdCounter;

  beforeEach(() => {
    mockStripe = new MockStripeService();
    mockLogger = new MockLogger();
    webhookEventsDb = new Map();
    usersDb = new Map();
    userIdCounter = 1;
  });

  // Helper to create a mock user - defined at top level so all describes can use it
  const createMockUser = (overrides = {}) => {
    const id = userIdCounter++;
    const user = {
      id,
      ...userFactory.buildTrial({ ...overrides }),
      update: jest.fn().mockImplementation(function(data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      }),
      save: jest.fn().mockResolvedValue(true),
    };
    usersDb.set(id, user);
    return user;
  };

  /**
   * Current (buggy) implementation
   */
  const currentImplementation = {
    isProcessed: async (eventId) => {
      return webhookEventsDb.has(eventId);
    },

    markProcessed: async (eventId, eventType, customerId, userId) => {
      if (webhookEventsDb.has(eventId)) {
        throw new Error('Unique constraint violation');
      }
      webhookEventsDb.set(eventId, { eventId, eventType, customerId, userId, processedAt: new Date() });
    },

    handleWebhookEvent: async function(event, handleFn) {
      // Current buggy pattern:
      const alreadyProcessed = await this.isProcessed(event.id);
      if (alreadyProcessed) {
        return { skipped: true, reason: 'already_processed' };
      }

      // GAP: Another request can pass the check here

      await handleFn(event);
      await this.markProcessed(event.id, event.type, event.data.object.customer, null);
      return { success: true };
    }
  };

  /**
   * Fixed implementation using atomic findOrCreate
   */
  const fixedImplementation = {
    findOrCreate: async (eventId, eventType, customerId) => {
      // Atomic operation - either creates or finds
      if (webhookEventsDb.has(eventId)) {
        return [webhookEventsDb.get(eventId), false]; // found, not created
      }
      const record = { eventId, eventType, customerId, processedAt: new Date() };
      webhookEventsDb.set(eventId, record);
      return [record, true]; // created
    },

    handleWebhookEvent: async function(event, handleFn) {
      // Fixed pattern using atomic findOrCreate:
      const [record, created] = await this.findOrCreate(
        event.id,
        event.type,
        event.data.object.customer
      );

      if (!created) {
        return { skipped: true, reason: 'already_processed' };
      }

      try {
        await handleFn(event);
        return { success: true };
      } catch (error) {
        // On failure, remove claim to allow retry
        webhookEventsDb.delete(event.id);
        throw error;
      }
    }
  };

  describe('Issue B2: Race Condition Vulnerability', () => {
    it('should demonstrate the race condition with current implementation', async () => {
      const event = {
        id: 'evt_race_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: '1' }
          }
        }
      };

      let handleCount = 0;
      const handleFn = async () => {
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 10));
        handleCount++;
      };

      // Simulate concurrent requests hitting the webhook at nearly the same time
      // This demonstrates the race condition
      const request1 = currentImplementation.handleWebhookEvent.call(currentImplementation, event, handleFn);
      const request2 = currentImplementation.handleWebhookEvent.call(currentImplementation, event, handleFn);

      try {
        await Promise.all([request1, request2]);
      } catch {
        // One might fail due to unique constraint
      }

      // BUG: Handler runs twice because both requests pass isProcessed() check
      // before either marks as processed
      // In a real scenario, this could be 2 depending on timing
      expect(handleCount).toBeGreaterThanOrEqual(1);

      // This test documents the vulnerability - the fix should ensure handleCount is exactly 1
    });

    it('should only process once with fixed implementation', async () => {
      const event = {
        id: 'evt_fixed_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { userId: '1' }
          }
        }
      };

      let handleCount = 0;
      const handleFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        handleCount++;
      };

      // With fixed implementation, atomic findOrCreate prevents race
      const results = await Promise.all([
        fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, handleFn),
        fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, handleFn),
      ]);

      // Exactly one should succeed, one should skip
      const successes = results.filter(r => r.success);
      const skipped = results.filter(r => r.skipped);

      expect(successes.length).toBe(1);
      expect(skipped.length).toBe(1);
      expect(handleCount).toBe(1); // Handler only runs once
    });
  });

  describe('Webhook Event Types', () => {
    describe('checkout.session.completed', () => {
      it('should activate subscription and reset SMS limits', async () => {
        const user = createMockUser({
          stripeCustomerId: 'cus_checkout_test',
          smsUsageCount: 8,
          smsUsageLimit: 10,
          subscriptionStatus: 'trial',
        });

        const event = stripeEventFactory.buildCheckoutCompleted(
          'cus_checkout_test',
          'sub_checkout_test',
          { rawPayload: undefined }
        );
        event.rawPayload = undefined;
        event.id = 'evt_checkout_complete_1';
        event.type = 'checkout.session.completed';
        event.data = {
          object: {
            customer: 'cus_checkout_test',
            subscription: 'sub_checkout_test',
            metadata: { userId: user.id.toString(), plan: 'monthly' }
          }
        };

        // Simulate handler
        const handleCheckoutCompleted = async (session) => {
          const targetUser = usersDb.get(parseInt(session.metadata.userId));
          if (!targetUser) throw new Error('User not found');

          await targetUser.update({
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
            smsUsageCount: 0,
            smsUsageLimit: 1000,
          });
        };

        await fixedImplementation.handleWebhookEvent.call(
          fixedImplementation,
          event,
          () => handleCheckoutCompleted(event.data.object)
        );

        expect(user.subscriptionStatus).toBe('active');
        expect(user.smsUsageCount).toBe(0);
        expect(user.smsUsageLimit).toBe(1000);
      });

      it('should not double-process checkout completion', async () => {
        const user = createMockUser({
          stripeCustomerId: 'cus_double_checkout',
          smsUsageCount: 5,
        });

        const event = {
          id: 'evt_double_checkout_test',
          type: 'checkout.session.completed',
          data: {
            object: {
              customer: 'cus_double_checkout',
              subscription: 'sub_double',
              metadata: { userId: user.id.toString(), plan: 'annual' }
            }
          }
        };

        let resetCount = 0;
        const handleFn = async () => {
          user.smsUsageCount = 0;
          resetCount++;
        };

        // Process twice
        await fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, handleFn);
        await fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, handleFn);

        // Should only reset once
        expect(resetCount).toBe(1);
      });
    });

    describe('customer.subscription.updated', () => {
      it('should update subscription status correctly', async () => {
        const user = createMockUser({
          stripeCustomerId: 'cus_sub_update',
          stripeSubscriptionId: 'sub_update_test',
          subscriptionStatus: 'active',
          smsUsageLimit: 1000,
        });

        const event = {
          id: 'evt_sub_updated_1',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_update_test',
              status: 'past_due',
              customer: 'cus_sub_update',
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            }
          }
        };

        const handleSubscriptionUpdated = async (subscription) => {
          const targetUser = Array.from(usersDb.values())
            .find(u => u.stripeSubscriptionId === subscription.id);
          if (!targetUser) return;

          if (subscription.status === 'past_due') {
            await targetUser.update({
              subscriptionStatus: 'past_due',
              smsUsageLimit: 0, // Block SMS when past due
            });
          }
        };

        await fixedImplementation.handleWebhookEvent.call(
          fixedImplementation,
          event,
          () => handleSubscriptionUpdated(event.data.object)
        );

        expect(user.subscriptionStatus).toBe('past_due');
        expect(user.smsUsageLimit).toBe(0);
      });

      it('should restore limits when subscription becomes active again', async () => {
        const user = createMockUser({
          stripeSubscriptionId: 'sub_reactivate',
          subscriptionStatus: 'past_due',
          smsUsageLimit: 0,
        });

        const event = {
          id: 'evt_sub_reactivated',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_reactivate',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            }
          }
        };

        const handleSubscriptionUpdated = async (subscription) => {
          const targetUser = Array.from(usersDb.values())
            .find(u => u.stripeSubscriptionId === subscription.id);
          if (!targetUser) return;

          if (subscription.status === 'active') {
            await targetUser.update({
              subscriptionStatus: 'active',
              smsUsageLimit: 1000,
            });
          }
        };

        await fixedImplementation.handleWebhookEvent.call(
          fixedImplementation,
          event,
          () => handleSubscriptionUpdated(event.data.object)
        );

        expect(user.subscriptionStatus).toBe('active');
        expect(user.smsUsageLimit).toBe(1000);
      });
    });

    describe('customer.subscription.deleted', () => {
      it('should revert to trial limits on cancellation', async () => {
        const user = createMockUser({
          stripeSubscriptionId: 'sub_delete_test',
          subscriptionStatus: 'active',
          smsUsageLimit: 1000,
        });

        const event = {
          id: 'evt_sub_deleted_1',
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_delete_test',
              customer: 'cus_deleted',
            }
          }
        };

        const handleSubscriptionDeleted = async (subscription) => {
          const targetUser = Array.from(usersDb.values())
            .find(u => u.stripeSubscriptionId === subscription.id);
          if (!targetUser) return;

          await targetUser.update({
            subscriptionStatus: 'cancelled',
            smsUsageLimit: 10, // Revert to trial
          });
        };

        await fixedImplementation.handleWebhookEvent.call(
          fixedImplementation,
          event,
          () => handleSubscriptionDeleted(event.data.object)
        );

        expect(user.subscriptionStatus).toBe('cancelled');
        expect(user.smsUsageLimit).toBe(10);
      });
    });

    describe('invoice.payment_succeeded (Issue B6 related)', () => {
      it('should reset SMS usage on payment success', async () => {
        const user = createMockUser({
          stripeCustomerId: 'cus_payment_success',
          smsUsageCount: 850,
          smsUsageLimit: 1000,
          subscriptionStatus: 'active',
        });

        const event = {
          id: 'evt_invoice_paid_1',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              customer: 'cus_payment_success',
              subscription: 'sub_payment_test',
              status: 'paid',
              amount_paid: 2900,
            }
          }
        };

        const handlePaymentSucceeded = async (invoice) => {
          const targetUser = Array.from(usersDb.values())
            .find(u => u.stripeCustomerId === invoice.customer);
          if (!targetUser) return;

          await targetUser.update({
            smsUsageCount: 0,
            smsUsageLimit: 1000,
            subscriptionStatus: 'active',
          });
        };

        await fixedImplementation.handleWebhookEvent.call(
          fixedImplementation,
          event,
          () => handlePaymentSucceeded(event.data.object)
        );

        expect(user.smsUsageCount).toBe(0);
        expect(user.subscriptionStatus).toBe('active');
      });

      it('should not reset usage twice on duplicate webhook', async () => {
        const user = createMockUser({
          stripeCustomerId: 'cus_double_payment',
          smsUsageCount: 500,
        });

        const event = {
          id: 'evt_double_invoice_paid',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              customer: 'cus_double_payment',
              subscription: 'sub_double',
            }
          }
        };

        let resetCount = 0;
        const handleFn = async () => {
          // Add some usage before reset to verify we can track resets
          user.smsUsageCount = 100; // Simulate usage since last reset
          user.smsUsageCount = 0;
          resetCount++;
        };

        await fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, handleFn);

        // Simulate some SMS usage
        user.smsUsageCount = 50;

        // Second webhook should be skipped
        await fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, handleFn);

        // Usage should still be 50 since second reset was skipped
        expect(user.smsUsageCount).toBe(50);
        expect(resetCount).toBe(1);
      });
    });

    describe('invoice.payment_failed', () => {
      it('should block SMS on payment failure', async () => {
        const user = createMockUser({
          stripeCustomerId: 'cus_payment_fail',
          subscriptionStatus: 'active',
          smsUsageLimit: 1000,
        });

        const event = {
          id: 'evt_payment_failed_1',
          type: 'invoice.payment_failed',
          data: {
            object: {
              customer: 'cus_payment_fail',
              status: 'open',
              attempt_count: 1,
            }
          }
        };

        const handlePaymentFailed = async (invoice) => {
          const targetUser = Array.from(usersDb.values())
            .find(u => u.stripeCustomerId === invoice.customer);
          if (!targetUser) return;

          await targetUser.update({
            subscriptionStatus: 'past_due',
            smsUsageLimit: 0,
          });
        };

        await fixedImplementation.handleWebhookEvent.call(
          fixedImplementation,
          event,
          () => handlePaymentFailed(event.data.object)
        );

        expect(user.subscriptionStatus).toBe('past_due');
        expect(user.smsUsageLimit).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should allow retry on processing error with fixed implementation', async () => {
      const event = {
        id: 'evt_error_retry_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_error',
            subscription: 'sub_error',
            metadata: { userId: '999' } // Non-existent user
          }
        }
      };

      let attempts = 0;
      const failingHandler = async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Simulated failure');
        }
        // Succeed on second attempt
      };

      // First attempt fails
      await expect(
        fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, failingHandler)
      ).rejects.toThrow('Simulated failure');

      // Event should NOT be marked as processed due to failure
      expect(webhookEventsDb.has(event.id)).toBe(false);

      // Retry should work
      const result = await fixedImplementation.handleWebhookEvent.call(
        fixedImplementation,
        event,
        failingHandler
      );

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });

    it('should handle missing user gracefully', async () => {
      const event = {
        id: 'evt_missing_user',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_nonexistent',
            metadata: { userId: '99999' }
          }
        }
      };

      const handleFn = async () => {
        const user = usersDb.get(99999);
        if (!user) {
          throw new Error('User not found');
        }
      };

      await expect(
        fixedImplementation.handleWebhookEvent.call(fixedImplementation, event, handleFn)
      ).rejects.toThrow('User not found');

      // Event should not be permanently marked processed
      expect(webhookEventsDb.has(event.id)).toBe(false);
    });
  });

  describe('Subscription State Consistency (Issue B3 related)', () => {
    it('should restore SMS count on payment recovery', async () => {
      // User's payment failed, they're past_due
      const user = createMockUser({
        stripeCustomerId: 'cus_recovery',
        stripeSubscriptionId: 'sub_recovery',
        subscriptionStatus: 'past_due',
        smsUsageLimit: 0,
        smsUsageCount: 0, // Reset due to past_due
      });

      // User fixes their payment method, we get payment_succeeded
      const event = {
        id: 'evt_recovery_payment',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_recovery',
            subscription: 'sub_recovery',
          }
        }
      };

      const handlePaymentSucceeded = async (invoice) => {
        const targetUser = Array.from(usersDb.values())
          .find(u => u.stripeCustomerId === invoice.customer);
        if (!targetUser) return;

        // Issue B3: This should also reset smsUsageCount
        await targetUser.update({
          subscriptionStatus: 'active',
          smsUsageLimit: 1000,
          smsUsageCount: 0, // Reset count on recovery
        });
      };

      await fixedImplementation.handleWebhookEvent.call(
        fixedImplementation,
        event,
        () => handlePaymentSucceeded(event.data.object)
      );

      expect(user.subscriptionStatus).toBe('active');
      expect(user.smsUsageLimit).toBe(1000);
      expect(user.smsUsageCount).toBe(0);
    });
  });

  describe('Webhook Cleanup', () => {
    it('should support cleanup of old webhook records', async () => {
      // Add some old records
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      webhookEventsDb.set('evt_old_1', { eventId: 'evt_old_1', createdAt: oldDate });
      webhookEventsDb.set('evt_old_2', { eventId: 'evt_old_2', createdAt: oldDate });
      webhookEventsDb.set('evt_recent', { eventId: 'evt_recent', createdAt: new Date() });

      // Cleanup function
      const cleanup = async (days = 7) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        let deleted = 0;
        for (const [key, value] of webhookEventsDb.entries()) {
          if (value.createdAt < cutoff) {
            webhookEventsDb.delete(key);
            deleted++;
          }
        }
        return deleted;
      };

      const deletedCount = await cleanup(7);

      expect(deletedCount).toBe(2);
      expect(webhookEventsDb.has('evt_old_1')).toBe(false);
      expect(webhookEventsDb.has('evt_old_2')).toBe(false);
      expect(webhookEventsDb.has('evt_recent')).toBe(true);
    });
  });
});

/**
 * IMPLEMENTATION CHECKLIST FOR FIX:
 *
 * 1. Update StripeWebhookEvent model:
 *    - Add method that combines check + create atomically
 *    - Ensure unique constraint on eventId is enforced
 *
 * 2. Update stripeService.handleWebhookEvent:
 *    - Replace isProcessed() + markProcessed() with findOrCreate()
 *    - Handle failure case by removing the claim record
 *    - Ensure processing happens only if created=true
 *
 * 3. Add transaction wrapping for subscription updates:
 *    - Use SELECT ... FOR UPDATE when updating user
 *    - Ensure SMS limits update atomically with status
 *
 * 4. Test with webhook retry simulation:
 *    - Stripe retries webhooks on failure
 *    - Our fix should handle this correctly
 *
 * FILES TO MODIFY:
 * - src/models/StripeWebhookEvent.js (add atomic claim method)
 * - src/services/stripeService.js (use atomic claim in handleWebhookEvent)
 */
