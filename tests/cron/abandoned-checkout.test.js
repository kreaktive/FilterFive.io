/**
 * Abandoned Checkout Cron Job Tests
 *
 * Tests for abandoned checkout recovery emails:
 * - 30-minute recovery (first touchpoint)
 * - 2-hour recovery (follow-up)
 * - Error handling and admin alerts
 * - Scheduling configuration
 */

const { userFactory } = require('../helpers/factories');

// Mock dependencies before importing
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  cron: jest.fn(),
}));

// Mock email service
const mockSendAbandonedCheckout30MinEmail = jest.fn().mockResolvedValue(true);
const mockSendAbandonedCheckoutEmail = jest.fn().mockResolvedValue(true);
const mockSendAdminAlert = jest.fn().mockResolvedValue(true);

jest.mock('../../src/services/emailService', () => ({
  sendAbandonedCheckout30MinEmail: mockSendAbandonedCheckout30MinEmail,
  sendAbandonedCheckoutEmail: mockSendAbandonedCheckoutEmail,
  sendAdminAlert: mockSendAdminAlert,
}));

// Mock User model
const mockUserFindAll = jest.fn();
const mockUserUpdate = jest.fn().mockResolvedValue(true);

jest.mock('../../src/models', () => ({
  User: {
    findAll: mockUserFindAll,
  },
}));

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

const logger = require('../../src/services/logger');
const { executeAbandonedCheckoutRecovery, initAbandonedCheckoutCron } = require('../../src/cron/abandoned-checkout');
const cron = require('node-cron');

