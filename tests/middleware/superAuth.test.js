/**
 * Super Admin Auth Middleware Tests
 *
 * Tests for the requireSuperAdmin middleware:
 * - Session validation
 * - User existence check
 * - Active account verification
 * - Super admin role verification
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies BEFORE requiring the module
jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

const { User } = require('../../src/models');
const logger = require('../../src/services/logger');
const { requireSuperAdmin } = require('../../src/middleware/superAuth');

describe('Super Admin Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      session: {
        userId: 1,
        destroy: jest.fn((callback) => callback && callback()),
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  // ===========================================
  // Session Validation Tests
  // ===========================================
  describe('Session Validation', () => {
    it('should return 403 if no session', async () => {
      mockReq.session = null;

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('error', {
        title: 'Access Denied',
        message: 'You must be logged in to access this page.',
        error: { status: 403 },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if no userId in session', async () => {
      mockReq.session.userId = null;

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
        title: 'Access Denied',
        message: 'You must be logged in to access this page.',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if session is undefined', async () => {
      delete mockReq.session;

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // User Not Found Tests
  // ===========================================
  describe('User Not Found', () => {
    it('should return 403 if user not found in database', async () => {
      User.findByPk.mockResolvedValue(null);

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('error', {
        title: 'Access Denied',
        message: 'User not found.',
        error: { status: 403 },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // Inactive User Tests
  // ===========================================
  describe('Inactive User', () => {
    it('should return 403 and destroy session if user is inactive', async () => {
      const inactiveUser = {
        id: 1,
        isActive: false,
        role: 'super_admin',
      };
      User.findByPk.mockResolvedValue(inactiveUser);

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockReq.session.destroy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('error', {
        title: 'Access Denied',
        message: 'Your account has been deactivated.',
        error: { status: 403 },
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Inactive user attempted super admin access',
        { userId: 1 }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // Role Validation Tests
  // ===========================================
  describe('Role Validation', () => {
    it('should return 403 if user is not super_admin', async () => {
      const regularUser = {
        id: 1,
        isActive: true,
        role: 'user',
      };
      User.findByPk.mockResolvedValue(regularUser);

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page. Super Admin access required.',
        error: { status: 403 },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is null', async () => {
      const userWithNullRole = {
        id: 1,
        isActive: true,
        role: null,
      };
      User.findByPk.mockResolvedValue(userWithNullRole);

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
        message: expect.stringContaining('Super Admin access required'),
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is undefined', async () => {
      const userWithoutRole = {
        id: 1,
        isActive: true,
      };
      User.findByPk.mockResolvedValue(userWithoutRole);

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is admin (not super_admin)', async () => {
      const adminUser = {
        id: 1,
        isActive: true,
        role: 'admin',
      };
      User.findByPk.mockResolvedValue(adminUser);

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // Success Scenarios
  // ===========================================
  describe('Successful Authorization', () => {
    it('should call next() and attach user for super_admin', async () => {
      const superAdminUser = {
        id: 1,
        email: 'admin@example.com',
        isActive: true,
        role: 'super_admin',
      };
      User.findByPk.mockResolvedValue(superAdminUser);

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBe(superAdminUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.render).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      User.findByPk.mockRejectedValue(new Error('Database connection failed'));

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in requireSuperAdmin middleware',
        { error: 'Database connection failed' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.render).toHaveBeenCalledWith('error', {
        title: 'Server Error',
        message: 'Something went wrong.',
        error: { status: 500 },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed user object gracefully', async () => {
      // User object that might cause issues
      User.findByPk.mockResolvedValue({});

      await requireSuperAdmin(mockReq, mockRes, mockNext);

      // Should fail because isActive is falsy
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // Integration Pattern Tests
  // ===========================================
  describe('Middleware Chain Integration', () => {
    it('should work as expected in middleware chain', async () => {
      const superAdminUser = {
        id: 1,
        isActive: true,
        role: 'super_admin',
      };
      User.findByPk.mockResolvedValue(superAdminUser);

      // Simulate middleware chain
      let chainContinued = false;
      const nextHandler = jest.fn(() => {
        chainContinued = true;
      });

      await requireSuperAdmin(mockReq, mockRes, nextHandler);

      expect(chainContinued).toBe(true);
      expect(mockReq.user).toBe(superAdminUser);
    });

    it('should stop chain when authorization fails', async () => {
      const regularUser = {
        id: 1,
        isActive: true,
        role: 'user',
      };
      User.findByPk.mockResolvedValue(regularUser);

      let chainContinued = false;
      const nextHandler = jest.fn(() => {
        chainContinued = true;
      });

      await requireSuperAdmin(mockReq, mockRes, nextHandler);

      expect(chainContinued).toBe(false);
      expect(nextHandler).not.toHaveBeenCalled();
    });
  });
});
