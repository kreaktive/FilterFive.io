/**
 * Tests for asyncHandler middleware
 */

const { asyncHandler, asyncHandlerWithTransform } = require('../../src/middleware/asyncHandler');

describe('asyncHandler', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('asyncHandler', () => {
    it('should call the handler function with req, res, next', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(handler);

      await wrapped(mockReq, mockRes, mockNext);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should not call next for successful async operations', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(handler);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when async function throws', async () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(handler);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should work with async functions that return values', async () => {
      const handler = jest.fn().mockResolvedValue({ data: 'test' });
      const wrapped = asyncHandler(handler);

      await wrapped(mockReq, mockRes, mockNext);

      expect(handler).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('asyncHandlerWithTransform', () => {
    it('should transform errors using the provided transformer', async () => {
      const originalError = new Error('Original error');
      const transformedError = new Error('Transformed error');
      const handler = jest.fn().mockRejectedValue(originalError);
      const transformer = jest.fn().mockReturnValue(transformedError);

      const wrapped = asyncHandlerWithTransform(handler, transformer);
      await wrapped(mockReq, mockRes, mockNext);

      expect(transformer).toHaveBeenCalledWith(originalError);
      expect(mockNext).toHaveBeenCalledWith(transformedError);
    });

    it('should pass error directly if no transformer provided', async () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);

      const wrapped = asyncHandlerWithTransform(handler, null);
      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call transformer for successful operations', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const transformer = jest.fn();

      const wrapped = asyncHandlerWithTransform(handler, transformer);
      await wrapped(mockReq, mockRes, mockNext);

      expect(transformer).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
