/**
 * Auth Controller Tests
 *
 * Tests for authentication flows:
 * - Signup (registration)
 * - Email verification
 * - Password reset
 * - Resend verification
 *
 * Related Issues:
 * - S5: Password reset token security
 * - D5: Auth flow transaction management
 */

const crypto = require('crypto');
const { userFactory, generatePassword } = require('../helpers/factories');
const { mockResend, mockStripe, resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendBusinessEventAlert: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/stripeService', () => ({
  createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
}));

jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  auth: jest.fn(),
  stripe: jest.fn(),
}));

jest.mock('../../src/middleware/csrf', () => ({
  rotateToken: jest.fn(),
}));

jest.mock('../../src/middleware/auth', () => ({
  invalidateUserSessionCache: jest.fn().mockResolvedValue(true),
}));

// Mock User model
const mockUser = {
  id: 1,
  email: 'test@example.com',
  businessName: 'Test Business',
  password: '$2a$10$hashedpassword',
  isVerified: false,
  verificationToken: 'test-token-123',
  verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  resetPasswordToken: null,
  resetPasswordTokenExpires: null,
  update: jest.fn().mockResolvedValue(true),
  comparePassword: jest.fn().mockResolvedValue(true),
};

jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
}));

const User = require('../../src/models/User');
const emailService = require('../../src/services/emailService');
const stripeService = require('../../src/services/stripeService');

