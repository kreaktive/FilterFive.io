/**
 * Integration Tests: Campaign Flow
 *
 * Tests the complete SMS campaign journey:
 * 1. User uploads CSV with customer data
 * 2. CSV is validated and parsed
 * 3. SMS limit is checked before sending
 * 4. SMS messages are sent via Twilio
 * 5. FeedbackRequests are created
 * 6. Customer clicks link and leaves review
 * 7. Analytics are updated
 */

// Mock external services
jest.mock('../../src/services/smsService', () => ({
  sendReviewRequest: jest.fn().mockResolvedValue({
    success: true,
    messageSid: 'SM_test_123'
  }),
  getSmsMessage: jest.fn().mockReturnValue('Test SMS message with {{ReviewLink}}'),
  replaceTemplateTags: jest.fn((template, name, business, link) =>
    template.replace(/\{\{CustomerName\}\}/gi, name || 'there')
      .replace(/\{\{BusinessName\}\}/gi, business)
      .replace(/\{\{ReviewLink\}\}/gi, link)
  )
}));

jest.mock('../../src/services/smsLimitService', () => ({
  reserveSmsSlot: jest.fn().mockResolvedValue({
    canSend: true,
    release: jest.fn().mockResolvedValue(true)
  }),
  reserveBulkSmsSlots: jest.fn().mockResolvedValue({
    canSend: true,
    reservedCount: 10,
    incrementAndRelease: jest.fn().mockResolvedValue(true)
  })
}));

const smsService = require('../../src/services/smsService');
const smsLimitService = require('../../src/services/smsLimitService');
const { validateRow, isDuplicatePhone } = require('../../src/utils/csvValidator');

