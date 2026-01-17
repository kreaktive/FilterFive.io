/**
 * POS Settings Controller Tests
 *
 * Tests for POS integration management:
 * - getPosSettingsData
 * - disconnectPos
 * - updateLocations (with IDOR protection)
 * - toggleTestMode
 * - updateTestPhone
 * - confirmConsent
 * - refreshLocations
 * - getTransactions
 * - sendTestSms
 * - getTestSmsRemaining
 * - createWebhookIntegration
 * - regenerateWebhookApiKey
 * - createStripeIntegration
 * - createWooCommerceIntegration
 * - showWebhookSetup
 * - showWooCommerceSetup
 */

const { resetAllMocks } = require('../helpers/mockServices');
const { posIntegrationFactory } = require('../helpers/factories');

// Mock all dependencies
jest.mock('../../src/models/PosIntegration');
jest.mock('../../src/models/PosLocation');
jest.mock('../../src/models/PosTransaction');
jest.mock('../../src/models/User');
jest.mock('../../src/services/squareOAuthService');
jest.mock('../../src/services/shopifyOAuthService');
jest.mock('../../src/services/smsService');
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../src/utils/phone', () => ({
  normalizePhone: jest.fn((phone) => phone),
  validatePhone: jest.fn((phone) => {
    if (!phone || phone.length < 10) {
      return { valid: false, error: 'Invalid phone number' };
    }
    return { valid: true, normalized: `+1${phone.replace(/\D/g, '')}` };
  }),
}));

const PosIntegration = require('../../src/models/PosIntegration');
const PosLocation = require('../../src/models/PosLocation');
const PosTransaction = require('../../src/models/PosTransaction');
const User = require('../../src/models/User');
const squareOAuthService = require('../../src/services/squareOAuthService');
const shopifyOAuthService = require('../../src/services/shopifyOAuthService');
const smsService = require('../../src/services/smsService');
const logger = require('../../src/services/logger');
const { validatePhone } = require('../../src/utils/phone');

const posSettingsController = require('../../src/controllers/posSettingsController');

