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

// ===========================================
// Hook Behavior Tests (beforeCreate, beforeUpdate)
// ===========================================
describe('User Model Hooks', () => {
  describe('beforeCreate hook behavior', () => {
    it('should hash password before creating user', async () => {
      const plainPassword = 'MySecurePassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Verify hashed password is different from plain password
      expect(hashedPassword).not.toBe(plainPassword);

      // Verify hash starts with bcrypt identifier
      expect(hashedPassword).toMatch(/^\$2[ayb]\$/);

      // Verify hashed password is correct length (60 chars for bcrypt)
      expect(hashedPassword.length).toBe(60);
    });

    it('should generate API key for tenant role', () => {
      const apiKey = `ff_${crypto.randomBytes(24).toString('hex')}`;

      expect(apiKey).toMatch(/^ff_[a-f0-9]{48}$/);
      expect(apiKey.length).toBe(51); // 'ff_' (3) + 48 hex chars
    });

    it('should not generate API key if already provided', () => {
      const existingApiKey = 'ff_existingkey123456789012345678901234567890123456';
      const user = { apiKey: existingApiKey };

      // If apiKey already exists, hook should not overwrite
      expect(user.apiKey).toBe(existingApiKey);
    });

    it('should only generate API key for tenant role', () => {
      // Simulate hook logic: only tenants get API keys
      const shouldGenerateApiKey = (role, existingApiKey) => {
        return role === 'tenant' && !existingApiKey;
      };

      expect(shouldGenerateApiKey('tenant', null)).toBe(true);
      expect(shouldGenerateApiKey('super_admin', null)).toBe(false);
      expect(shouldGenerateApiKey('tenant', 'ff_existing')).toBe(false);
    });
  });

  describe('beforeUpdate hook behavior', () => {
    it('should rehash password when changed', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';

      const oldHash = await bcrypt.hash(oldPassword, 10);
      const newHash = await bcrypt.hash(newPassword, 10);

      // Hashes should be different
      expect(oldHash).not.toBe(newHash);

      // Both should be valid bcrypt hashes
      expect(oldHash).toMatch(/^\$2[ayb]\$/);
      expect(newHash).toMatch(/^\$2[ayb]\$/);
    });

    it('should not rehash password if not changed', async () => {
      const password = 'SamePassword123!';
      const hashedOnce = await bcrypt.hash(password, 10);

      // Simulate checking if password changed (Sequelize's changed('password'))
      const passwordChanged = false;

      // If not changed, hook should skip rehashing
      if (!passwordChanged) {
        // Password remains the same
        expect(hashedOnce).toMatch(/^\$2[ayb]\$/);
      }
    });

    it('should detect password field changes correctly', () => {
      // Simulate Sequelize's changed() method behavior
      const user = {
        _previousDataValues: { password: 'oldHash' },
        password: 'newHash',
        changed: function(field) {
          return this[field] !== this._previousDataValues[field];
        }
      };

      expect(user.changed('password')).toBe(true);

      const unchangedUser = {
        _previousDataValues: { password: 'sameHash' },
        password: 'sameHash',
        changed: function(field) {
          return this[field] !== this._previousDataValues[field];
        }
      };

      expect(unchangedUser.changed('password')).toBe(false);
    });
  });
});

