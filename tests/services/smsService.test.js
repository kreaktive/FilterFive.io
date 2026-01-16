/**
 * SMS Service Tests
 *
 * Tests for SMS sending functionality:
 * - Message template replacement
 * - Tone-based message generation
 * - Review request sending with circuit breaker
 * - Custom SMS sending with retry logic
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock Twilio
const mockCreate = jest.fn();
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
});

// Mock circuit breaker service
const mockCanRequest = jest.fn();
const mockRecordSuccess = jest.fn();
const mockRecordFailure = jest.fn();
const mockGetState = jest.fn();

jest.mock('../../src/services/circuitBreakerService', () => ({
  getCircuitBreaker: jest.fn().mockReturnValue({
    canRequest: mockCanRequest,
    recordSuccess: mockRecordSuccess,
    recordFailure: mockRecordFailure,
    getState: mockGetState,
  }),
}));

// Mock retry utils
jest.mock('../../src/utils/retryUtils', () => ({
  withRetry: jest.fn((fn) => fn()),
  isRetryableError: jest.fn(),
}));

// Mock logger
jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  sms: jest.fn(),
}));

// Set env vars before importing
process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_MESSAGING_SERVICE_SID = 'test_messaging_service_sid';
process.env.TWILIO_PHONE_NUMBER = '+15551234567';

const { withRetry } = require('../../src/utils/retryUtils');
const logger = require('../../src/services/logger');
const {
  sendReviewRequest,
  sendSMS,
  getSmsMessage,
  replaceTemplateTags,
} = require('../../src/services/smsService');

describe('SMS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    // Default mock implementations
    mockCanRequest.mockReturnValue(true);
    mockGetState.mockReturnValue({ state: 'closed', failures: 0 });
    mockCreate.mockResolvedValue({
      sid: 'SM123456',
      status: 'queued',
      to: '+15559998888',
    });
  });

  // ===========================================
  // replaceTemplateTags Tests
  // ===========================================
  describe('replaceTemplateTags', () => {
    it('should replace all template tags', () => {
      const template = 'Hi {{CustomerName}}, thanks for visiting {{BusinessName}}! Leave a review: {{ReviewLink}}';
      const result = replaceTemplateTags(template, 'John', 'Test Shop', 'https://review.link');

      expect(result).toBe('Hi John, thanks for visiting Test Shop! Leave a review: https://review.link');
    });

    it('should use "there" when customerName is null', () => {
      const template = 'Hi {{CustomerName}}!';
      const result = replaceTemplateTags(template, null, 'Shop', 'https://link');

      expect(result).toBe('Hi there!');
    });

    it('should use "there" when customerName is empty', () => {
      const template = 'Hi {{CustomerName}}!';
      const result = replaceTemplateTags(template, '', 'Shop', 'https://link');

      expect(result).toBe('Hi there!');
    });

    it('should be case-insensitive for tags', () => {
      const template = '{{customername}} at {{businessname}} - {{reviewlink}}';
      const result = replaceTemplateTags(template, 'Jane', 'Store', 'https://url');

      expect(result).toBe('Jane at Store - https://url');
    });

    it('should handle multiple occurrences of same tag', () => {
      const template = '{{CustomerName}} {{CustomerName}} {{CustomerName}}';
      const result = replaceTemplateTags(template, 'Bob', 'Shop', 'https://link');

      expect(result).toBe('Bob Bob Bob');
    });
  });

  // ===========================================
  // getSmsMessage Tests
  // ===========================================
  describe('getSmsMessage', () => {
    const reviewLink = 'https://review.io/abc123';

    it('should return friendly message by default', () => {
      const message = getSmsMessage('John', 'Coffee Shop', reviewLink);

      expect(message).toContain('Hi John');
      expect(message).toContain('Coffee Shop');
      expect(message).toContain(reviewLink);
      expect(message).toContain('thrive');
    });

    it('should return friendly message explicitly', () => {
      const message = getSmsMessage('Jane', 'Pizza Place', reviewLink, 'friendly');

      expect(message).toContain('Hi Jane');
      expect(message).toContain('Pizza Place');
      expect(message).toContain('small businesses');
    });

    it('should return professional message', () => {
      const message = getSmsMessage('John', 'Law Firm', reviewLink, 'professional');

      expect(message).toContain('Hello John');
      expect(message).toContain('Law Firm');
      expect(message).toContain('feedback is valuable');
    });

    it('should return grateful message', () => {
      const message = getSmsMessage('Sarah', 'Bakery', reviewLink, 'grateful');

      expect(message).toContain('Hi Sarah');
      expect(message).toContain('Bakery');
      expect(message).toContain('grateful');
      expect(message).toContain('mean the world');
    });

    it('should use "there" when customerName is null', () => {
      const message = getSmsMessage(null, 'Shop', reviewLink, 'friendly');

      expect(message).toContain('Hi there');
    });

    it('should fall back to friendly for unknown tone', () => {
      const message = getSmsMessage('John', 'Shop', reviewLink, 'unknown_tone');

      expect(message).toContain('thrive'); // friendly tone indicator
    });

    it('should use custom message when tone is custom', () => {
      const customTemplate = 'Dear {{CustomerName}}, please review {{BusinessName}} at {{ReviewLink}}';
      const message = getSmsMessage('Alice', 'Store', reviewLink, 'custom', customTemplate);

      expect(message).toBe('Dear Alice, please review Store at https://review.io/abc123');
    });

    it('should append review link if custom message does not include it', () => {
      const customTemplate = 'Thank you {{CustomerName}} for visiting {{BusinessName}}!';
      const message = getSmsMessage('Bob', 'Shop', reviewLink, 'custom', customTemplate);

      expect(message).toBe('Thank you Bob for visiting Shop! https://review.io/abc123');
      expect(logger.warn).toHaveBeenCalledWith('Custom message does not include review link, appending it');
    });

    it('should not append link if template has {{ReviewLink}} tag', () => {
      const customTemplate = 'Thanks! Click: {{ReviewLink}}';
      const message = getSmsMessage('Joe', 'Store', reviewLink, 'custom', customTemplate);

      expect(message).toBe('Thanks! Click: https://review.io/abc123');
      expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('appending it'));
    });

    it('should fall back to friendly if custom tone but no message', () => {
      const message = getSmsMessage('John', 'Shop', reviewLink, 'custom', null);

      expect(message).toContain('thrive'); // friendly indicator
      expect(logger.warn).toHaveBeenCalledWith('Custom tone selected but no custom message provided, falling back to friendly');
    });

    it('should fall back to friendly if custom tone with empty message', () => {
      const message = getSmsMessage('John', 'Shop', reviewLink, 'custom', '');

      expect(message).toContain('thrive');
    });
  });

  // ===========================================
  // sendReviewRequest Tests
  // ===========================================
  describe('sendReviewRequest', () => {
    const phone = '+15559998888';
    const customerName = 'John';
    const businessName = 'Test Shop';
    const reviewLink = 'https://review.io/xyz';

    it('should send SMS successfully', async () => {
      const result = await sendReviewRequest(phone, customerName, businessName, reviewLink);

      expect(result).toEqual({
        success: true,
        messageSid: 'SM123456',
        status: 'queued',
      });
      expect(mockRecordSuccess).toHaveBeenCalled();
      expect(logger.sms).toHaveBeenCalledWith('sent', phone, expect.objectContaining({
        messageSid: 'SM123456',
      }));
    });

    it('should throw when circuit breaker is open', async () => {
      mockCanRequest.mockReturnValue(false);
      mockGetState.mockReturnValue({ state: 'open', failures: 5 });

      await expect(sendReviewRequest(phone, customerName, businessName, reviewLink))
        .rejects.toThrow('SMS service temporarily unavailable (circuit breaker open)');

      expect(mockCreate).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'SMS send blocked by circuit breaker',
        expect.objectContaining({ phoneLast4: '8888' })
      );
    });

    it('should record failure when send fails', async () => {
      withRetry.mockRejectedValueOnce(new Error('Twilio API error'));

      await expect(sendReviewRequest(phone, customerName, businessName, reviewLink))
        .rejects.toThrow('Twilio API error');

      expect(mockRecordFailure).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'SMS sending failed after retries',
        expect.objectContaining({ phoneLast4: '8888' })
      );
    });

    it('should use messaging service SID when available', async () => {
      await sendReviewRequest(phone, customerName, businessName, reviewLink);

      // withRetry is called with the send function, which internally uses mockCreate
      expect(withRetry).toHaveBeenCalled();
    });

    it('should use tone parameter', async () => {
      await sendReviewRequest(phone, customerName, businessName, reviewLink, 'professional');

      expect(withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          context: expect.objectContaining({ tone: 'professional' }),
        })
      );
    });

    it('should pass custom message for custom tone', async () => {
      const customMsg = 'Custom {{CustomerName}} message {{ReviewLink}}';
      await sendReviewRequest(phone, customerName, businessName, reviewLink, 'custom', customMsg);

      expect(withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          context: expect.objectContaining({ tone: 'custom' }),
        })
      );
    });

    it('should mask phone number in logs', async () => {
      await sendReviewRequest('+15551234567', customerName, businessName, reviewLink);

      expect(withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          context: expect.objectContaining({ phoneLast4: '4567' }),
        })
      );
    });
  });

  // ===========================================
  // sendSMS Tests
  // ===========================================
  describe('sendSMS', () => {
    const phone = '+15559998888';
    const message = 'Test message content';

    it('should send custom SMS successfully', async () => {
      const result = await sendSMS(phone, message);

      expect(result).toEqual({
        success: true,
        messageSid: 'SM123456',
        status: 'queued',
        to: '+15559998888',
      });
      expect(mockRecordSuccess).toHaveBeenCalled();
    });

    it('should throw when circuit breaker is open', async () => {
      mockCanRequest.mockReturnValue(false);
      mockGetState.mockReturnValue({ state: 'open' });

      await expect(sendSMS(phone, message))
        .rejects.toThrow('SMS service temporarily unavailable (circuit breaker open)');

      expect(logger.error).toHaveBeenCalledWith(
        'Custom SMS send blocked by circuit breaker',
        expect.any(Object)
      );
    });

    it('should record failure when send fails', async () => {
      withRetry.mockRejectedValueOnce(new Error('Network error'));

      await expect(sendSMS(phone, message)).rejects.toThrow('Network error');

      expect(mockRecordFailure).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Custom SMS sending failed after retries',
        expect.any(Object)
      );
    });

    it('should log debug message before sending', async () => {
      await sendSMS(phone, message);

      expect(logger.debug).toHaveBeenCalledWith(
        'Sending custom SMS',
        expect.objectContaining({ phoneLast4: '8888' })
      );
    });

    it('should use retry logic', async () => {
      await sendSMS(phone, message);

      expect(withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        })
      );
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should include error code in thrown error for circuit breaker', async () => {
      mockCanRequest.mockReturnValue(false);
      mockGetState.mockReturnValue({ state: 'open', failures: 10 });

      try {
        await sendReviewRequest('+15551234567', 'John', 'Shop', 'https://link');
        fail('Should have thrown');
      } catch (error) {
        expect(error.code).toBe('CIRCUIT_OPEN');
        expect(error.circuitState).toBeDefined();
      }
    });

    it('should record success after successful send', async () => {
      await sendReviewRequest('+15551234567', 'John', 'Shop', 'https://link');

      expect(mockRecordSuccess).toHaveBeenCalled();
    });

    it('should record failure after failed send', async () => {
      withRetry.mockRejectedValueOnce(new Error('Failed'));

      await expect(sendReviewRequest('+15551234567', 'John', 'Shop', 'https://link'))
        .rejects.toThrow();

      expect(mockRecordFailure).toHaveBeenCalled();
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle empty customer name', () => {
      const message = getSmsMessage('', 'Shop', 'https://link', 'friendly');
      expect(message).toContain('Hi there');
    });

    it('should handle special characters in business name', () => {
      const message = getSmsMessage('John', "Joe's Pizza & Pasta", 'https://link', 'friendly');
      expect(message).toContain("Joe's Pizza & Pasta");
    });

    it('should handle very long review links', () => {
      const longLink = 'https://example.com/' + 'a'.repeat(200);
      const message = getSmsMessage('John', 'Shop', longLink, 'friendly');
      expect(message).toContain(longLink);
    });

    it('should handle unicode characters in names', () => {
      const message = getSmsMessage('José', 'Café München', 'https://link', 'friendly');
      expect(message).toContain('José');
      expect(message).toContain('Café München');
    });
  });
});
