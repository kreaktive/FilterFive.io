/**
 * Phone Utility Tests
 */
const { normalizePhone, isUSNumber, formatPhoneDisplay, validatePhone } = require('../src/utils/phone');

describe('Phone Utilities', () => {
  describe('normalizePhone', () => {
    test('normalizes 10-digit US number', () => {
      expect(normalizePhone('5551234567')).toBe('+15551234567');
    });

    test('normalizes 10-digit formatted number', () => {
      expect(normalizePhone('(555) 123-4567')).toBe('+15551234567');
    });

    test('normalizes 11-digit with country code', () => {
      expect(normalizePhone('15551234567')).toBe('+15551234567');
    });

    test('normalizes +1 prefixed number', () => {
      expect(normalizePhone('+15551234567')).toBe('+15551234567');
    });

    test('returns null for too short number', () => {
      expect(normalizePhone('12345')).toBeNull();
    });

    test('returns null for too long number', () => {
      expect(normalizePhone('155512345678')).toBeNull();
    });

    test('returns null for empty input', () => {
      expect(normalizePhone('')).toBeNull();
    });

    test('returns null for null input', () => {
      expect(normalizePhone(null)).toBeNull();
    });
  });

  describe('isUSNumber', () => {
    test('validates correct US number', () => {
      expect(isUSNumber('+15551234567')).toBe(true);
    });

    test('rejects number with area code starting with 0', () => {
      expect(isUSNumber('+10551234567')).toBe(false);
    });

    test('rejects number with area code starting with 1', () => {
      expect(isUSNumber('+11551234567')).toBe(false);
    });

    test('rejects non-US country code', () => {
      expect(isUSNumber('+445551234567')).toBe(false);
    });

    test('returns false for null', () => {
      expect(isUSNumber(null)).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isUSNumber('')).toBe(false);
    });
  });

  describe('formatPhoneDisplay', () => {
    test('formats normalized number', () => {
      expect(formatPhoneDisplay('+15551234567')).toBe('(555) 123-4567');
    });

    test('formats 10-digit number', () => {
      expect(formatPhoneDisplay('5551234567')).toBe('(555) 123-4567');
    });

    test('formats 11-digit number', () => {
      expect(formatPhoneDisplay('15551234567')).toBe('(555) 123-4567');
    });

    test('returns empty string for empty input', () => {
      expect(formatPhoneDisplay('')).toBe('');
    });

    test('returns original for invalid length', () => {
      expect(formatPhoneDisplay('12345')).toBe('12345');
    });
  });

  describe('validatePhone', () => {
    test('validates correct number', () => {
      const result = validatePhone('(555) 234-5678');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+15552345678');
      expect(result.error).toBeNull();
    });

    test('rejects empty input', () => {
      const result = validatePhone('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    test('rejects invalid format', () => {
      const result = validatePhone('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid phone number format');
    });

    test('rejects non-US number', () => {
      const result = validatePhone('0551234567'); // Area code starts with 0
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only US phone numbers are supported');
    });
  });
});
