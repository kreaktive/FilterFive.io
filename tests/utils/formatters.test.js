/**
 * Formatters Utility Tests
 *
 * Tests for formatting utilities used throughout the application:
 * - getTimeAgo: Relative time display
 * - maskPhone: Phone number masking for privacy
 * - maskSecret: Secret/API key masking for logging
 * - sanitizeForLogging: Object sanitization for logs
 */

const { getTimeAgo, maskPhone, maskSecret, sanitizeForLogging } = require('../../src/utils/formatters');

describe('Formatters Utility', () => {
  describe('getTimeAgo', () => {
    it('should return "Just now" for times less than 60 seconds ago', () => {
      const now = new Date();
      const result = getTimeAgo(now);
      expect(result).toBe('Just now');
    });

    it('should return "X mins ago" for times 1-59 minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = getTimeAgo(fiveMinutesAgo);
      expect(result).toBe('5 mins ago');
    });

    it('should return "1 min ago" for exactly 1 minute', () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      const result = getTimeAgo(oneMinuteAgo);
      expect(result).toBe('1 min ago');
    });

    it('should return "X hours ago" for times 1-23 hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const result = getTimeAgo(threeHoursAgo);
      expect(result).toBe('3 hours ago');
    });

    it('should return "1 hour ago" for exactly 1 hour', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const result = getTimeAgo(oneHourAgo);
      expect(result).toBe('1 hour ago');
    });

    it('should return "Yesterday" for 1 day ago', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = getTimeAgo(yesterday);
      expect(result).toBe('Yesterday');
    });

    it('should return "X days ago" for 2-6 days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = getTimeAgo(threeDaysAgo);
      expect(result).toBe('3 days ago');
    });

    it('should return "X weeks ago" for 7-29 days ago', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const result = getTimeAgo(twoWeeksAgo);
      expect(result).toBe('2 weeks ago');
    });

    it('should return "1 week ago" for exactly 7 days', () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = getTimeAgo(oneWeekAgo);
      expect(result).toBe('1 week ago');
    });

    it('should return "X months ago" for 30+ days ago', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = getTimeAgo(twoMonthsAgo);
      expect(result).toBe('2 months ago');
    });

    it('should return "1 month ago" for exactly 30 days', () => {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = getTimeAgo(oneMonthAgo);
      expect(result).toBe('1 month ago');
    });

    it('should handle string date input', () => {
      const now = new Date().toISOString();
      const result = getTimeAgo(now);
      expect(result).toBe('Just now');
    });
  });

  describe('maskPhone', () => {
    it('should mask middle digits of valid US phone number', () => {
      const result = maskPhone('+15551234567');
      expect(result).toBe('+1 555-***-4567');
    });

    it('should handle phone without plus sign', () => {
      const result = maskPhone('15551234567');
      expect(result).toBe('+1 555-***-4567');
    });

    it('should return "Unknown" for empty phone', () => {
      const result = maskPhone('');
      expect(result).toBe('Unknown');
    });

    it('should return "Unknown" for null phone', () => {
      const result = maskPhone(null);
      expect(result).toBe('Unknown');
    });

    it('should return "Unknown" for undefined phone', () => {
      const result = maskPhone(undefined);
      expect(result).toBe('Unknown');
    });

    it('should return as-is for non-US format', () => {
      const result = maskPhone('555-1234');
      expect(result).toBe('555-1234');
    });

    it('should handle phone with formatting characters', () => {
      const result = maskPhone('+1 (555) 123-4567');
      expect(result).toBe('+1 555-***-4567');
    });
  });

  describe('maskSecret', () => {
    it('should mask middle of secret showing first and last 4 chars', () => {
      const result = maskSecret('sk_live_abcdefghijklmnop');
      expect(result).toBe('sk_l...mnop');
    });

    it('should return "***" for secrets shorter than 8 characters', () => {
      const result = maskSecret('short');
      expect(result).toBe('***');
    });

    it('should return "[empty]" for empty string', () => {
      const result = maskSecret('');
      expect(result).toBe('[empty]');
    });

    it('should return "[empty]" for null', () => {
      const result = maskSecret(null);
      expect(result).toBe('[empty]');
    });

    it('should return "[empty]" for undefined', () => {
      const result = maskSecret(undefined);
      expect(result).toBe('[empty]');
    });

    it('should return "[empty]" for non-string input', () => {
      const result = maskSecret(12345);
      expect(result).toBe('[empty]');
    });

    it('should support custom visible characters', () => {
      const result = maskSecret('sk_live_abcdefghijklmnop', 6);
      expect(result).toBe('sk_liv...klmnop');
    });

    it('should handle secrets exactly 8 chars (default threshold)', () => {
      const result = maskSecret('12345678');
      expect(result).toBe('***');
    });

    it('should handle secrets with 9 chars', () => {
      const result = maskSecret('123456789');
      expect(result).toBe('1234...6789');
    });
  });

  describe('sanitizeForLogging', () => {
    it('should mask default sensitive fields', () => {
      const obj = {
        name: 'Test',
        apiKey: 'sk_live_abcdefghijklmnop',
        token: 'tok_1234567890123456',
        secret: 'secret_value_here_1234'
      };

      const result = sanitizeForLogging(obj);

      expect(result.name).toBe('Test');
      expect(result.apiKey).toBe('sk_l...mnop');
      expect(result.token).toBe('tok_...3456');
      expect(result.secret).toBe('secr...1234');
    });

    it('should mask password field', () => {
      const obj = { password: 'super_secret_password_123' };
      const result = sanitizeForLogging(obj);
      expect(result.password).toBe('supe..._123');
    });

    it('should mask accessToken and refreshToken', () => {
      const obj = {
        accessToken: 'access_token_value_12345',
        refreshToken: 'refresh_token_value_67890'
      };

      const result = sanitizeForLogging(obj);

      expect(result.accessToken).toBe('acce...2345');
      expect(result.refreshToken).toBe('refr...7890');
    });

    it('should not modify non-sensitive fields', () => {
      const obj = {
        name: 'Test User',
        email: 'test@example.com',
        count: 42
      };

      const result = sanitizeForLogging(obj);

      expect(result).toEqual(obj);
    });

    it('should handle null input', () => {
      const result = sanitizeForLogging(null);
      expect(result).toBe(null);
    });

    it('should handle undefined input', () => {
      const result = sanitizeForLogging(undefined);
      expect(result).toBe(undefined);
    });

    it('should handle non-object input', () => {
      const result = sanitizeForLogging('string');
      expect(result).toBe('string');
    });

    it('should support custom sensitive fields', () => {
      const obj = {
        customSecret: 'my_custom_secret_value_1234',
        normalField: 'visible'
      };

      const result = sanitizeForLogging(obj, ['customSecret']);

      expect(result.customSecret).toBe('my_c...1234');
      expect(result.normalField).toBe('visible');
    });

    it('should not modify original object', () => {
      const original = {
        apiKey: 'sk_live_abcdefghijklmnop'
      };

      sanitizeForLogging(original);

      expect(original.apiKey).toBe('sk_live_abcdefghijklmnop');
    });

    it('should handle empty object', () => {
      const result = sanitizeForLogging({});
      expect(result).toEqual({});
    });
  });
});
