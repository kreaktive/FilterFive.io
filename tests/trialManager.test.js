/**
 * Trial Manager Tests
 * Tests for trial status logic and redirect blocking
 */

const { buildTrialStatus, getRedirectBlockStatus } = require('../src/middleware/trialManager');

describe('Trial Manager', () => {
  describe('buildTrialStatus', () => {
    test('returns null for null user', () => {
      expect(buildTrialStatus(null)).toBeNull();
    });

    test('returns null for undefined user', () => {
      expect(buildTrialStatus(undefined)).toBeNull();
    });

    test('builds correct status for active trial user', () => {
      const mockUser = {
        isTrialActive: () => true,
        isInGracePeriod: () => false,
        isHardLocked: () => false,
        canSendSms: () => true,
        subscriptionStatus: null,
        trialEndsAt: new Date('2025-12-31')
      };

      const status = buildTrialStatus(mockUser);

      expect(status).toEqual({
        isActive: true,
        isInGracePeriod: false,
        isHardLocked: false,
        canSendSms: true,
        hasActiveSubscription: false,
        trialEndsAt: mockUser.trialEndsAt,
        subscriptionStatus: null
      });
    });

    test('builds correct status for subscribed user', () => {
      const mockUser = {
        isTrialActive: () => false,
        isInGracePeriod: () => false,
        isHardLocked: () => false,
        canSendSms: () => true,
        subscriptionStatus: 'active',
        trialEndsAt: new Date('2025-01-01')
      };

      const status = buildTrialStatus(mockUser);

      expect(status.hasActiveSubscription).toBe(true);
      expect(status.subscriptionStatus).toBe('active');
    });

    test('builds correct status for grace period user', () => {
      const mockUser = {
        isTrialActive: () => false,
        isInGracePeriod: () => true,
        isHardLocked: () => false,
        canSendSms: () => false,
        subscriptionStatus: null,
        trialEndsAt: new Date('2025-01-01')
      };

      const status = buildTrialStatus(mockUser);

      expect(status.isActive).toBe(false);
      expect(status.isInGracePeriod).toBe(true);
      expect(status.isHardLocked).toBe(false);
    });

    test('builds correct status for hard locked user', () => {
      const mockUser = {
        isTrialActive: () => false,
        isInGracePeriod: () => false,
        isHardLocked: () => true,
        canSendSms: () => false,
        subscriptionStatus: null,
        trialEndsAt: new Date('2024-01-01')
      };

      const status = buildTrialStatus(mockUser);

      expect(status.isActive).toBe(false);
      expect(status.isInGracePeriod).toBe(false);
      expect(status.isHardLocked).toBe(true);
      expect(status.canSendSms).toBe(false);
    });
  });

  describe('getRedirectBlockStatus', () => {
    test('does not block for active subscription', () => {
      const mockUser = {
        subscriptionStatus: 'active',
        isTrialActive: () => false,
        isHardLocked: () => false,
        isInGracePeriod: () => false
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(false);
      expect(result.reason).toBeNull();
    });

    test('does not block for active trial', () => {
      const mockUser = {
        subscriptionStatus: null,
        isTrialActive: () => true,
        isHardLocked: () => false,
        isInGracePeriod: () => false
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(false);
      expect(result.reason).toBeNull();
    });

    test('blocks with hard_locked reason when hard locked', () => {
      const mockUser = {
        subscriptionStatus: null,
        isTrialActive: () => false,
        isHardLocked: () => true,
        isInGracePeriod: () => false
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toBe('hard_locked');
    });

    test('blocks with grace_period reason during grace period', () => {
      const mockUser = {
        subscriptionStatus: null,
        isTrialActive: () => false,
        isHardLocked: () => false,
        isInGracePeriod: () => true
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toBe('grace_period');
    });

    test('blocks with trial_expired reason when trial expired and not in grace', () => {
      const mockUser = {
        subscriptionStatus: null,
        isTrialActive: () => false,
        isHardLocked: () => false,
        isInGracePeriod: () => false
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toBe('trial_expired');
    });

    test('subscription takes precedence over hard lock', () => {
      const mockUser = {
        subscriptionStatus: 'active',
        isTrialActive: () => false,
        isHardLocked: () => true,
        isInGracePeriod: () => true
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(false);
    });

    test('active trial takes precedence over grace period', () => {
      const mockUser = {
        subscriptionStatus: null,
        isTrialActive: () => true,
        isHardLocked: () => false,
        isInGracePeriod: () => true
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(false);
    });

    test('hard lock takes precedence over grace period', () => {
      const mockUser = {
        subscriptionStatus: null,
        isTrialActive: () => false,
        isHardLocked: () => true,
        isInGracePeriod: () => true
      };

      const result = getRedirectBlockStatus(mockUser);

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toBe('hard_locked');
    });
  });
});
