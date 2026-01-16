/**
 * POS Auth Controller Tests
 *
 * Tests for OAuth flows:
 * - Square OAuth initiation and callback
 * - Shopify OAuth initiation and callback
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/squareOAuthService', () => ({
  getAuthorizationUrl: jest.fn(),
  handleCallback: jest.fn(),
  createOrUpdateIntegration: jest.fn(),
}));

jest.mock('../../src/services/shopifyOAuthService', () => ({
  getAuthorizationUrl: jest.fn(),
  validateCallback: jest.fn(),
  handleCallback: jest.fn(),
  createOrUpdateIntegration: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const squareOAuthService = require('../../src/services/squareOAuthService');
const shopifyOAuthService = require('../../src/services/shopifyOAuthService');
const logger = require('../../src/services/logger');
const {
  initiateSquareOAuth,
  handleSquareCallback,
  initiateShopifyOAuth,
  handleShopifyCallback,
} = require('../../src/controllers/posAuthController');

describe('POS Auth Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      session: { userId: 1 },
      query: {},
      body: {},
    };

    mockRes = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
    };
  });

  // ===========================================
  // initiateSquareOAuth Tests
  // ===========================================
  describe('initiateSquareOAuth', () => {
    it('should redirect to Square authorization URL', async () => {
      squareOAuthService.getAuthorizationUrl.mockReturnValue({
        url: 'https://connect.squareup.com/oauth2/authorize?client_id=123',
        state: 'abc123',
      });

      await initiateSquareOAuth(mockReq, mockRes);

      expect(squareOAuthService.getAuthorizationUrl).toHaveBeenCalledWith(1);
      expect(mockReq.session.squareOAuthState).toBe('abc123');
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'https://connect.squareup.com/oauth2/authorize?client_id=123'
      );
    });

    it('should redirect to login if no userId', async () => {
      mockReq.session.userId = null;

      await initiateSquareOAuth(mockReq, mockRes);

      expect(squareOAuthService.getAuthorizationUrl).not.toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
    });

    it('should handle error and redirect to settings', async () => {
      squareOAuthService.getAuthorizationUrl.mockImplementation(() => {
        throw new Error('Config error');
      });

      await initiateSquareOAuth(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith(
        'Error initiating Square OAuth',
        { error: 'Config error' }
      );
      expect(mockReq.session.posError).toBe('Failed to connect to Square. Please try again.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });
  });

  // ===========================================
  // handleSquareCallback Tests
  // ===========================================
  describe('handleSquareCallback', () => {
    beforeEach(() => {
      mockReq.query = {
        code: 'auth_code_123',
        state: '1:statevalue',
      };
    });

    it('should exchange code for tokens and create integration', async () => {
      squareOAuthService.handleCallback.mockResolvedValue({
        userId: 1,
        tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
      });
      squareOAuthService.createOrUpdateIntegration.mockResolvedValue({
        id: 10,
        provider: 'square',
      });

      await handleSquareCallback(mockReq, mockRes);

      expect(squareOAuthService.handleCallback).toHaveBeenCalledWith('auth_code_123', '1:statevalue');
      expect(squareOAuthService.createOrUpdateIntegration).toHaveBeenCalledWith(1, {
        accessToken: 'token123',
        refreshToken: 'refresh123',
      });
      expect(mockReq.session.posSuccess).toBe(
        'Successfully connected to Square! Please select which locations to enable.'
      );
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should handle OAuth error response', async () => {
      mockReq.query = {
        error: 'access_denied',
        error_description: 'User denied access',
      };

      await handleSquareCallback(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Square OAuth error', {
        error: 'access_denied',
        errorDescription: 'User denied access',
      });
      expect(mockReq.session.posError).toBe('User denied access');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should handle OAuth error without description', async () => {
      mockReq.query = {
        error: 'access_denied',
      };

      await handleSquareCallback(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Square authorization was denied.');
    });

    it('should handle missing code', async () => {
      mockReq.query = { state: '1:statevalue' };

      await handleSquareCallback(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid callback parameters.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should handle missing state', async () => {
      mockReq.query = { code: 'auth_code_123' };

      await handleSquareCallback(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid callback parameters.');
    });

    it('should handle callback processing error', async () => {
      squareOAuthService.handleCallback.mockRejectedValue(new Error('API error'));

      await handleSquareCallback(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Error handling Square callback', { error: 'API error' });
      expect(mockReq.session.posError).toBe('Failed to complete Square connection. Please try again.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });
  });

  // ===========================================
  // initiateShopifyOAuth Tests
  // ===========================================
  describe('initiateShopifyOAuth', () => {
    beforeEach(() => {
      mockReq.query = { shop: 'teststore.myshopify.com' };
    });

    it('should redirect to Shopify authorization URL', async () => {
      shopifyOAuthService.getAuthorizationUrl.mockReturnValue({
        url: 'https://teststore.myshopify.com/admin/oauth/authorize?client_id=123',
        state: 'xyz789',
        shopDomain: 'teststore.myshopify.com',
      });

      await initiateShopifyOAuth(mockReq, mockRes);

      expect(shopifyOAuthService.getAuthorizationUrl).toHaveBeenCalledWith(1, 'teststore.myshopify.com');
      expect(mockReq.session.shopifyOAuthState).toBe('xyz789');
      expect(mockRes.redirect).toHaveBeenCalledWith(
        'https://teststore.myshopify.com/admin/oauth/authorize?client_id=123'
      );
    });

    it('should redirect to login if no userId', async () => {
      mockReq.session.userId = null;

      await initiateShopifyOAuth(mockReq, mockRes);

      expect(shopifyOAuthService.getAuthorizationUrl).not.toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
    });

    it('should require shop parameter', async () => {
      mockReq.query = {};

      await initiateShopifyOAuth(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Please enter your Shopify store URL.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should handle error and redirect to settings', async () => {
      shopifyOAuthService.getAuthorizationUrl.mockImplementation(() => {
        throw new Error('Invalid shop domain');
      });

      await initiateShopifyOAuth(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Error initiating Shopify OAuth', {
        error: 'Invalid shop domain',
      });
      expect(mockReq.session.posError).toBe('Invalid shop domain');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should use generic error message when error.message is empty', async () => {
      const error = new Error();
      error.message = '';
      shopifyOAuthService.getAuthorizationUrl.mockImplementation(() => {
        throw error;
      });

      await initiateShopifyOAuth(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Failed to connect to Shopify. Please try again.');
    });
  });

  // ===========================================
  // handleShopifyCallback Tests
  // ===========================================
  describe('handleShopifyCallback', () => {
    beforeEach(() => {
      mockReq.query = {
        code: 'shopify_code_123',
        shop: 'teststore.myshopify.com',
        state: '1:teststore.myshopify.com:statevalue',
        hmac: 'valid_hmac',
      };
    });

    it('should validate HMAC and create integration', async () => {
      shopifyOAuthService.validateCallback.mockReturnValue(true);
      shopifyOAuthService.handleCallback.mockResolvedValue({
        userId: 1,
        shopDomain: 'teststore.myshopify.com',
        tokens: { accessToken: 'shopify_token' },
      });
      shopifyOAuthService.createOrUpdateIntegration.mockResolvedValue({
        id: 20,
        provider: 'shopify',
      });

      await handleShopifyCallback(mockReq, mockRes);

      expect(shopifyOAuthService.validateCallback).toHaveBeenCalledWith(mockReq.query);
      expect(shopifyOAuthService.handleCallback).toHaveBeenCalledWith(
        'shopify_code_123',
        'teststore.myshopify.com',
        '1:teststore.myshopify.com:statevalue'
      );
      expect(shopifyOAuthService.createOrUpdateIntegration).toHaveBeenCalledWith(
        1,
        'teststore.myshopify.com',
        { accessToken: 'shopify_token' }
      );
      expect(mockReq.session.posSuccess).toBe(
        'Successfully connected to Shopify! Please select which locations to enable.'
      );
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should reject invalid HMAC', async () => {
      shopifyOAuthService.validateCallback.mockReturnValue(false);

      await handleShopifyCallback(mockReq, mockRes);

      expect(logger.warn).toHaveBeenCalledWith('Shopify HMAC validation failed');
      expect(mockReq.session.posError).toBe('Invalid callback signature.');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
      expect(shopifyOAuthService.handleCallback).not.toHaveBeenCalled();
    });

    it('should handle missing code', async () => {
      shopifyOAuthService.validateCallback.mockReturnValue(true);
      mockReq.query = {
        shop: 'teststore.myshopify.com',
        state: 'statevalue',
        hmac: 'valid_hmac',
      };

      await handleShopifyCallback(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid callback parameters.');
    });

    it('should handle missing shop', async () => {
      shopifyOAuthService.validateCallback.mockReturnValue(true);
      mockReq.query = {
        code: 'code123',
        state: 'statevalue',
        hmac: 'valid_hmac',
      };

      await handleShopifyCallback(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid callback parameters.');
    });

    it('should handle missing state', async () => {
      shopifyOAuthService.validateCallback.mockReturnValue(true);
      mockReq.query = {
        code: 'code123',
        shop: 'teststore.myshopify.com',
        hmac: 'valid_hmac',
      };

      await handleShopifyCallback(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Invalid callback parameters.');
    });

    it('should handle callback processing error', async () => {
      shopifyOAuthService.validateCallback.mockReturnValue(true);
      shopifyOAuthService.handleCallback.mockRejectedValue(new Error('Token exchange failed'));

      await handleShopifyCallback(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith('Error handling Shopify callback', {
        error: 'Token exchange failed',
      });
      expect(mockReq.session.posError).toBe('Token exchange failed');
      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/settings?tab=pos');
    });

    it('should use generic error message when error.message is empty', async () => {
      shopifyOAuthService.validateCallback.mockReturnValue(true);
      const error = new Error();
      error.message = '';
      shopifyOAuthService.handleCallback.mockRejectedValue(error);

      await handleShopifyCallback(mockReq, mockRes);

      expect(mockReq.session.posError).toBe('Failed to complete Shopify connection. Please try again.');
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle empty session object for Square', async () => {
      mockReq.session = {};

      await initiateSquareOAuth(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
    });

    it('should handle empty session object for Shopify', async () => {
      mockReq.session = {};
      mockReq.query = { shop: 'test.myshopify.com' };

      await initiateShopifyOAuth(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
    });

    it('should store OAuth state in session for Square', async () => {
      squareOAuthService.getAuthorizationUrl.mockReturnValue({
        url: 'https://example.com',
        state: 'secure_state_token',
      });

      await initiateSquareOAuth(mockReq, mockRes);

      expect(mockReq.session.squareOAuthState).toBe('secure_state_token');
    });

    it('should store OAuth state in session for Shopify', async () => {
      mockReq.query = { shop: 'test.myshopify.com' };
      shopifyOAuthService.getAuthorizationUrl.mockReturnValue({
        url: 'https://example.com',
        state: 'shopify_state_token',
        shopDomain: 'test.myshopify.com',
      });

      await initiateShopifyOAuth(mockReq, mockRes);

      expect(mockReq.session.shopifyOAuthState).toBe('shopify_state_token');
    });
  });
});