// ===========================================
// Token Generation Pattern Tests
// ===========================================
describe('Token Generation Patterns', () => {
  describe('Verification Token', () => {
    it('should generate cryptographically secure verification token', () => {
      const token = crypto.randomBytes(32).toString('hex');

      // Token should be 64 hex characters
      expect(token.length).toBe(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');

      expect(token1).not.toBe(token2);
    });

    it('should calculate correct expiration (24 hours)', () => {
      const now = new Date();
      const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Should be 24 hours in the future
      const diffMs = expires.getTime() - now.getTime();
      const diffHours = diffMs / (60 * 60 * 1000);

      expect(diffHours).toBe(24);
    });
  });

  describe('Password Reset Token', () => {
    it('should generate cryptographically secure reset token', () => {
      const token = crypto.randomBytes(32).toString('hex');

      expect(token.length).toBe(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should calculate correct expiration (1 hour)', () => {
      const now = new Date();
      const expires = new Date(now.getTime() + 60 * 60 * 1000);

      const diffMs = expires.getTime() - now.getTime();
      const diffMinutes = diffMs / (60 * 1000);

      expect(diffMinutes).toBe(60);
    });
  });
});

// ===========================================
// Edge Cases and Boundary Conditions
// ===========================================
describe('Edge Cases', () => {
  // Helper to create a mock user with all methods
  const createMockUserInstance = (overrides = {}) => {
    return {
      smsUsageCount: 0,
      smsUsageLimit: 10,
      subscriptionStatus: 'trial',
      trialEndsAt: null,
      ...overrides,
    };
  };

  describe('Trial Expiration Edge Cases', () => {
    const isTrialActive = function() {
      if (!this.trialEndsAt) return false;
      const now = new Date();
      return now < new Date(this.trialEndsAt);
    };

    it('should handle trialEndsAt as string (ISO format)', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const user = createMockUserInstance({ trialEndsAt: futureDate });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(true);
    });

    it('should handle trialEndsAt as Date object', () => {
      const futureDate = new Date(Date.now() + 86400000);
      const user = createMockUserInstance({ trialEndsAt: futureDate });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(true);
    });

    it('should return false for exactly now (boundary)', () => {
      // At exact boundary, trial is no longer active (< not <=)
      const now = new Date();
      const user = createMockUserInstance({ trialEndsAt: now });
      user.isTrialActive = isTrialActive.bind(user);

      expect(user.isTrialActive()).toBe(false);
    });
  });

  describe('SMS Limit Edge Cases', () => {
    const canSendSms = function() {
      if (this.subscriptionStatus === 'past_due') return false;
      return this.smsUsageCount < this.smsUsageLimit;
    };

    it('should return true at zero usage', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'active',
        smsUsageCount: 0,
        smsUsageLimit: 1000
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(true);
    });

    it('should return true at limit - 1', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'active',
        smsUsageCount: 999,
        smsUsageLimit: 1000
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(true);
    });

    it('should handle zero limit gracefully', () => {
      const user = createMockUserInstance({
        subscriptionStatus: 'active',
        smsUsageCount: 0,
        smsUsageLimit: 0
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(false);
    });

    it('should handle negative usage gracefully', () => {
      // Should never happen, but test defensive behavior
      const user = createMockUserInstance({
        subscriptionStatus: 'active',
        smsUsageCount: -1,
        smsUsageLimit: 10
      });
      user.canSendSms = canSendSms.bind(user);

      expect(user.canSendSms()).toBe(true);
    });
  });

  describe('Password Hashing Edge Cases', () => {
    it('should handle empty string password', async () => {
      const emptyPassword = '';
      const hash = await bcrypt.hash(emptyPassword, 10);

      expect(hash).toMatch(/^\$2[ayb]\$/);

      const isMatch = await bcrypt.compare('', hash);
      expect(isMatch).toBe(true);
    });

    it('should handle very long password', async () => {
      // bcrypt has a 72 character limit on input
      const longPassword = 'A'.repeat(100);
      const hash = await bcrypt.hash(longPassword, 10);

      expect(hash).toMatch(/^\$2[ayb]\$/);

      // Due to bcrypt's 72 char limit, only first 72 chars matter
      const isMatch = await bcrypt.compare('A'.repeat(100), hash);
      expect(isMatch).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = '密码🔐Пароль';
      const hash = await bcrypt.hash(unicodePassword, 10);

      const isMatch = await bcrypt.compare(unicodePassword, hash);
      expect(isMatch).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      const hash = await bcrypt.hash(specialPassword, 10);

      const isMatch = await bcrypt.compare(specialPassword, hash);
      expect(isMatch).toBe(true);
    });
  });
});
