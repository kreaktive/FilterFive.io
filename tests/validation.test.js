/**
 * Validation Service Tests
 */
const {
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  isValidBusinessName,
  sanitizeInput,
  validateSignup
} = require('../src/services/validationService');

describe('Validation Service', () => {
  describe('isValidEmail', () => {
    test('accepts valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    test('accepts email with subdomain', () => {
      expect(isValidEmail('test@mail.example.com')).toBe(true);
    });

    test('accepts email with plus sign', () => {
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    test('rejects email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    test('rejects email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    test('rejects email without TLD', () => {
      expect(isValidEmail('test@example')).toBe(false);
    });

    test('rejects null', () => {
      expect(isValidEmail(null)).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    test('accepts valid password with all requirements', () => {
      expect(isValidPassword('TestPass1!')).toBe(true);
    });

    test('rejects password without uppercase', () => {
      expect(isValidPassword('testpass1!')).toBe(false);
    });

    test('rejects password without lowercase', () => {
      expect(isValidPassword('TESTPASS1!')).toBe(false);
    });

    test('rejects password without number', () => {
      expect(isValidPassword('TestPass!')).toBe(false);
    });

    test('rejects password without special character', () => {
      expect(isValidPassword('TestPass1')).toBe(false);
    });

    test('rejects password too short', () => {
      expect(isValidPassword('Test1!')).toBe(false);
    });

    test('rejects null', () => {
      expect(isValidPassword(null)).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('getPasswordStrength', () => {
    test('returns 0 for empty password', () => {
      expect(getPasswordStrength('')).toBe(0);
    });

    test('returns 0 for null', () => {
      expect(getPasswordStrength(null)).toBe(0);
    });

    test('returns higher score for longer passwords', () => {
      const shortScore = getPasswordStrength('Test1!');
      const longScore = getPasswordStrength('TestPassword1!');
      expect(longScore).toBeGreaterThan(shortScore);
    });

    test('returns max score of 4', () => {
      expect(getPasswordStrength('SuperLongPassword123!@#')).toBeLessThanOrEqual(4);
    });
  });

  describe('isValidBusinessName', () => {
    test('accepts valid business name', () => {
      expect(isValidBusinessName("Joe's Barbershop")).toBe(true);
    });

    test('accepts 2 character name', () => {
      expect(isValidBusinessName('AB')).toBe(true);
    });

    test('rejects single character name', () => {
      expect(isValidBusinessName('A')).toBe(false);
    });

    test('rejects empty string', () => {
      expect(isValidBusinessName('')).toBe(false);
    });

    test('rejects null', () => {
      expect(isValidBusinessName(null)).toBe(false);
    });

    test('rejects name over 100 characters', () => {
      expect(isValidBusinessName('A'.repeat(101))).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('escapes HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<');
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('>');
    });

    test('escapes quotes', () => {
      expect(sanitizeInput('test"value')).not.toContain('"');
      expect(sanitizeInput("test'value")).not.toContain("'");
    });

    test('trims whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    test('returns empty string for null', () => {
      expect(sanitizeInput(null)).toBe('');
    });

    test('returns empty string for non-string', () => {
      expect(sanitizeInput(123)).toBe('');
    });
  });

  describe('validateSignup', () => {
    test('validates correct signup data', () => {
      const result = validateSignup("Joe's Shop", 'joe@example.com', 'TestPass1!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('returns errors for invalid business name', () => {
      const result = validateSignup('A', 'joe@example.com', 'TestPass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('returns errors for invalid email', () => {
      const result = validateSignup("Joe's Shop", 'invalid-email', 'TestPass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('returns errors for invalid password', () => {
      const result = validateSignup("Joe's Shop", 'joe@example.com', 'weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('returns multiple errors for all invalid fields', () => {
      const result = validateSignup('A', 'invalid', 'weak');
      expect(result.isValid).toBe(false);
      // Each field can return multiple errors (e.g., password has multiple requirements)
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
