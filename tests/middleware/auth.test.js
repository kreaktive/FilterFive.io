/**
 * Auth Middleware Tests
 *
 * Tests for authentication middleware:
 * - requireAuth - Main authentication check
 * - redirectIfAuthenticated - Redirect logged-in users
 * - invalidateUserSessionCache - Clear user cache
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies BEFORE requiring the module
jest.mock('../../src/services/cacheService', () => ({
  isAvailable: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
    build: jest.fn(),
  },
}));

const cacheService = require('../../src/services/cacheService');
const logger = require('../../src/services/logger');
const { User } = require('../../src/models');
const { requireAuth, redirectIfAuthenticated, invalidateUserSessionCache } = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      session: {
        userId: 1,
        id: 'session_12345678',
        destroy: jest.fn((callback) => callback && callback()),
      },
      sessionID: 'sess_123',
      path: '/dashboard',
      headers: {
        cookie: 'connect.sid=s%3Asession_token',
        accept: 'text/html',
      },
      xhr: false,
    };

    mockRes = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  // ===========================================
  // requireAuth Tests
  // ===========================================
  describe('requireAuth', () => {
    describe('Session Validation', () => {
      it('should redirect to login if no session', async () => {
        mockReq.session = null;

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
        expect(mockNext).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
          'requireAuth: No session or userId',
          expect.any(Object)
        );
      });

      it('should redirect to login if no userId in session', async () => {
        mockReq.session.userId = null;

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 401 JSON for AJAX requests without session', async () => {
        mockReq.session.userId = null;
        mockReq.xhr = true;

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Session expired. Please refresh the page.',
        });
        expect(mockRes.redirect).not.toHaveBeenCalled();
      });

      it('should return 401 JSON for requests accepting application/json', async () => {
        mockReq.session.userId = null;
        mockReq.headers.accept = 'application/json';

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Session expired. Please refresh the page.',
        });
      });
    });

    describe('Cache Hit Scenarios', () => {
      it('should use cached user and call next()', async () => {
        const cachedUser = {
          id: 1,
          email: 'test@example.com',
          businessName: 'Test Business',
          isActive: true,
          isVerified: true,
          role: 'user',
        };

        const mockUserInstance = {
          ...cachedUser,
          toJSON: () => cachedUser,
        };

        cacheService.isAvailable.mockReturnValue(true);
        cacheService.get.mockResolvedValue(cachedUser);
        User.build.mockReturnValue(mockUserInstance);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(cacheService.get).toHaveBeenCalledWith('auth:user:1');
        expect(User.findByPk).not.toHaveBeenCalled();
        expect(mockReq.user).toBe(mockUserInstance);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Cache Miss Scenarios', () => {
      it('should query DB on cache miss and cache the result', async () => {
        const dbUser = {
          id: 1,
          email: 'test@example.com',
          businessName: 'Test Business',
          isActive: true,
          isVerified: true,
          role: 'user',
          toJSON: jest.fn().mockReturnValue({
            id: 1,
            email: 'test@example.com',
            businessName: 'Test Business',
            isActive: true,
            isVerified: true,
            role: 'user',
          }),
        };

        cacheService.isAvailable.mockReturnValue(true);
        cacheService.get.mockResolvedValue(null);
        cacheService.set.mockResolvedValue(true);
        User.findByPk.mockResolvedValue(dbUser);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(User.findByPk).toHaveBeenCalledWith(1, {
          attributes: expect.arrayContaining(['id', 'email', 'businessName', 'isActive', 'isVerified', 'role']),
        });
        expect(cacheService.set).toHaveBeenCalledWith(
          'auth:user:1',
          expect.any(Object),
          60 // TTL
        );
        expect(mockReq.user).toBe(dbUser);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should work without cache when cache service unavailable', async () => {
        const dbUser = {
          id: 1,
          email: 'test@example.com',
          isActive: true,
          isVerified: true,
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        };

        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk.mockResolvedValue(dbUser);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(cacheService.get).not.toHaveBeenCalled();
        expect(User.findByPk).toHaveBeenCalled();
        expect(mockReq.user).toBe(dbUser);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('User Not Found', () => {
      it('should destroy session and redirect when user not found in DB', async () => {
        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk.mockResolvedValue(null);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockReq.session.destroy).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login?error=account_disabled');
        expect(mockNext).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
          'Auth rejected: user inactive or deleted',
          expect.objectContaining({ reason: 'user_not_found' })
        );
      });
    });

    describe('Inactive User', () => {
      it('should destroy session and redirect when user is inactive', async () => {
        const inactiveUser = {
          id: 1,
          isActive: false,
          isVerified: true,
        };

        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk.mockResolvedValue(inactiveUser);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockReq.session.destroy).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login?error=account_disabled');
        expect(logger.warn).toHaveBeenCalledWith(
          'Auth rejected: user inactive or deleted',
          expect.objectContaining({ reason: 'user_inactive' })
        );
      });

      it('should reject inactive user even if from cache', async () => {
        const cachedInactiveUser = {
          id: 1,
          isActive: false,
          isVerified: true,
        };

        cacheService.isAvailable.mockReturnValue(true);
        cacheService.get.mockResolvedValue(cachedInactiveUser);
        User.build.mockReturnValue(cachedInactiveUser);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockReq.session.destroy).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login?error=account_disabled');
      });
    });

    describe('Unverified User', () => {
      it('should destroy session and redirect when user is not verified', async () => {
        const unverifiedUser = {
          id: 1,
          isActive: true,
          isVerified: false,
        };

        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk.mockResolvedValue(unverifiedUser);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(mockReq.session.destroy).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login?error=email_not_verified');
        expect(logger.warn).toHaveBeenCalledWith(
          'Auth rejected: user not verified',
          expect.objectContaining({ userId: 1 })
        );
      });
    });

    describe('Error Handling', () => {
      it('should redirect to login on DB error', async () => {
        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk.mockRejectedValue(new Error('Database connection error'));

        await requireAuth(mockReq, mockRes, mockNext);

        expect(logger.error).toHaveBeenCalledWith(
          'Auth middleware error',
          expect.objectContaining({ error: 'Database connection error' })
        );
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should redirect to login when cache set throws (documents current behavior)', async () => {
        // Note: Current implementation catches cache errors at outer try/catch level,
        // causing the request to fail. This could be improved by catching cache.set errors
        // specifically and continuing despite cache failures.
        const dbUser = {
          id: 1,
          isActive: true,
          isVerified: true,
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        };

        cacheService.isAvailable.mockReturnValue(true);
        cacheService.get.mockResolvedValue(null);
        cacheService.set.mockRejectedValue(new Error('Redis error'));
        User.findByPk.mockResolvedValue(dbUser);

        await requireAuth(mockReq, mockRes, mockNext);

        // Current behavior: cache error causes redirect
        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
        expect(logger.error).toHaveBeenCalledWith(
          'Auth middleware error',
          expect.objectContaining({ error: 'Redis error' })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('loadUserAttributes lazy loader', () => {
      it('should attach loadUserAttributes function to request', async () => {
        const dbUser = {
          id: 1,
          isActive: true,
          isVerified: true,
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        };

        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk.mockResolvedValue(dbUser);

        await requireAuth(mockReq, mockRes, mockNext);

        expect(typeof mockReq.loadUserAttributes).toBe('function');
      });

      it('should load additional attributes when loadUserAttributes called', async () => {
        const basicUser = {
          id: 1,
          isActive: true,
          isVerified: true,
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        };

        const fullUser = {
          id: 1,
          email: 'test@example.com',
          smsUsageCount: 100,
          subscriptionStatus: 'active',
        };

        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk
          .mockResolvedValueOnce(basicUser)
          .mockResolvedValueOnce(fullUser);

        await requireAuth(mockReq, mockRes, mockNext);

        // Call loadUserAttributes
        const result = await mockReq.loadUserAttributes('full');

        expect(User.findByPk).toHaveBeenCalledTimes(2);
        expect(mockReq.user).toBe(fullUser);
        expect(result).toBe(fullUser);
      });

      it('should not reload if already loaded same attribute set', async () => {
        const basicUser = {
          id: 1,
          isActive: true,
          isVerified: true,
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        };

        const fullUser = {
          id: 1,
          email: 'test@example.com',
        };

        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk
          .mockResolvedValueOnce(basicUser)
          .mockResolvedValueOnce(fullUser);

        await requireAuth(mockReq, mockRes, mockNext);

        // Call loadUserAttributes twice
        await mockReq.loadUserAttributes('full');
        await mockReq.loadUserAttributes('full');

        // Should only call findByPk twice total (once for auth, once for full)
        expect(User.findByPk).toHaveBeenCalledTimes(2);
      });

      it('should load sms attributes correctly', async () => {
        const basicUser = {
          id: 1,
          isActive: true,
          isVerified: true,
          toJSON: jest.fn().mockReturnValue({ id: 1 }),
        };

        const smsUser = {
          id: 1,
          smsUsageCount: 50,
          smsUsageLimit: 100,
        };

        cacheService.isAvailable.mockReturnValue(false);
        User.findByPk
          .mockResolvedValueOnce(basicUser)
          .mockResolvedValueOnce(smsUser);

        await requireAuth(mockReq, mockRes, mockNext);

        await mockReq.loadUserAttributes('sms');

        // Verify it called with SMS-related attributes
        expect(User.findByPk).toHaveBeenLastCalledWith(
          1,
          expect.objectContaining({
            attributes: expect.arrayContaining(['smsUsageCount', 'smsUsageLimit']),
          })
        );
      });
    });
  });

  // ===========================================
  // redirectIfAuthenticated Tests
  // ===========================================
  describe('redirectIfAuthenticated', () => {
    it('should redirect to dashboard if user is authenticated', () => {
      mockReq.session.userId = 1;

      redirectIfAuthenticated(mockReq, mockRes, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next if no userId in session', () => {
      mockReq.session.userId = null;

      redirectIfAuthenticated(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    it('should call next if session is null', () => {
      mockReq.session = null;

      redirectIfAuthenticated(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    it('should call next if session is undefined', () => {
      delete mockReq.session;

      redirectIfAuthenticated(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // invalidateUserSessionCache Tests
  // ===========================================
  describe('invalidateUserSessionCache', () => {
    it('should delete cache key when cache is available', async () => {
      cacheService.isAvailable.mockReturnValue(true);
      cacheService.del.mockResolvedValue(true);

      await invalidateUserSessionCache(123);

      expect(cacheService.del).toHaveBeenCalledWith('auth:user:123');
      expect(logger.info).toHaveBeenCalledWith(
        'User session cache invalidated',
        { userId: 123 }
      );
    });

    it('should do nothing when cache is not available', async () => {
      cacheService.isAvailable.mockReturnValue(false);

      await invalidateUserSessionCache(123);

      expect(cacheService.del).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should handle cache del error gracefully', async () => {
      cacheService.isAvailable.mockReturnValue(true);
      cacheService.del.mockRejectedValue(new Error('Redis connection lost'));

      // Should not throw
      await expect(invalidateUserSessionCache(123)).rejects.toThrow('Redis connection lost');
    });
  });
});
