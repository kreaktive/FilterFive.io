/**
 * Request ID Middleware Tests
 *
 * Tests for unique request ID generation and propagation:
 * - Generates unique request ID for each request
 * - Uses existing X-Request-ID from proxy if present
 * - Sets X-Request-ID response header
 * - Attaches ID to req.id for logging
 */

const { requestId, getRequestId, generateRequestId } = require('../../src/middleware/requestId');

describe('Request ID Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with timestamp-hex format', () => {
      const id = generateRequestId();

      // Format: timestamp-randomhex (e.g., 1702656000000-a1b2c3d4)
      expect(id).toMatch(/^\d+-[a-f0-9]+$/);
    });

    it('should include current timestamp in ID', () => {
      const before = Date.now();
      const id = generateRequestId();
      const after = Date.now();

      const timestamp = parseInt(id.split('-')[0], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate 8-character hex suffix', () => {
      const id = generateRequestId();
      const hexPart = id.split('-')[1];

      expect(hexPart).toHaveLength(8);
      expect(hexPart).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('requestId middleware', () => {
    it('should generate new request ID when none exists', () => {
      mockReq.headers = {};

      requestId(mockReq, mockRes, mockNext);

      expect(mockReq.id).toBeDefined();
      expect(mockReq.id).toMatch(/^\d+-[a-f0-9]+$/);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing X-Request-ID from headers', () => {
      const existingId = 'proxy-generated-id-123';
      mockReq.headers['x-request-id'] = existingId;

      requestId(mockReq, mockRes, mockNext);

      expect(mockReq.id).toBe(existingId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set X-Request-ID response header', () => {
      requestId(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.id);
    });

    it('should preserve proxy request ID in response header', () => {
      const proxyId = 'load-balancer-abc123';
      mockReq.headers['x-request-id'] = proxyId;

      requestId(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', proxyId);
    });

    it('should call next() to continue middleware chain', () => {
      requestId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle case-insensitive header name', () => {
      // Headers are typically lowercase in Express
      mockReq.headers['x-request-id'] = 'existing-id';

      requestId(mockReq, mockRes, mockNext);

      expect(mockReq.id).toBe('existing-id');
    });
  });

  describe('getRequestId helper', () => {
    it('should return req.id when available', () => {
      const req = { id: 'test-request-id-123' };

      const result = getRequestId(req);

      expect(result).toBe('test-request-id-123');
    });

    it('should generate new ID when req is undefined', () => {
      const result = getRequestId(undefined);

      expect(result).toBeDefined();
      expect(result).toMatch(/^\d+-[a-f0-9]+$/);
    });

    it('should generate new ID when req is null', () => {
      const result = getRequestId(null);

      expect(result).toBeDefined();
      expect(result).toMatch(/^\d+-[a-f0-9]+$/);
    });

    it('should generate new ID when req.id is undefined', () => {
      const req = { id: undefined };

      const result = getRequestId(req);

      expect(result).toBeDefined();
      expect(result).toMatch(/^\d+-[a-f0-9]+$/);
    });

    it('should return falsy values if req.id is empty string', () => {
      const req = { id: '' };

      const result = getRequestId(req);

      // Empty string is falsy, so it should generate new ID
      expect(result).toBeDefined();
      expect(result).not.toBe('');
    });
  });

  describe('Integration scenarios', () => {
    it('should work in typical request flow', () => {
      // Simulate typical Express middleware flow
      const req = { headers: {} };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      // Apply middleware
      requestId(req, res, next);

      // Verify request has ID for logging
      expect(req.id).toBeDefined();

      // Verify response has header for client correlation
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.id);

      // Verify next middleware is called
      expect(next).toHaveBeenCalled();
    });

    it('should work with proxy-forwarded requests', () => {
      // Simulate request from load balancer with existing ID
      const proxyId = 'nginx-1702656000000-abc123';
      const req = {
        headers: { 'x-request-id': proxyId }
      };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      requestId(req, res, next);

      // Should preserve the proxy ID
      expect(req.id).toBe(proxyId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', proxyId);
    });
  });
});
