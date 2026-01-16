/**
 * Trial Notifications Cron Job Tests
 *
 * Tests for trial expiration warning emails:
 * - Verification reminders (24-48h after signup)
 * - 7-day warning
 * - 3-day warning
 * - 1-day warning
 * - Trial expired notification
 * - Error handling and admin alerts
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
const mockSendVerificationReminderEmail = jest.fn().mockResolvedValue(true);
const mockSendTrialWarning7DaysEmail = jest.fn().mockResolvedValue(true);
const mockSendTrialEndingEmail = jest.fn().mockResolvedValue(true);
const mockSendTrialWarning1DayEmail = jest.fn().mockResolvedValue(true);
const mockSendTrialExpiredEmail = jest.fn().mockResolvedValue(true);
const mockSendAdminAlert = jest.fn().mockResolvedValue(true);

jest.mock('../../src/services/emailService', () => ({
  sendVerificationReminderEmail: mockSendVerificationReminderEmail,
  sendTrialWarning7DaysEmail: mockSendTrialWarning7DaysEmail,
  sendTrialEndingEmail: mockSendTrialEndingEmail,
  sendTrialWarning1DayEmail: mockSendTrialWarning1DayEmail,
  sendTrialExpiredEmail: mockSendTrialExpiredEmail,
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
const { executeTrialNotifications, initTrialNotificationsCron } = require('../../src/cron/trial-notifications');
const cron = require('node-cron');

describe('Trial Notifications Cron Job', () => {
  // Helper to create mock user with update method
  const createMockUser = (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    businessName: 'Test Business',
    isVerified: true,
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    verificationToken: null,
    verificationReminderSentAt: null,
    trialWarning7DaySentAt: null,
    trialWarning3DaySentAt: null,
    trialWarning1DaySentAt: null,
    trialExpiredEmailSentAt: null,
    update: mockUserUpdate,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindAll.mockResolvedValue([]);
  });

  // ===========================================
  // Verification Reminder Tests (24-48h window)
  // ===========================================
  describe('Verification Reminders', () => {
    it('should find unverified users created 24-48h ago', async () => {
      await executeTrialNotifications();

      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isVerified: false,
            verificationReminderSentAt: null,
          })
        })
      );
    });

    it('should send verification reminder email to unverified users', async () => {
      const unverifiedUser = createMockUser({
        isVerified: false,
        verificationToken: 'token123',
        createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000) // 30h ago
      });
      mockUserFindAll.mockResolvedValueOnce([unverifiedUser]);

      await executeTrialNotifications();

      expect(mockSendVerificationReminderEmail).toHaveBeenCalledWith(
        unverifiedUser.email,
        unverifiedUser.businessName,
        unverifiedUser.verificationToken
      );
    });

    it('should update verificationReminderSentAt after sending', async () => {
      const unverifiedUser = createMockUser({
        isVerified: false,
        verificationToken: 'token123'
      });
      mockUserFindAll.mockResolvedValueOnce([unverifiedUser]);

      await executeTrialNotifications();

      expect(unverifiedUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationReminderSentAt: expect.any(Date)
        })
      );
    });

    it('should skip users without verification token', async () => {
      // This is handled by the query where clause
      mockUserFindAll.mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(mockSendVerificationReminderEmail).not.toHaveBeenCalled();
    });

    it('should skip users where reminder already sent', async () => {
      // Query filters these out
      mockUserFindAll.mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(mockSendVerificationReminderEmail).not.toHaveBeenCalled();
    });

    it('should continue processing other users if one email fails', async () => {
      const user1 = createMockUser({ id: 1, email: 'user1@test.com', isVerified: false, verificationToken: 'token1' });
      const user2 = createMockUser({ id: 2, email: 'user2@test.com', isVerified: false, verificationToken: 'token2' });

      mockUserFindAll.mockResolvedValueOnce([user1, user2]);
      mockSendVerificationReminderEmail
        .mockRejectedValueOnce(new Error('Email failed'))
        .mockResolvedValueOnce(true);

      await executeTrialNotifications();

      expect(mockSendVerificationReminderEmail).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send verification reminder',
        expect.objectContaining({ userId: 1 })
      );
    });
  });

  // ===========================================
  // 7-Day Warning Tests
  // ===========================================
  describe('7-Day Warning', () => {
    it('should find users with trial ending in 6-7 days', async () => {
      await executeTrialNotifications();

      // Second call (after verification reminders)
      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscriptionStatus: 'trial',
            isVerified: true,
            trialWarning7DaySentAt: null,
          })
        })
      );
    });

    it('should send 7-day warning email', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000) // 6.5 days from now
      });

      // First call returns no verification reminders, second returns 7-day users
      mockUserFindAll
        .mockResolvedValueOnce([]) // verification
        .mockResolvedValueOnce([user]) // 7-day
        .mockResolvedValueOnce([]) // 3-day
        .mockResolvedValueOnce([]) // 1-day
        .mockResolvedValueOnce([]); // expired

      await executeTrialNotifications();

      expect(mockSendTrialWarning7DaysEmail).toHaveBeenCalledWith(
        user.email,
        user.businessName,
        user.trialEndsAt
      );
    });

    it('should update trialWarning7DaySentAt after sending', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          trialWarning7DaySentAt: expect.any(Date)
        })
      );
    });

    it('should log successful 7-day warning send', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(logger.info).toHaveBeenCalledWith(
        'Sent 7-day trial warning',
        expect.objectContaining({ userId: user.id, email: user.email })
      );
    });
  });

  // ===========================================
  // 3-Day Warning Tests
  // ===========================================
  describe('3-Day Warning', () => {
    it('should find users with trial ending in 2-3 days', async () => {
      await executeTrialNotifications();

      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscriptionStatus: 'trial',
            isVerified: true,
            trialWarning3DaySentAt: null,
          })
        })
      );
    });

    it('should send 3-day warning email (sendTrialEndingEmail)', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000) // 2.5 days from now
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(mockSendTrialEndingEmail).toHaveBeenCalledWith(
        user.email,
        user.businessName,
        user.trialEndsAt
      );
    });

    it('should update trialWarning3DaySentAt after sending', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          trialWarning3DaySentAt: expect.any(Date)
        })
      );
    });
  });

  // ===========================================
  // 1-Day Warning Tests
  // ===========================================
  describe('1-Day Warning', () => {
    it('should find users with trial ending in 0-1 days', async () => {
      await executeTrialNotifications();

      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscriptionStatus: 'trial',
            isVerified: true,
            trialWarning1DaySentAt: null,
          })
        })
      );
    });

    it('should send 1-day warning email', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(mockSendTrialWarning1DayEmail).toHaveBeenCalledWith(
        user.email,
        user.businessName,
        user.trialEndsAt
      );
    });

    it('should update trialWarning1DaySentAt after sending', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([]);

      await executeTrialNotifications();

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          trialWarning1DaySentAt: expect.any(Date)
        })
      );
    });
  });

  // ===========================================
  // Trial Expired Tests
  // ===========================================
  describe('Trial Expired', () => {
    it('should find users with trial expired in last 24h', async () => {
      await executeTrialNotifications();

      expect(mockUserFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscriptionStatus: 'trial',
            isVerified: true,
            trialExpiredEmailSentAt: null,
          })
        })
      );
    });

    it('should send trial expired email', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user]);

      await executeTrialNotifications();

      expect(mockSendTrialExpiredEmail).toHaveBeenCalledWith(
        user.email,
        user.businessName
      );
    });

    it('should update trialExpiredEmailSentAt and marketingStatus after sending', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user]);

      await executeTrialNotifications();

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          trialExpiredEmailSentAt: expect.any(Date),
          marketingStatus: 'trial_expired'
        })
      );
    });

    it('should log successful trial expired email send', async () => {
      const user = createMockUser({
        trialEndsAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      });

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([user]);

      await executeTrialNotifications();

      expect(logger.info).toHaveBeenCalledWith(
        'Sent trial expired email',
        expect.objectContaining({ userId: user.id, email: user.email })
      );
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should continue processing after individual email failure', async () => {
      const users = [
        createMockUser({ id: 1, email: 'user1@test.com', trialEndsAt: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000) }),
        createMockUser({ id: 2, email: 'user2@test.com', trialEndsAt: new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000) }),
      ];

      mockUserFindAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockSendTrialWarning7DaysEmail
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(true);

      await executeTrialNotifications();

      // Both users should have been attempted
      expect(mockSendTrialWarning7DaysEmail).toHaveBeenCalledTimes(2);

      // Error should be logged for first user
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send 7-day warning',
        expect.objectContaining({ userId: 1 })
      );
    });

    it('should send admin alert on major cron job failure', async () => {
      mockUserFindAll.mockRejectedValue(new Error('Database connection failed'));

      await executeTrialNotifications();

      expect(mockSendAdminAlert).toHaveBeenCalledWith(
        'Cron Job Failed: Trial Notifications',
        'Database connection failed',
        expect.any(String), // stack trace
        expect.objectContaining({
          cronJob: 'trial-notifications',
          timestamp: expect.any(String)
        })
      );
    });

    it('should log error when admin alert fails', async () => {
      mockUserFindAll.mockRejectedValue(new Error('Database error'));
      mockSendAdminAlert.mockRejectedValue(new Error('Alert failed'));

      await executeTrialNotifications();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send admin alert',
        expect.objectContaining({ error: 'Alert failed' })
      );
    });
  });

  // ===========================================
  // Initialization Tests
  // ===========================================
  describe('initTrialNotificationsCron()', () => {
    it('should schedule cron job with correct pattern', () => {
      initTrialNotificationsCron();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 * * * *', // Every hour
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'America/Los_Angeles'
        })
      );
    });

    it('should log scheduling info', () => {
      initTrialNotificationsCron();

      expect(logger.info).toHaveBeenCalledWith(
        'Scheduling trial notifications cron job',
        expect.objectContaining({ schedule: '0 * * * *' })
      );
    });
  });
});
