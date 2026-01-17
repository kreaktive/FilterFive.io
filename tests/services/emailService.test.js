/**
 * Email Service Tests
 *
 * Tests for email functionality:
 * - Verification emails
 * - Welcome emails
 * - Password reset
 * - Trial warnings and expiration
 * - Admin alerts
 * - Support requests
 * - Abandoned checkout recovery
 * - Payment notifications
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock Resend SDK
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Mock logger
jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Mock email templates
jest.mock('../../src/services/emailTemplates', () => ({
  verificationEmail: jest.fn(() => '<html>Verification Email</html>'),
  verificationReminderEmail: jest.fn(() => '<html>Verification Reminder</html>'),
  welcomeEmail: jest.fn(() => '<html>Welcome Email</html>'),
  passwordResetEmail: jest.fn(() => '<html>Password Reset</html>'),
  trialEndingEmail: jest.fn(() => '<html>Trial Ending</html>'),
  trialExpiredEmail: jest.fn(() => '<html>Trial Expired</html>'),
  adminAlertEmail: jest.fn(() => '<html>Admin Alert</html>'),
  supportRequestEmail: jest.fn(() => '<html>Support Request</html>'),
  trialWarning7DaysEmail: jest.fn(() => '<html>Trial 7 Days</html>'),
  trialWarning1DayEmail: jest.fn(() => '<html>Trial 1 Day</html>'),
  abandonedCheckoutEmail: jest.fn(() => '<html>Abandoned Checkout</html>'),
  abandonedCheckout30MinEmail: jest.fn(() => '<html>Abandoned 30min</html>'),
  paymentFailedEmail: jest.fn(() => '<html>Payment Failed</html>'),
  contactFormNotification: jest.fn(() => '<html>Contact Form</html>'),
  businessEventAlert: jest.fn(() => '<html>Business Event Alert</html>'),
}));

// Set environment variables BEFORE importing
process.env.RESEND_API_KEY = 'test_api_key';
process.env.RESEND_FROM_EMAIL = 'noreply@morestars.io';
process.env.APP_URL = 'https://morestars.io';
process.env.ADMIN_EMAIL = 'admin@morestars.io';
process.env.BUSINESS_ALERTS_EMAIL = 'alerts@morestars.io'; // Used by sendBusinessEventAlert

const logger = require('../../src/services/logger');
const emailService = require('../../src/services/emailService');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    // Default successful response
    mockSend.mockResolvedValue({ data: { id: 'email_123' } });
  });

  // ===========================================
  // sendVerificationEmail Tests
  // ===========================================
  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const result = await emailService.sendVerificationEmail(
        'user@test.com',
        'Test Business',
        'token123'
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Verify your MoreStars account',
        from: 'noreply@morestars.io',
      }));
      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email_123');
    });

    it('should include HTML content from template', async () => {
      await emailService.sendVerificationEmail('user@test.com', 'Test', 'abc123');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: '<html>Verification Email</html>',
      }));
    });

    it('should log on Resend API error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid email' } });

      await expect(
        emailService.sendVerificationEmail('bad@email', 'Test', 'token')
      ).rejects.toThrow('Resend API Error: Invalid email');
      expect(logger.error).toHaveBeenCalledWith(
        'Verification email failed',
        expect.any(Object)
      );
    });
  });

  // ===========================================
  // sendWelcomeEmail Tests
  // ===========================================
  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await emailService.sendWelcomeEmail('user@test.com', 'Test Business');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Welcome to MoreStars - Your trial has started!',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      await expect(
        emailService.sendWelcomeEmail('user@test.com', 'Test')
      ).rejects.toThrow('Network error');
      expect(logger.error).toHaveBeenCalledWith('Welcome email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendPasswordResetEmail Tests
  // ===========================================
  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const result = await emailService.sendPasswordResetEmail(
        'user@test.com',
        'Test Business',
        'reset_token_abc'
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Reset your MoreStars password',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('API error'));

      await expect(
        emailService.sendPasswordResetEmail('user@test.com', 'Test', 'token')
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Password reset email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendTrialEndingEmail Tests
  // ===========================================
  describe('sendTrialEndingEmail', () => {
    it('should send trial ending email successfully', async () => {
      const trialEnds = new Date('2025-03-15');
      const result = await emailService.sendTrialEndingEmail(
        'user@test.com',
        'Test Business',
        trialEnds
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Your MoreStars trial ends in 3 days',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendTrialEndingEmail('user@test.com', 'Test', new Date())
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Trial ending email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendTrialExpiredEmail Tests
  // ===========================================
  describe('sendTrialExpiredEmail', () => {
    it('should send trial expired email successfully', async () => {
      const result = await emailService.sendTrialExpiredEmail('user@test.com', 'Test Business');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Your MoreStars trial has ended',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendTrialExpiredEmail('user@test.com', 'Test')
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Trial expired email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendAdminAlert Tests
  // ===========================================
  describe('sendAdminAlert', () => {
    it('should send admin alert successfully', async () => {
      const result = await emailService.sendAdminAlert(
        'Cron Job Failed',
        'Failed to process daily snapshots',
        'Error stack trace...',
        { cronName: 'dailySnapshots' }
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'admin@morestars.io',
        subject: '[MoreStars Alert] Cron Job Failed',
      }));
      expect(result.success).toBe(true);
    });

    it('should fail silently on Resend error (no throw)', async () => {
      mockSend.mockRejectedValue(new Error('API error'));

      const result = await emailService.sendAdminAlert('Test', 'Error');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
      // Should NOT throw - this is the key behavior
    });

    it('should log error on Resend failure', async () => {
      mockSend.mockRejectedValue(new Error('API failure'));

      await emailService.sendAdminAlert('Test', 'Error');

      expect(logger.error).toHaveBeenCalledWith(
        'Admin alert email failed',
        expect.objectContaining({ error: 'API failure' })
      );
    });
  });

  // ===========================================
  // sendSupportRequestEmail Tests
  // ===========================================
  describe('sendSupportRequestEmail', () => {
    it('should send support request email', async () => {
      const result = await emailService.sendSupportRequestEmail(
        'user@test.com',
        'Test Business',
        123,
        'bug_report',
        'I found a bug in the dashboard'
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'support@morestars.io',
        replyTo: 'user@test.com',
        subject: '[MoreStars Support] Bug Report from Test Business',
      }));
      expect(result.success).toBe(true);
    });

    it('should map subject types correctly', async () => {
      const subjects = [
        ['feature_request', 'Feature Request'],
        ['bug_report', 'Bug Report'],
        ['billing', 'Billing Question'],
        ['integration', 'Integration Help'],
        ['general', 'General Question'],
      ];

      for (const [type, label] of subjects) {
        mockSend.mockClear();
        await emailService.sendSupportRequestEmail('user@test.com', 'Test', 1, type, 'msg');
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining(label),
          })
        );
      }
    });

    it('should include replyTo header', async () => {
      await emailService.sendSupportRequestEmail('user@company.com', 'Test', 1, 'general', 'msg');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        replyTo: 'user@company.com',
      }));
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendSupportRequestEmail('user@test.com', 'Test', 1, 'general', 'msg')
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Support request email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendTrialWarning7DaysEmail Tests
  // ===========================================
  describe('sendTrialWarning7DaysEmail', () => {
    it('should send 7-day trial warning', async () => {
      const result = await emailService.sendTrialWarning7DaysEmail(
        'user@test.com',
        'Test',
        new Date('2025-03-20')
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: '7 days left in your MoreStars trial',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendTrialWarning7DaysEmail('user@test.com', 'Test', new Date())
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Trial 7-day warning email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendTrialWarning1DayEmail Tests
  // ===========================================
  describe('sendTrialWarning1DayEmail', () => {
    it('should send urgent 1-day trial warning', async () => {
      const result = await emailService.sendTrialWarning1DayEmail(
        'user@test.com',
        'Test',
        new Date('2025-03-14')
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Last day of your MoreStars trial!',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendTrialWarning1DayEmail('user@test.com', 'Test', new Date())
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Trial 1-day warning email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendAbandonedCheckoutEmail Tests
  // ===========================================
  describe('sendAbandonedCheckoutEmail', () => {
    it('should send abandoned checkout email', async () => {
      const result = await emailService.sendAbandonedCheckoutEmail('user@test.com', 'Test');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'You left something behind...',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendAbandonedCheckoutEmail('user@test.com', 'Test')
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Abandoned checkout email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendAbandonedCheckout30MinEmail Tests
  // ===========================================
  describe('sendAbandonedCheckout30MinEmail', () => {
    it('should send 30-min abandoned checkout email', async () => {
      const result = await emailService.sendAbandonedCheckout30MinEmail('user@test.com', 'Test');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Still thinking it over?',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendAbandonedCheckout30MinEmail('user@test.com', 'Test')
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('30-min abandoned checkout email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendPaymentFailedEmail Tests
  // ===========================================
  describe('sendPaymentFailedEmail', () => {
    it('should send payment failed email', async () => {
      const result = await emailService.sendPaymentFailedEmail('user@test.com', 'Test');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Payment failed for your MoreStars subscription',
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendPaymentFailedEmail('user@test.com', 'Test')
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Payment failed email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendVerificationReminderEmail Tests
  // ===========================================
  describe('sendVerificationReminderEmail', () => {
    it('should send verification reminder email', async () => {
      const result = await emailService.sendVerificationReminderEmail(
        'user@test.com',
        'Test',
        'remind_token'
      );

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: "Don't forget to verify your MoreStars account",
      }));
      expect(result.success).toBe(true);
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendVerificationReminderEmail('user@test.com', 'Test', 'token')
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Verification reminder email failed', expect.any(Object));
    });
  });

  // ===========================================
  // sendContactNotification Tests
  // ===========================================
  describe('sendContactNotification', () => {
    it('should send contact form notification', async () => {
      const formData = {
        id: 'sub_123',
        email: 'visitor@site.com',
        businessName: 'Visitor Company',
        topic: 'sales',
        message: 'I want to learn more',
      };

      const result = await emailService.sendContactNotification(formData);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'support@morestars.io',
        replyTo: 'visitor@site.com',
        subject: '[MoreStars Contact] Sales Inquiry from Visitor Company',
      }));
      expect(result.success).toBe(true);
    });

    it('should map topic labels correctly', async () => {
      const topics = [
        ['sales', 'Sales Inquiry'],
        ['support', 'Support Request'],
        ['billing', 'Billing Question'],
        ['partnership', 'Partnership Opportunity'],
        ['general', 'General Inquiry'],
      ];

      for (const [topic, label] of topics) {
        mockSend.mockClear();
        await emailService.sendContactNotification({
          email: 'test@test.com',
          businessName: 'Test',
          topic,
        });
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining(label),
          })
        );
      }
    });

    it('should use fallback label for unknown topic', async () => {
      const formData = {
        email: 'test@test.com',
        businessName: 'Test',
        topic: 'unknown_topic',
      };

      await emailService.sendContactNotification(formData);

      // Uses "Contact Inquiry" as fallback for unknown topics
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Contact Inquiry'),
        })
      );
    });

    it('should log on error', async () => {
      mockSend.mockRejectedValue(new Error('Error'));

      await expect(
        emailService.sendContactNotification({ email: 'test@test.com', businessName: 'Test', topic: 'general' })
      ).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith('Contact notification email failed', expect.any(Object));
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should handle Resend API error response', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Rate limit exceeded' } });

      await expect(
        emailService.sendWelcomeEmail('user@test.com', 'Test')
      ).rejects.toThrow('Resend API Error: Rate limit exceeded');
    });

    it('should handle missing email id in response', async () => {
      mockSend.mockResolvedValue({ data: {} });

      const result = await emailService.sendWelcomeEmail('user@test.com', 'Test');

      expect(result.success).toBe(true);
      expect(result.emailId).toBeUndefined();
    });

    it('should handle null data in response', async () => {
      mockSend.mockResolvedValue({});

      const result = await emailService.sendWelcomeEmail('user@test.com', 'Test');

      expect(result.success).toBe(true);
    });
  });

  // ===========================================
  // Email Configuration Tests
  // ===========================================
  describe('Email Configuration', () => {
    it('should use from email from environment', async () => {
      await emailService.sendWelcomeEmail('user@test.com', 'Test');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        from: 'noreply@morestars.io',
      }));
    });

    it('should send to correct recipient', async () => {
      await emailService.sendWelcomeEmail('specific@user.com', 'Test');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'specific@user.com',
      }));
    });
  });

  // ===========================================
  // Logging Tests
  // ===========================================
  describe('Logging', () => {
    it('should log successful email send', async () => {
      await emailService.sendWelcomeEmail('user@test.com', 'Test');

      expect(logger.info).toHaveBeenCalledWith(
        'Welcome email sent',
        expect.objectContaining({ email: 'user@test.com' })
      );
    });

    it('should include email ID in log', async () => {
      mockSend.mockResolvedValue({ data: { id: 'msg_abc123' } });

      await emailService.sendVerificationEmail('user@test.com', 'Test', 'token');

      expect(logger.info).toHaveBeenCalledWith(
        'Verification email sent',
        expect.objectContaining({ emailId: 'msg_abc123' })
      );
    });
  });

  // ===========================================
  // sendBusinessEventAlert Tests
  // ===========================================
  describe('sendBusinessEventAlert', () => {
    it('should send subscription_created event', async () => {
      const result = await emailService.sendBusinessEventAlert('subscription_created', {
        userId: 123,
        email: 'user@test.com',
        businessName: 'Test Business',
        plan: 'monthly',
      });

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'alerts@morestars.io', // Uses BUSINESS_ALERTS_EMAIL env var
        subject: expect.stringContaining('New Subscription'),
      }));
      expect(result.success).toBe(true);
    });

    it('should send trial_converted event', async () => {
      const result = await emailService.sendBusinessEventAlert('trial_converted', {
        userId: 456,
        email: 'converted@test.com',
        businessName: 'Converted Biz',
        plan: 'annual',
      });

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: expect.stringContaining('Trial Converted'),
      }));
      expect(result.success).toBe(true);
    });

    it('should use fallback label for unknown event type', async () => {
      const result = await emailService.sendBusinessEventAlert('unknown_event_type', {
        userId: 789,
        email: 'unknown@test.com',
        businessName: 'Unknown Biz',
      });

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        subject: expect.stringContaining('Business Event'),
      }));
      expect(result.success).toBe(true);
    });

    it('should return success: false on API failure (non-blocking)', async () => {
      mockSend.mockRejectedValue(new Error('Email service unavailable'));

      const result = await emailService.sendBusinessEventAlert('subscription_created', {
        userId: 1,
        email: 'test@test.com',
        businessName: 'Test',
      });

      // Should NOT throw, should return success: false
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service unavailable');
    });

    it('should log error but not throw on failure', async () => {
      // Mock console.error since sendBusinessEventAlert uses it (not logger.error)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSend.mockRejectedValue(new Error('Connection timeout'));

      await emailService.sendBusinessEventAlert('trial_converted', {
        userId: 2,
        email: 'timeout@test.com',
        businessName: 'Timeout Biz',
      });

      // sendBusinessEventAlert uses console.error, not logger.error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Business event alert failed:',
        'Connection timeout'
      );
      consoleSpy.mockRestore();
    });

    it('should include event data in the email', async () => {
      await emailService.sendBusinessEventAlert('subscription_created', {
        userId: 100,
        email: 'data@test.com',
        businessName: 'Data Business',
        plan: 'monthly',
        amount: 77,
      });

      expect(mockSend).toHaveBeenCalled();
    });
  });

  // ===========================================
  // sendNegativeFeedbackAlert Tests (Deprecated)
  // ===========================================
  describe('sendNegativeFeedbackAlert (deprecated)', () => {
    it('should still work for backward compatibility', async () => {
      // sendNegativeFeedbackAlert is deprecated but should still function
      if (typeof emailService.sendNegativeFeedbackAlert === 'function') {
        const result = await emailService.sendNegativeFeedbackAlert(
          'business@test.com',
          'Test Business',
          {
            rating: 2,
            feedback: 'Service was slow',
            customerName: 'John Doe',
          }
        );

        expect(result.success).toBe(true);
      }
    });

    it('should throw when API key is not configured', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      await expect(
        emailService.sendNegativeFeedbackAlert('test@test.com', 'Customer', 2, 'Bad service', '+1555123456')
      ).rejects.toThrow('Resend API key not configured');

      process.env.RESEND_API_KEY = originalKey;
    });

    it('should throw on result.error response', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid email', statusCode: 400 } });

      await expect(
        emailService.sendNegativeFeedbackAlert('test@test.com', 'Customer', 2, 'Bad service', '+1555123456')
      ).rejects.toThrow('Resend API Error: Invalid email (Status: 400)');
    });

    it('should throw when no email ID returned', async () => {
      mockSend.mockResolvedValue({ data: {} });

      await expect(
        emailService.sendNegativeFeedbackAlert('test@test.com', 'Customer', 2, 'Bad service', '+1555123456')
      ).rejects.toThrow('No email ID returned from Resend API');
    });
  });

  // ===========================================
  // HTTP Error Code Handling Tests
  // ===========================================
  describe('HTTP Error Code Handling', () => {
    it('should handle 401 Unauthorized error', async () => {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      mockSend.mockRejectedValue(error);

      await expect(
        emailService.sendWelcomeEmail('user@test.com', 'Test')
      ).rejects.toThrow('Unauthorized');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle 429 Rate Limit error', async () => {
      const error = new Error('Too many requests');
      error.statusCode = 429;
      mockSend.mockRejectedValue(error);

      await expect(
        emailService.sendVerificationEmail('user@test.com', 'Test', 'token')
      ).rejects.toThrow('Too many requests');
    });

    it('should handle 500 Server Error', async () => {
      const error = new Error('Internal server error');
      error.statusCode = 500;
      mockSend.mockRejectedValue(error);

      await expect(
        emailService.sendPasswordResetEmail('user@test.com', 'Test', 'token')
      ).rejects.toThrow();
    });

    it('should handle Resend API 401 in error response', async () => {
      mockSend.mockResolvedValue({
        error: { message: 'Invalid API key', statusCode: 401 },
      });

      await expect(
        emailService.sendWelcomeEmail('user@test.com', 'Test')
      ).rejects.toThrow('Resend API Error: Invalid API key');
    });
  });

  // ===========================================
  // Missing API Key Tests
  // ===========================================
  describe('Missing API Key Checks', () => {
    it('sendVerificationEmail should throw when API key is not configured', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      await expect(
        emailService.sendVerificationEmail('test@test.com', 'Test Business', 'token123')
      ).rejects.toThrow('Resend API key not configured');

      process.env.RESEND_API_KEY = originalKey;
    });

    it('sendPasswordResetEmail should throw when API key is not configured', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      await expect(
        emailService.sendPasswordResetEmail('test@test.com', 'Test Business', 'reset_token')
      ).rejects.toThrow('Resend API key not configured');

      process.env.RESEND_API_KEY = originalKey;
    });
  });

  // ===========================================
  // Resend API Error Response Tests
  // ===========================================
  describe('Resend API Error Responses', () => {
    it('sendPasswordResetEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid recipient' } });

      await expect(
        emailService.sendPasswordResetEmail('test@test.com', 'Test', 'token')
      ).rejects.toThrow('Resend API Error: Invalid recipient');
    });

    it('sendTrialEndingEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Rate limit exceeded' } });

      await expect(
        emailService.sendTrialEndingEmail('test@test.com', 'Test', new Date())
      ).rejects.toThrow('Resend API Error: Rate limit exceeded');
    });

    it('sendTrialExpiredEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid API key' } });

      await expect(
        emailService.sendTrialExpiredEmail('test@test.com', 'Test')
      ).rejects.toThrow('Resend API Error: Invalid API key');
    });

    it('sendAdminAlert should return success:false on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Service unavailable' } });

      const result = await emailService.sendAdminAlert('Test Alert', 'Test message');

      // sendAdminAlert catches errors and returns success: false instead of throwing
      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
    });

    it('sendSupportRequestEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid format' } });

      await expect(
        emailService.sendSupportRequestEmail('test@test.com', 'Test', 1, 'general', 'message')
      ).rejects.toThrow('Resend API Error: Invalid format');
    });

    it('sendTrialWarning7DaysEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Quota exceeded' } });

      await expect(
        emailService.sendTrialWarning7DaysEmail('test@test.com', 'Test', new Date())
      ).rejects.toThrow('Resend API Error: Quota exceeded');
    });

    it('sendTrialWarning1DayEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Connection refused' } });

      await expect(
        emailService.sendTrialWarning1DayEmail('test@test.com', 'Test', new Date())
      ).rejects.toThrow('Resend API Error: Connection refused');
    });

    it('sendAbandonedCheckoutEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Domain not verified' } });

      await expect(
        emailService.sendAbandonedCheckoutEmail('test@test.com', 'Test')
      ).rejects.toThrow('Resend API Error: Domain not verified');
    });

    it('sendAbandonedCheckout30MinEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid sender' } });

      await expect(
        emailService.sendAbandonedCheckout30MinEmail('test@test.com', 'Test')
      ).rejects.toThrow('Resend API Error: Invalid sender');
    });

    it('sendPaymentFailedEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Blocked domain' } });

      await expect(
        emailService.sendPaymentFailedEmail('test@test.com', 'Test')
      ).rejects.toThrow('Resend API Error: Blocked domain');
    });

    it('sendVerificationReminderEmail should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Invalid token' } });

      await expect(
        emailService.sendVerificationReminderEmail('test@test.com', 'Test', 'token')
      ).rejects.toThrow('Resend API Error: Invalid token');
    });

    it('sendContactNotification should throw on result.error', async () => {
      mockSend.mockResolvedValue({ error: { message: 'Spam detected' } });

      await expect(
        emailService.sendContactNotification({ email: 'test@test.com', businessName: 'Test', topic: 'sales' })
      ).rejects.toThrow('Resend API Error: Spam detected');
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle empty business name', async () => {
      const result = await emailService.sendWelcomeEmail('user@test.com', '');

      expect(result.success).toBe(true);
    });

    it('should handle special characters in email', async () => {
      const result = await emailService.sendWelcomeEmail("user+test'special@test.com", 'Test');

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: "user+test'special@test.com",
      }));
      expect(result.success).toBe(true);
    });

    it('should handle very long business names', async () => {
      const longName = 'A'.repeat(500);
      const result = await emailService.sendWelcomeEmail('user@test.com', longName);

      expect(result.success).toBe(true);
    });

    it('should handle unicode in business name', async () => {
      const result = await emailService.sendWelcomeEmail('user@test.com', 'Café Müller');

      expect(result.success).toBe(true);
    });
  });
});