describe('Abandoned Checkout Cron Job', () => {
  // Helper to create mock user with update method
  const createMockUser = (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    businessName: 'Test Business',
    subscriptionStatus: 'trial',
    checkoutStartedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    checkoutSessionId: 'cs_test123',
    checkoutRecovery30MinSentAt: null,
    checkoutRecoveryEmailSentAt: null,
    update: mockUserUpdate,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindAll.mockResolvedValue([]);
  });

  // ===========================================
  // 30-Minute Recovery Tests
  // ===========================================
  describe('30-Minute Recovery', () => {
    it('should find users who abandoned checkout 30min-2h ago', async () => {
      await executeAbandonedCheckoutRecovery();

      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            checkoutRecovery30MinSentAt: null,
          })
        })
      );
    });

    it('should send 30-minute recovery email', async () => {
      const user = createMockUser({
        checkoutStartedAt: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
      });

      mockUserFindAll.mockResolvedValueOnce([user]).mockResolvedValueOnce([]);

      await executeAbandonedCheckoutRecovery();

      expect(mockSendAbandonedCheckout30MinEmail).toHaveBeenCalledWith(
        user.email,
        user.businessName
      );
    });

    it('should update checkoutRecovery30MinSentAt after sending', async () => {
      const user = createMockUser({
        checkoutStartedAt: new Date(Date.now() - 45 * 60 * 1000)
      });

      mockUserFindAll.mockResolvedValueOnce([user]).mockResolvedValueOnce([]);

      await executeAbandonedCheckoutRecovery();

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          checkoutRecovery30MinSentAt: expect.any(Date)
        })
      );
    });

    it('should only target trial, cancelled, or inactive users', async () => {
      await executeAbandonedCheckoutRecovery();

      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscriptionStatus: expect.any(Object) // Op.in check
          })
        })
      );
    });

    it('should log successful 30-minute email send', async () => {
      const user = createMockUser({
        checkoutStartedAt: new Date(Date.now() - 45 * 60 * 1000)
      });

      mockUserFindAll.mockResolvedValueOnce([user]).mockResolvedValueOnce([]);

      await executeAbandonedCheckoutRecovery();

      expect(logger.info).toHaveBeenCalledWith(
        'Sent 30-min abandoned checkout email',
        expect.objectContaining({ userId: user.id, email: user.email })
      );
    });
  });

  // ===========================================
  // 2-Hour Recovery Tests
  // ===========================================
  describe('2-Hour Recovery', () => {
    it('should find users who abandoned checkout 2h-12h ago', async () => {
      await executeAbandonedCheckoutRecovery();

      // Second query for 2-hour recovery
      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            checkoutRecoveryEmailSentAt: null,
          })
        })
      );
    });

    it('should send 2-hour recovery email', async () => {
      const user = createMockUser({
        checkoutStartedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user]);

      await executeAbandonedCheckoutRecovery();

      expect(mockSendAbandonedCheckoutEmail).toHaveBeenCalledWith(
        user.email,
        user.businessName
      );
    });

    it('should update checkoutRecoveryEmailSentAt after sending', async () => {
      const user = createMockUser({
        checkoutStartedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user]);

      await executeAbandonedCheckoutRecovery();

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          checkoutRecoveryEmailSentAt: expect.any(Date)
        })
      );
    });

    it('should log successful 2-hour email send', async () => {
      const user = createMockUser({
        checkoutStartedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user]);

      await executeAbandonedCheckoutRecovery();

      expect(logger.info).toHaveBeenCalledWith(
        'Sent 2-hour abandoned checkout email',
        expect.objectContaining({ userId: user.id, email: user.email })
      );
    });

    it('should only target users without already sent recovery email', async () => {
      await executeAbandonedCheckoutRecovery();

      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            checkoutRecoveryEmailSentAt: null
          })
        })
      );
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should continue processing after individual email failure', async () => {
      const users = [
        createMockUser({ id: 1, email: 'user1@test.com', checkoutStartedAt: new Date(Date.now() - 45 * 60 * 1000) }),
        createMockUser({ id: 2, email: 'user2@test.com', checkoutStartedAt: new Date(Date.now() - 45 * 60 * 1000) }),
      ];

      mockUserFindAll
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce([]);

      mockSendAbandonedCheckout30MinEmail
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(true);

      await executeAbandonedCheckoutRecovery();

      // Both users should have been attempted
      expect(mockSendAbandonedCheckout30MinEmail).toHaveBeenCalledTimes(2);

      // Error should be logged for first user
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send 30-min abandoned checkout email',
        expect.objectContaining({ userId: 1 })
      );
    });

    it('should send admin alert on major cron job failure', async () => {
      mockUserFindAll.mockRejectedValue(new Error('Database connection failed'));

      await executeAbandonedCheckoutRecovery();

      expect(mockSendAdminAlert).toHaveBeenCalledWith(
        'Cron Job Failed: Abandoned Checkout',
        'Database connection failed',
        expect.any(String), // stack trace
        expect.objectContaining({
          cronJob: 'abandoned-checkout',
          timestamp: expect.any(String)
        })
      );
    });

    it('should log error when admin alert fails', async () => {
      mockUserFindAll.mockRejectedValue(new Error('Database error'));
      mockSendAdminAlert.mockRejectedValue(new Error('Alert failed'));

      await executeAbandonedCheckoutRecovery();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send admin alert',
        expect.objectContaining({ error: 'Alert failed' })
      );
    });
  });

  // ===========================================
  // Initialization Tests
  // ===========================================
  describe('initAbandonedCheckoutCron()', () => {
    it('should schedule cron job with correct pattern (every 15 minutes)', () => {
      initAbandonedCheckoutCron();

      expect(cron.schedule).toHaveBeenCalledWith(
        '*/15 * * * *', // Every 15 minutes
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'America/Los_Angeles'
        })
      );
    });

    it('should log scheduling info', () => {
      initAbandonedCheckoutCron();

      expect(logger.info).toHaveBeenCalledWith(
        'Scheduling abandoned checkout cron job',
        expect.objectContaining({ schedule: '*/15 * * * *' })
      );
    });
  });

  // ===========================================
  // Logging Tests
  // ===========================================
  describe('Logging', () => {
    it('should log cron job start', async () => {
      mockUserFindAll.mockResolvedValue([]);

      await executeAbandonedCheckoutRecovery();

      expect(logger.cron).toHaveBeenCalledWith('abandoned-checkout', 'started');
    });

    it('should log cron job completion with results', async () => {
      mockUserFindAll.mockResolvedValue([]);

      await executeAbandonedCheckoutRecovery();

      expect(logger.cron).toHaveBeenCalledWith(
        'abandoned-checkout',
        'completed',
        expect.objectContaining({
          sent30Min: expect.any(Number),
          sent2Hour: expect.any(Number),
          errors: expect.any(Number)
        })
      );
    });
  });
});
