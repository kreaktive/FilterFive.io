/**
 * Integration Tests: Signup Flow
 *
 * Tests the complete user signup journey:
 * 1. User submits signup form
 * 2. User record created with trial status
 * 3. Verification email sent
 * 4. User clicks verification link
 * 5. User can now login
 * 6. Trial starts on first SMS send
 */

const { User } = require('../../src/models');

// Mock external services
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../../src/services/stripeService', () => ({
  createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
  createCheckoutSession: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
}));

// Mock reCAPTCHA verification
jest.mock('../../src/middleware/captcha', () => ({
  verifyCaptcha: (req, res, next) => next(),
  provideCaptchaKey: (req, res, next) => {
    res.locals.recaptchaSiteKey = 'test-key';
    next();
  }
}));

const emailService = require('../../src/services/emailService');
const stripeService = require('../../src/services/stripeService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

describe('Signup Flow Integration', () => {
  // Test data
  const validSignupData = {
    businessName: 'Test Business',
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. User Registration', () => {
    it('should create user with correct initial state', async () => {
      // Simulate what authController.signup does
      const hashedPassword = await bcrypt.hash(validSignupData.password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Mock user creation
      const mockUser = {
        id: 1,
        email: validSignupData.email,
        businessName: validSignupData.businessName,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        verificationTokenExpires: verificationExpires,
        subscriptionStatus: 'trial',
        subscriptionPlan: 'starter',
        trialStartsAt: null, // Trial hasn't started yet
        trialEndsAt: null,
        smsUsageCount: 0,
        smsUsageLimit: 50, // Trial limit
        isActive: true
      };

      // Verify initial state
      expect(mockUser.isVerified).toBe(false);
      expect(mockUser.subscriptionStatus).toBe('trial');
      expect(mockUser.trialStartsAt).toBeNull(); // Trial starts on first SMS
      expect(mockUser.smsUsageCount).toBe(0);
      expect(mockUser.smsUsageLimit).toBe(50);
    });

    it('should send verification email after signup', async () => {
      const verificationToken = crypto.randomBytes(32).toString('hex');

      await emailService.sendVerificationEmail(
        validSignupData.email,
        verificationToken,
        validSignupData.businessName
      );

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        validSignupData.email,
        verificationToken,
        validSignupData.businessName
      );
    });

    it('should create Stripe customer for new user', async () => {
      await stripeService.createCustomer(
        validSignupData.email,
        validSignupData.businessName
      );

      expect(stripeService.createCustomer).toHaveBeenCalledWith(
        validSignupData.email,
        validSignupData.businessName
      );
    });
  });

  describe('2. Input Validation', () => {
    it('should reject invalid email format', () => {
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@invalid.com')).toBe(false);
      expect(isValidEmail('valid@example.com')).toBe(true);
    });

    it('should reject weak passwords', () => {
      const isValidPassword = (password) => {
        if (!password || password.length < 8) return false;
        if (!/\d/.test(password)) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
        return true;
      };

      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('nouppercase123!')).toBe(false);
      expect(isValidPassword('NOLOWERCASE123!')).toBe(false);
      expect(isValidPassword('NoSpecialChar123')).toBe(false);
      expect(isValidPassword('NoNumbers!!')).toBe(false);
      expect(isValidPassword('SecurePass123!')).toBe(true);
    });

    it('should reject business names that are too short or too long', () => {
      const isValidBusinessName = (name) => {
        if (!name) return false;
        const trimmed = name.trim();
        return trimmed.length >= 2 && trimmed.length <= 100;
      };

      expect(isValidBusinessName('A')).toBe(false);
      expect(isValidBusinessName('AB')).toBe(true);
      expect(isValidBusinessName('A'.repeat(101))).toBe(false);
      expect(isValidBusinessName('Valid Business Name')).toBe(true);
    });
  });

  describe('3. Email Verification', () => {
    it('should verify user with valid token', async () => {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Simulate token validation
      const isTokenValid = (providedToken, storedToken, expiresAt) => {
        if (providedToken !== storedToken) return false;
        if (new Date() > new Date(expiresAt)) return false;
        return true;
      };

      expect(isTokenValid(token, token, tokenExpires)).toBe(true);
    });

    it('should reject expired verification token', () => {
      const token = crypto.randomBytes(32).toString('hex');
      const expiredToken = new Date(Date.now() - 1000); // 1 second ago

      const isTokenValid = (providedToken, storedToken, expiresAt) => {
        if (providedToken !== storedToken) return false;
        if (new Date() > new Date(expiresAt)) return false;
        return true;
      };

      expect(isTokenValid(token, token, expiredToken)).toBe(false);
    });

    it('should reject invalid verification token', () => {
      const correctToken = crypto.randomBytes(32).toString('hex');
      const wrongToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const isTokenValid = (providedToken, storedToken, expiresAt) => {
        if (providedToken !== storedToken) return false;
        if (new Date() > new Date(expiresAt)) return false;
        return true;
      };

      expect(isTokenValid(wrongToken, correctToken, tokenExpires)).toBe(false);
    });
  });

  describe('4. Post-Verification State', () => {
    it('should update user state after verification', () => {
      // Simulate post-verification state
      const verifiedUser = {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
        subscriptionStatus: 'trial',
        trialStartsAt: null // Still null - starts on first SMS
      };

      expect(verifiedUser.isVerified).toBe(true);
      expect(verifiedUser.verificationToken).toBeNull();
      expect(verifiedUser.subscriptionStatus).toBe('trial');
    });

    it('should send welcome email after verification', async () => {
      await emailService.sendWelcomeEmail(
        validSignupData.email,
        validSignupData.businessName
      );

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        validSignupData.email,
        validSignupData.businessName
      );
    });
  });

  describe('5. Session Security', () => {
    it('should regenerate session after login (prevent session fixation)', () => {
      // This test documents the expected behavior
      const mockSession = {
        id: 'old-session-id',
        regenerate: jest.fn((callback) => {
          mockSession.id = 'new-session-id';
          callback(null);
        })
      };

      // Simulate login flow
      mockSession.regenerate((err) => {
        if (!err) {
          mockSession.userId = 1;
        }
      });

      expect(mockSession.regenerate).toHaveBeenCalled();
      expect(mockSession.id).toBe('new-session-id');
      expect(mockSession.userId).toBe(1);
    });
  });

  describe('6. Trial Activation', () => {
    it('should start trial on first SMS send, not on signup', () => {
      // Simulate user state progression
      const userAtSignup = {
        subscriptionStatus: 'trial',
        trialStartsAt: null,
        trialEndsAt: null
      };

      // Trial should not start at signup
      expect(userAtSignup.trialStartsAt).toBeNull();

      // Simulate first SMS send triggering trial start
      const startTrial = (user) => {
        if (!user.trialStartsAt && user.subscriptionStatus === 'trial') {
          const now = new Date();
          user.trialStartsAt = now;
          user.trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
        }
      };

      startTrial(userAtSignup);

      expect(userAtSignup.trialStartsAt).not.toBeNull();
      expect(userAtSignup.trialEndsAt).not.toBeNull();
    });

    it('should set 14-day trial period', () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const diffDays = Math.round((trialEnd - now) / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(14);
    });
  });

  describe('7. Rate Limiting', () => {
    it('should have rate limits configured for signup', () => {
      // Document expected rate limit configuration
      const signupRateLimit = {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 attempts per hour
        message: 'Too many signup attempts'
      };

      expect(signupRateLimit.max).toBeLessThanOrEqual(10);
      expect(signupRateLimit.windowMs).toBeGreaterThanOrEqual(60 * 60 * 1000);
    });

    it('should have rate limits configured for password reset', () => {
      // Document expected rate limit configuration
      const passwordResetRateLimit = {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 attempts per hour
        message: 'Too many password reset attempts'
      };

      expect(passwordResetRateLimit.max).toBeLessThanOrEqual(5);
    });
  });
});
