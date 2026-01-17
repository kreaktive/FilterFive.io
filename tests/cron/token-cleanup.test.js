/**
 * Token Cleanup Cron Job Tests
 *
 * Tests for the token cleanup cron job:
 * - executeTokenCleanup - Main execution function
 * - Verification token cleanup
 * - Password reset token cleanup
 * - Stripe/POS webhook cleanup
 * - Error handling and admin alerts
 * - initTokenCleanupCron - Scheduling
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies BEFORE requiring the module
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../../src/models', () => ({
  User: {
    update: jest.fn(),
  },
  StripeWebhookEvent: {
    cleanup: jest.fn(),
  },
  PosWebhookEvent: {
    cleanup: jest.fn(),
  },
}));

jest.mock('../../src/services/emailService', () => ({
  sendAdminAlert: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  cron: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const cron = require('node-cron');
const { User, StripeWebhookEvent, PosWebhookEvent } = require('../../src/models');
const { sendAdminAlert } = require('../../src/services/emailService');
const logger = require('../../src/services/logger');

const {
  initTokenCleanupCron,
  executeTokenCleanup,
} = require('../../src/cron/token-cleanup');

describe('Token Cleanup Cron Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    // Set up default successful responses
    User.update.mockResolvedValue([0]); // [affectedCount]
    StripeWebhookEvent.cleanup.mockResolvedValue(0);
    PosWebhookEvent.cleanup.mockResolvedValue(0);
    sendAdminAlert.mockResolvedValue(true);
  });

  // ===========================================
  // executeTokenCleanup Tests
  // ===========================================
  describe('executeTokenCleanup', () => {
    test('should log start and completion', async () => {
      await executeTokenCleanup();

      expect(logger.cron).toHaveBeenCalledWith('token-cleanup', 'started');
      expect(logger.cron).toHaveBeenCalledWith('token-cleanup', 'completed', expect.any(Object));
    });

    test('should clean expired verification tokens', async () => {
      User.update.mockResolvedValueOnce([5]); // 5 verification tokens cleaned
      User.update.mockResolvedValueOnce([0]); // 0 reset tokens

      await executeTokenCleanup();

      expect(User.update).toHaveBeenCalledWith(
        {
          verificationToken: null,
          verificationTokenExpires: null,
        },
        expect.objectContaining({
          where: expect.any(Object),
        })
      );
    });

    test('should clean expired password reset tokens', async () => {
      User.update.mockResolvedValueOnce([0]); // 0 verification tokens
      User.update.mockResolvedValueOnce([3]); // 3 reset tokens cleaned

      await executeTokenCleanup();

      expect(User.update).toHaveBeenCalledWith(
        {
          resetPasswordToken: null,
          resetPasswordTokenExpires: null,
        },
        expect.objectContaining({
          where: expect.any(Object),
        })
      );
    });

    test('should clean old Stripe webhook events', async () => {
      StripeWebhookEvent.cleanup.mockResolvedValue(10);

      await executeTokenCleanup();

      expect(StripeWebhookEvent.cleanup).toHaveBeenCalledWith(7); // 7 days
    });

    test('should clean old POS webhook events', async () => {
      PosWebhookEvent.cleanup.mockResolvedValue(8);

      await executeTokenCleanup();

      expect(PosWebhookEvent.cleanup).toHaveBeenCalledWith(7); // 7 days
    });

    test('should log cleanup results', async () => {
      User.update.mockResolvedValueOnce([5]); // verification tokens
      User.update.mockResolvedValueOnce([3]); // reset tokens
      StripeWebhookEvent.cleanup.mockResolvedValue(10);
      PosWebhookEvent.cleanup.mockResolvedValue(8);

      await executeTokenCleanup();

      expect(logger.cron).toHaveBeenCalledWith(
        'token-cleanup',
        'completed',
        expect.objectContaining({
          verificationTokensCleaned: 5,
          resetTokensCleaned: 3,
          stripeWebhooksCleaned: 10,
          posWebhooksCleaned: 8,
        })
      );
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    test('should handle Stripe cleanup error gracefully', async () => {
      StripeWebhookEvent.cleanup.mockRejectedValue(new Error('Stripe cleanup failed'));

      await executeTokenCleanup();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to clean Stripe webhook events',
        { error: 'Stripe cleanup failed' }
      );
      // Should still complete
      expect(logger.cron).toHaveBeenCalledWith(
        'token-cleanup',
        'completed',
        expect.objectContaining({
          errors: expect.arrayContaining(['Stripe cleanup: Stripe cleanup failed']),
        })
      );
    });

    test('should handle POS cleanup error gracefully', async () => {
      PosWebhookEvent.cleanup.mockRejectedValue(new Error('POS cleanup failed'));

      await executeTokenCleanup();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to clean POS webhook events',
        { error: 'POS cleanup failed' }
      );
      // Should still complete
      expect(logger.cron).toHaveBeenCalledWith(
        'token-cleanup',
        'completed',
        expect.objectContaining({
          errors: expect.arrayContaining(['POS cleanup: POS cleanup failed']),
        })
      );
    });

    test('should log error and send admin alert on main function failure', async () => {
      const error = new Error('Database connection failed');
      User.update.mockRejectedValue(error);

      await executeTokenCleanup();

      expect(logger.error).toHaveBeenCalledWith(
        'Cron job failed: token-cleanup',
        expect.objectContaining({
          error: 'Database connection failed',
          job: 'token-cleanup',
        })
      );
      expect(sendAdminAlert).toHaveBeenCalledWith(
        'Cron Job Failed: Token Cleanup',
        'Database connection failed',
        expect.any(String),
        expect.objectContaining({ cronJob: 'token-cleanup' })
      );
    });

    test('should handle admin alert failure gracefully', async () => {
      const dbError = new Error('Database error');
      User.update.mockRejectedValue(dbError);
      sendAdminAlert.mockRejectedValue(new Error('Email service down'));

      // Should not throw
      await expect(executeTokenCleanup()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send admin alert',
        { error: 'Email service down' }
      );
    });

    test('should handle missing PosWebhookEvent cleanup method', async () => {
      // Simulate PosWebhookEvent without cleanup method
      const originalCleanup = PosWebhookEvent.cleanup;
      delete PosWebhookEvent.cleanup;

      await executeTokenCleanup();

      // Should still complete without error
      expect(logger.cron).toHaveBeenCalledWith('token-cleanup', 'completed', expect.any(Object));

      // Restore
      PosWebhookEvent.cleanup = originalCleanup;
    });
  });

  // ===========================================
  // initTokenCleanupCron Tests
  // ===========================================
  describe('initTokenCleanupCron', () => {
    test('should schedule cron job every 4 hours', () => {
      initTokenCleanupCron();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 */4 * * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'America/Los_Angeles',
        })
      );
    });

    test('should log scheduling info', () => {
      initTokenCleanupCron();

      expect(logger.info).toHaveBeenCalledWith(
        'Scheduling token cleanup cron job',
        expect.objectContaining({ schedule: '0 */4 * * *' })
      );
    });

    test('should log scheduled status', () => {
      initTokenCleanupCron();

      expect(logger.cron).toHaveBeenCalledWith('token-cleanup', 'scheduled');
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    test('should handle zero items cleaned', async () => {
      User.update.mockResolvedValueOnce([0]);
      User.update.mockResolvedValueOnce([0]);
      StripeWebhookEvent.cleanup.mockResolvedValue(0);
      PosWebhookEvent.cleanup.mockResolvedValue(0);

      await executeTokenCleanup();

      expect(logger.cron).toHaveBeenCalledWith(
        'token-cleanup',
        'completed',
        expect.objectContaining({
          verificationTokensCleaned: 0,
          resetTokensCleaned: 0,
          stripeWebhooksCleaned: 0,
          posWebhooksCleaned: 0,
          errors: [],
        })
      );
    });

    test('should handle multiple cleanup errors', async () => {
      StripeWebhookEvent.cleanup.mockRejectedValue(new Error('Stripe error'));
      PosWebhookEvent.cleanup.mockRejectedValue(new Error('POS error'));

      await executeTokenCleanup();

      expect(logger.cron).toHaveBeenCalledWith(
        'token-cleanup',
        'completed',
        expect.objectContaining({
          errors: expect.arrayContaining([
            'Stripe cleanup: Stripe error',
            'POS cleanup: POS error',
          ]),
        })
      );
    });
  });
});
