/**
 * Rate Limiter Middleware Tests
 *
 * Tests for rate limiting middleware:
 * - Handler factory functions
 * - Middleware exports
 * - Behavior verification
 */

const {
  signupLimiter,
  loginLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
  apiLimiter,
  uploadLimiter,
  qrScanLimiter,
  smsSendLimiter,
  createErrorPageHandler,
  createLoginPageHandler,
  createJsonHandler,
} = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  // ===========================================
  // Handler Factory Function Tests
  // ===========================================
  describe('createErrorPageHandler', () => {
    it('should return a function', () => {
      const handler = createErrorPageHandler('Test message');
      expect(typeof handler).toBe('function');
    });

    it('should render error page with 429 status', () => {
      const handler = createErrorPageHandler('Too many requests');
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.render).toHaveBeenCalledWith('error', {
        title: 'Too Many Requests',
        error: {
          status: 429,
          message: 'Too many requests',
        },
      });
    });

    it('should use custom message in error object', () => {
      const handler = createErrorPageHandler('Custom error message');
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler({}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          error: expect.objectContaining({ message: 'Custom error message' }),
        })
      );
    });

    it('should set title to "Too Many Requests"', () => {
      const handler = createErrorPageHandler('Any message');
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler({}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ title: 'Too Many Requests' })
      );
    });
  });

  describe('createLoginPageHandler', () => {
    it('should return a function', () => {
      const handler = createLoginPageHandler('Test message');
      expect(typeof handler).toBe('function');
    });

    it('should render login page with 429 status', () => {
      const handler = createLoginPageHandler('Too many login attempts');
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.render).toHaveBeenCalledWith('dashboard/login', {
        title: 'Login',
        error: 'Too many login attempts',
      });
    });

    it('should set title to "Login"', () => {
      const handler = createLoginPageHandler('Any error');
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler({}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'dashboard/login',
        expect.objectContaining({ title: 'Login' })
      );
    });

    it('should pass error message directly', () => {
      const handler = createLoginPageHandler('Blocked for 15 minutes');
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler({}, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'dashboard/login',
        expect.objectContaining({ error: 'Blocked for 15 minutes' })
      );
    });
  });

  describe('createJsonHandler', () => {
    it('should return a function', () => {
      const handler = createJsonHandler('Test message');
      expect(typeof handler).toBe('function');
    });

    it('should return JSON with 429 status', () => {
      const handler = createJsonHandler('Too many API requests');
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many API requests',
      });
    });

    it('should always set success to false', () => {
      const handler = createJsonHandler('Any error');
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      handler({}, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should use custom error message', () => {
      const handler = createJsonHandler('Rate limited: 50 SMS per hour');
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      handler({}, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Rate limited: 50 SMS per hour' })
      );
    });
  });

  // ===========================================
  // Limiter Export Tests
  // ===========================================
  describe('Limiter Exports', () => {
    it('should export signupLimiter as middleware function', () => {
      expect(typeof signupLimiter).toBe('function');
      expect(signupLimiter.length).toBeGreaterThanOrEqual(0); // Middleware has arity
    });

    it('should export loginLimiter as middleware function', () => {
      expect(typeof loginLimiter).toBe('function');
    });

    it('should export passwordResetLimiter as middleware function', () => {
      expect(typeof passwordResetLimiter).toBe('function');
    });

    it('should export resendVerificationLimiter as middleware function', () => {
      expect(typeof resendVerificationLimiter).toBe('function');
    });

    it('should export apiLimiter as middleware function', () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should export uploadLimiter as middleware function', () => {
      expect(typeof uploadLimiter).toBe('function');
    });

    it('should export qrScanLimiter as middleware function', () => {
      expect(typeof qrScanLimiter).toBe('function');
    });

    it('should export smsSendLimiter as middleware function', () => {
      expect(typeof smsSendLimiter).toBe('function');
    });

    it('should export createErrorPageHandler factory', () => {
      expect(typeof createErrorPageHandler).toBe('function');
    });

    it('should export createLoginPageHandler factory', () => {
      expect(typeof createLoginPageHandler).toBe('function');
    });

    it('should export createJsonHandler factory', () => {
      expect(typeof createJsonHandler).toBe('function');
    });
  });

  // ===========================================
  // Middleware Behavior Tests
  // ===========================================
  describe('Middleware Behavior', () => {
    const createMockReq = (overrides = {}) => ({
      ip: '192.168.1.100',
      session: {},
      headers: {},
      connection: {},
      method: 'POST',
      url: '/test',
      app: {
        get: jest.fn().mockReturnValue(false),
      },
      ...overrides,
    });

    const createMockRes = () => ({
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
      getHeader: jest.fn(),
    });

    describe('signupLimiter', () => {
      it('should call next() on first request', (done) => {
        const req = createMockReq({ ip: '10.0.0.1' });
        const res = createMockRes();

        signupLimiter(req, res, () => {
          done();
        });
      });

      it('should set rate limit headers', (done) => {
        const req = createMockReq({ ip: '10.0.0.2' });
        const res = createMockRes();

        signupLimiter(req, res, () => {
          expect(res.setHeader).toHaveBeenCalled();
          done();
        });
      });
    });

    describe('loginLimiter', () => {
      it('should call next() on first request', (done) => {
        const req = createMockReq({ ip: '10.0.1.1' });
        const res = createMockRes();

        loginLimiter(req, res, () => {
          done();
        });
      });
    });

    describe('apiLimiter', () => {
      it('should call next() for authenticated user', (done) => {
        const req = createMockReq({
          ip: '10.0.2.1',
          session: { userId: 123 },
        });
        const res = createMockRes();

        apiLimiter(req, res, () => {
          done();
        });
      });

      it('should call next() for unauthenticated user', (done) => {
        const req = createMockReq({ ip: '10.0.2.2' });
        const res = createMockRes();

        apiLimiter(req, res, () => {
          done();
        });
      });
    });

    describe('uploadLimiter', () => {
      it('should call next() on first upload', (done) => {
        const req = createMockReq({
          ip: '10.0.3.1',
          session: { userId: 456 },
        });
        const res = createMockRes();

        uploadLimiter(req, res, () => {
          done();
        });
      });
    });

    describe('smsSendLimiter', () => {
      it('should call next() for authenticated user', (done) => {
        const req = createMockReq({
          ip: '10.0.4.1',
          session: { userId: 789 },
        });
        const res = createMockRes();

        smsSendLimiter(req, res, () => {
          done();
        });
      });
    });

    describe('qrScanLimiter', () => {
      it('should call next() on first scan', (done) => {
        const req = createMockReq({ ip: '10.0.5.1' });
        const res = createMockRes();

        qrScanLimiter(req, res, () => {
          done();
        });
      });
    });

    describe('passwordResetLimiter', () => {
      it('should call next() on first request', (done) => {
        const req = createMockReq({ ip: '10.0.6.1' });
        const res = createMockRes();

        passwordResetLimiter(req, res, () => {
          done();
        });
      });
    });

    describe('resendVerificationLimiter', () => {
      it('should call next() on first request', (done) => {
        const req = createMockReq({ ip: '10.0.7.1' });
        const res = createMockRes();

        resendVerificationLimiter(req, res, () => {
          done();
        });
      });
    });
  });

  // ===========================================
  // Handler Response Format Tests
  // ===========================================
  describe('Handler Response Formats', () => {
    describe('Error Page Handler', () => {
      it('should include status 429 in error object', () => {
        const handler = createErrorPageHandler('Test');
        const res = {
          status: jest.fn().mockReturnThis(),
          render: jest.fn(),
        };

        handler({}, res);

        const renderCall = res.render.mock.calls[0];
        expect(renderCall[1].error.status).toBe(429);
      });
    });

    describe('JSON Handler', () => {
      it('should return valid JSON structure', () => {
        const handler = createJsonHandler('API rate limit exceeded');
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        handler({}, res);

        const jsonResponse = res.json.mock.calls[0][0];
        expect(jsonResponse).toHaveProperty('success');
        expect(jsonResponse).toHaveProperty('error');
        expect(typeof jsonResponse.success).toBe('boolean');
        expect(typeof jsonResponse.error).toBe('string');
      });
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    it('createErrorPageHandler should handle empty message', () => {
      const handler = createErrorPageHandler('');
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler({}, res);

      expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
        error: expect.objectContaining({ message: '' }),
      }));
    });

    it('createJsonHandler should handle special characters in message', () => {
      const handler = createJsonHandler('Rate limit: <script>alert("xss")</script>');
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      handler({}, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Rate limit: <script>alert("xss")</script>',
      }));
    });

    it('createLoginPageHandler should preserve message formatting', () => {
      const handler = createLoginPageHandler('Please wait 15 minutes.\nToo many attempts.');
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler({}, res);

      expect(res.render).toHaveBeenCalledWith('dashboard/login', expect.objectContaining({
        error: 'Please wait 15 minutes.\nToo many attempts.',
      }));
    });
  });

  // ===========================================
  // Multiple Handler Types Comparison
  // ===========================================
  describe('Handler Type Comparison', () => {
    it('error page handler renders to template', () => {
      const handler = createErrorPageHandler('Test');
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
        json: jest.fn(),
      };

      handler({}, res);

      expect(res.render).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('JSON handler returns JSON not template', () => {
      const handler = createJsonHandler('Test');
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
        json: jest.fn(),
      };

      handler({}, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.render).not.toHaveBeenCalled();
    });

    it('login page handler renders login-specific template', () => {
      const handler = createLoginPageHandler('Test');
      const res = {
        status: jest.fn().mockReturnThis(),
        render: jest.fn(),
      };

      handler({}, res);

      expect(res.render).toHaveBeenCalledWith('dashboard/login', expect.any(Object));
    });

    it('all handlers return 429 status', () => {
      const errorHandler = createErrorPageHandler('Test');
      const loginHandler = createLoginPageHandler('Test');
      const jsonHandler = createJsonHandler('Test');

      const results = [errorHandler, loginHandler, jsonHandler].map((handler) => {
        const res = {
          status: jest.fn().mockReturnThis(),
          render: jest.fn(),
          json: jest.fn(),
        };
        handler({}, res);
        return res.status.mock.calls[0][0];
      });

      expect(results).toEqual([429, 429, 429]);
    });
  });
});
