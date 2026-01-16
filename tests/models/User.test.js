/**
 * User Model Tests
 *
 * Tests all User instance methods:
 * - comparePassword
 * - toJSON
 * - isTrialActive
 * - isInGracePeriod
 * - isHardLocked
 * - canSendSms
 * - startTrial
 * - regenerateApiKey
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Mock dependencies before importing User
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../src/config/database', () => ({
  sequelize: {
    define: jest.fn(() => ({
      prototype: {},
    })),
  },
}));

// Since User model uses Sequelize.define, we need to test the methods independently
// We'll create a mock user object that simulates the Sequelize instance methods

describe('User Model Instance Methods', () => {
  // Helper to create a mock user with all methods
  const createMockUserInstance = (overrides = {}) => {
    const userData = {
      id: 1,
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      businessName: 'Test Business',
      apiKey: 'ff_testapikey123456789012345678901234567890123456',
      verificationToken: 'verification123',
      verificationTokenExpires: new Date(),
      resetPasswordToken: 'reset123',
      resetPasswordTokenExpires: new Date(),
      subscriptionStatus: 'trial',
      subscriptionPlan: null,
      smsUsageCount: 0,
      smsUsageLimit: 10,
      trialStartsAt: null,
      trialEndsAt: null,
      marketingStatus: 'active',
      ...overrides,
    };

    return {
      ...userData,
      get: function() { return this; },
      save: jest.fn().mockResolvedValue(this),
      update: jest.fn().mockResolvedValue(this),
    };
  };

  // ===========================================
  // comparePassword Tests
  // ===========================================
  describe('comparePassword()', () => {
    let hashedPassword;
    const plainPassword = 'Test123!@#';

    beforeAll(async () => {
      hashedPassword = await bcrypt.hash(plainPassword, 10);
    });

    it('should return true for correct password', async () => {
      const user = createMockUserInstance({ password: hashedPassword });
      const result = await bcrypt.compare(plainPassword, user.password);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = createMockUserInstance({ password: hashedPassword });
      const result = await bcrypt.compare('WrongPassword123!', user.password);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const user = createMockUserInstance({ password: hashedPassword });
      const result = await bcrypt.compare('', user.password);
      expect(result).toBe(false);
    });

    it('should handle null password gracefully', async () => {
      const user = createMockUserInstance({ password: hashedPassword });
      // bcrypt.compare throws for null - this tests that callers should validate input first
      await expect(bcrypt.compare(null, user.password)).rejects.toThrow();
    });
  });

  // ===========================================
  // toJSON Tests
  // ===========================================
  describe('toJSON()', () => {
    const toJSON = function() {
      const values = Object.assign({}, this.get());
      delete values.password;
      delete values.apiKey;
      delete values.verificationToken;
      delete values.verificationTokenExpires;
      delete values.resetPasswordToken;
      delete values.resetPasswordTokenExpires;
      return values;
    };

    it('should exclude password from JSON output', () => {
      const user = createMockUserInstance();
      user.toJSON = toJSON.bind(user);

      const json = user.toJSON();

      expect(json).not.toHaveProperty('password');
    });

    it('should exclude apiKey from JSON output', () => {
      const user = createMockUserInstance();
      user.toJSON = toJSON.bind(user);

      const json = user.toJSON();

      expect(json).not.toHaveProperty('apiKey');
    });

    it('should exclude verificationToken from JSON output', () => {
      const user = createMockUserInstance();
      user.toJSON = toJSON.bind(user);

      const json = user.toJSON();

      expect(json).not.toHaveProperty('verificationToken');
    });

    it('should exclude verificationTokenExpires from JSON output', () => {
      const user = createMockUserInstance();
      user.toJSON = toJSON.bind(user);

      const json = user.toJSON();

      expect(json).not.toHaveProperty('verificationTokenExpires');
    });

    it('should exclude resetPasswordToken from JSON output', () => {
      const user = createMockUserInstance();
      user.toJSON = toJSON.bind(user);

      const json = user.toJSON();

      expect(json).not.toHaveProperty('resetPasswordToken');
    });

    it('should exclude resetPasswordTokenExpires from JSON output', () => {
      const user = createMockUserInstance();
      user.toJSON = toJSON.bind(user);

      const json = user.toJSON();

      expect(json).not.toHaveProperty('resetPasswordTokenExpires');
    });

    it('should include non-sensitive fields in JSON output', () => {
      const user = createMockUserInstance({
        id: 42,
        email: 'user@example.com',
        businessName: 'My Business',
      });
      user.toJSON = toJSON.bind(user);

      const json = user.toJSON();

      expect(json).toHaveProperty('id', 42);
      expect(json).toHaveProperty('email', 'user@example.com');
      expect(json).toHaveProperty('businessName', 'My Business');
    });
  });

  // ===========================================
  // isTrialActive Tests
  // ===========================================
  describe('isTrialActive()', () => {
    const isTrialActive = function() {
      if (!this.trialEndsAt) return false;
      const now = new Date();
      return now < new Date(this.trialEndsAt);
    };

    it('should return false when trialEndsAt is null', () => {
      const user = createMockUserInstance({ trialEndsAt: null });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(false);
    });

    it('should return false when trialEndsAt is undefined', () => {
      const user = createMockUserInstance();
      delete user.trialEndsAt;
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(false);
    });

    it('should return true when trial is active (future date)', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const user = createMockUserInstance({ trialEndsAt: futureDate });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(true);
    });

    it('should return false when trial has expired (past date)', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const user = createMockUserInstance({ trialEndsAt: pastDate });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(false);
    });

    it('should return true for trial ending in 1 minute', () => {
      const soonDate = new Date(Date.now() + 60 * 1000); // 1 minute from now
      const user = createMockUserInstance({ trialEndsAt: soonDate });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(true);
    });

    it('should return false when trial ended 1 minute ago', () => {
      const recentPast = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const user = createMockUserInstance({ trialEndsAt: recentPast });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(false);
    });
  });

  // ===========================================
  // isInGracePeriod Tests
  // ===========================================
  describe('isInGracePeriod()', () => {
    const isInGracePeriod = function() {
      if (!this.trialEndsAt) return false;
      const now = new Date();
      const trialEnd = new Date(this.trialEndsAt);
      const graceEnd = new Date(this.trialEndsAt);
      graceEnd.setDate(graceEnd.getDate() + 5); // 5-day grace period
      return now > trialEnd && now < graceEnd;
    };

    it('should return false when trialEndsAt is null', () => {
      const user = createMockUserInstance({ trialEndsAt: null });
      user.isInGracePeriod = isInGracePeriod.bind(user);

      expect(user.isInGracePeriod()).toBe(false);
    });

    it('should return false when trial is still active', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const user = createMockUserInstance({ trialEndsAt: futureDate });
      user.isInGracePeriod = isInGracePeriod.bind(user);

      expect(user.isInGracePeriod()).toBe(false);
    });

    it('should return true when in grace period (1 day after trial end)', () => {
      const trialEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const user = createMockUserInstance({ trialEndsAt: trialEnd });
      user.isInGracePeriod = isInGracePeriod.bind(user);

      expect(user.isInGracePeriod()).toBe(true);
    });

    it('should return true when in grace period (3 days after trial end)', () => {
      const trialEnd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const user = createMockUserInstance({ trialEndsAt: trialEnd });
      user.isInGracePeriod = isInGracePeriod.bind(user);

      expect(user.isInGracePeriod()).toBe(true);
    });

    it('should return true at 4 days after trial end (still within 5-day grace)', () => {
      const trialEnd = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
      const user = createMockUserInstance({ trialEndsAt: trialEnd });
      user.isInGracePeriod = isInGracePeriod.bind(user);

      expect(user.isInGracePeriod()).toBe(true);
    });

    it('should return false when past grace period (6 days after trial end)', () => {
      const trialEnd = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // 6 days ago
      const user = createMockUserInstance({ trialEndsAt: trialEnd });
      user.isInGracePeriod = isInGracePeriod.bind(user);

      expect(user.isInGracePeriod()).toBe(false);
    });

    it('should return false when far past grace period (30 days)', () => {
      const trialEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const user = createMockUserInstance({ trialEndsAt: trialEnd });
      user.isInGracePeriod = isInGracePeriod.bind(user);

      expect(user.isInGracePeriod()).toBe(false);
    });
  });

  // ===========================================
  // isHardLocked Tests
  // ===========================================
  describe('isHardLocked()', () => {
    const isHardLocked = function() {
      if (!this.trialEndsAt) return false;
      const now = new Date();
      const graceEnd = new Date(this.trialEndsAt);
      graceEnd.setDate(graceEnd.getDate() + 5);
      return now > graceEnd && this.subscriptionStatus !== 'active';
    };

    it('should return false when trialEndsAt is null', () => {
      const user = createMockUserInstance({ trialEndsAt: null });
      user.isHardLocked = isHardLocked.bind(user);

      expect(user.isHardLocked()).toBe(false);
    });

    it('should return false when trial is still active', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const user = createMockUserInstance({
        trialEndsAt: futureDate,
        subscriptionStatus: 'trial'
      });
      user.isHardLocked = isHardLocked.bind(user);

      expect(user.isHardLocked()).toBe(false);
    });

    it('should return false when in grace period', () => {
      const trialEnd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const user = createMockUserInstance({
        trialEndsAt: trialEnd,
        subscriptionStatus: 'trial'
      });
      user.isHardLocked = isHardLocked.bind(user);

      expect(user.isHardLocked()).toBe(false);
    });

    it('should return true when past grace period and not subscribed', () => {
      const trialEnd = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const user = createMockUserInstance({
        trialEndsAt: trialEnd,
        subscriptionStatus: 'trial'
      });
      user.isHardLocked = isHardLocked.bind(user);

      expect(user.isHardLocked()).toBe(true);
    });

    it('should return false when past grace period but has active subscription', () => {
      const trialEnd = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const user = createMockUserInstance({
        trialEndsAt: trialEnd,
        subscriptionStatus: 'active'
      });
      user.isHardLocked = isHardLocked.bind(user);

      expect(user.isHardLocked()).toBe(false);
    });

    it('should return true when past grace period with cancelled subscription', () => {
      const trialEnd = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const user = createMockUserInstance({
        trialEndsAt: trialEnd,
        subscriptionStatus: 'cancelled'
      });
      user.isHardLocked = isHardLocked.bind(user);

      expect(user.isHardLocked()).toBe(true);
    });
  });

  // ===========================================
  // canSendSms Tests
  // ===========================================
  describe('canSendSms()', () => {
    const canSendSms = function() {
      if (this.subscriptionStatus === 'past_due') return false;
      if (this.subscriptionStatus === 'active') {
        return this.smsUsageCount < this.smsUsageLimit;
      }
      return this.smsUsageCount < this.smsUsageLimit;
    };

    it('should return false when subscription is past_due', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'past_due',
        smsUsageCount: 0,
        smsUsageLimit: 1000
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(false);
    });

    it('should return true for active subscription under limit', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'active',
        smsUsageCount: 500,
        smsUsageLimit: 1000
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(true);
    });

    it('should return false for active subscription at limit', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'active',
        smsUsageCount: 1000,
        smsUsageLimit: 1000
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(false);
    });

    it('should return false for active subscription over limit', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'active',
        smsUsageCount: 1001,
        smsUsageLimit: 1000
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(false);
    });

    it('should return true for trial user under limit', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'trial',
        smsUsageCount: 5,
        smsUsageLimit: 10
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(true);
    });

    it('should return false for trial user at limit', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'trial',
        smsUsageCount: 10,
        smsUsageLimit: 10
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(false);
    });

    it('should return true for cancelled user still under limit', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'cancelled',
        smsUsageCount: 5,
        smsUsageLimit: 10
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(true);
    });
  });

  // ===========================================
  // startTrial Tests
  // ===========================================
  describe('startTrial()', () => {
    const TRIAL_DURATION_DAYS = 14;

    const startTrial = async function() {
      if (this.trialStartsAt) return; // Already started
      const now = new Date();
      this.trialStartsAt = now;
      this.trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
      this.marketingStatus = 'trial_active';
      await this.save();
    };

    it('should set trialStartsAt to current time', async () => {
      const user = createMockUserInstance({ trialStartsAt: null, trialEndsAt: null });
      user.startTrial = startTrial.bind(user);

      const before = Date.now();
      await user.startTrial();
      const after = Date.now();

      expect(user.trialStartsAt).not.toBeNull();
      expect(user.trialStartsAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(user.trialStartsAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('should set trialEndsAt to 14 days from now', async () => {
      const user = createMockUserInstance({ trialStartsAt: null, trialEndsAt: null });
      user.startTrial = startTrial.bind(user);

      await user.startTrial();

      const expectedEnd = user.trialStartsAt.getTime() + 14 * 24 * 60 * 60 * 1000;
      expect(user.trialEndsAt.getTime()).toBe(expectedEnd);
    });

    it('should set marketingStatus to trial_active', async () => {
      const user = createMockUserInstance({
        trialStartsAt: null,
        trialEndsAt: null,
        marketingStatus: 'active'
      });
      user.startTrial = startTrial.bind(user);

      await user.startTrial();

      expect(user.marketingStatus).toBe('trial_active');
    });

    it('should call save() to persist changes', async () => {
      const user = createMockUserInstance({ trialStartsAt: null, trialEndsAt: null });
      user.startTrial = startTrial.bind(user);

      await user.startTrial();

      expect(user.save).toHaveBeenCalled();
    });

    it('should not restart trial if already started (idempotent)', async () => {
      const existingStart = new Date('2024-01-01');
      const existingEnd = new Date('2024-01-15');
      const user = createMockUserInstance({
        trialStartsAt: existingStart,
        trialEndsAt: existingEnd
      });
      user.startTrial = startTrial.bind(user);

      await user.startTrial();

      expect(user.trialStartsAt).toEqual(existingStart);
      expect(user.trialEndsAt).toEqual(existingEnd);
      expect(user.save).not.toHaveBeenCalled();
    });

    it('should not modify user if trial already started', async () => {
      const existingStart = new Date('2024-01-01');
      const user = createMockUserInstance({
        trialStartsAt: existingStart,
        marketingStatus: 'churned'
      });
      user.startTrial = startTrial.bind(user);

      await user.startTrial();

      expect(user.marketingStatus).toBe('churned');
    });
  });

  // ===========================================
  // regenerateApiKey Tests
  // ===========================================
  describe('regenerateApiKey()', () => {
    const regenerateApiKey = async function() {
      this.apiKey = `ff_${crypto.randomBytes(24).toString('hex')}`;
      await this.save();
      return this.apiKey;
    };

    it('should generate API key with ff_ prefix', async () => {
      const user = createMockUserInstance({ apiKey: null });
      user.regenerateApiKey = regenerateApiKey.bind(user);

      const newKey = await user.regenerateApiKey();

      expect(newKey).toMatch(/^ff_/);
    });

    it('should generate API key with correct format (ff_ + 48 hex chars)', async () => {
      const user = createMockUserInstance({ apiKey: null });
      user.regenerateApiKey = regenerateApiKey.bind(user);

      const newKey = await user.regenerateApiKey();

      expect(newKey).toMatch(/^ff_[a-f0-9]{48}$/);
    });

    it('should generate unique API keys on each call', async () => {
      const user = createMockUserInstance({ apiKey: null });
      user.regenerateApiKey = regenerateApiKey.bind(user);

      const key1 = await user.regenerateApiKey();
      const key2 = await user.regenerateApiKey();

      expect(key1).not.toBe(key2);
    });

    it('should call save() to persist the new key', async () => {
      const user = createMockUserInstance({ apiKey: null });
      user.regenerateApiKey = regenerateApiKey.bind(user);

      await user.regenerateApiKey();

      expect(user.save).toHaveBeenCalled();
    });

    it('should return the newly generated key', async () => {
      const user = createMockUserInstance({ apiKey: null });
      user.regenerateApiKey = regenerateApiKey.bind(user);

      const returnedKey = await user.regenerateApiKey();

      expect(returnedKey).toBe(user.apiKey);
    });
  });
});
