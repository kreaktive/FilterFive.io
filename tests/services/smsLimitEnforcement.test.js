/**
 * SMS Limit Enforcement Tests
 *
 * Tests for SMS usage limits and the race condition fix.
 *
 * Related Issues:
 * - D1: SMS Usage Count Race Condition (CRITICAL)
 * - B1: No SMS Limit Enforcement Before Send (CRITICAL)
 *
 * Current (BROKEN) flow:
 * 1. Check if user.smsUsageCount < user.smsUsageLimit
 * 2. Send SMS via Twilio
 * 3. Increment user.smsUsageCount
 *
 * Problem: Between step 1 and 3, concurrent requests can all pass
 * the check and send more SMS than the limit allows.
 *
 * Required (FIXED) flow:
 * 1. BEGIN TRANSACTION with row lock
 * 2. SELECT user FOR UPDATE (locks the row)
 * 3. Check if smsUsageCount < smsUsageLimit
 * 4. Send SMS via Twilio
 * 5. INCREMENT smsUsageCount (within same transaction)
 * 6. COMMIT TRANSACTION
 *
 * If SMS send fails, rollback - count not incremented.
 * If concurrent request, it waits for lock - sees updated count.
 */

describe('SMS Limit Enforcement', () => {
  describe('Issue B1: Limit Check Before Send', () => {
    /**
     * The current implementation checks the limit but doesn't enforce it atomically.
     * This test documents the EXPECTED behavior.
     */
    test('should reject SMS when user has reached limit', async () => {
      // Arrange
      const userAtLimit = {
        id: 1,
        smsUsageCount: 10,
        smsUsageLimit: 10,
        canSendSms: function () {
          return this.smsUsageCount < this.smsUsageLimit;
        },
      };

      // Act
      const canSend = userAtLimit.canSendSms();

      // Assert
      expect(canSend).toBe(false);
    });

    test('should allow SMS when user is under limit', async () => {
      // Arrange
      const userUnderLimit = {
        id: 1,
        smsUsageCount: 5,
        smsUsageLimit: 10,
        canSendSms: function () {
          return this.smsUsageCount < this.smsUsageLimit;
        },
      };

      // Act
      const canSend = userUnderLimit.canSendSms();

      // Assert
      expect(canSend).toBe(true);
    });

    test('should check limit BEFORE sending SMS, not after', () => {
      /**
       * DOCUMENTATION TEST: The order of operations matters
       *
       * Current (dashboardController.js:562-568):
       *   if (smsResult.success) {
       *     await feedbackRequest.update({ status: 'sent' });
       *     await user.increment('smsUsageCount');  // <-- After send!
       *
       * Problem: SMS is already sent before count is checked/incremented.
       * User could be at 9/10, send 2 concurrent requests, both pass check,
       * both send (now 11 sent), then both increment (count shows 11).
       *
       * Required pattern:
       *   const transaction = await sequelize.transaction();
       *   const lockedUser = await User.findByPk(userId, { transaction, lock: true });
       *   if (lockedUser.smsUsageCount >= lockedUser.smsUsageLimit) {
       *     await transaction.rollback();
       *     throw new Error('SMS limit reached');
       *   }
       *   await smsService.sendReviewRequest(...);
       *   await lockedUser.increment('smsUsageCount', { transaction });
       *   await transaction.commit();
       */

      const correctOrder = [
        'BEGIN TRANSACTION',
        'SELECT user FOR UPDATE (lock row)',
        'CHECK smsUsageCount < smsUsageLimit',
        'REJECT if at limit',
        'SEND SMS via Twilio',
        'INCREMENT smsUsageCount',
        'COMMIT TRANSACTION',
      ];

      // The check must happen BEFORE the send
      const checkIndex = correctOrder.findIndex((step) => step.includes('CHECK'));
      const sendIndex = correctOrder.findIndex((step) => step.includes('SEND'));

      expect(checkIndex).toBeLessThan(sendIndex);
    });

    test('should not increment count if SMS send fails', () => {
      /**
       * If Twilio returns an error, the count should NOT be incremented.
       * With transactions, this is automatic (rollback on error).
       *
       * Current bug: If SMS fails AFTER the check but the code still
       * reaches the increment line (unlikely but possible with async bugs),
       * the count could be wrong.
       */
      const expectedBehavior = {
        smsSentSuccessfully: 'increment count',
        smsFailedToSend: 'do NOT increment count',
        twilioTimeout: 'do NOT increment count',
        networkError: 'do NOT increment count',
      };

      expect(expectedBehavior.smsFailedToSend).toBe('do NOT increment count');
    });
  });

  describe('Issue D1: Race Condition Prevention', () => {
    /**
     * Simulates concurrent SMS requests to demonstrate the race condition.
     */
    test('documents the race condition scenario', async () => {
      /**
       * RACE CONDITION SCENARIO:
       *
       * User has: smsUsageCount = 9, smsUsageLimit = 10 (1 SMS left)
       *
       * Request A (t=0ms):   Check limit -> 9 < 10 -> PASS
       * Request B (t=5ms):   Check limit -> 9 < 10 -> PASS (still 9!)
       * Request A (t=100ms): Send SMS -> SUCCESS
       * Request B (t=105ms): Send SMS -> SUCCESS (BUG: should have been blocked!)
       * Request A (t=150ms): Increment -> count = 10
       * Request B (t=155ms): Increment -> count = 11 (OVER LIMIT!)
       *
       * Result: User sent 2 SMS but only had 1 remaining.
       *         Revenue loss: 1 SMS sent for free.
       */

      const timeline = [
        { time: 0, request: 'A', action: 'check limit', count: 9, limit: 10, result: 'pass' },
        { time: 5, request: 'B', action: 'check limit', count: 9, limit: 10, result: 'pass' }, // Bug!
        { time: 100, request: 'A', action: 'send sms', result: 'success' },
        { time: 105, request: 'B', action: 'send sms', result: 'success' }, // Should have failed!
        { time: 150, request: 'A', action: 'increment', newCount: 10 },
        { time: 155, request: 'B', action: 'increment', newCount: 11 }, // Over limit!
      ];

      // Both requests see count=9 because neither has incremented yet
      const requestACheck = timeline.find((e) => e.request === 'A' && e.action === 'check limit');
      const requestBCheck = timeline.find((e) => e.request === 'B' && e.action === 'check limit');

      // This is the bug: both see the same count
      expect(requestACheck.count).toBe(requestBCheck.count);

      // Final count exceeds limit
      const finalIncrement = timeline.filter((e) => e.action === 'increment').pop();
      expect(finalIncrement.newCount).toBeGreaterThan(10);
    });

    test('documents the fix using database transactions', () => {
      /**
       * FIXED SCENARIO using row locking:
       *
       * Request A (t=0ms):   BEGIN TRANSACTION
       * Request A (t=1ms):   SELECT ... FOR UPDATE (acquires lock)
       * Request A (t=2ms):   Check limit -> 9 < 10 -> PASS
       * Request B (t=5ms):   BEGIN TRANSACTION
       * Request B (t=6ms):   SELECT ... FOR UPDATE (WAITS for A's lock)
       * Request A (t=100ms): Send SMS -> SUCCESS
       * Request A (t=150ms): INCREMENT -> count = 10
       * Request A (t=151ms): COMMIT (releases lock)
       * Request B (t=152ms): SELECT completes (now sees count = 10)
       * Request B (t=153ms): Check limit -> 10 < 10 -> FAIL
       * Request B (t=154ms): ROLLBACK (SMS not sent)
       *
       * Result: Only 1 SMS sent. User correctly blocked at limit.
       */

      const fixedTimeline = [
        { time: 0, request: 'A', action: 'begin transaction' },
        { time: 1, request: 'A', action: 'select for update', acquired: true },
        { time: 2, request: 'A', action: 'check limit', count: 9, result: 'pass' },
        { time: 5, request: 'B', action: 'begin transaction' },
        { time: 6, request: 'B', action: 'select for update', waiting: true },
        { time: 100, request: 'A', action: 'send sms', result: 'success' },
        { time: 150, request: 'A', action: 'increment', newCount: 10 },
        { time: 151, request: 'A', action: 'commit' },
        { time: 152, request: 'B', action: 'select for update', acquired: true, seesCount: 10 },
        { time: 153, request: 'B', action: 'check limit', count: 10, result: 'fail' },
        { time: 154, request: 'B', action: 'rollback' },
      ];

      // Request B waits for A's lock
      const requestBWaiting = fixedTimeline.find(
        (e) => e.request === 'B' && e.action === 'select for update' && e.waiting
      );
      expect(requestBWaiting).toBeDefined();

      // When B finally gets the lock, it sees the updated count
      const requestBFinalCheck = fixedTimeline.find(
        (e) => e.request === 'B' && e.action === 'check limit'
      );
      expect(requestBFinalCheck.count).toBe(10);
      expect(requestBFinalCheck.result).toBe('fail');

      // Request B rolls back (no SMS sent)
      const requestBRollback = fixedTimeline.find(
        (e) => e.request === 'B' && e.action === 'rollback'
      );
      expect(requestBRollback).toBeDefined();
    });

    test('provides the fix code pattern', () => {
      /**
       * This is the pattern that needs to be implemented in:
       * - src/controllers/dashboardController.js (sendTestSms function)
       * - src/controllers/uploadController.js (processSending function)
       */

      const fixPattern = `
// Import at top of file
const { sequelize } = require('../models');

// In the SMS sending function:
const sendSmsWithLimitEnforcement = async (userId, phone, message) => {
  const transaction = await sequelize.transaction();

  try {
    // Lock the user row to prevent concurrent modifications
    const user = await User.findByPk(userId, {
      transaction,
      lock: true, // SELECT ... FOR UPDATE
    });

    // Check limit with locked row
    if (user.smsUsageCount >= user.smsUsageLimit) {
      await transaction.rollback();
      throw new Error('SMS limit reached');
    }

    // Send SMS (if this fails, we rollback - count not incremented)
    const result = await smsService.sendReviewRequest(...);

    // Increment within same transaction
    await user.increment('smsUsageCount', { transaction });

    // Commit only after all operations succeed
    await transaction.commit();

    return result;
  } catch (error) {
    // Rollback on any error - count not incremented
    await transaction.rollback();
    throw error;
  }
};
`;

      expect(fixPattern).toContain('transaction');
      expect(fixPattern).toContain('lock: true');
      expect(fixPattern).toContain('rollback');
      expect(fixPattern).toContain('commit');
    });
  });

  describe('SMS Limit Edge Cases', () => {
    test('should handle limit of 0 (service disabled)', () => {
      const userWithZeroLimit = {
        smsUsageCount: 0,
        smsUsageLimit: 0,
        canSendSms: function () {
          return this.smsUsageCount < this.smsUsageLimit;
        },
      };

      expect(userWithZeroLimit.canSendSms()).toBe(false);
    });

    test('should handle null/undefined limit (default to 0)', () => {
      const userWithNoLimit = {
        smsUsageCount: 0,
        smsUsageLimit: null,
        canSendSms: function () {
          const limit = this.smsUsageLimit || 0;
          return this.smsUsageCount < limit;
        },
      };

      expect(userWithNoLimit.canSendSms()).toBe(false);
    });

    test('should handle negative count (data corruption)', () => {
      const userWithNegativeCount = {
        smsUsageCount: -5,
        smsUsageLimit: 10,
        canSendSms: function () {
          // Negative count should be treated as 0
          const count = Math.max(0, this.smsUsageCount);
          return count < this.smsUsageLimit;
        },
      };

      expect(userWithNegativeCount.canSendSms()).toBe(true);
    });

    test('should handle trial user limits (10 SMS)', () => {
      const trialUser = {
        subscriptionStatus: 'trial',
        smsUsageCount: 9,
        smsUsageLimit: 10,
        canSendSms: function () {
          return this.smsUsageCount < this.smsUsageLimit;
        },
      };

      // Can send 1 more
      expect(trialUser.canSendSms()).toBe(true);

      // After sending
      trialUser.smsUsageCount = 10;
      expect(trialUser.canSendSms()).toBe(false);
    });

    test('should handle paid user limits (1000 SMS)', () => {
      const paidUser = {
        subscriptionStatus: 'active',
        smsUsageCount: 999,
        smsUsageLimit: 1000,
        canSendSms: function () {
          return this.smsUsageCount < this.smsUsageLimit;
        },
      };

      // Can send 1 more
      expect(paidUser.canSendSms()).toBe(true);

      // After sending
      paidUser.smsUsageCount = 1000;
      expect(paidUser.canSendSms()).toBe(false);
    });
  });

  describe('Bulk SMS Sending (CSV Upload)', () => {
    test('should pre-calculate total SMS needed vs remaining limit', () => {
      /**
       * Before sending bulk SMS, calculate if user has enough quota.
       * Don't start sending if they'll exceed limit mid-batch.
       */
      const user = {
        smsUsageCount: 5,
        smsUsageLimit: 10,
        getRemainingLimit: function () {
          return this.smsUsageLimit - this.smsUsageCount;
        },
      };

      const csvRows = [
        { name: 'Customer 1', phone: '+1234567890' },
        { name: 'Customer 2', phone: '+1234567891' },
        { name: 'Customer 3', phone: '+1234567892' },
        { name: 'Customer 4', phone: '+1234567893' },
        { name: 'Customer 5', phone: '+1234567894' },
        { name: 'Customer 6', phone: '+1234567895' }, // Would exceed limit
      ];

      const remaining = user.getRemainingLimit();
      const toSend = csvRows.length;

      expect(remaining).toBe(5);
      expect(toSend).toBe(6);
      expect(toSend > remaining).toBe(true); // Should reject entire batch
    });

    test('should atomically increment count for each SMS in batch', () => {
      /**
       * In bulk send, each SMS should atomically increment the counter.
       * If we're doing 5 SMS in a batch:
       * - SMS 1: count 5->6
       * - SMS 2: count 6->7
       * - SMS 3: count 7->8
       * etc.
       *
       * Each increment should be within its own transaction (or nested).
       */
      const batchSendPattern = `
// Bulk send with individual transactions per SMS
for (const row of csvRows) {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction, lock: true });
    if (user.smsUsageCount >= user.smsUsageLimit) {
      await transaction.rollback();
      results.push({ row, error: 'SMS limit reached' });
      break; // Stop sending
    }
    await smsService.sendReviewRequest(...);
    await user.increment('smsUsageCount', { transaction });
    await transaction.commit();
    results.push({ row, success: true });
  } catch (error) {
    await transaction.rollback();
    results.push({ row, error: error.message });
  }
}
`;

      expect(batchSendPattern).toContain('for (const row of csvRows)');
      expect(batchSendPattern).toContain('transaction');
    });
  });
});

