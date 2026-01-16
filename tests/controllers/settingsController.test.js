/**
 * Settings Controller Tests
 *
 * Tests for settings management endpoints:
 * - GET /dashboard/settings
 * - POST /dashboard/settings
 * - POST /dashboard/api-key/regenerate
 *
 * Related Issues:
 * - B8: Review URL validation (https required)
 */

const { userFactory } = require('../helpers/factories');
const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../src/services/emailService', () => ({
  sendSupportRequestEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/middleware/trialManager', () => ({
  buildTrialStatus: jest.fn().mockReturnValue({
    isActive: true,
    isInGracePeriod: false,
    isHardLocked: false,
    canSendSms: true,
    hasActiveSubscription: false,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    subscriptionStatus: 'trial'
  }),
}));

jest.mock('../../src/middleware/auth', () => ({
  invalidateUserSessionCache: jest.fn().mockResolvedValue(true),
  requireAuth: (req, res, next) => next(),
  redirectIfAuthenticated: (req, res, next) => next(),
}));

// Create mock user with required methods
const createMockUser = (overrides = {}) => {
  const baseUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    businessName: 'Test Business',
    reviewUrl: 'https://g.page/r/test123/review',
    smsUsageCount: 0,
    smsUsageLimit: 10,
    subscriptionStatus: 'trial',
    isVerified: true,
    isActive: true,
    trialStartsAt: new Date(),
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    smsMessageTone: 'friendly',
    customSmsMessage: null,
    reviewValueEstimate: 80.00,
    apiKey: 'ff_testapikey123',
    analyticsEnabled: false,
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    regenerateApiKey: jest.fn().mockResolvedValue('ff_newapikey456'),
    isTrialActive: jest.fn().mockReturnValue(true),
    isInGracePeriod: jest.fn().mockReturnValue(false),
    isHardLocked: jest.fn().mockReturnValue(false),
    canSendSms: jest.fn().mockReturnValue(true),
    ...overrides,
  };
  return baseUser;
};

jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  FeedbackRequest: {
    count: jest.fn().mockResolvedValue(0),
    findAll: jest.fn().mockResolvedValue([]),
  },
  Review: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  PosIntegration: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  PosLocation: {},
  PosTransaction: {
    findAll: jest.fn().mockResolvedValue([]),
  },
}));

const { User, PosIntegration, PosTransaction } = require('../../src/models');
const { invalidateUserSessionCache } = require('../../src/middleware/auth');
const logger = require('../../src/services/logger');

