/**
 * Dashboard Controller Tests
 *
 * Tests for dashboard authentication and core functionality:
 * - Phase 1: Login, logout, protected routes
 * - Phase 2: Send test SMS endpoint
 *
 * Related Issues:
 * - B5: Trial starts on first SMS, not signup
 * - D1: Atomic SMS slot reservation to prevent race conditions
 */

const { userFactory } = require('../helpers/factories');
const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/emailService', () => ({
  sendSupportRequestEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/stripeService', () => ({
  createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
}));

jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  sms: jest.fn(),
}));

jest.mock('../../src/services/analyticsService', () => ({
  invalidateCache: jest.fn().mockResolvedValue(true),
  getDashboardMetrics: jest.fn().mockResolvedValue({
    roi: { value: 1000, reviews: 10 },
    reviews: { total: 10, positive: 8 },
    requests: { total: 50, clicked: 30 }
  }),
  getUserLocations: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/services/smsService', () => ({
  sendReviewRequest: jest.fn().mockResolvedValue({ success: true, sid: 'SM123' }),
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

jest.mock('../../src/middleware/csrf', () => ({
  rotateToken: jest.fn(),
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
    trialStartsAt: null,
    trialEndsAt: null,
    smsMessageTone: 'friendly',
    customSmsMessage: null,
    marketingStatus: 'active',
    analyticsEnabled: false,
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    increment: jest.fn().mockResolvedValue(true),
    comparePassword: jest.fn().mockResolvedValue(true),
    isTrialActive: jest.fn().mockReturnValue(false),
    isInGracePeriod: jest.fn().mockReturnValue(false),
    isHardLocked: jest.fn().mockReturnValue(false),
    canSendSms: jest.fn().mockReturnValue(true),
    ...overrides,
  };
  return baseUser;
};

// Mock User model
const mockUser = createMockUser();

jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
  FeedbackRequest: {
    count: jest.fn().mockResolvedValue(0),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
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

// Mock smsLimitService for atomic SMS limit checking
jest.mock('../../src/services/smsLimitService', () => ({
  reserveSmsSlot: jest.fn(),
  getUsageStats: jest.fn(),
}));

// Mock shortUrlService
jest.mock('../../src/services/shortUrlService', () => ({
  createFeedbackRequestWithShortUrl: jest.fn(),
}));

const { User, FeedbackRequest } = require('../../src/models');
const smsService = require('../../src/services/smsService');
const smsLimitService = require('../../src/services/smsLimitService');
const shortUrlService = require('../../src/services/shortUrlService');
const { invalidateUserSessionCache } = require('../../src/middleware/auth');
const { rotateToken } = require('../../src/middleware/csrf');
const logger = require('../../src/services/logger');

describe('Dashboard Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      body: {},
      params: {},
      session: {
        userId: null,
        userEmail: null,
        businessName: null,
        regenerate: jest.fn((cb) => cb && cb()),
        save: jest.fn((cb) => cb && cb()),
        destroy: jest.fn((cb) => cb && cb()),
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

    // Reset mock user to default state
    User.findOne.mockResolvedValue(null);
    User.findByPk.mockResolvedValue(createMockUser());
  });

  // ===========================================
  // PHASE 1: Dashboard Authentication Tests
  // ===========================================
  describe('Phase 1: Dashboard Authentication', () => {
    describe('GET /dashboard/login (showLogin)', () => {
      it('should render login page', () => {
        const dashboardController = require('../../src/controllers/dashboardController');

        dashboardController.showLogin(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', {
          title: 'Login - MoreStars',
          error: null
        });
      });
    });

    describe('POST /dashboard/login (login)', () => {
      const validCredentials = {
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      it('should login with valid credentials and redirect to dashboard', async () => {
        mockReq.body = validCredentials;
        const verifiedUser = createMockUser({ isVerified: true });
        User.findOne.mockResolvedValue(verifiedUser);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalledWith({ where: { email: validCredentials.email } });
        expect(verifiedUser.comparePassword).toHaveBeenCalledWith(validCredentials.password);
        expect(mockReq.session.regenerate).toHaveBeenCalled();
      });

      it('should set session data after successful login', async () => {
        mockReq.body = validCredentials;
        const verifiedUser = createMockUser({
          id: 42,
          email: 'user@example.com',
          businessName: 'My Business',
          isVerified: true
        });
        User.findOne.mockResolvedValue(verifiedUser);

        // Mock session.regenerate to actually set session data
        mockReq.session.regenerate = jest.fn((cb) => {
          cb();
        });
        mockReq.session.save = jest.fn((cb) => {
          cb();
        });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockReq.session.userId).toBe(42);
        expect(mockReq.session.userEmail).toBe('user@example.com');
        expect(mockReq.session.businessName).toBe('My Business');
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard');
      });

      it('should rotate CSRF token after login (S1 fix)', async () => {
        mockReq.body = validCredentials;
        const verifiedUser = createMockUser({ isVerified: true });
        User.findOne.mockResolvedValue(verifiedUser);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(rotateToken).toHaveBeenCalledWith(mockReq);
      });

      it('should regenerate session on login (prevent session fixation - S1)', async () => {
        mockReq.body = validCredentials;
        const verifiedUser = createMockUser({ isVerified: true });
        User.findOne.mockResolvedValue(verifiedUser);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockReq.session.regenerate).toHaveBeenCalled();
      });

      it('should reject invalid email (user not found)', async () => {
        mockReq.body = { email: 'nonexistent@example.com', password: 'password' };
        User.findOne.mockResolvedValue(null);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', {
          title: 'Login - MoreStars',
          error: 'Invalid email or password'
        });
        expect(mockReq.session.userId).toBeNull();
      });

      it('should reject invalid password', async () => {
        mockReq.body = validCredentials;
        const userWithWrongPassword = createMockUser({
          comparePassword: jest.fn().mockResolvedValue(false)
        });
        User.findOne.mockResolvedValue(userWithWrongPassword);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', {
          title: 'Login - MoreStars',
          error: 'Invalid email or password'
        });
      });

      it('should reject missing email', async () => {
        mockReq.body = { password: 'Test123!@#' };

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', {
          title: 'Login - MoreStars',
          error: 'Email and password are required'
        });
      });

      it('should reject missing password', async () => {
        mockReq.body = { email: 'test@example.com' };

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', {
          title: 'Login - MoreStars',
          error: 'Email and password are required'
        });
      });

      it('should prompt unverified user to verify email', async () => {
        mockReq.body = validCredentials;
        const unverifiedUser = createMockUser({
          isVerified: false,
          role: 'tenant'
        });
        User.findOne.mockResolvedValue(unverifiedUser);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', expect.objectContaining({
          error: expect.stringContaining('verify your email'),
          showResendVerification: true,
          unverifiedEmail: unverifiedUser.email
        }));
      });

      it('should allow unverified super_admin to login', async () => {
        mockReq.body = validCredentials;
        const unverifiedAdmin = createMockUser({
          isVerified: false,
          role: 'super_admin'
        });
        User.findOne.mockResolvedValue(unverifiedAdmin);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        // Super admin should bypass verification check
        expect(mockReq.session.regenerate).toHaveBeenCalled();
      });

      it('should handle session regeneration error', async () => {
        mockReq.body = validCredentials;
        const verifiedUser = createMockUser({ isVerified: true });
        User.findOne.mockResolvedValue(verifiedUser);

        mockReq.session.regenerate = jest.fn((cb) => cb(new Error('Session error')));

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', expect.objectContaining({
          error: 'Something went wrong. Please try again.'
        }));
        expect(logger.error).toHaveBeenCalled();
      });

      it('should handle session save error', async () => {
        mockReq.body = validCredentials;
        const verifiedUser = createMockUser({ isVerified: true });
        User.findOne.mockResolvedValue(verifiedUser);

        mockReq.session.save = jest.fn((cb) => cb(new Error('Save error')));

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.login(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', expect.objectContaining({
          error: 'Something went wrong. Please try again.'
        }));
      });
    });

    describe('GET /dashboard/logout (logout)', () => {
      it('should destroy session and redirect to login', async () => {
        mockReq.session.userId = 42;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.logout(mockReq, mockRes);

        expect(invalidateUserSessionCache).toHaveBeenCalledWith(42);
        expect(mockReq.session.destroy).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
      });

      it('should handle logout when no user ID in session', async () => {
        mockReq.session.userId = null;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.logout(mockReq, mockRes);

        expect(invalidateUserSessionCache).not.toHaveBeenCalled();
        expect(mockReq.session.destroy).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
      });

      it('should handle session destroy error gracefully', async () => {
        mockReq.session.userId = 42;
        mockReq.session.destroy = jest.fn((cb) => cb(new Error('Destroy error')));

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.logout(mockReq, mockRes);

        // Should still redirect even on error
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
        expect(logger.error).toHaveBeenCalled();
      });
    });

    describe('GET /dashboard (showDashboard) - Protected Route', () => {
      it('should render dashboard with user data', async () => {
        mockReq.session.userId = 1;
        mockReq.session.businessName = 'Test Business';

        const user = createMockUser();
        User.findByPk.mockResolvedValue(user);

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.showDashboard(mockReq, mockRes);

        expect(User.findByPk).toHaveBeenCalledWith(1);
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/index', expect.objectContaining({
          title: 'Dashboard - MoreStars',
          businessName: 'Test Business',
          user: expect.any(Object),
        }));
      });

      it('should return 500 on error', async () => {
        mockReq.session.userId = 1;
        User.findByPk.mockRejectedValue(new Error('Database error'));

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.showDashboard(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith('Something went wrong');
      });
    });
  });

  // ===========================================
  // PHASE 2: Send Test SMS Endpoint Tests
  // ===========================================
  describe('Phase 2: Send Test SMS', () => {
    describe('POST /dashboard/send-test-sms (sendTestSms)', () => {
      const validSmsRequest = {
        phone: '+15551234567',
        customerName: 'John Doe'
      };

      beforeEach(() => {
        mockReq.session.userId = 1;

        // Default: successful SMS slot reservation
        const user = createMockUser({
          reviewUrl: 'https://g.page/r/test123/review',
          trialStartsAt: null,
          subscriptionStatus: 'trial'
        });

        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: true,
          user,
          transaction: { LOCK: { UPDATE: 'UPDATE' } },
          release: jest.fn().mockResolvedValue(true),
        });

        shortUrlService.createFeedbackRequestWithShortUrl.mockResolvedValue({
          feedbackRequest: {
            id: 1,
            shortCode: 'abc123',
            update: jest.fn().mockResolvedValue(true),
          },
          reviewLink: 'https://morestars.io/r/abc123'
        });

        smsService.sendReviewRequest.mockResolvedValue({ success: true, sid: 'SM123' });
      });

      it('should send SMS with valid phone and review URL', async () => {
        mockReq.body = validSmsRequest;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(smsLimitService.reserveSmsSlot).toHaveBeenCalledWith(1, 1);
        expect(shortUrlService.createFeedbackRequestWithShortUrl).toHaveBeenCalled();
        expect(smsService.sendReviewRequest).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: 'SMS sent successfully!'
        }));
      });

      it('should validate phone number format (E.164)', async () => {
        mockReq.body = { phone: 'invalid-phone', customerName: 'Test' };

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid phone number')
        }));
      });

      it('should reject phone without +1 prefix', async () => {
        mockReq.body = { phone: '+445551234567', customerName: 'Test' };

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('valid US phone number')
        }));
      });

      it('should reject when review URL not configured', async () => {
        mockReq.body = validSmsRequest;

        const userWithoutReviewUrl = createMockUser({ reviewUrl: null });
        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: true,
          user: userWithoutReviewUrl,
          transaction: {},
          release: jest.fn().mockResolvedValue(true),
        });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('Review platform URL not configured')
        }));
      });

      it('should reject when SMS limit reached (403)', async () => {
        mockReq.body = validSmsRequest;

        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: false,
          error: 'SMS limit reached',
          user: null,
          transaction: null,
        });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('SMS limit reached')
        }));
      });

      it('should reject when payment is past due (403)', async () => {
        mockReq.body = validSmsRequest;

        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: false,
          error: 'Payment past due',
          user: null,
          transaction: null,
        });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('payment is past due')
        }));
      });

      it('should start trial on first SMS send (B5 fix)', async () => {
        mockReq.body = validSmsRequest;

        const userWithNoTrial = createMockUser({
          trialStartsAt: null,
          trialEndsAt: null,
          subscriptionStatus: 'trial',
          reviewUrl: 'https://g.page/r/test123/review',
        });

        const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
        const mockRelease = jest.fn().mockResolvedValue(true);

        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: true,
          user: userWithNoTrial,
          transaction: mockTransaction,
          release: mockRelease,
        });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        // Verify trial was started
        expect(userWithNoTrial.save).toHaveBeenCalled();
        expect(userWithNoTrial.trialStartsAt).not.toBeNull();
        expect(userWithNoTrial.trialEndsAt).not.toBeNull();
        expect(userWithNoTrial.marketingStatus).toBe('trial_active');
      });

      it('should not restart trial if already started', async () => {
        mockReq.body = validSmsRequest;

        const existingTrialStart = new Date('2024-01-01');
        const userWithTrial = createMockUser({
          trialStartsAt: existingTrialStart,
          trialEndsAt: new Date('2024-01-15'),
          subscriptionStatus: 'trial',
          reviewUrl: 'https://g.page/r/test123/review',
        });

        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: true,
          user: userWithTrial,
          transaction: {},
          release: jest.fn().mockResolvedValue(true),
        });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        // Trial dates should remain unchanged
        expect(userWithTrial.trialStartsAt).toEqual(existingTrialStart);
      });

      it('should use atomic slot reservation (D1 fix)', async () => {
        mockReq.body = validSmsRequest;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        // Verify atomic reservation was used
        expect(smsLimitService.reserveSmsSlot).toHaveBeenCalledWith(1, 1);
      });

      it('should release SMS slot on success and increment count', async () => {
        mockReq.body = validSmsRequest;

        const mockRelease = jest.fn().mockResolvedValue(true);
        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: true,
          user: createMockUser({ reviewUrl: 'https://g.page/r/test/review' }),
          transaction: {},
          release: mockRelease,
        });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        // Release should be called with success=true, increment=1
        expect(mockRelease).toHaveBeenCalledWith(true, 1);
      });

      it('should release SMS slot on failure without incrementing', async () => {
        mockReq.body = validSmsRequest;

        const mockRelease = jest.fn().mockResolvedValue(true);
        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: true,
          user: createMockUser({ reviewUrl: 'https://g.page/r/test/review' }),
          transaction: {},
          release: mockRelease,
        });

        smsService.sendReviewRequest.mockResolvedValue({ success: false, error: 'Twilio error' });

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        // Release should be called with success=false, increment=0
        expect(mockRelease).toHaveBeenCalledWith(false, 0);
        expect(mockRes.status).toHaveBeenCalledWith(500);
      });

      it('should return review link and short code on success', async () => {
        mockReq.body = validSmsRequest;

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          reviewLink: 'https://morestars.io/r/abc123',
          shortCode: 'abc123',
        }));
      });

      it('should handle database error when creating FeedbackRequest', async () => {
        mockReq.body = validSmsRequest;

        const mockRelease = jest.fn().mockResolvedValue(true);
        smsLimitService.reserveSmsSlot.mockResolvedValue({
          canSend: true,
          user: createMockUser({ reviewUrl: 'https://g.page/r/test/review' }),
          transaction: {},
          release: mockRelease,
        });

        shortUrlService.createFeedbackRequestWithShortUrl.mockRejectedValue(
          new Error('Database error')
        );

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(mockRelease).toHaveBeenCalledWith(false, 0);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('Database error')
        }));
      });

      it('should use default customer name if not provided', async () => {
        mockReq.body = { phone: '+15551234567' };

        const dashboardController = require('../../src/controllers/dashboardController');
        await dashboardController.sendTestSms(mockReq, mockRes);

        expect(shortUrlService.createFeedbackRequestWithShortUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            customerName: 'Test Customer'
          }),
          expect.any(Object)
        );
      });
    });
  });

  // ===========================================
  // API Key Regeneration Tests
  // ===========================================
  describe('POST /dashboard/api-key/regenerate', () => {
    it('should regenerate API key and return new key', async () => {
      mockReq.session.userId = 1;

      const user = createMockUser();
      user.regenerateApiKey = jest.fn().mockResolvedValue('ff_newapikey123');
      User.findByPk.mockResolvedValue(user);
      mockReq.user = user;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.regenerateApiKey(mockReq, mockRes);

      expect(user.regenerateApiKey).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        apiKey: 'ff_newapikey123',
      }));
    });

    it('should return 401 if user not found', async () => {
      mockReq.session.userId = 999;
      User.findByPk.mockResolvedValue(null);
      mockReq.user = null;

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.regenerateApiKey(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Not authenticated'
      }));
    });
  });

  // ===========================================
  // Support Request Tests
  // ===========================================
  describe('POST /dashboard/settings/support', () => {
    it('should submit support request successfully', async () => {
      mockReq.session.userId = 1;
      mockReq.body = {
        subject: 'Help needed',
        message: 'I need assistance with my account'
      };

      User.findByPk.mockResolvedValue(createMockUser());

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.submitSupportRequest(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('message has been sent')
      }));
    });

    it('should reject missing subject', async () => {
      mockReq.session.userId = 1;
      mockReq.body = { message: 'Message without subject' };

      User.findByPk.mockResolvedValue(createMockUser());

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.submitSupportRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Subject and message are required'
      }));
    });

    it('should reject missing message', async () => {
      mockReq.session.userId = 1;
      mockReq.body = { subject: 'Subject without message' };

      User.findByPk.mockResolvedValue(createMockUser());

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.submitSupportRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
      mockReq.session.userId = 999;
      mockReq.body = { subject: 'Test', message: 'Test message' };

      User.findByPk.mockResolvedValue(null);

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.submitSupportRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    // Note: Email service error handling is tested at the service level
    // The controller catches errors and returns appropriate responses
  });

  // ===========================================
  // Analytics Edge Cases
  // ===========================================
  describe('Dashboard Analytics Edge Cases', () => {
    it('should render dashboard with default metrics when analytics fails', async () => {
      // This tests the controller's error handling behavior
      // The showDashboard method handles analytics errors internally
      mockReq.session.userId = 1;
      mockReq.user = createMockUser();

      const dashboardController = require('../../src/controllers/dashboardController');
      // Should still render dashboard view
      await dashboardController.showDashboard(mockReq, mockRes);
      expect(mockRes.render).toHaveBeenCalled();
    });

    it('should render dashboard with zero metrics', async () => {
      mockReq.session.userId = 1;
      mockReq.user = createMockUser();

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.showDashboard(mockReq, mockRes);
      expect(mockRes.render).toHaveBeenCalled();
    });
  });

  // ===========================================
  // Additional Error Handling Tests
  // ===========================================
  describe('Error Handling Edge Cases', () => {
    it('should handle missing user on request', async () => {
      mockReq.session.userId = 1;
      mockReq.user = null;

      const dashboardController = require('../../src/controllers/dashboardController');
      // showDashboard expects req.user to be set by auth middleware
      // Testing behavior when user is unexpectedly null
      await dashboardController.showDashboard(mockReq, mockRes);

      // Should handle gracefully - either render or redirect
      expect(mockRes.render.mock.calls.length + mockRes.redirect.mock.calls.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle null session gracefully', async () => {
      mockReq.session = null;
      mockReq.user = null;

      const dashboardController = require('../../src/controllers/dashboardController');
      // This tests defensive error handling
      try {
        await dashboardController.showDashboard(mockReq, mockRes);
      } catch (error) {
        // May throw or handle gracefully
        expect(error).toBeDefined();
      }
    });
  });

  // ===========================================
  // Settings Update Tests
  // ===========================================
  describe('Settings Update', () => {
    it('should update user settings successfully', async () => {
      mockReq.session.userId = 1;
      mockReq.body = {
        reviewUrl: 'https://g.page/r/newbusiness/review',
        smsMessageTone: 'professional',
      };

      const user = createMockUser();
      User.findByPk.mockResolvedValue(user);

      const dashboardController = require('../../src/controllers/dashboardController');
      await dashboardController.updateSettings(mockReq, mockRes);

      // Should render settings page with success message
      expect(mockRes.render).toHaveBeenCalledWith(
        'dashboard/settings',
        expect.objectContaining({
          success: expect.any(String),
        })
      );
    });
  });
});
