/**
 * SMS Limit Service
 *
 * Handles atomic SMS limit checking and usage tracking.
 * Uses database transactions with row locking to prevent race conditions (D1 fix).
 *
 * THE RACE CONDITION PROBLEM:
 *
 * Without proper locking, two concurrent requests could both pass the limit check:
 *
 *   Time      Request A                Request B
 *   ─────────────────────────────────────────────────
 *   T1        Read: count=9, limit=10
 *   T2                                  Read: count=9, limit=10
 *   T3        canSend? 9<10 = true
 *   T4                                  canSend? 9<10 = true
 *   T5        Send SMS
 *   T6                                  Send SMS
 *   T7        Increment to 10
 *   T8                                  Increment to 11 (EXCEEDS LIMIT!)
 *
 * THE FIX:
 * Use SELECT ... FOR UPDATE to lock the user row during the check+send+increment:
 *
 *   Time      Request A                Request B
 *   ─────────────────────────────────────────────────
 *   T1        Begin txn, Lock user row
 *   T2                                  Begin txn, wait for lock...
 *   T3        Read: count=9, limit=10
 *   T4        canSend? 9<10 = true
 *   T5        Send SMS
 *   T6        Increment to 10
 *   T7        Commit, release lock
 *   T8                                  ...lock acquired
 *   T9                                  Read: count=10, limit=10
 *   T10                                 canSend? 10<10 = false
 *   T11                                 Return error (limit reached)
 */

const { sequelize } = require('../config/database');
const { User } = require('../models');
const logger = require('./logger');

class SmsLimitService {
  /**
   * Check if user can send SMS and atomically reserve a slot
   * Returns a release function to either commit (success) or rollback (failure)
   *
   * @param {number} userId - User ID
   * @param {number} count - Number of SMS to reserve (default 1)
   * @returns {Promise<{canSend: boolean, user: User|null, transaction: Transaction|null, release: Function}>}
   */
  async reserveSmsSlot(userId, count = 1) {
    const transaction = await sequelize.transaction();

    try {
      // Lock the user row for update (prevents concurrent reads)
      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!user) {
        await transaction.rollback();
        return { canSend: false, error: 'User not found', user: null, transaction: null };
      }

      // Check if user has enough SMS capacity
      const remainingSlots = user.smsUsageLimit - user.smsUsageCount;

      if (remainingSlots < count) {
        await transaction.rollback();
        return {
          canSend: false,
          error: 'SMS limit reached',
          user,
          transaction: null,
          remainingSlots
        };
      }

      // Check subscription status
      if (user.subscriptionStatus === 'past_due') {
        await transaction.rollback();
        return {
          canSend: false,
          error: 'Payment past due',
          user,
          transaction: null
        };
      }

      // Return locked user and transaction for the caller to use
      // Caller MUST call release() when done
      return {
        canSend: true,
        user,
        transaction,
        remainingSlots,
        release: async (success, incrementBy = count) => {
          try {
            if (success && incrementBy > 0) {
              // Increment usage count within the same transaction
              await user.increment('smsUsageCount', {
                by: incrementBy,
                transaction
              });
            }
            await transaction.commit();
          } catch (error) {
            logger.error('Error releasing SMS slot', { userId, error: error.message });
            await transaction.rollback();
            throw error;
          }
        }
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error reserving SMS slot', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Simple atomic check-and-send helper
   * Wraps the entire SMS operation in a transaction
   *
   * @param {number} userId - User ID
   * @param {Function} sendFunction - Async function that sends SMS, returns {success: boolean, ...}
   * @returns {Promise<{success: boolean, error?: string, result?: any}>}
   */
  async withSmsLimit(userId, sendFunction) {
    const reservation = await this.reserveSmsSlot(userId, 1);

    if (!reservation.canSend) {
      return {
        success: false,
        error: reservation.error,
        remainingSlots: reservation.remainingSlots
      };
    }

    try {
      // Execute the send function
      const result = await sendFunction(reservation.user);

      // Release with success=true only if SMS actually sent
      const incrementBy = result.success ? 1 : 0;
      await reservation.release(true, incrementBy);

      return {
        success: result.success,
        result
      };
    } catch (error) {
      // Rollback on error (no increment)
      await reservation.release(false, 0);
      throw error;
    }
  }

  /**
   * Bulk SMS reservation for batch operations (like CSV upload)
   * Pre-reserves multiple slots and returns immediately if not enough capacity
   *
   * @param {number} userId - User ID
   * @param {number} requestedCount - Number of SMS to reserve
   * @returns {Promise<{canSend: boolean, availableSlots: number, transaction?: Transaction}>}
   */
  async reserveBulkSmsSlots(userId, requestedCount) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!user) {
        await transaction.rollback();
        return { canSend: false, error: 'User not found', availableSlots: 0 };
      }

      const availableSlots = user.smsUsageLimit - user.smsUsageCount;

      if (availableSlots < requestedCount) {
        await transaction.rollback();
        return {
          canSend: false,
          error: 'Insufficient SMS capacity',
          availableSlots,
          requestedCount
        };
      }

      // Return locked state for batch processing
      return {
        canSend: true,
        availableSlots,
        user,
        transaction,
        incrementAndRelease: async (actualSentCount) => {
          try {
            if (actualSentCount > 0) {
              await user.increment('smsUsageCount', {
                by: actualSentCount,
                transaction
              });
            }
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            throw error;
          }
        },
        rollback: async () => {
          await transaction.rollback();
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get current SMS usage stats (non-locking read)
   *
   * @param {number} userId - User ID
   * @returns {Promise<{count: number, limit: number, remaining: number}>}
   */
  async getUsageStats(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['smsUsageCount', 'smsUsageLimit']
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      count: user.smsUsageCount,
      limit: user.smsUsageLimit,
      remaining: user.smsUsageLimit - user.smsUsageCount
    };
  }
}

module.exports = new SmsLimitService();
