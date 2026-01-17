/**
 * SMS Limit Service Tests
 *
 * Tests for atomic SMS limit checking and usage tracking:
 * - reserveSmsSlot: Atomic slot reservation with row locking
 * - withSmsLimit: Wrapper for check-send-increment pattern
 * - reserveBulkSmsSlots: Bulk SMS reservation
 * - getUsageStats: Non-locking usage stats read
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock sequelize transaction
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  LOCK: { UPDATE: 'UPDATE' },
};

jest.mock('../../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}));

jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const { sequelize } = require('../../src/config/database');
const { User } = require('../../src/models');
const logger = require('../../src/services/logger');
const smsLimitService = require('../../src/services/smsLimitService');

describe('SMS Limit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
    // Use mockReset() to clear BOTH call history AND implementation
    // mockClear() only clears call history, leaving mockRejectedValue intact
    mockTransaction.commit.mockReset();
    mockTransaction.rollback.mockReset();
    // Re-add default implementations after reset
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  // ===========================================
  // reserveSmsSlot Tests
  // ===========================================
  describe('reserveSmsSlot', () => {
    const createMockUser = (overrides = {}) => ({
      id: 1,
      smsUsageCount: 50,
      smsUsageLimit: 1000,
      subscriptionStatus: 'active',
      increment: jest.fn().mockResolvedValue(true),
      ...overrides,
    });

    it('should reserve slot when user has capacity', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1);

      expect(result.canSend).toBe(true);
      expect(result.user).toBe(mockUser);
      expect(result.transaction).toBe(mockTransaction);
      expect(result.remainingSlots).toBe(950);
      expect(typeof result.release).toBe('function');
    });

    it('should return error when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const result = await smsLimitService.reserveSmsSlot(999);

      expect(result.canSend).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.user).toBeNull();
      expect(result.transaction).toBeNull();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject when insufficient slots', async () => {
      const mockUser = createMockUser({
        smsUsageCount: 1000, // At limit
        smsUsageLimit: 1000,
      });
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1, 1);

      expect(result.canSend).toBe(false);
      expect(result.error).toBe('SMS limit reached');
      expect(result.remainingSlots).toBe(0);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should reject when payment is past due', async () => {
      const mockUser = createMockUser({
        subscriptionStatus: 'past_due',
      });
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1);

      expect(result.canSend).toBe(false);
      expect(result.error).toBe('Payment past due');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should release with increment on success=true', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1);
      await result.release(true);

      expect(mockUser.increment).toHaveBeenCalledWith('smsUsageCount', {
        by: 1,
        transaction: mockTransaction,
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should release without increment on success=false', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1);
      await result.release(false);

      expect(mockUser.increment).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle transaction creation error', async () => {
      sequelize.transaction.mockRejectedValue(new Error('DB connection failed'));

      await expect(smsLimitService.reserveSmsSlot(1)).rejects.toThrow('DB connection failed');
    });

    it('should handle User.findByPk error inside transaction', async () => {
      User.findByPk.mockRejectedValue(new Error('DB query failed'));

      await expect(smsLimitService.reserveSmsSlot(1)).rejects.toThrow('DB query failed');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error reserving SMS slot',
        expect.objectContaining({ userId: 1, error: 'DB query failed' })
      );
    });

    it('should handle rollback on commit failure', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);
      mockTransaction.commit.mockRejectedValue(new Error('Commit failed'));

      const result = await smsLimitService.reserveSmsSlot(1);

      await expect(result.release(true)).rejects.toThrow('Commit failed');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error releasing SMS slot',
        expect.objectContaining({ userId: 1 })
      );
    });

    it('should use row locking with FOR UPDATE', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      await smsLimitService.reserveSmsSlot(1);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        transaction: mockTransaction,
        lock: 'UPDATE',
      });
    });

    it('should reserve multiple slots when count > 1', async () => {
      const mockUser = createMockUser({
        smsUsageCount: 0,
        smsUsageLimit: 100,
      });
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1, 50);

      expect(result.canSend).toBe(true);
      expect(result.remainingSlots).toBe(100);
    });

    it('should reject when requesting more slots than available', async () => {
      const mockUser = createMockUser({
        smsUsageCount: 90,
        smsUsageLimit: 100,
      });
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1, 20); // Only 10 available

      expect(result.canSend).toBe(false);
      expect(result.error).toBe('SMS limit reached');
      expect(result.remainingSlots).toBe(10);
    });
  });

  // ===========================================
  // withSmsLimit Tests
  // ===========================================
  describe('withSmsLimit', () => {
    const createMockUser = (overrides = {}) => ({
      id: 1,
      smsUsageCount: 50,
      smsUsageLimit: 1000,
      subscriptionStatus: 'active',
      increment: jest.fn().mockResolvedValue(true),
      ...overrides,
    });

    it('should execute function when can send', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const sendFn = jest.fn().mockResolvedValue({ success: true, messageId: 'msg_123' });

      const result = await smsLimitService.withSmsLimit(1, sendFn);

      expect(sendFn).toHaveBeenCalledWith(mockUser);
      expect(result.success).toBe(true);
      expect(result.result.messageId).toBe('msg_123');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should return error without executing when cannot send', async () => {
      const mockUser = createMockUser({
        smsUsageCount: 1000,
        smsUsageLimit: 1000,
      });
      User.findByPk.mockResolvedValue(mockUser);

      const sendFn = jest.fn();

      const result = await smsLimitService.withSmsLimit(1, sendFn);

      expect(sendFn).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('SMS limit reached');
      expect(result.remainingSlots).toBe(0);
    });

    it('should rollback when send function throws', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const sendFn = jest.fn().mockRejectedValue(new Error('SMS provider error'));

      await expect(smsLimitService.withSmsLimit(1, sendFn)).rejects.toThrow('SMS provider error');
    });

    it('should not increment when send function returns success=false', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const sendFn = jest.fn().mockResolvedValue({ success: false, error: 'Invalid phone' });

      const result = await smsLimitService.withSmsLimit(1, sendFn);

      expect(result.success).toBe(false);
      expect(result.result.error).toBe('Invalid phone');
      // increment should be 0 since success=false
      expect(mockUser.increment).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should calculate remaining slots correctly', async () => {
      const mockUser = createMockUser({
        smsUsageCount: 999,
        smsUsageLimit: 1000,
      });
      User.findByPk.mockResolvedValue(mockUser);

      const sendFn = jest.fn().mockResolvedValue({ success: true });

      await smsLimitService.withSmsLimit(1, sendFn);

      expect(mockUser.increment).toHaveBeenCalledWith('smsUsageCount', {
        by: 1,
        transaction: mockTransaction,
      });
    });
  });

  // ===========================================
  // reserveBulkSmsSlots Tests
  // ===========================================
  describe('reserveBulkSmsSlots', () => {
    const createMockUser = (overrides = {}) => ({
      id: 1,
      smsUsageCount: 0,
      smsUsageLimit: 1000,
      subscriptionStatus: 'active',
      increment: jest.fn().mockResolvedValue(true),
      ...overrides,
    });

    it('should reserve when sufficient capacity', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveBulkSmsSlots(1, 500);

      expect(result.canSend).toBe(true);
      expect(result.availableSlots).toBe(1000);
      expect(typeof result.incrementAndRelease).toBe('function');
      expect(typeof result.rollback).toBe('function');
    });

    it('should return insufficient capacity error', async () => {
      const mockUser = createMockUser({
        smsUsageCount: 900,
        smsUsageLimit: 1000,
      });
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveBulkSmsSlots(1, 200);

      expect(result.canSend).toBe(false);
      expect(result.error).toBe('Insufficient SMS capacity');
      expect(result.availableSlots).toBe(100);
      expect(result.requestedCount).toBe(200);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should incrementAndRelease correctly', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveBulkSmsSlots(1, 100);
      await result.incrementAndRelease(50); // Only 50 actually sent

      expect(mockUser.increment).toHaveBeenCalledWith('smsUsageCount', {
        by: 50,
        transaction: mockTransaction,
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback discards transaction', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveBulkSmsSlots(1, 100);
      await result.rollback();

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should handle zero available slots', async () => {
      const mockUser = createMockUser({
        smsUsageCount: 1000,
        smsUsageLimit: 1000,
      });
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveBulkSmsSlots(1, 10);

      expect(result.canSend).toBe(false);
      expect(result.availableSlots).toBe(0);
    });

    it('should return error when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const result = await smsLimitService.reserveBulkSmsSlots(999, 100);

      expect(result.canSend).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.availableSlots).toBe(0);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should not increment when actualSentCount is 0', async () => {
      const mockUser = createMockUser();
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveBulkSmsSlots(1, 100);
      await result.incrementAndRelease(0);

      expect(mockUser.increment).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle incrementAndRelease error', async () => {
      const mockUser = createMockUser();
      mockUser.increment.mockRejectedValue(new Error('DB error'));
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveBulkSmsSlots(1, 100);

      await expect(result.incrementAndRelease(50)).rejects.toThrow('DB error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle transaction creation error', async () => {
      sequelize.transaction.mockRejectedValue(new Error('DB connection failed'));

      await expect(smsLimitService.reserveBulkSmsSlots(1, 100)).rejects.toThrow('DB connection failed');
    });

    it('should handle User.findByPk error inside transaction', async () => {
      User.findByPk.mockRejectedValue(new Error('DB query failed'));

      await expect(smsLimitService.reserveBulkSmsSlots(1, 100)).rejects.toThrow('DB query failed');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  // ===========================================
  // getUsageStats Tests
  // ===========================================
  describe('getUsageStats', () => {
    it('should return correct usage stats', async () => {
      User.findByPk.mockResolvedValue({
        smsUsageCount: 250,
        smsUsageLimit: 1000,
      });

      const result = await smsLimitService.getUsageStats(1);

      expect(result.count).toBe(250);
      expect(result.limit).toBe(1000);
      expect(result.remaining).toBe(750);
    });

    it('should throw when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(smsLimitService.getUsageStats(999)).rejects.toThrow('User not found');
    });

    it('should only fetch necessary attributes', async () => {
      User.findByPk.mockResolvedValue({
        smsUsageCount: 0,
        smsUsageLimit: 500,
      });

      await smsLimitService.getUsageStats(1);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['smsUsageCount', 'smsUsageLimit'],
      });
    });

    it('should handle zero remaining slots', async () => {
      User.findByPk.mockResolvedValue({
        smsUsageCount: 1000,
        smsUsageLimit: 1000,
      });

      const result = await smsLimitService.getUsageStats(1);

      expect(result.remaining).toBe(0);
    });

    it('should handle user with zero limit', async () => {
      User.findByPk.mockResolvedValue({
        smsUsageCount: 0,
        smsUsageLimit: 0,
      });

      const result = await smsLimitService.getUsageStats(1);

      expect(result.count).toBe(0);
      expect(result.limit).toBe(0);
      expect(result.remaining).toBe(0);
    });
  });

  // ===========================================
  // Edge Cases and Race Condition Prevention
  // ===========================================
  describe('Race Condition Prevention', () => {
    it('should use transaction locking to prevent race conditions', async () => {
      const mockUser = {
        id: 1,
        smsUsageCount: 9,
        smsUsageLimit: 10,
        subscriptionStatus: 'active',
        increment: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await smsLimitService.reserveSmsSlot(1);

      // Verify lock was used
      expect(User.findByPk).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          lock: 'UPDATE',
          transaction: mockTransaction,
        })
      );
    });

    it('should handle exactly at limit boundary', async () => {
      const mockUser = {
        id: 1,
        smsUsageCount: 999,
        smsUsageLimit: 1000,
        subscriptionStatus: 'active',
        increment: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1);

      expect(result.canSend).toBe(true);
      expect(result.remainingSlots).toBe(1);
    });

    it('should reject when exactly at limit', async () => {
      const mockUser = {
        id: 1,
        smsUsageCount: 1000,
        smsUsageLimit: 1000,
        subscriptionStatus: 'active',
        increment: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await smsLimitService.reserveSmsSlot(1);

      expect(result.canSend).toBe(false);
      expect(result.remainingSlots).toBe(0);
    });
  });
});
