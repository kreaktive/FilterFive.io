/**
 * Global Test Setup
 *
 * This file configures the test environment and provides global utilities.
 * It runs before all tests via Jest's setupFilesAfterEnv configuration.
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Import jest-extended matchers for additional assertions
require('jest-extended');

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Global test timeout (30 seconds for integration tests)
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global beforeAll - runs once before all test suites
beforeAll(async () => {
  // Any global setup can go here
});

// Global afterAll - runs once after all test suites
afterAll(async () => {
  // Cleanup connections, etc.
});

// Custom Jest matchers
expect.extend({
  /**
   * Check if a value is a valid UUID v4
   */
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  /**
   * Check if a date is within a range of another date
   */
  toBeWithinMinutes(received, expected, minutes) {
    const receivedDate = new Date(received);
    const expectedDate = new Date(expected);
    const diffMs = Math.abs(receivedDate - expectedDate);
    const diffMinutes = diffMs / (1000 * 60);
    const pass = diffMinutes <= minutes;

    if (pass) {
      return {
        message: () => `expected ${received} not to be within ${minutes} minutes of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within ${minutes} minutes of ${expected}, but was ${diffMinutes.toFixed(2)} minutes apart`,
        pass: false,
      };
    }
  },

  /**
   * Check if an error response has the expected structure
   */
  toBeErrorResponse(received) {
    const hasSuccess = received.success === false;
    const hasError = typeof received.error === 'string' || typeof received.message === 'string';
    const pass = hasSuccess && hasError;

    if (pass) {
      return {
        message: () => `expected response not to be an error response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be an error response with { success: false, error/message: string }`,
        pass: false,
      };
    }
  },

  /**
   * Check if a phone number is in E.164 format
   */
  toBeE164Phone(received) {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const pass = e164Regex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be in E.164 format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be in E.164 format (e.g., +12125551234)`,
        pass: false,
      };
    }
  }
});

// Export commonly used test constants
module.exports = {
  TEST_USER_EMAIL: 'test@example.com',
  TEST_USER_PASSWORD: 'Test123!@#',
  TEST_BUSINESS_NAME: 'Test Business',
  TEST_PHONE: '+12125551234',
  TEST_GOOGLE_PLACE_ID: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
};