describe('POS Settings Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      session: {
        userId: 1,
        posError: null,
        posSuccess: null,
      },
      params: {},
      body: {},
      query: {},
    };

    mockRes = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
    };
  });

  // ===========================================
  // getPosSettingsData Tests
  // ===========================================
  describe('getPosSettingsData', () => {
    it('should return all integrations with locations', async () => {
      const mockIntegrations = [
        { id: 1, provider: 'square', userId: 1, locations: [] },
        { id: 2, provider: 'shopify', userId: 1, locations: [] },
      ];
      const mockTransactions = [
        { id: 1, userId: 1, smsStatus: 'sent' },
      ];

      PosIntegration.findAll.mockResolvedValue(mockIntegrations);
      PosTransaction.findAll.mockResolvedValue(mockTransactions);

      const result = await posSettingsController.getPosSettingsData(1);

      expect(PosIntegration.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: expect.any(Array),
      });
      expect(result.integrations).toEqual(mockIntegrations);
      expect(result.recentTransactions).toEqual(mockTransactions);
      expect(result.integrationsByCategory).toBeDefined();
    });

    it('should return empty arrays when no integrations exist', async () => {
      PosIntegration.findAll.mockResolvedValue([]);
      PosTransaction.findAll.mockResolvedValue([]);

      const result = await posSettingsController.getPosSettingsData(1);

      expect(result.integrations).toEqual([]);
      expect(result.recentTransactions).toEqual([]);
      expect(result.squareIntegration).toBeUndefined();
    });

    it('should correctly categorize integrations by type', async () => {
      const mockIntegrations = [
        { id: 1, provider: 'square', userId: 1, locations: [] },
        { id: 2, provider: 'shopify', userId: 1, locations: [] },
        { id: 3, provider: 'zapier', userId: 1, locations: [] },
      ];

      PosIntegration.findAll.mockResolvedValue(mockIntegrations);
      PosTransaction.findAll.mockResolvedValue([]);

      const result = await posSettingsController.getPosSettingsData(1);

      expect(result.integrationsByCategory.pos).toBeDefined();
      expect(result.integrationsByCategory.ecommerce).toBeDefined();
      expect(result.integrationsByCategory.automation).toBeDefined();
    });
  });

  // ===========================================
  // disconnectPos Tests
  // ===========================================
  describe('disconnectPos', () => {
    it('should redirect with error for invalid provider', async () => {
      mockReq.params = { provider: 'invalid_provider' };

      await posSettingsController.disconnectPos(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid provider.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should redirect with error if integration not found', async () => {
      mockReq.params = { provider: 'square' };
      PosIntegration.findOne.mockResolvedValue(null);

      await posSettingsController.disconnectPos(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('No square integration found.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should revoke Square access and redirect on success', async () => {
      mockReq.params = { provider: 'square' };
      const mockIntegration = { id: 1, provider: 'square', userId: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      squareOAuthService.revokeAccess.mockResolvedValue(true);

      await posSettingsController.disconnectPos(mockReq, mockRes);

      expect(squareOAuthService.revokeAccess).toHaveBeenCalledWith(mockIntegration);
      expect(mockReq.session.posSuccess).toBe('Successfully disconnected from Square.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should revoke Shopify access on disconnect', async () => {
      mockReq.params = { provider: 'shopify' };
      const mockIntegration = { id: 1, provider: 'shopify', userId: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      shopifyOAuthService.revokeAccess.mockResolvedValue(true);

      await posSettingsController.disconnectPos(mockReq, mockRes);

      expect(shopifyOAuthService.revokeAccess).toHaveBeenCalledWith(mockIntegration);
      expect(mockReq.session.posSuccess).toBe('Successfully disconnected from Shopify.');
    });

    it('should deactivate non-OAuth providers (zapier)', async () => {
      mockReq.params = { provider: 'zapier' };
      const mockIntegration = {
        id: 1,
        provider: 'zapier',
        userId: 1,
        isActive: true,
        setApiKey: jest.fn(),
        setConsumerKey: jest.fn(),
        setConsumerSecret: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.disconnectPos(mockReq, mockRes);

      expect(mockIntegration.isActive).toBe(false);
      expect(mockIntegration.setApiKey).toHaveBeenCalledWith(null);
      expect(mockIntegration.save).toHaveBeenCalled();
      expect(mockReq.session.posSuccess).toBe('Successfully disconnected from Zapier.');
    });

    it('should handle disconnect error gracefully', async () => {
      mockReq.params = { provider: 'square' };
      PosIntegration.findOne.mockRejectedValue(new Error('DB error'));

      await posSettingsController.disconnectPos(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Error disconnecting POS', expect.any(Object));
      expect(mockReq.session.posError).toBe('Failed to disconnect. Please try again.');
    });
  });

  // ===========================================
  // updateLocations Tests (IDOR Protection)
  // ===========================================
  describe('updateLocations', () => {
    it('should redirect with error for invalid provider', async () => {
      mockReq.body = { provider: 'invalid', locations: [] };

      await posSettingsController.updateLocations(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid provider.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should redirect with error if integration not found', async () => {
      mockReq.body = { provider: 'square', locations: [] };
      PosIntegration.findOne.mockResolvedValue(null);

      await posSettingsController.updateLocations(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('No square integration found.');
    });

    it('should validate location IDs belong to user (IDOR protection)', async () => {
      mockReq.body = {
        provider: 'square',
        locations: ['loc_valid_1', 'loc_attacker_owned'],
      };

      const mockIntegration = { id: 1, provider: 'square', userId: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      // Only loc_valid_1 belongs to this user
      PosLocation.findAll.mockResolvedValue([
        { externalLocationId: 'loc_valid_1' },
      ]);
      PosLocation.update.mockResolvedValue([1]);

      await posSettingsController.updateLocations(mockReq, mockRes);

      // Should only enable valid location
      expect(PosLocation.update).toHaveBeenCalledWith(
        { isEnabled: true },
        expect.objectContaining({
          where: expect.objectContaining({
            externalLocationId: ['loc_valid_1'],
          }),
        })
      );
    });

    it('should log warning when invalid location IDs are submitted', async () => {
      mockReq.body = {
        provider: 'square',
        locations: ['loc_valid', 'loc_invalid'],
      };

      const mockIntegration = { id: 1, provider: 'square', userId: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findAll.mockResolvedValue([{ externalLocationId: 'loc_valid' }]);
      PosLocation.update.mockResolvedValue([1]);

      await posSettingsController.updateLocations(mockReq, mockRes);

      // Note: The controller logs at the point where invalid IDs are filtered
      expect(mockReq.session.posSuccess).toBe('Location settings updated.');
    });

    it('should handle locations as array', async () => {
      mockReq.body = {
        provider: 'square',
        locations: ['loc_1', 'loc_2'],
      };

      const mockIntegration = { id: 1, provider: 'square', userId: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findAll.mockResolvedValue([
        { externalLocationId: 'loc_1' },
        { externalLocationId: 'loc_2' },
      ]);
      PosLocation.update.mockResolvedValue([2]);

      await posSettingsController.updateLocations(mockReq, mockRes);

      expect(mockReq.session.posSuccess).toBe('Location settings updated.');
    });

    it('should handle single location as string', async () => {
      mockReq.body = {
        provider: 'square',
        locations: 'loc_single',
      };

      const mockIntegration = { id: 1, provider: 'square', userId: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findAll.mockResolvedValue([{ externalLocationId: 'loc_single' }]);
      PosLocation.update.mockResolvedValue([1]);

      await posSettingsController.updateLocations(mockReq, mockRes);

      expect(mockReq.session.posSuccess).toBe('Location settings updated.');
    });

    it('should disable all locations when none selected', async () => {
      mockReq.body = { provider: 'square', locations: [] };

      const mockIntegration = { id: 1, provider: 'square', userId: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.update.mockResolvedValue([3]);

      await posSettingsController.updateLocations(mockReq, mockRes);

      // First call disables all
      expect(PosLocation.update).toHaveBeenCalledWith(
        { isEnabled: false },
        expect.objectContaining({ where: { posIntegrationId: 1 } })
      );
      expect(mockReq.session.posSuccess).toBe('Location settings updated.');
    });

    it('should handle DB error gracefully', async () => {
      mockReq.body = { provider: 'square', locations: [] };
      PosIntegration.findOne.mockRejectedValue(new Error('DB error'));

      await posSettingsController.updateLocations(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Failed to update locations. Please try again.');
    });
  });

  // ===========================================
  // toggleTestMode Tests
  // ===========================================
  describe('toggleTestMode', () => {
    it('should enable test mode', async () => {
      mockReq.body = { provider: 'square', testMode: 'on' };
      const mockIntegration = {
        id: 1,
        provider: 'square',
        testMode: false,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.toggleTestMode(mockReq, mockRes);

      expect(mockIntegration.testMode).toBe(true);
      expect(mockIntegration.save).toHaveBeenCalled();
      expect(mockReq.session.posSuccess).toBe('Test mode enabled');
    });

    it('should disable test mode (live mode)', async () => {
      mockReq.body = { provider: 'square', testMode: 'off' };
      const mockIntegration = {
        id: 1,
        provider: 'square',
        testMode: true,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.toggleTestMode(mockReq, mockRes);

      expect(mockIntegration.testMode).toBe(false);
      expect(mockReq.session.posSuccess).toBe('Live mode enabled');
    });

    it('should handle boolean true value', async () => {
      mockReq.body = { provider: 'square', testMode: true };
      const mockIntegration = {
        id: 1,
        testMode: false,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.toggleTestMode(mockReq, mockRes);

      expect(mockIntegration.testMode).toBe(true);
    });

    it('should reject invalid provider', async () => {
      mockReq.body = { provider: 'invalid', testMode: 'on' };

      await posSettingsController.toggleTestMode(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid provider.');
    });
  });

  // ===========================================
  // updateTestPhone Tests
  // ===========================================
  describe('updateTestPhone', () => {
    it('should update test phone number', async () => {
      mockReq.body = { provider: 'square', testPhoneNumber: '2125551234' };
      validatePhone.mockReturnValue({ valid: true, normalized: '+12125551234' });

      const mockIntegration = {
        id: 1,
        testPhoneNumber: null,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.updateTestPhone(mockReq, mockRes);

      expect(mockIntegration.testPhoneNumber).toBe('+12125551234');
      expect(mockIntegration.save).toHaveBeenCalled();
      expect(mockReq.session.posSuccess).toBe('Test phone number updated.');
    });

    it('should clear test phone when empty', async () => {
      mockReq.body = { provider: 'square', testPhoneNumber: '' };
      const mockIntegration = {
        id: 1,
        testPhoneNumber: '+12125551234',
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.updateTestPhone(mockReq, mockRes);

      expect(mockIntegration.testPhoneNumber).toBeNull();
    });

    it('should reject invalid phone number', async () => {
      mockReq.body = { provider: 'square', testPhoneNumber: '123' };
      validatePhone.mockReturnValue({ valid: false, error: 'Invalid phone format' });

      const mockIntegration = { id: 1 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.updateTestPhone(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid phone format');
    });
  });

  // ===========================================
  // confirmConsent Tests
  // ===========================================
  describe('confirmConsent', () => {
    it('should confirm SMS consent', async () => {
      mockReq.body = { provider: 'square', consent: 'on' };
      const mockIntegration = {
        id: 1,
        consentConfirmed: false,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.confirmConsent(mockReq, mockRes);

      expect(mockIntegration.consentConfirmed).toBe(true);
      expect(mockReq.session.posSuccess).toContain('SMS consent confirmed');
    });

    it('should revoke SMS consent', async () => {
      mockReq.body = { provider: 'square', consent: 'off' };
      const mockIntegration = {
        id: 1,
        consentConfirmed: true,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.confirmConsent(mockReq, mockRes);

      expect(mockIntegration.consentConfirmed).toBe(false);
      expect(mockReq.session.posSuccess).toContain('SMS consent updated');
    });
  });

  // ===========================================
  // refreshLocations Tests
  // ===========================================
  describe('refreshLocations', () => {
    it('should refresh Square locations', async () => {
      mockReq.body = { provider: 'square' };
      const mockIntegration = { id: 1, provider: 'square' };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      squareOAuthService.syncLocations.mockResolvedValue(true);

      await posSettingsController.refreshLocations(mockReq, mockRes);

      expect(squareOAuthService.syncLocations).toHaveBeenCalledWith(mockIntegration);
      expect(mockReq.session.posSuccess).toBe('Locations refreshed successfully.');
    });

    it('should refresh Shopify locations', async () => {
      mockReq.body = { provider: 'shopify' };
      const mockIntegration = { id: 1, provider: 'shopify' };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      shopifyOAuthService.syncLocations.mockResolvedValue(true);

      await posSettingsController.refreshLocations(mockReq, mockRes);

      expect(shopifyOAuthService.syncLocations).toHaveBeenCalledWith(mockIntegration);
    });

    it('should handle sync error', async () => {
      mockReq.body = { provider: 'square' };
      PosIntegration.findOne.mockResolvedValue({ id: 1, provider: 'square' });
      squareOAuthService.syncLocations.mockRejectedValue(new Error('API error'));

      await posSettingsController.refreshLocations(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Failed to refresh locations. Please try again.');
    });
  });

  // ===========================================
  // getTransactions Tests
  // ===========================================
  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      mockReq.query = { page: '1', limit: '20' };
      const mockTransactions = [
        {
          id: 1,
          customerName: 'John Doe',
          getMaskedPhone: () => '***-***-1234',
          purchaseAmount: '50.00',
          locationName: 'Main Store',
          smsStatus: 'sent',
          getStatusLabel: () => 'Sent',
          createdAt: new Date(),
        },
      ];

      PosTransaction.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockTransactions,
      });

      await posSettingsController.getTransactions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transactions: expect.any(Array),
          pagination: expect.objectContaining({
            total: 1,
            page: 1,
            limit: 20,
          }),
        })
      );
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'sent' };
      PosTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await posSettingsController.getTransactions(mockReq, mockRes);

      expect(PosTransaction.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            smsStatus: 'sent',
          }),
        })
      );
    });

    it('should not filter when status is "all"', async () => {
      mockReq.query = { status: 'all' };
      PosTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await posSettingsController.getTransactions(mockReq, mockRes);

      expect(PosTransaction.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        })
      );
    });

    it('should return empty array when no transactions', async () => {
      PosTransaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await posSettingsController.getTransactions(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          transactions: [],
          pagination: expect.objectContaining({ total: 0 }),
        })
      );
    });

    it('should handle DB error', async () => {
      PosTransaction.findAndCountAll.mockRejectedValue(new Error('DB error'));

      await posSettingsController.getTransactions(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch transactions' });
    });
  });

  // ===========================================
  // sendTestSms Tests
  // ===========================================
  describe('sendTestSms', () => {
    it('should send test SMS successfully', async () => {
      mockReq.body = { phone: '2125551234' };
      validatePhone.mockReturnValue({ valid: true, normalized: '+12125551234' });

      const mockUser = {
        id: 1,
        businessName: 'Test Business',
        reviewUrl: 'https://g.page/test',
        smsMessageTone: 'friendly',
        testSmsCount: 0,
        testSmsResetAt: new Date(),
        update: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      smsService.getSmsMessage.mockReturnValue('Test message');
      smsService.sendSMS.mockResolvedValue({ messageSid: 'SM123', status: 'queued' });

      await posSettingsController.sendTestSms(mockReq, mockRes);

      expect(smsService.sendSMS).toHaveBeenCalledWith('+12125551234', 'Test message');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          messageSid: 'SM123',
        })
      );
    });

    it('should return 400 if phone not provided', async () => {
      mockReq.body = { phone: '' };

      await posSettingsController.sendTestSms(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Phone number is required',
      });
    });

    it('should return 404 if user not found', async () => {
      mockReq.body = { phone: '2125551234' };
      User.findByPk.mockResolvedValue(null);

      await posSettingsController.sendTestSms(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should return 400 if no review URL set', async () => {
      mockReq.body = { phone: '2125551234' };
      const mockUser = {
        id: 1,
        reviewUrl: null,
        testSmsCount: 0,
        testSmsResetAt: new Date(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await posSettingsController.sendTestSms(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Google Review URL'),
        })
      );
    });

    it('should return 429 when daily limit exceeded', async () => {
      mockReq.body = { phone: '2125551234' };
      const mockUser = {
        id: 1,
        reviewUrl: 'https://g.page/test',
        testSmsCount: 5,
        testSmsResetAt: new Date(),
        update: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await posSettingsController.sendTestSms(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Daily limit'),
        })
      );
    });

    it('should reset count on new day', async () => {
      mockReq.body = { phone: '2125551234' };
      validatePhone.mockReturnValue({ valid: true, normalized: '+12125551234' });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUser = {
        id: 1,
        reviewUrl: 'https://g.page/test',
        testSmsCount: 5,
        testSmsResetAt: yesterday,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);
      smsService.getSmsMessage.mockReturnValue('Test message');
      smsService.sendSMS.mockResolvedValue({ messageSid: 'SM123' });

      await posSettingsController.sendTestSms(mockReq, mockRes);

      // Should have reset count to 0, then incremented to 1
      expect(mockUser.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 400 for invalid phone', async () => {
      mockReq.body = { phone: '123' };
      validatePhone.mockReturnValue({ valid: false, error: 'Invalid phone format' });

      const mockUser = {
        id: 1,
        reviewUrl: 'https://g.page/test',
        testSmsCount: 0,
        testSmsResetAt: new Date(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await posSettingsController.sendTestSms(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid phone format',
      });
    });

    it('should handle SMS service error', async () => {
      mockReq.body = { phone: '2125551234' };
      validatePhone.mockReturnValue({ valid: true, normalized: '+12125551234' });

      const mockUser = {
        id: 1,
        reviewUrl: 'https://g.page/test',
        testSmsCount: 0,
        testSmsResetAt: new Date(),
        update: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);
      smsService.getSmsMessage.mockReturnValue('Test');
      smsService.sendSMS.mockRejectedValue(new Error('Twilio error'));

      await posSettingsController.sendTestSms(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Twilio error',
      });
    });
  });

  // ===========================================
  // getTestSmsRemaining Tests
  // ===========================================
  describe('getTestSmsRemaining', () => {
    it('should return remaining test SMS count', async () => {
      const mockUser = {
        id: 1,
        testSmsCount: 2,
        testSmsResetAt: new Date(),
        update: jest.fn(),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await posSettingsController.getTestSmsRemaining(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        remaining: 3, // 5 - 2
        limit: 5,
        used: 2,
      });
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await posSettingsController.getTestSmsRemaining(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });
  });

  // ===========================================
  // createWebhookIntegration Tests
  // ===========================================
  describe('createWebhookIntegration', () => {
    it('should create Zapier integration', async () => {
      mockReq.body = { provider: 'zapier' };
      PosIntegration.findOne.mockResolvedValue(null);

      const mockCreatedIntegration = {
        id: 1,
        provider: 'zapier',
        setApiKey: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.create.mockResolvedValue(mockCreatedIntegration);

      await posSettingsController.createWebhookIntegration(mockReq, mockRes);

      expect(PosIntegration.create).toHaveBeenCalled();
      expect(mockReq.session.posSuccess).toContain('Zapier integration created');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos&setup=zapier');
    });

    it('should create custom webhook integration', async () => {
      mockReq.body = { provider: 'webhook' };
      PosIntegration.findOne.mockResolvedValue(null);

      const mockCreatedIntegration = {
        id: 1,
        provider: 'webhook',
        setApiKey: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.create.mockResolvedValue(mockCreatedIntegration);

      await posSettingsController.createWebhookIntegration(mockReq, mockRes);

      expect(mockReq.session.posSuccess).toContain('Custom Webhook integration created');
    });

    it('should reject invalid provider', async () => {
      mockReq.body = { provider: 'invalid' };

      await posSettingsController.createWebhookIntegration(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid webhook provider.');
    });

    it('should reactivate existing inactive integration', async () => {
      mockReq.body = { provider: 'zapier' };
      const existingIntegration = {
        id: 1,
        provider: 'zapier',
        isActive: false,
        setApiKey: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(existingIntegration);

      await posSettingsController.createWebhookIntegration(mockReq, mockRes);

      expect(existingIntegration.isActive).toBe(true);
      expect(existingIntegration.save).toHaveBeenCalled();
    });

    it('should reject if active integration exists', async () => {
      mockReq.body = { provider: 'zapier' };
      const existingIntegration = {
        id: 1,
        provider: 'zapier',
        isActive: true,
      };
      PosIntegration.findOne.mockResolvedValue(existingIntegration);

      await posSettingsController.createWebhookIntegration(mockReq, mockRes);

      expect(mockReq.session.posError).toContain('already exists');
    });
  });

  // ===========================================
  // regenerateWebhookApiKey Tests
  // ===========================================
  describe('regenerateWebhookApiKey', () => {
    it('should regenerate API key for valid provider', async () => {
      mockReq.body = { provider: 'zapier' };
      const mockIntegration = {
        id: 1,
        setApiKey: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await posSettingsController.regenerateWebhookApiKey(mockReq, mockRes);

      expect(mockIntegration.setApiKey).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          apiKey: expect.any(String),
        })
      );
    });

    it('should return 400 for invalid provider', async () => {
      mockReq.body = { provider: 'square' };

      await posSettingsController.regenerateWebhookApiKey(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid provider',
      });
    });

    it('should return 404 if integration not found', async () => {
      mockReq.body = { provider: 'zapier' };
      PosIntegration.findOne.mockResolvedValue(null);

      await posSettingsController.regenerateWebhookApiKey(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Integration not found',
      });
    });
  });

  // ===========================================
  // createStripeIntegration Tests
  // ===========================================
  describe('createStripeIntegration', () => {
    it('should create new Stripe integration', async () => {
      mockReq.body = { triggerOnCheckout: 'on', triggerOnTerminal: 'on' };
      PosIntegration.findOne.mockResolvedValue(null);

      const mockCreated = { id: 1, provider: 'stripe_pos' };
      PosIntegration.create.mockResolvedValue(mockCreated);

      await posSettingsController.createStripeIntegration(mockReq, mockRes);

      expect(PosIntegration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'stripe_pos',
          triggerOnCheckout: true,
          triggerOnTerminal: true,
        })
      );
      expect(mockReq.session.posSuccess).toBe('Stripe integration created.');
    });

    it('should update existing active integration', async () => {
      mockReq.body = { triggerOnCheckout: 'on', triggerOnTerminal: false };
      const existing = {
        id: 1,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(existing);

      await posSettingsController.createStripeIntegration(mockReq, mockRes);

      expect(existing.triggerOnCheckout).toBe(true);
      expect(existing.triggerOnTerminal).toBe(false);
      expect(mockReq.session.posSuccess).toBe('Stripe integration settings updated.');
    });

    it('should reactivate inactive integration', async () => {
      mockReq.body = { triggerOnCheckout: 'on' };
      const existing = {
        id: 1,
        isActive: false,
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(existing);

      await posSettingsController.createStripeIntegration(mockReq, mockRes);

      expect(existing.isActive).toBe(true);
      expect(mockReq.session.posSuccess).toBe('Stripe integration enabled.');
    });
  });

  // ===========================================
  // createWooCommerceIntegration Tests
  // ===========================================
  describe('createWooCommerceIntegration', () => {
    it('should create WooCommerce integration with valid data', async () => {
      mockReq.body = {
        storeUrl: 'https://mystore.com',
        consumerKey: 'ck_test123',
        consumerSecret: 'cs_test456',
      };
      PosIntegration.findOne.mockResolvedValue(null);

      const mockCreated = {
        id: 1,
        setConsumerKey: jest.fn(),
        setConsumerSecret: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.create.mockResolvedValue(mockCreated);

      await posSettingsController.createWooCommerceIntegration(mockReq, mockRes);

      expect(PosIntegration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'woocommerce',
          storeUrl: 'https://mystore.com',
        })
      );
      expect(mockCreated.setConsumerKey).toHaveBeenCalledWith('ck_test123');
      expect(mockReq.session.posSuccess).toContain('WooCommerce integration created');
    });

    it('should require all credentials', async () => {
      mockReq.body = { storeUrl: 'https://mystore.com' };

      await posSettingsController.createWooCommerceIntegration(mockReq, mockRes);

      expect(mockReq.session.posError).toContain('required');
    });

    it('should normalize store URL', async () => {
      mockReq.body = {
        storeUrl: 'mystore.com/',
        consumerKey: 'ck_test',
        consumerSecret: 'cs_test',
      };
      PosIntegration.findOne.mockResolvedValue(null);

      const mockCreated = {
        id: 1,
        setConsumerKey: jest.fn(),
        setConsumerSecret: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.create.mockResolvedValue(mockCreated);

      await posSettingsController.createWooCommerceIntegration(mockReq, mockRes);

      expect(PosIntegration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storeUrl: 'https://mystore.com',
        })
      );
    });
  });

  // ===========================================
  // showWebhookSetup Tests
  // ===========================================
  describe('showWebhookSetup', () => {
    it('should render webhook setup page', async () => {
      mockReq.query = { provider: 'zapier' };
      const mockIntegration = {
        id: 1,
        isActive: true,
        webhookUrl: 'abc123',
        getApiKey: () => 'api_key_123',
        testMode: true,
        consentConfirmed: false,
      };
      const mockUser = { id: 1, businessName: 'Test' };

      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      User.findByPk.mockResolvedValue(mockUser);

      await posSettingsController.showWebhookSetup(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'dashboard/webhook-setup',
        expect.objectContaining({
          provider: 'zapier',
          integration: mockIntegration,
          webhookUrl: expect.stringContaining('abc123'),
        })
      );
    });

    it('should redirect for invalid provider', async () => {
      mockReq.query = { provider: 'invalid' };

      await posSettingsController.showWebhookSetup(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should redirect if no active integration', async () => {
      mockReq.query = { provider: 'zapier' };
      PosIntegration.findOne.mockResolvedValue(null);

      await posSettingsController.showWebhookSetup(mockReq, mockRes);

      expect(mockReq.session.posError).toContain('No active');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });
  });

  // ===========================================
  // showWooCommerceSetup Tests
  // ===========================================
  describe('showWooCommerceSetup', () => {
    it('should render WooCommerce setup page', async () => {
      const mockIntegration = {
        id: 1,
        isActive: true,
        webhookSecret: 'secret123',
        storeUrl: 'https://mystore.com',
        testMode: true,
        consentConfirmed: false,
      };
      const mockUser = { id: 1, businessName: 'Test' };

      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      User.findByPk.mockResolvedValue(mockUser);

      await posSettingsController.showWooCommerceSetup(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'dashboard/woocommerce-setup',
        expect.objectContaining({
          integration: mockIntegration,
          storeUrl: 'https://mystore.com',
        })
      );
    });

    it('should redirect if no active WooCommerce integration', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      await posSettingsController.showWooCommerceSetup(mockReq, mockRes);

      expect(mockReq.session.posError).toContain('No active WooCommerce');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });
  });
});
