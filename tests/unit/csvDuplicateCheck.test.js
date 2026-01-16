/**
 * CSV Duplicate Check Tests
 * Tests for the isDuplicatePhone function with database mocking
 */

const { Op } = require('sequelize');

// Mock the FeedbackRequest model
jest.mock('../../src/models', () => ({
  FeedbackRequest: {
    findOne: jest.fn()
  }
}));

const { FeedbackRequest } = require('../../src/models');
const { isDuplicatePhone } = require('../../src/utils/csvValidator');

describe('isDuplicatePhone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('duplicate detection', () => {
    test('returns true when sent SMS exists within 30 days', async () => {
      FeedbackRequest.findOne.mockResolvedValue({
        id: 1,
        userId: 123,
        customerPhone: '+15551234567',
        status: 'sent'
      });

      const result = await isDuplicatePhone(123, '+15551234567');
      expect(result.isDuplicate).toBe(true);
      expect(FeedbackRequest.findOne).toHaveBeenCalledTimes(1);
    });

    test('returns true when clicked SMS exists within 30 days', async () => {
      FeedbackRequest.findOne.mockResolvedValue({
        id: 2,
        userId: 123,
        customerPhone: '+15551234567',
        status: 'clicked'
      });

      const result = await isDuplicatePhone(123, '+15551234567');
      expect(result.isDuplicate).toBe(true);
    });

    test('returns true when rated SMS exists within 30 days', async () => {
      FeedbackRequest.findOne.mockResolvedValue({
        id: 3,
        userId: 123,
        customerPhone: '+15551234567',
        status: 'rated'
      });

      const result = await isDuplicatePhone(123, '+15551234567');
      expect(result.isDuplicate).toBe(true);
    });

    test('returns false when no matching request exists', async () => {
      FeedbackRequest.findOne.mockResolvedValue(null);

      const result = await isDuplicatePhone(123, '+15551234567');
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('query parameters', () => {
    test('queries with correct userId and phone', async () => {
      FeedbackRequest.findOne.mockResolvedValue(null);

      await isDuplicatePhone(456, '+15559876543');

      const callArgs = FeedbackRequest.findOne.mock.calls[0][0];
      expect(callArgs.where.userId).toBe(456);
      expect(callArgs.where.customerPhone).toBe('+15559876543');
    });

    test('queries with date filter for last 30 days', async () => {
      FeedbackRequest.findOne.mockResolvedValue(null);

      const beforeCall = new Date();
      await isDuplicatePhone(123, '+15551234567');
      const afterCall = new Date();

      const callArgs = FeedbackRequest.findOne.mock.calls[0][0];

      // Check that createdAt filter exists with Op.gte
      expect(callArgs.where.createdAt).toBeDefined();
      expect(callArgs.where.createdAt[Op.gte]).toBeInstanceOf(Date);

      // The date should be approximately 30 days ago
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const queriedDate = callArgs.where.createdAt[Op.gte];
      const expectedDateApprox = new Date(beforeCall.getTime() - thirtyDaysMs);

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(queriedDate.getTime() - expectedDateApprox.getTime())).toBeLessThan(1000);
    });

    test('queries with status filter for sent/clicked/rated', async () => {
      FeedbackRequest.findOne.mockResolvedValue(null);

      await isDuplicatePhone(123, '+15551234567');

      const callArgs = FeedbackRequest.findOne.mock.calls[0][0];

      // Check that status filter exists with Op.in
      expect(callArgs.where.status).toBeDefined();
      expect(callArgs.where.status[Op.in]).toEqual(['sent', 'clicked', 'rated']);
    });
  });

  describe('allows re-sending to failed requests', () => {
    test('returns false for pending status (allows retry)', async () => {
      // When only pending requests exist, findOne returns null
      // because we filter for sent/clicked/rated
      FeedbackRequest.findOne.mockResolvedValue(null);

      const result = await isDuplicatePhone(123, '+15551234567');
      expect(result.isDuplicate).toBe(false);
    });

    test('allows re-sending when previous request failed', async () => {
      // Failed requests are not in sent/clicked/rated, so findOne returns null
      FeedbackRequest.findOne.mockResolvedValue(null);

      const result = await isDuplicatePhone(123, '+15551234567');
      expect(result.isDuplicate).toBe(false);
    });

    test('allows re-sending when previous request expired', async () => {
      // Expired requests are not in sent/clicked/rated, so findOne returns null
      FeedbackRequest.findOne.mockResolvedValue(null);

      const result = await isDuplicatePhone(123, '+15551234567');
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('different users', () => {
    test('does not block same phone for different users', async () => {
      // First user has sent to this phone
      FeedbackRequest.findOne.mockResolvedValueOnce({
        id: 1,
        userId: 123,
        customerPhone: '+15551234567',
        status: 'sent'
      });

      const result1 = await isDuplicatePhone(123, '+15551234567');
      expect(result1.isDuplicate).toBe(true);

      // Second user has not sent to this phone
      FeedbackRequest.findOne.mockResolvedValueOnce(null);

      const result2 = await isDuplicatePhone(456, '+15551234567');
      expect(result2.isDuplicate).toBe(false);
    });
  });
});
