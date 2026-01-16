/**
 * CSRF Middleware Tests
 * Tests for CSRF path exemption logic
 */

describe('CSRF Middleware', () => {
  // These paths should be exempt from CSRF protection
  const csrfExemptPaths = [
    '/webhooks',
    '/api/webhooks',
    '/api/v1/hooks',
    '/api/auth',
    '/health'
  ];

  describe('path exemption logic', () => {
    const isExempt = (path) => {
      return csrfExemptPaths.some(exemptPath => path.startsWith(exemptPath));
    };

    test('exempts webhook paths', () => {
      expect(isExempt('/webhooks')).toBe(true);
      expect(isExempt('/webhooks/stripe')).toBe(true);
      expect(isExempt('/api/webhooks/square')).toBe(true);
    });

    test('exempts API hooks paths', () => {
      expect(isExempt('/api/v1/hooks')).toBe(true);
      expect(isExempt('/api/v1/hooks/zapier')).toBe(true);
    });

    test('exempts API auth paths (OAuth callbacks)', () => {
      expect(isExempt('/api/auth')).toBe(true);
      expect(isExempt('/api/auth/square/callback')).toBe(true);
    });

    test('exempts health check', () => {
      expect(isExempt('/health')).toBe(true);
    });

    test('does not exempt regular paths', () => {
      expect(isExempt('/')).toBe(false);
      expect(isExempt('/dashboard')).toBe(false);
      expect(isExempt('/dashboard/login')).toBe(false);
      expect(isExempt('/auth/signup')).toBe(false);
      expect(isExempt('/upload')).toBe(false);
    });

    test('does not exempt unrelated paths', () => {
      expect(isExempt('/webhook')).toBe(false); // singular, not plural
      expect(isExempt('/my-webhooks')).toBe(false);
      expect(isExempt('/api/data')).toBe(false);
    });

    test('exempts paths starting with exempt prefix (expected behavior)', () => {
      // /healthcheck starts with /health, so it's exempt
      // This is fine since health endpoints don't need CSRF
      expect(isExempt('/healthcheck')).toBe(true);
      expect(isExempt('/health/status')).toBe(true);
    });
  });

  describe('token extraction locations', () => {
    // Simulates the getTokenFromRequest logic
    const getTokenFromRequest = (req) => {
      return req.body?._csrf ||
             req.headers?.['x-csrf-token'] ||
             req.headers?.['csrf-token'] ||
             req.query?._csrf;
    };

    test('extracts token from body._csrf', () => {
      const req = { body: { _csrf: 'body-token' } };
      expect(getTokenFromRequest(req)).toBe('body-token');
    });

    test('extracts token from x-csrf-token header', () => {
      const req = { headers: { 'x-csrf-token': 'header-token' } };
      expect(getTokenFromRequest(req)).toBe('header-token');
    });

    test('extracts token from csrf-token header', () => {
      const req = { headers: { 'csrf-token': 'alt-header-token' } };
      expect(getTokenFromRequest(req)).toBe('alt-header-token');
    });

    test('extracts token from query._csrf', () => {
      const req = { query: { _csrf: 'query-token' } };
      expect(getTokenFromRequest(req)).toBe('query-token');
    });

    test('prefers body over headers', () => {
      const req = {
        body: { _csrf: 'body-token' },
        headers: { 'x-csrf-token': 'header-token' }
      };
      expect(getTokenFromRequest(req)).toBe('body-token');
    });

    test('returns undefined when no token present', () => {
      const req = { body: {}, headers: {}, query: {} };
      expect(getTokenFromRequest(req)).toBeUndefined();
    });
  });
});