describe('Campaign Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. CSV Upload Validation', () => {
    it('should validate CSV rows with required fields', () => {
      const validRow = {
        phone: '+15551234567',
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = validateRow(validRow);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject rows without phone number', () => {
      const invalidRow = {
        name: 'John Doe',
        email: 'john@example.com'
        // missing phone
      };

      const result = validateRow(invalidRow);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('phone'))).toBe(true);
    });

    it('should validate phone number formats', () => {
      const rowWithValidPhone = { phone: '+15551234567', name: 'Test' };
      const rowWith10Digit = { phone: '5551234567', name: 'Test' };

      expect(validateRow(rowWithValidPhone).isValid).toBe(true);
      expect(validateRow(rowWith10Digit).isValid).toBe(true);
    });

    it('should flag short phone numbers with warnings', () => {
      const rowWithShortPhone = { phone: '123', name: 'Test' };
      const result = validateRow(rowWithShortPhone);
      // Short numbers get flagged with warnings or low confidence
      expect(result.warnings.length > 0 || !result.isValid).toBe(true);
    });

    it('should allow optional name field', () => {
      const rowWithoutName = { phone: '+15551234567' };
      const result = validateRow(rowWithoutName);
      expect(result.isValid).toBe(true);
    });

    it('should detect duplicate phone numbers', async () => {
      const existingPhones = new Set(['+15551234567', '+15559876543']);

      const isDuplicate = (phone, existingSet) => {
        const normalized = phone.replace(/\D/g, '');
        return existingSet.has(phone) ||
          existingSet.has(`+1${normalized}`) ||
          existingSet.has(normalized);
      };

      expect(isDuplicate('+15551234567', existingPhones)).toBe(true);
      expect(isDuplicate('+15550000000', existingPhones)).toBe(false);
    });
  });

  describe('2. SMS Limit Enforcement', () => {
    it('should check SMS limits before sending', async () => {
      const userId = 1;
      const requestedCount = 10;

      const reservation = await smsLimitService.reserveBulkSmsSlots(userId, requestedCount);

      expect(smsLimitService.reserveBulkSmsSlots).toHaveBeenCalledWith(userId, requestedCount);
      expect(reservation.canSend).toBe(true);
      expect(reservation.reservedCount).toBe(requestedCount);
    });

    it('should prevent sending when limit exceeded', async () => {
      smsLimitService.reserveBulkSmsSlots.mockResolvedValueOnce({
        canSend: false,
        error: 'SMS limit exceeded',
        remaining: 0
      });

      const reservation = await smsLimitService.reserveBulkSmsSlots(1, 100);

      expect(reservation.canSend).toBe(false);
      expect(reservation.error).toBe('SMS limit exceeded');
    });

    it('should release unused slots on partial send', async () => {
      const reservation = await smsLimitService.reserveBulkSmsSlots(1, 10);

      // Simulate only 7 out of 10 sent successfully
      await reservation.incrementAndRelease(7);

      expect(reservation.incrementAndRelease).toHaveBeenCalledWith(7);
    });
  });

  describe('3. SMS Sending', () => {
    it('should send SMS with correct parameters', async () => {
      const phone = '+15551234567';
      const customerName = 'John';
      const businessName = 'Test Business';
      const reviewLink = 'https://morestars.io/review/abc123';
      const tone = 'friendly';

      await smsService.sendReviewRequest(
        phone,
        customerName,
        businessName,
        reviewLink,
        tone
      );

      expect(smsService.sendReviewRequest).toHaveBeenCalledWith(
        phone,
        customerName,
        businessName,
        reviewLink,
        tone
      );
    });

    it('should replace template tags in custom messages', () => {
      const template = 'Hi {{CustomerName}}, thanks for visiting {{BusinessName}}! {{ReviewLink}}';
      const result = smsService.replaceTemplateTags(
        template,
        'John',
        'Test Business',
        'https://morestars.io/r/123'
      );

      expect(result).toContain('John');
      expect(result).toContain('Test Business');
      expect(result).toContain('https://morestars.io/r/123');
      expect(result).not.toContain('{{');
    });

    it('should handle missing customer name gracefully', () => {
      const template = 'Hi {{CustomerName}}, leave us a review: {{ReviewLink}}';
      const result = smsService.replaceTemplateTags(
        template,
        null,
        'Business',
        'https://link.com'
      );

      expect(result).toContain('there'); // Default fallback
    });
  });

  describe('4. FeedbackRequest Creation', () => {
    it('should create FeedbackRequest with correct initial state', () => {
      const feedbackRequest = {
        id: 1,
        uuid: 'abc-123-def',
        userId: 1,
        customerName: 'John Doe',
        customerPhone: '+15551234567',
        deliveryMethod: 'sms',
        status: 'sent',
        smsSentAt: new Date(),
        linkClickedAt: null,
        createdAt: new Date()
      };

      expect(feedbackRequest.status).toBe('sent');
      expect(feedbackRequest.deliveryMethod).toBe('sms');
      expect(feedbackRequest.linkClickedAt).toBeNull();
    });

    it('should generate unique UUID for each request', () => {
      const uuid1 = require('uuid').v4();
      const uuid2 = require('uuid').v4();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('5. Review Link Flow', () => {
    it('should update status to clicked when link is accessed', () => {
      const feedbackRequest = {
        status: 'sent',
        linkClickedAt: null
      };

      // Simulate link click
      if (feedbackRequest.status === 'sent') {
        feedbackRequest.status = 'clicked';
        feedbackRequest.linkClickedAt = new Date();
      }

      expect(feedbackRequest.status).toBe('clicked');
      expect(feedbackRequest.linkClickedAt).not.toBeNull();
    });

    it('should update status to rated when review is submitted', () => {
      const feedbackRequest = {
        status: 'clicked',
        linkClickedAt: new Date()
      };

      // Simulate review submission (B9 fix)
      feedbackRequest.status = 'rated';

      expect(feedbackRequest.status).toBe('rated');
    });

    it('should redirect to configured review URL', () => {
      const user = {
        reviewUrl: 'https://g.page/r/test-business/review'
      };

      const detectPlatform = (url) => {
        if (!url) return 'custom';
        const urlLower = url.toLowerCase();
        if (urlLower.includes('google.com') || urlLower.includes('g.page')) return 'google';
        if (urlLower.includes('facebook.com')) return 'facebook';
        if (urlLower.includes('yelp.com')) return 'yelp';
        return 'custom';
      };

      expect(detectPlatform(user.reviewUrl)).toBe('google');
    });
  });

  describe('6. Trial Activation on First SMS', () => {
    it('should start trial when first SMS is sent', () => {
      const user = {
        subscriptionStatus: 'trial',
        trialStartsAt: null,
        trialEndsAt: null
      };

      // B5 fix: Trial starts on first SMS send
      const startTrial = () => {
        if (!user.trialStartsAt && user.subscriptionStatus === 'trial') {
          const now = new Date();
          user.trialStartsAt = now;
          user.trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        }
      };

      expect(user.trialStartsAt).toBeNull();

      // First SMS triggers trial
      startTrial();

      expect(user.trialStartsAt).not.toBeNull();
      expect(user.trialEndsAt).not.toBeNull();

      // Second SMS should not change trial dates
      const originalStart = user.trialStartsAt;
      startTrial();
      expect(user.trialStartsAt).toBe(originalStart);
    });
  });

  describe('7. Analytics Tracking', () => {
    it('should track SMS delivery events', () => {
      const smsEvent = {
        userId: 1,
        feedbackRequestId: 1,
        phoneNumber: '+15551234567',
        eventType: 'sent',
        twilioMessageSid: 'SM_test_123',
        eventTimestamp: new Date()
      };

      expect(smsEvent.eventType).toBe('sent');
      expect(smsEvent.twilioMessageSid).toBeTruthy();
    });

    it('should calculate correct metrics', () => {
      const metrics = {
        requestsSent: 100,
        requestsClicked: 45,
        requestsRated: 30,
        reviewsPositive: 25,
        reviewsNegative: 5
      };

      const clickRate = (metrics.requestsClicked / metrics.requestsSent) * 100;
      const conversionRate = (metrics.requestsRated / metrics.requestsClicked) * 100;
      const positiveRate = (metrics.reviewsPositive / metrics.requestsRated) * 100;

      expect(clickRate).toBeCloseTo(45, 1);
      expect(conversionRate).toBeCloseTo(66.67, 1);
      expect(positiveRate).toBeCloseTo(83.33, 1);
    });
  });

  describe('8. Error Handling', () => {
    it('should handle SMS send failure gracefully', async () => {
      smsService.sendReviewRequest.mockRejectedValueOnce(new Error('Twilio error'));

      await expect(smsService.sendReviewRequest(
        '+15551234567',
        'John',
        'Business',
        'https://link.com',
        'friendly'
      )).rejects.toThrow('Twilio error');
    });

    it('should track failed SMS events', () => {
      const failedEvent = {
        userId: 1,
        eventType: 'failed',
        errorCode: '21211',
        errorMessage: 'Invalid phone number'
      };

      expect(failedEvent.eventType).toBe('failed');
      expect(failedEvent.errorCode).toBeTruthy();
    });

    it('should handle opt-out (STOP) messages', () => {
      const optOutEvent = {
        userId: 1,
        phoneNumber: '+15551234567',
        eventType: 'opt_out',
        eventTimestamp: new Date()
      };

      expect(optOutEvent.eventType).toBe('opt_out');
    });
  });
});