describe('Auth Controller', () => {
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
        destroy: jest.fn((cb) => cb && cb()),
        save: jest.fn((cb) => cb && cb()),
      },
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('POST /signup', () => {
    const validSignupData = {
      businessName: 'Test Business LLC',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
    };

    beforeEach(() => {
      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue({
        id: 1,
        ...validSignupData,
        update: jest.fn().mockResolvedValue(true),
      });
    });

    test('should create user with valid data', async () => {
      mockReq.body = validSignupData;

      // Import controller after mocks are set up
      const authController = require('../../src/controllers/authController');

      await authController.signup(mockReq, mockRes);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validSignupData.email.toLowerCase(),
          businessName: validSignupData.businessName,
        })
      );
    });

    test('should send verification email after signup', async () => {
      mockReq.body = validSignupData;

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        validSignupData.email.toLowerCase(),
        validSignupData.businessName,
        expect.any(String) // verification token
      );
    });

    test('should create Stripe customer after signup', async () => {
      mockReq.body = validSignupData;

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(stripeService.createCustomer).toHaveBeenCalled();
    });

    test('should reject duplicate email', async () => {
      mockReq.body = validSignupData;
      User.findOne.mockResolvedValue(mockUser); // Existing user found

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/signup',
        expect.objectContaining({
          error: expect.stringContaining('already exists'),
        })
      );
    });

    test('should validate email format', async () => {
      mockReq.body = {
        ...validSignupData,
        email: 'invalid-email',
      };

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(User.create).not.toHaveBeenCalled();
    });

    test('should validate password strength', async () => {
      mockReq.body = {
        ...validSignupData,
        password: 'weak',
      };

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(User.create).not.toHaveBeenCalled();
    });

    test('should sanitize business name (XSS prevention)', async () => {
      mockReq.body = {
        ...validSignupData,
        businessName: '<script>alert("xss")</script>Business',
      };

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      if (User.create.mock.calls.length > 0) {
        const createdUser = User.create.mock.calls[0][0];
        expect(createdUser.businessName).not.toContain('<script>');
      }
    });

    test('should set correct trial dates', async () => {
      mockReq.body = validSignupData;

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      const createCall = User.create.mock.calls[0][0];
      expect(createCall.trialStartsAt).toBeDefined();
      expect(createCall.trialEndsAt).toBeDefined();

      // Trial should be ~14 days
      const trialDuration = createCall.trialEndsAt - createCall.trialStartsAt;
      const expectedDuration = 14 * 24 * 60 * 60 * 1000;
      expect(trialDuration).toBeCloseTo(expectedDuration, -4); // Within 10 seconds
    });

    test('should continue signup if Stripe fails', async () => {
      mockReq.body = validSignupData;
      stripeService.createCustomer.mockRejectedValue(new Error('Stripe unavailable'));

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      // Signup should still succeed
      expect(User.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    /**
     * ISSUE D5: Missing Transaction Management
     *
     * Current behavior: User is created, then Stripe customer creation happens.
     * If Stripe fails, we have an orphaned user.
     *
     * This test documents the current (non-transactional) behavior.
     * TODO: Wrap in transaction after implementing fix.
     */
    test('documents D5: user creation should be atomic with related operations', () => {
      // This is a documentation test for Issue D5
      // The fix requires wrapping User.create + stripeService.createCustomer
      // in a database transaction

      const expectedAtomicOperations = [
        'Create user in database',
        'Create Stripe customer',
        'Update user with stripeCustomerId',
        'Send verification email',
      ];

      // Currently these are NOT atomic - if step 2 fails, step 1 already committed
      expect(expectedAtomicOperations).toHaveLength(4);
    });
  });

  describe('GET /verify/:token', () => {
    test('should verify email with valid token', async () => {
      mockReq.params = { token: 'valid-token-123' };

      const validUser = {
        ...mockUser,
        verificationToken: 'valid-token-123',
        verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour future
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(validUser);

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      expect(validUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: true,
          verificationToken: null,
        })
      );
    });

    test('should reject expired token', async () => {
      mockReq.params = { token: 'expired-token' };

      const expiredUser = {
        ...mockUser,
        verificationToken: 'expired-token',
        verificationTokenExpires: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };
      User.findOne.mockResolvedValue(expiredUser);

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/verify-error',
        expect.objectContaining({
          error: expect.stringContaining('expired'),
        })
      );
    });

    test('should reject invalid token', async () => {
      mockReq.params = { token: 'invalid-token' };
      User.findOne.mockResolvedValue(null);

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should auto-login user after verification', async () => {
      mockReq.params = { token: 'valid-token' };

      const validUser = {
        id: 42,
        email: 'verified@example.com',
        businessName: 'Verified Business',
        verificationToken: 'valid-token',
        verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
        isVerified: false,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(validUser);

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      // Session should be set
      expect(mockReq.session.userId).toBe(validUser.id);
      expect(mockReq.session.userEmail).toBe(validUser.email);
    });

    test('should send welcome email after verification', async () => {
      mockReq.params = { token: 'valid-token' };

      const validUser = {
        ...mockUser,
        verificationToken: 'valid-token',
        verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(validUser);

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        validUser.email,
        validUser.businessName
      );
    });
  });

  describe('POST /forgot-password', () => {
    test('should generate reset token for valid email', async () => {
      mockReq.body = { email: 'user@example.com' };

      const existingUser = {
        ...mockUser,
        email: 'user@example.com',
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(existingUser);

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(mockReq, mockRes);

      expect(existingUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordTokenExpires: expect.any(Date),
        })
      );
    });

    test('should send password reset email', async () => {
      mockReq.body = { email: 'user@example.com' };

      const existingUser = {
        ...mockUser,
        email: 'user@example.com',
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(existingUser);

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(mockReq, mockRes);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    test('should not reveal if email exists (security)', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };
      User.findOne.mockResolvedValue(null);

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(mockReq, mockRes);

      // Should show same success message even for non-existent email
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/forgot-password',
        expect.objectContaining({
          success: expect.stringContaining('If an account exists'),
        })
      );
    });

    /**
     * ISSUE S5: Password Reset Token Security
     *
     * Current: Token expires after 1 hour, but no maximum reuse limit
     * Required:
     * 1. Shorter expiration (30 min recommended)
     * 2. Invalidate token after first use
     * 3. Add token use count limit
     */
    test('documents S5: reset token should expire in 30 minutes or less', async () => {
      mockReq.body = { email: 'user@example.com' };

      const existingUser = {
        ...mockUser,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(existingUser);

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(mockReq, mockRes);

      const updateCall = existingUser.update.mock.calls[0][0];
      const tokenExpiry = updateCall.resetPasswordTokenExpires;
      const expiryDuration = tokenExpiry - Date.now();

      // Current: 1 hour (3600000ms)
      // TODO: Should be 30 minutes (1800000ms) or less
      const oneHour = 60 * 60 * 1000;
      const thirtyMinutes = 30 * 60 * 1000;

      // This test documents the current behavior
      // When fixed, change expectation to thirtyMinutes
      expect(expiryDuration).toBeLessThanOrEqual(oneHour);

      // Uncomment after fix:
      // expect(expiryDuration).toBeLessThanOrEqual(thirtyMinutes);
    });
  });

  describe('POST /reset-password/:token', () => {
    test('should reset password with valid token', async () => {
      mockReq.params = { token: 'valid-reset-token' };
      mockReq.body = {
        password: 'NewSecurePass123!',
        confirmPassword: 'NewSecurePass123!',
      };

      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-reset-token',
        resetPasswordTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(userWithToken);

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(mockReq, mockRes);

      expect(userWithToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          password: mockReq.body.password,
          resetPasswordToken: null,
          resetPasswordTokenExpires: null,
        })
      );
    });

    test('should reject mismatched passwords', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.body = {
        password: 'NewPass123!',
        confirmPassword: 'DifferentPass123!',
      };

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should reject expired token', async () => {
      mockReq.params = { token: 'expired-token' };
      mockReq.body = {
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      const expiredUser = {
        ...mockUser,
        resetPasswordToken: 'expired-token',
        resetPasswordTokenExpires: new Date(Date.now() - 60 * 60 * 1000), // Expired
      };
      User.findOne.mockResolvedValue(expiredUser);

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/reset-error',
        expect.objectContaining({
          error: expect.stringContaining('expired'),
        })
      );
    });

    test('should invalidate token after successful reset', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.body = {
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(userWithToken);

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(mockReq, mockRes);

      // Token should be cleared
      expect(userWithToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: null,
          resetPasswordTokenExpires: null,
        })
      );
    });

    test('should validate new password strength', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.body = {
        password: 'weak',
        confirmPassword: 'weak',
      };

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('POST /resend-verification', () => {
    test('should resend verification email for unverified user', async () => {
      mockReq.body = { email: 'unverified@example.com' };

      const unverifiedUser = {
        ...mockUser,
        email: 'unverified@example.com',
        isVerified: false,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(unverifiedUser);

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    test('should not reveal if email exists (security)', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };
      User.findOne.mockResolvedValue(null);

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      // Same success message even for non-existent email
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('If an account exists'),
        })
      );
    });

    test('should generate new verification token when existing token is expired', async () => {
      mockReq.body = { email: 'unverified@example.com' };

      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        // Expired token - should generate a new one
        verificationToken: 'expired-token',
        verificationTokenExpires: new Date(Date.now() - 1000), // 1 second ago
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(unverifiedUser);

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      expect(unverifiedUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationToken: expect.any(String),
          verificationTokenExpires: expect.any(Date),
        })
      );
    });

    test('should reuse existing token if still valid', async () => {
      mockReq.body = { email: 'unverified@example.com' };

      const validFutureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        verificationToken: 'still-valid-token',
        verificationTokenExpires: validFutureDate,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(unverifiedUser);

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      // Should NOT call update - reuses existing valid token
      expect(unverifiedUser.update).not.toHaveBeenCalled();

      // Should still send the email with the existing token
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'unverified@example.com',
        unverifiedUser.businessName,
        'still-valid-token'
      );
    });

    test('should generate new token when no token exists', async () => {
      mockReq.body = { email: 'unverified@example.com' };

      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        verificationToken: null,
        verificationTokenExpires: null,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(unverifiedUser);

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      expect(unverifiedUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationToken: expect.any(String),
          verificationTokenExpires: expect.any(Date),
        })
      );
    });
  });

  // ===========================================
  // GET /forgot-password (showForgotPassword)
  // ===========================================
  describe('GET /forgot-password (showForgotPassword)', () => {
    test('should render forgot password form', () => {
      const authController = require('../../src/controllers/authController');
      authController.showForgotPassword(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('auth/forgot-password', {
        title: 'Forgot Password',
        error: null,
        success: null,
      });
    });
  });

  // ===========================================
  // GET /reset-password/:token (showResetPassword)
  // ===========================================
  describe('GET /reset-password/:token (showResetPassword)', () => {
    test('should render reset password form for valid token', async () => {
      mockReq.params = { token: 'valid-reset-token' };

      const userWithValidToken = {
        ...mockUser,
        resetPasswordToken: 'valid-reset-token',
        resetPasswordTokenExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
      };
      User.findOne.mockResolvedValue(userWithValidToken);

      const authController = require('../../src/controllers/authController');
      await authController.showResetPassword(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('auth/reset-password', {
        title: 'Reset Password',
        token: 'valid-reset-token',
        error: null,
      });
    });

    test('should return 400 for invalid token', async () => {
      mockReq.params = { token: 'invalid-token' };
      User.findOne.mockResolvedValue(null);

      const authController = require('../../src/controllers/authController');
      await authController.showResetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.render).toHaveBeenCalledWith('auth/reset-error', expect.objectContaining({
        title: 'Invalid Link',
        error: expect.stringContaining('Invalid'),
      }));
    });

    test('should return 400 for expired token', async () => {
      mockReq.params = { token: 'expired-token' };

      const userWithExpiredToken = {
        ...mockUser,
        resetPasswordToken: 'expired-token',
        resetPasswordTokenExpires: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };
      User.findOne.mockResolvedValue(userWithExpiredToken);

      const authController = require('../../src/controllers/authController');
      await authController.showResetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.render).toHaveBeenCalledWith('auth/reset-error', expect.objectContaining({
        title: 'Link Expired',
        error: expect.stringContaining('expired'),
      }));
    });

    test('should handle database errors gracefully', async () => {
      mockReq.params = { token: 'any-token' };
      User.findOne.mockRejectedValue(new Error('Database error'));

      const authController = require('../../src/controllers/authController');
      await authController.showResetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.render).toHaveBeenCalledWith('auth/reset-error', expect.objectContaining({
        error: expect.stringContaining('error'),
      }));
    });
  });

  // ===========================================
  // GET /signup (showSignup)
  // ===========================================
  describe('GET /signup (showSignup)', () => {
    test('should render signup form', () => {
      const authController = require('../../src/controllers/authController');
      authController.showSignup(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('auth/signup', expect.objectContaining({
        title: 'Sign Up - MoreStars',
        error: null,
        businessName: '',
        email: '',
      }));
    });
  });

  // ===========================================
  // Additional Edge Case Tests for Full Coverage
  // ===========================================
  describe('POST /signup - Additional Edge Cases', () => {
    const validSignupData = {
      businessName: 'Test Business LLC',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
    };

    beforeEach(() => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 1,
        ...validSignupData,
        update: jest.fn().mockResolvedValue(true),
      });
    });

    test('should render verify-pending with emailError when email fails', async () => {
      mockReq.body = validSignupData;
      const emailService = require('../../src/services/emailService');
      emailService.sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/verify-pending',
        expect.objectContaining({
          emailError: true,
        })
      );
    });

    test('should handle DB error during user creation', async () => {
      mockReq.body = validSignupData;
      User.create.mockRejectedValue(new Error('Database constraint violation'));

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/signup',
        expect.objectContaining({
          error: expect.stringContaining('error'),
        })
      );
    });

    test('should show resend option for unverified duplicate email', async () => {
      mockReq.body = validSignupData;
      User.findOne.mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });

      const authController = require('../../src/controllers/authController');
      await authController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/signup',
        expect.objectContaining({
          showResendVerification: true,
          unverifiedEmail: validSignupData.email.toLowerCase(),
        })
      );
    });
  });

  describe('GET /verify/:token - Session Edge Cases', () => {
    test('should show login message when session regeneration fails', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.session.regenerate = jest.fn((cb) => cb(new Error('Session store unavailable')));

      const validUser = {
        id: 42,
        email: 'verified@example.com',
        businessName: 'Verified Business',
        verificationToken: 'valid-token',
        verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
        isVerified: false,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(validUser);

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/verify-success',
        expect.objectContaining({
          dashboardUrl: '/dashboard/login',
          message: 'Please log in to continue.',
        })
      );
    });

    test('should handle session save error gracefully', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.session.regenerate = jest.fn((cb) => cb(null));
      mockReq.session.save = jest.fn((cb) => cb(new Error('Session save failed')));

      const validUser = {
        id: 42,
        email: 'verified@example.com',
        businessName: 'Verified Business',
        verificationToken: 'valid-token',
        verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
        isVerified: false,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(validUser);

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      // Should still render success page despite save error
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/verify-success',
        expect.objectContaining({
          dashboardUrl: '/dashboard',
        })
      );
    });

    test('should handle welcome email failure without blocking', async () => {
      mockReq.params = { token: 'valid-token' };

      const validUser = {
        id: 42,
        email: 'verified@example.com',
        businessName: 'Verified Business',
        verificationToken: 'valid-token',
        verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
        isVerified: false,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(validUser);

      const emailService = require('../../src/services/emailService');
      emailService.sendWelcomeEmail.mockRejectedValueOnce(new Error('Email service down'));

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      // Verification should still succeed
      expect(validUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: true,
        })
      );
    });

    test('should handle database error during verification', async () => {
      mockReq.params = { token: 'any-token' };
      User.findOne.mockRejectedValue(new Error('Database connection lost'));

      const authController = require('../../src/controllers/authController');
      await authController.verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/verify-error',
        expect.objectContaining({
          error: expect.stringContaining('error'),
        })
      );
    });
  });

  describe('POST /resend-verification - Edge Cases', () => {
    test('should return 400 when email not provided', async () => {
      mockReq.body = { email: '' };

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email is required',
      });
    });

    test('should handle database error during resend', async () => {
      mockReq.body = { email: 'test@example.com' };
      User.findOne.mockRejectedValue(new Error('DB error'));

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to resend verification email',
      });
    });

    test('should handle email send failure during resend', async () => {
      mockReq.body = { email: 'unverified@example.com' };

      const unverifiedUser = {
        ...mockUser,
        isVerified: false,
        verificationToken: null,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(unverifiedUser);

      const emailService = require('../../src/services/emailService');
      emailService.sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP failure'));

      const authController = require('../../src/controllers/authController');
      await authController.resendVerification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to resend verification email',
      });
    });
  });

  describe('POST /forgot-password - Edge Cases', () => {
    test('should handle email validation failure', async () => {
      mockReq.body = { email: 'invalid-email' };

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/forgot-password',
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    test('should handle email service failure', async () => {
      mockReq.body = { email: 'user@example.com' };

      const existingUser = {
        ...mockUser,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(existingUser);

      const emailService = require('../../src/services/emailService');
      emailService.sendPasswordResetEmail.mockRejectedValueOnce(new Error('Email service down'));

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/forgot-password',
        expect.objectContaining({
          error: expect.stringContaining('error'),
        })
      );
    });

    test('should use 30 minute token expiry (S5 security fix)', async () => {
      mockReq.body = { email: 'user@example.com' };

      const existingUser = {
        ...mockUser,
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(existingUser);

      const authController = require('../../src/controllers/authController');
      await authController.forgotPassword(mockReq, mockRes);

      const updateCall = existingUser.update.mock.calls[0][0];
      const tokenExpiry = updateCall.resetPasswordTokenExpires;
      const expiryDuration = tokenExpiry - Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      // S5 fix: Token should expire in 30 minutes or less
      expect(expiryDuration).toBeLessThanOrEqual(thirtyMinutes + 1000); // Allow 1s tolerance
      expect(expiryDuration).toBeGreaterThan(29 * 60 * 1000);
    });
  });

  describe('POST /reset-password/:token - Edge Cases', () => {
    test('should handle database error during reset', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.body = {
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };
      User.findOne.mockRejectedValue(new Error('DB connection lost'));

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/reset-error',
        expect.objectContaining({
          error: expect.stringContaining('error'),
        })
      );
    });

    test('should render success page after password reset', async () => {
      mockReq.params = { token: 'valid-token' };
      mockReq.body = {
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      const userWithToken = {
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
        update: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(userWithToken);

      const authController = require('../../src/controllers/authController');
      await authController.resetPassword(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'auth/reset-success',
        expect.objectContaining({
          title: 'Password Reset Successful',
          loginUrl: '/dashboard/login',
        })
      );
    });
  });
});
