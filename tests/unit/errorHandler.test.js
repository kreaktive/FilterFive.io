/**
 * Tests for error handler middleware
 */

const {
  ApiError,
  errorHandler,
  notFoundHandler,
  formatApiError,
  validationError,
  sequelizeErrorFormatter,
  isApiRequest
} = require('../../src/middleware/errorHandler');

// Mock logger
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET',
      session: { userId: 1 },
      ip: '127.0.0.1',
      xhr: false,
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      headersSent: false
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('ApiError', () => {
    it('should create error with all properties', () => {
      const error = new ApiError(400, 'Test message', 'TEST_CODE', { field: 'value' });

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ field: 'value' });
      expect(error.isOperational).toBe(true);
    });

    it('should create badRequest error', () => {
      const error = ApiError.badRequest('Invalid input', 'INVALID_INPUT');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_INPUT');
    });

    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should create forbidden error', () => {
      const error = ApiError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should create notFound error', () => {
      const error = ApiError.notFound('User not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create conflict error', () => {
      const error = ApiError.conflict('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should create tooManyRequests error', () => {
      const error = ApiError.tooManyRequests();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('should create internal error', () => {
      const error = ApiError.internal();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('isApiRequest', () => {
    it('should return true for /api/ paths', () => {
      mockReq.path = '/api/v1/users';
      expect(isApiRequest(mockReq)).toBe(true);
    });

    it('should return true for XHR requests', () => {
      mockReq.xhr = true;
      expect(isApiRequest(mockReq)).toBe(true);
    });

    it('should return true for JSON accept header', () => {
      mockReq.headers.accept = 'application/json';
      expect(isApiRequest(mockReq)).toBe(true);
    });

    it('should return true for JSON content-type', () => {
      mockReq.headers['content-type'] = 'application/json';
      expect(isApiRequest(mockReq)).toBe(true);
    });

    it('should return falsy for regular browser requests', () => {
      mockReq.path = '/dashboard';
      mockReq.headers.accept = 'text/html';
      expect(isApiRequest(mockReq)).toBeFalsy();
    });
  });

  describe('formatApiError', () => {
    it('should format error with message and code', () => {
      const error = new ApiError(400, 'Test error', 'TEST_ERROR');
      const formatted = formatApiError(error);

      expect(formatted).toEqual({
        success: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR'
        }
      });
    });

    it('should include details when present', () => {
      const error = new ApiError(400, 'Validation failed', 'VALIDATION', { fields: ['email'] });
      const formatted = formatApiError(error);

      expect(formatted.error.details).toEqual({ fields: ['email'] });
    });

    it('should include stack in development', () => {
      const error = new Error('Test error');
      error.code = 'TEST';
      const formatted = formatApiError(error, true);

      expect(formatted.error.stack).toBeDefined();
    });

    it('should not include stack in production', () => {
      const error = new Error('Test error');
      error.code = 'TEST';
      const formatted = formatApiError(error, false);

      expect(formatted.error.stack).toBeUndefined();
    });
  });

  describe('errorHandler', () => {
    it('should return JSON for API requests', () => {
      mockReq.path = '/api/test';
      const error = ApiError.badRequest('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Test error'
          })
        })
      );
    });

    it('should render error page for browser requests', () => {
      mockReq.path = '/dashboard';
      const error = ApiError.notFound('Page not found');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.render).toHaveBeenCalledWith('error', expect.any(Object));
    });

    it('should use 500 as default status code', () => {
      mockReq.path = '/api/test';
      const error = new Error('Unknown error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should call next if headers already sent', () => {
      mockRes.headersSent = true;
      const error = new Error('Test');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error and call next', () => {
      mockReq.method = 'GET';
      mockReq.path = '/unknown';

      notFoundHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Cannot GET /unknown'
        })
      );
    });
  });

  describe('validationError', () => {
    it('should format array of validation errors', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'phone', message: 'Invalid phone' }
      ];
      const error = validationError(errors);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(2);
    });

    it('should handle single error object', () => {
      const errors = { message: 'Invalid input' };
      const error = validationError(errors);

      expect(error.details).toHaveLength(1);
      expect(error.details[0].message).toBe('Invalid input');
    });
  });

  describe('sequelizeErrorFormatter', () => {
    it('should format unique constraint error', () => {
      const seqError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email', value: 'test@test.com' }]
      };
      const error = sequelizeErrorFormatter(seqError);

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('DUPLICATE_ENTRY');
      expect(error.details.field).toBe('email');
    });

    it('should format validation error', () => {
      const seqError = {
        name: 'SequelizeValidationError',
        errors: [{ path: 'name', message: 'Name is required' }]
      };
      const error = sequelizeErrorFormatter(seqError);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should format foreign key error', () => {
      const seqError = {
        name: 'SequelizeForeignKeyConstraintError'
      };
      const error = sequelizeErrorFormatter(seqError);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('FOREIGN_KEY_ERROR');
    });

    it('should format connection error', () => {
      const seqError = {
        name: 'SequelizeConnectionError',
        message: 'Connection refused'
      };
      const error = sequelizeErrorFormatter(seqError);

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });

    it('should handle unknown Sequelize errors', () => {
      const seqError = {
        name: 'SequelizeDatabaseError',
        message: 'Unknown error'
      };
      const error = sequelizeErrorFormatter(seqError);

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });
  });
});