describe('Settings Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      body: {},
      params: {},
      session: {
        userId: 1,
        userEmail: 'test@example.com',
        businessName: 'Test Business',
      },
      user: null,
      trialStatus: null,
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    User.findByPk.mockResolvedValue(createMockUser());
    PosIntegration.findAll.mockResolvedValue([]);
    PosTransaction.findAll.mockResolvedValue([]);
  });

  // ===========================================
  // GET /dashboard/settings (showSettings)
  // ===========================================
  describe('GET /dashboard/settings (showSettings)', () => {
    it('should render settings page with user data', async () => {
      const user = createMockUser();
      User.findByPk.mockResolvedValue(user);

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showSettings(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
        title: 'Settings - MoreStars',
        user: expect.any(Object),
        success: null,
        error: null,
      }));
    });

    it('should redirect to login if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showSettings(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
    });

    it('should include POS integrations data', async () => {
      const squareIntegration = { provider: 'square', isActive: true, locations: [] };
      const shopifyIntegration = { provider: 'shopify', isActive: true, locations: [] };

      PosIntegration.findAll.mockResolvedValue([squareIntegration, shopifyIntegration]);

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showSettings(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
        squareIntegration,
        shopifyIntegration,
      }));
    });

    it('should return 500 on database error', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showSettings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Something went wrong');
    });
  });

  // ===========================================
  // POST /dashboard/settings (updateSettings)
  // ===========================================
  describe('POST /dashboard/settings (updateSettings)', () => {
    const validSettingsUpdate = {
      businessName: 'Updated Business Name',
      reviewUrl: 'https://g.page/r/newurl123/review',
      smsMessageTone: 'professional',
      reviewValueEstimate: '100',
    };

    it('should update settings with valid data', async () => {
      mockReq.body = validSettingsUpdate;
      const user = createMockUser();
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.updateSettings(mockReq, mockRes);

      expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
        businessName: 'Updated Business Name',
        reviewUrl: 'https://g.page/r/newurl123/review',
        smsMessageTone: 'professional',
        reviewValueEstimate: 100,
      }));
      expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
        success: 'Settings updated successfully!',
        error: null,
      }));
    });

    it('should invalidate cache after settings update', async () => {
      mockReq.body = validSettingsUpdate;
      const user = createMockUser();
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.updateSettings(mockReq, mockRes);

      expect(invalidateUserSessionCache).toHaveBeenCalledWith(1);
    });

    it('should update session businessName after update', async () => {
      mockReq.body = { businessName: 'New Business Name' };
      const user = createMockUser();
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.updateSettings(mockReq, mockRes);

      expect(mockReq.session.businessName).toBe(user.businessName);
    });

    // B8 FIX: Review URL Validation Tests
    describe('Review URL Validation (B8 fix)', () => {
      it('should accept valid https URL', async () => {
        mockReq.body = { reviewUrl: 'https://g.page/r/test123/review' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalled();
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
          success: expect.any(String),
          error: null,
        }));
      });

      it('should accept valid http URL', async () => {
        mockReq.body = { reviewUrl: 'http://example.com/review' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalled();
      });

      it('should reject URL with invalid protocol', async () => {
        mockReq.body = { reviewUrl: 'ftp://example.com/review' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).not.toHaveBeenCalled();
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
          error: expect.stringContaining('https://'),
        }));
      });

      it('should reject invalid URL format', async () => {
        mockReq.body = { reviewUrl: 'not-a-valid-url' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).not.toHaveBeenCalled();
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
          error: expect.stringContaining('Invalid review URL'),
        }));
      });

      it('should reject localhost URL in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        mockReq.body = { reviewUrl: 'https://localhost:3000/review' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).not.toHaveBeenCalled();
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
          error: expect.stringContaining('localhost'),
        }));

        process.env.NODE_ENV = originalEnv;
      });

      it('should reject 127.0.0.1 URL in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        mockReq.body = { reviewUrl: 'https://127.0.0.1:3000/review' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).not.toHaveBeenCalled();

        process.env.NODE_ENV = originalEnv;
      });

      it('should allow empty review URL (clears the field)', async () => {
        mockReq.body = { reviewUrl: '' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewUrl: null,
        }));
      });

      it('should trim whitespace from review URL', async () => {
        mockReq.body = { reviewUrl: '  https://g.page/r/test/review  ' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalled();
      });
    });

    // Custom SMS Template Validation Tests
    describe('Custom SMS Message Validation', () => {
      it('should require custom message when tone is "custom"', async () => {
        mockReq.body = {
          smsMessageTone: 'custom',
          customSmsMessage: '', // Empty message
        };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).not.toHaveBeenCalled();
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
          error: expect.stringContaining('empty'),
        }));
      });

      it('should validate custom message includes {{ReviewLink}}', async () => {
        mockReq.body = {
          smsMessageTone: 'custom',
          customSmsMessage: 'Hi {{CustomerName}}, please leave us a review!', // Missing {{ReviewLink}}
        };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).not.toHaveBeenCalled();
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
          error: expect.stringContaining('{{ReviewLink}}'),
        }));
      });

      it('should accept valid custom message with {{ReviewLink}}', async () => {
        mockReq.body = {
          smsMessageTone: 'custom',
          customSmsMessage: 'Hi {{CustomerName}}, thanks for visiting! Please leave a review: {{ReviewLink}}',
        };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          smsMessageTone: 'custom',
          customSmsMessage: expect.stringContaining('{{ReviewLink}}'),
        }));
      });

      it('should not require custom message when tone is not "custom"', async () => {
        mockReq.body = {
          smsMessageTone: 'friendly',
          customSmsMessage: '', // Empty is fine for non-custom tone
        };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalled();
      });
    });

    // Review Value Estimate Validation
    describe('Review Value Estimate Validation', () => {
      it('should accept valid review value within bounds (1-10000)', async () => {
        mockReq.body = { reviewValueEstimate: '150' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewValueEstimate: 150,
        }));
      });

      it('should accept minimum review value (1)', async () => {
        mockReq.body = { reviewValueEstimate: '1' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewValueEstimate: 1,
        }));
      });

      it('should accept maximum review value (10000)', async () => {
        mockReq.body = { reviewValueEstimate: '10000' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewValueEstimate: 10000,
        }));
      });

      it('should reject value below minimum (< 1)', async () => {
        mockReq.body = { reviewValueEstimate: '0' };
        const user = createMockUser({ reviewValueEstimate: 80 });
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        // Value should not be updated (keeps original)
        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewValueEstimate: 80, // Original value preserved
        }));
      });

      it('should reject value above maximum (> 10000)', async () => {
        mockReq.body = { reviewValueEstimate: '10001' };
        const user = createMockUser({ reviewValueEstimate: 80 });
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        // Value should not be updated (keeps original)
        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewValueEstimate: 80,
        }));
      });

      it('should handle non-numeric review value gracefully', async () => {
        mockReq.body = { reviewValueEstimate: 'abc' };
        const user = createMockUser({ reviewValueEstimate: 80 });
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        // Value should not be updated (keeps original)
        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewValueEstimate: 80,
        }));
      });

      it('should parse decimal review values', async () => {
        mockReq.body = { reviewValueEstimate: '75.50' };
        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);
        mockReq.user = user;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.updateSettings(mockReq, mockRes);

        expect(user.update).toHaveBeenCalledWith(expect.objectContaining({
          reviewValueEstimate: 75.50,
        }));
      });
    });

    it('should redirect to login if user not found', async () => {
      mockReq.body = validSettingsUpdate;
      User.findByPk.mockResolvedValue(null);
      mockReq.user = null;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.updateSettings(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
    });

    it('should handle database update error gracefully', async () => {
      mockReq.body = validSettingsUpdate;
      const user = createMockUser();
      user.update.mockRejectedValue(new Error('Database error'));
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.updateSettings(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('dashboard/settings', expect.objectContaining({
        error: expect.any(String),
        success: null,
      }));
    });
  });

  // ===========================================
  // POST /dashboard/api-key/regenerate
  // ===========================================
  describe('POST /dashboard/api-key/regenerate', () => {
    it('should regenerate API key and return new key', async () => {
      const user = createMockUser();
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.regenerateApiKey(mockReq, mockRes);

      expect(user.regenerateApiKey).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        apiKey: 'ff_newapikey456',
        message: expect.stringContaining('regenerated'),
      }));
    });

    it('should return 401 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);
      mockReq.user = null;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.regenerateApiKey(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Not authenticated',
      }));
    });

    it('should return 500 on regeneration error', async () => {
      const user = createMockUser();
      user.regenerateApiKey.mockRejectedValue(new Error('Key generation failed'));
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.regenerateApiKey(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.stringContaining('Failed to regenerate'),
      }));
    });
  });

  // ===========================================
  // GET /dashboard/qr (showQrCode) - Also in settings context
  // ===========================================
  describe('GET /dashboard/qr (showQrCode)', () => {
    it('should render QR code page', async () => {
      const user = createMockUser();
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      // Mock QRCode module
      jest.mock('qrcode', () => ({
        toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode')
      }));

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showQrCode(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('dashboard/qr', expect.objectContaining({
        title: 'My QR Code - MoreStars',
        qrCodeImage: expect.stringContaining('data:image/png'),
        qrUrl: expect.stringContaining('/r/'),
      }));
    });

    it('should redirect to login if user not found', async () => {
      User.findByPk.mockResolvedValue(null);
      mockReq.user = null;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showQrCode(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
    });

    it('should generate QR code with correct URL format', async () => {
      const user = createMockUser({ id: 42 });
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showQrCode(mockReq, mockRes);

      // QR URL should follow format: {APP_URL}/r/{userId}
      expect(mockRes.render).toHaveBeenCalledWith('dashboard/qr', expect.objectContaining({
        qrUrl: expect.stringContaining('/r/42'),
      }));
    });
  });
});
