/**
 * POS SMS Service Tests
 *
 * Tests for SMS sending logic for POS transactions:
 * - Phone validation and normalization
 * - Consent checking
 * - SMS limit enforcement
 * - 30-day contact rule
 * - Test mode handling
 * - Queue job creation
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/models/PosTransaction', () => ({
  create: jest.fn(),
  wasContactedRecently: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../../src/utils/phone', () => ({
  normalizePhone: jest.fn((phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return '+1' + cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('1')) return '+' + cleaned;
    return '+' + cleaned;
  }),
  isUSNumber: jest.fn((phone) => {
    if (!phone) return false;
    return phone.startsWith('+1') && phone.length === 12;
  }),
}));

jest.mock('../../src/queues/posSmsQueue', () => ({
  addJob: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const PosTransaction = require('../../src/models/PosTransaction');
const User = require('../../src/models/User');
const { normalizePhone, isUSNumber } = require('../../src/utils/phone');
const logger = require('../../src/services/logger');

// Import after mocks
const posSmsService = require('../../src/services/posSmsService');

describe('POS SMS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
    // Reset the queue mock
    const posSmsQueue = require('../../src/queues/posSmsQueue');
    posSmsQueue.addJob.mockResolvedValue({ id: 'job_123' });
  });

  // ===========================================
  // Utility Wrappers Tests
  // ===========================================
  describe('Utility Wrappers', () => {
    it('normalizePhone should delegate to phone utils', () => {
      const result = posSmsService.normalizePhone('5551234567');
      expect(result).toBe('+15551234567');
    });

    it('normalizePhone should return null for empty input', () => {
      normalizePhone.mockReturnValueOnce(null);
      const result = posSmsService.normalizePhone('');
      expect(result).toBeNull();
    });

    it('isUSNumber should return true for valid US numbers', () => {
      isUSNumber.mockReturnValueOnce(true);
      const result = posSmsService.isUSNumber('+15551234567');
      expect(result).toBe(true);
    });

    it('isUSNumber should return false for non-US numbers', () => {
      isUSNumber.mockReturnValueOnce(false);
      const result = posSmsService.isUSNumber('+447911123456');
      expect(result).toBe(false);
    });
  });

  // ===========================================
  // wasContactedRecently Tests
  // ===========================================
  describe('wasContactedRecently', () => {
    it('should return true when contact found within days', async () => {
      PosTransaction.wasContactedRecently.mockResolvedValue(true);

      const result = await posSmsService.wasContactedRecently(1, '+15551234567', 30);

      expect(result).toBe(true);
      expect(PosTransaction.wasContactedRecently).toHaveBeenCalledWith(1, '+15551234567', 30);
    });

    it('should return false when no recent contact', async () => {
      PosTransaction.wasContactedRecently.mockResolvedValue(false);

      const result = await posSmsService.wasContactedRecently(1, '+15551234567', 30);

      expect(result).toBe(false);
    });
  });

  // ===========================================
  // logTransaction Tests
  // ===========================================
  describe('logTransaction', () => {
    it('should successfully create transaction record', async () => {
      const mockTransaction = { id: 1, smsStatus: 'pending' };
      PosTransaction.create.mockResolvedValue(mockTransaction);

      const result = await posSmsService.logTransaction({
        userId: 1,
        posIntegrationId: 5,
        externalTransactionId: 'ext_123',
        customerName: 'John Doe',
        customerPhone: '+15551234567',
        purchaseAmount: 49.99,
        locationName: 'Main Store',
        smsStatus: 'pending',
      });

      expect(result).toBe(mockTransaction);
      expect(PosTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        posIntegrationId: 5,
        smsStatus: 'pending',
      }));
    });

    it('should handle database errors', async () => {
      PosTransaction.create.mockRejectedValue(new Error('Database error'));

      await expect(
        posSmsService.logTransaction({
          userId: 1,
          posIntegrationId: 5,
          externalTransactionId: 'ext_123',
          smsStatus: 'pending',
        })
      ).rejects.toThrow('Database error');
    });
  });

  // ===========================================
  // processTransaction Tests
  // ===========================================
  describe('processTransaction', () => {
    const createMockIntegration = (overrides = {}) => ({
      id: 1,
      userId: 10,
      consentConfirmed: true,
      testMode: false,
      testPhoneNumber: null,
      ...overrides,
    });

    const createMockUser = (overrides = {}) => ({
      id: 10,
      businessName: 'Test Business',
      reviewUrl: 'https://g.page/review/test',
      smsUsageCount: 50,
      smsUsageLimit: 1000,
      smsMessageTone: 'friendly',
      customSmsMessage: null,
      trialStartsAt: new Date(),
      subscriptionStatus: 'active',
      startTrial: jest.fn().mockResolvedValue(true),
      ...overrides,
    });

    const createTransactionData = (overrides = {}) => ({
      integration: createMockIntegration(),
      externalTransactionId: 'ext_txn_123',
      customerName: 'John Doe',
      customerPhone: '5551234567',
      purchaseAmount: 99.99,
      locationName: 'Downtown Store',
      ...overrides,
    });

    beforeEach(() => {
      const mockTransaction = { id: 1, smsStatus: 'pending', save: jest.fn() };
      PosTransaction.create.mockResolvedValue(mockTransaction);
      PosTransaction.wasContactedRecently.mockResolvedValue(false);
      User.findByPk.mockResolvedValue(createMockUser());
    });

    it('should skip with invalid phone', async () => {
      normalizePhone.mockReturnValueOnce(null);

      const result = await posSmsService.processTransaction(
        createTransactionData({ customerPhone: 'invalid' })
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('invalid_phone');
      expect(PosTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_no_phone',
          skipReason: 'Invalid or non-US phone number',
        })
      );
    });

    it('should skip with non-US phone', async () => {
      isUSNumber.mockReturnValueOnce(false);

      const result = await posSmsService.processTransaction(
        createTransactionData({ customerPhone: '+447911123456' })
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('invalid_phone');
    });

    it('should skip when consent not confirmed', async () => {
      const result = await posSmsService.processTransaction(
        createTransactionData({
          integration: createMockIntegration({ consentConfirmed: false }),
        })
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_consent');
      expect(PosTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_no_consent',
        })
      );
    });

    it('should skip when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const result = await posSmsService.processTransaction(createTransactionData());

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('user_not_found');
    });

    it('should auto-start trial on first POS SMS', async () => {
      const mockUser = createMockUser({
        trialStartsAt: null,
        subscriptionStatus: 'trial',
      });
      User.findByPk.mockResolvedValue(mockUser);

      await posSmsService.processTransaction(createTransactionData());

      expect(mockUser.startTrial).toHaveBeenCalled();
    });

    it('should skip when no review URL configured', async () => {
      User.findByPk.mockResolvedValue(createMockUser({ reviewUrl: null }));

      const result = await posSmsService.processTransaction(createTransactionData());

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_review_link');
      expect(PosTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_no_review_link',
        })
      );
    });

    it('should skip when SMS limit reached', async () => {
      User.findByPk.mockResolvedValue(createMockUser({
        smsUsageCount: 1000,
        smsUsageLimit: 1000,
      }));

      const result = await posSmsService.processTransaction(createTransactionData());

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('sms_limit_reached');
      expect(PosTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_limit_reached',
        })
      );
    });

    it('should skip when customer contacted recently', async () => {
      PosTransaction.wasContactedRecently.mockResolvedValue(true);

      const result = await posSmsService.processTransaction(createTransactionData());

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('recently_contacted');
      expect(PosTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_recent',
        })
      );
    });

    it('should use test phone when test mode enabled', async () => {
      const posSmsQueue = require('../../src/queues/posSmsQueue');

      const result = await posSmsService.processTransaction(
        createTransactionData({
          integration: createMockIntegration({
            testMode: true,
            testPhoneNumber: '5559876543',
          }),
        })
      );

      expect(result.queued).toBe(true);
      expect(result.isTestMode).toBe(true);
      expect(posSmsQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          isTestMode: true,
        })
      );
    });

    it('should skip when test mode enabled but no test phone', async () => {
      const result = await posSmsService.processTransaction(
        createTransactionData({
          integration: createMockIntegration({
            testMode: true,
            testPhoneNumber: null,
          }),
        })
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('test_mode_no_phone');
    });

    it('should queue SMS successfully', async () => {
      const posSmsQueue = require('../../src/queues/posSmsQueue');

      const result = await posSmsService.processTransaction(createTransactionData());

      expect(result.queued).toBe(true);
      expect(result.transactionId).toBe(1);
      expect(result.isTestMode).toBe(false);
      expect(posSmsQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 1,
          userId: 10,
          businessName: 'Test Business',
          reviewLink: 'https://g.page/review/test',
          tone: 'friendly',
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Queued POS SMS',
        expect.objectContaining({ mode: 'LIVE' })
      );
    });

    it('should handle queue errors gracefully', async () => {
      const posSmsQueue = require('../../src/queues/posSmsQueue');
      posSmsQueue.addJob.mockRejectedValue(new Error('Queue unavailable'));

      const mockTransaction = {
        id: 1,
        smsStatus: 'pending',
        skipReason: null,
        save: jest.fn().mockResolvedValue(true),
      };
      PosTransaction.create.mockResolvedValue(mockTransaction);

      const result = await posSmsService.processTransaction(createTransactionData());

      expect(result.error).toBe(true);
      expect(result.reason).toBe('Queue unavailable');
      expect(mockTransaction.smsStatus).toBe('failed');
      expect(mockTransaction.skipReason).toBe('Queue unavailable');
      expect(mockTransaction.save).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error queueing SMS',
        expect.objectContaining({ error: 'Queue unavailable' })
      );
    });

    it('should use custom SMS message when tone is custom', async () => {
      const posSmsQueue = require('../../src/queues/posSmsQueue');
      User.findByPk.mockResolvedValue(createMockUser({
        smsMessageTone: 'custom',
        customSmsMessage: 'Thanks for shopping with us, {{name}}!',
      }));

      await posSmsService.processTransaction(createTransactionData());

      expect(posSmsQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'custom',
          customMessage: 'Thanks for shopping with us, {{name}}!',
        })
      );
    });

    it('should set customMessage to null when tone is not custom', async () => {
      const posSmsQueue = require('../../src/queues/posSmsQueue');
      User.findByPk.mockResolvedValue(createMockUser({
        smsMessageTone: 'professional',
        customSmsMessage: 'This should not be used',
      }));

      await posSmsService.processTransaction(createTransactionData());

      expect(posSmsQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'professional',
          customMessage: null,
        })
      );
    });

    it('should not start trial if already started', async () => {
      const mockUser = createMockUser({
        trialStartsAt: new Date('2025-01-01'),
        subscriptionStatus: 'trial',
      });
      User.findByPk.mockResolvedValue(mockUser);

      await posSmsService.processTransaction(createTransactionData());

      expect(mockUser.startTrial).not.toHaveBeenCalled();
    });

    it('should not start trial if not on trial status', async () => {
      const mockUser = createMockUser({
        trialStartsAt: null,
        subscriptionStatus: 'active',
      });
      User.findByPk.mockResolvedValue(mockUser);

      await posSmsService.processTransaction(createTransactionData());

      expect(mockUser.startTrial).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle purchase amount of 0', async () => {
      const mockTransaction = { id: 1, smsStatus: 'pending', save: jest.fn() };
      PosTransaction.create.mockResolvedValue(mockTransaction);
      PosTransaction.wasContactedRecently.mockResolvedValue(false);
      User.findByPk.mockResolvedValue({
        id: 10,
        businessName: 'Test',
        reviewUrl: 'https://g.page/test',
        smsUsageCount: 0,
        smsUsageLimit: 100,
        smsMessageTone: 'friendly',
        trialStartsAt: new Date(),
      });

      const result = await posSmsService.processTransaction({
        integration: { id: 1, userId: 10, consentConfirmed: true, testMode: false },
        externalTransactionId: 'ext_123',
        customerName: 'Jane Doe',
        customerPhone: '5551234567',
        purchaseAmount: 0,
        locationName: 'Online',
      });

      expect(result.queued).toBe(true);
    });

    it('should handle very long customer names', async () => {
      const mockTransaction = { id: 1, smsStatus: 'pending', save: jest.fn() };
      PosTransaction.create.mockResolvedValue(mockTransaction);
      PosTransaction.wasContactedRecently.mockResolvedValue(false);
      User.findByPk.mockResolvedValue({
        id: 10,
        businessName: 'Test',
        reviewUrl: 'https://g.page/test',
        smsUsageCount: 0,
        smsUsageLimit: 100,
        smsMessageTone: 'friendly',
        trialStartsAt: new Date(),
      });

      const longName = 'A'.repeat(500);

      const result = await posSmsService.processTransaction({
        integration: { id: 1, userId: 10, consentConfirmed: true, testMode: false },
        externalTransactionId: 'ext_123',
        customerName: longName,
        customerPhone: '5551234567',
        purchaseAmount: 50,
        locationName: 'Store',
      });

      expect(result.queued).toBe(true);
    });

    it('should handle null customer name', async () => {
      const mockTransaction = { id: 1, smsStatus: 'pending', save: jest.fn() };
      PosTransaction.create.mockResolvedValue(mockTransaction);
      PosTransaction.wasContactedRecently.mockResolvedValue(false);
      User.findByPk.mockResolvedValue({
        id: 10,
        businessName: 'Test',
        reviewUrl: 'https://g.page/test',
        smsUsageCount: 0,
        smsUsageLimit: 100,
        smsMessageTone: 'friendly',
        trialStartsAt: new Date(),
      });

      const result = await posSmsService.processTransaction({
        integration: { id: 1, userId: 10, consentConfirmed: true, testMode: false },
        externalTransactionId: 'ext_123',
        customerName: null,
        customerPhone: '5551234567',
        purchaseAmount: 50,
        locationName: 'Store',
      });

      expect(result.queued).toBe(true);
    });
  });
});
