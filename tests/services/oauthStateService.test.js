const crypto = require('crypto');
const oauthStateService = require('../../src/services/oauthStateService');

describe('OAuthStateService', () => {
  let mockReq;

  beforeEach(() => {
    mockReq = {
      session: {}
    };
  });

  describe('generateState', () => {
    it('should generate unique 64-char hex tokens', () => {
      const state1 = oauthStateService.generateState(mockReq, 'square', 123);
      const state2 = oauthStateService.generateState(mockReq, 'square', 123);

      expect(state1).not.toBe(state2);
      expect(state1).toMatch(/^\d+:[0-9a-f]{64}$/);
    });

    it('should store state in session', () => {
      oauthStateService.generateState(mockReq, 'square', 123);

      expect(mockReq.session.oauthState).toBeDefined();
      expect(mockReq.session.oauthState.square).toBeDefined();
      expect(mockReq.session.oauthState.square.userId).toBe(123);
      expect(mockReq.session.oauthState.square.token).toHaveLength(64);
    });

    it('should generate Shopify state with shop domain', () => {
      const state = oauthStateService.generateState(mockReq, 'shopify', 456, { shopDomain: 'test.myshopify.com' });

      expect(state).toMatch(/^456:test\.myshopify\.com:[0-9a-f]{64}$/);
      expect(mockReq.session.oauthState.shopify.metadata.shopDomain).toBe('test.myshopify.com');
    });

    it('should throw error when session is missing', () => {
      const reqWithoutSession = {};

      expect(() => {
        oauthStateService.generateState(reqWithoutSession, 'square', 123);
      }).toThrow('Session required for OAuth state generation');
    });
  });

  describe('validateAndConsume', () => {
    it('should validate matching state token', () => {
      const state = oauthStateService.generateState(mockReq, 'square', 123);
      const result = oauthStateService.validateAndConsume(mockReq, 'square', state);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(123);
      expect(result.error).toBeUndefined();
    });

    it('should reject tampered state token', () => {
      const state = oauthStateService.generateState(mockReq, 'square', 123);
      // Tamper with the token part (last 64 chars), not just the userId
      const parts = state.split(':');
      const tamperedToken = parts[1].substring(0, 60) + 'fake';
      const tamperedState = `${parts[0]}:${tamperedToken}`;

      const result = oauthStateService.validateAndConsume(mockReq, 'square', tamperedState);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('state_mismatch');
      expect(result.userId).toBeUndefined();
    });

    it('should prevent replay attack (single-use)', () => {
      const state = oauthStateService.generateState(mockReq, 'square', 123);

      // First validation succeeds
      const result1 = oauthStateService.validateAndConsume(mockReq, 'square', state);
      expect(result1.valid).toBe(true);

      // Second validation fails (state consumed)
      const result2 = oauthStateService.validateAndConsume(mockReq, 'square', state);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('no_session_state');
    });

    it('should reject expired state (>15 min)', () => {
      jest.useFakeTimers();

      const state = oauthStateService.generateState(mockReq, 'square', 123);

      // Fast forward 16 minutes
      jest.advanceTimersByTime(16 * 60 * 1000);

      const result = oauthStateService.validateAndConsume(mockReq, 'square', state);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('state_expired');

      jest.useRealTimers();
    });

    it('should return metadata for Shopify state', () => {
      const state = oauthStateService.generateState(mockReq, 'shopify', 789, { shopDomain: 'shop.myshopify.com' });
      const result = oauthStateService.validateAndConsume(mockReq, 'shopify', state);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(789);
      expect(result.metadata.shopDomain).toBe('shop.myshopify.com');
    });

    it('should reject when session has no stored state', () => {
      const result = oauthStateService.validateAndConsume(mockReq, 'square', '123:abc123');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('no_session_state');
    });
  });

  describe('Timing Safety', () => {
    it('should use crypto.timingSafeEqual for validation', () => {
      const cryptoSpy = jest.spyOn(crypto, 'timingSafeEqual');

      const state = oauthStateService.generateState(mockReq, 'square', 123);
      oauthStateService.validateAndConsume(mockReq, 'square', state);

      expect(cryptoSpy).toHaveBeenCalled();
      cryptoSpy.mockRestore();
    });
  });
});