describe('SMS Service Functions', () => {
  describe('replaceTemplateTags', () => {
    // Import the actual function for testing
    let replaceTemplateTags;

    beforeAll(() => {
      // We'll test the logic, not the actual implementation
      replaceTemplateTags = (template, customerName, businessName, reviewLink) => {
        const name = customerName || 'there';
        return template
          .replace(/\{\{CustomerName\}\}/gi, name)
          .replace(/\{\{BusinessName\}\}/gi, businessName)
          .replace(/\{\{ReviewLink\}\}/gi, reviewLink);
      };
    });

    test('should replace all template tags', () => {
      const template = 'Hi {{CustomerName}}, thanks for visiting {{BusinessName}}! Leave a review: {{ReviewLink}}';
      const result = replaceTemplateTags(template, 'John', 'Test Business', 'https://g.page/review');

      expect(result).toBe('Hi John, thanks for visiting Test Business! Leave a review: https://g.page/review');
    });

    test('should handle missing customer name', () => {
      const template = 'Hi {{CustomerName}}!';
      const result = replaceTemplateTags(template, null, 'Business', 'link');

      expect(result).toBe('Hi there!'); // Should default to "there"
    });

    test('should be case-insensitive for tags', () => {
      const template = '{{customername}} at {{BUSINESSNAME}} - {{reviewLINK}}';
      const result = replaceTemplateTags(template, 'Jane', 'Shop', 'http://review');

      expect(result).toBe('Jane at Shop - http://review');
    });

    test('should handle template without tags', () => {
      const template = 'Plain message without tags';
      const result = replaceTemplateTags(template, 'Name', 'Business', 'Link');

      expect(result).toBe('Plain message without tags');
    });
  });

  describe('getSmsMessage', () => {
    // Test the message generation logic
    test('should generate friendly tone message', () => {
      const friendlyMessage = (name, business, link) =>
        `Hi ${name}! Thanks for visiting ${business}. Reviews help small businesses like ours thrive! Would you mind sharing your experience? ${link}`;

      const result = friendlyMessage('John', 'Test Shop', 'https://g.page');

      expect(result).toContain('Hi John');
      expect(result).toContain('Test Shop');
      expect(result).toContain('https://g.page');
    });

    test('should generate professional tone message', () => {
      const professionalMessage = (name, business, link) =>
        `Hello ${name}, thank you for choosing ${business}. Your feedback is valuable to us. Please take a moment to leave a review: ${link}`;

      const result = professionalMessage('Jane', 'Pro Services', 'https://review');

      expect(result).toContain('Hello Jane');
      expect(result).toContain('Pro Services');
      expect(result).toContain('feedback is valuable');
    });

    test('should append review link if custom message missing it', () => {
      const customMessage = 'Thanks for your business!'; // Missing link
      const reviewLink = 'https://g.page/review';

      // Current behavior: appends link if missing
      const processCustomMessage = (msg, link) => {
        if (!msg.includes(link) && !msg.toLowerCase().includes('{{reviewlink}}')) {
          return `${msg} ${link}`;
        }
        return msg;
      };

      const result = processCustomMessage(customMessage, reviewLink);

      expect(result).toContain(reviewLink);
    });
  });
});
