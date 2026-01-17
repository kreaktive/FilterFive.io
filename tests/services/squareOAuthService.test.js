/**
 * Square OAuth Service Tests
 *
 * Tests for Square OAuth flow:
 * - Authorization URL generation
 * - Token exchange (callback handling)
 * - Token refresh
 * - Access revocation
 * - Location fetching and syncing
 * - Integration creation/update
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock Square SDK
const mockObtainToken = jest.fn();
const mockRevokeToken = jest.fn();
const mockLocationsList = jest.fn();
const mockCustomersGet = jest.fn();

jest.mock('square', () => ({
  SquareClient: jest.fn().mockImplementation(() => ({
    oAuth: {
      obtainToken: mockObtainToken,
      revokeToken: mockRevokeToken,
    },
    locations: {
      list: mockLocationsList,
    },
    customers: {
      get: mockCustomersGet,
    },
  })),
  SquareEnvironment: {
    Production: 'production',
    Sandbox: 'sandbox',
  },
}));

jest.mock('../../src/models/PosIntegration', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../src/models/PosLocation', () => ({
  upsert: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Set env vars before importing service
process.env.SQUARE_APP_ID = 'test_square_app_id';
process.env.SQUARE_APP_SECRET = 'test_square_secret';
process.env.APP_URL = 'https://morestars.io';
process.env.NODE_ENV = 'test';

const PosIntegration = require('../../src/models/PosIntegration');
const PosLocation = require('../../src/models/PosLocation');
const logger = require('../../src/services/logger');
const squareOAuthService = require('../../src/services/squareOAuthService');

describe('Square OAuth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  // ===========================================
  // getAuthorizationUrl Tests
  // ===========================================
  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with userId in state', () => {
      const mockReq = { session: {} };
      const result = squareOAuthService.getAuthorizationUrl(mockReq, 123);

      expect(result.url).toContain('oauth2/authorize');
      expect(result.url).toContain('client_id=test_square_app_id');
      expect(result.url).toContain('state=123%3A'); // userId:state encoded
      expect(result.url).toContain('redirect_uri=');
      expect(result.state).toBeDefined();
      expect(result.state).toMatch(/^\d+:[0-9a-f]{64}$/); // userId:token format
    });

    it('should include required OAuth scopes', () => {
      const mockReq = { session: {} };
      const result = squareOAuthService.getAuthorizationUrl(mockReq, 1);

      expect(result.url).toContain('PAYMENTS_READ');
      expect(result.url).toContain('CUSTOMERS_READ');
      expect(result.url).toContain('MERCHANT_PROFILE_READ');
    });

    it('should include redirect URI', () => {
      const mockReq = { session: {} };
      const result = squareOAuthService.getAuthorizationUrl(mockReq, 1);

      expect(result.url).toContain(encodeURIComponent('https://morestars.io/api/auth/square/callback'));
    });

    it('should generate unique state for each call', () => {
      const mockReq = { session: {} };
      const result1 = squareOAuthService.getAuthorizationUrl(mockReq, 1);
      const result2 = squareOAuthService.getAuthorizationUrl(mockReq, 1);

      expect(result1.state).not.toBe(result2.state);
    });
  });

  // ===========================================
  // handleCallback Tests
  // ===========================================
  describe('handleCallback', () => {
    it('should exchange code for tokens', async () => {
      const mockReq = { session: {} };
      const { state } = squareOAuthService.getAuthorizationUrl(mockReq, 123);

      mockObtainToken.mockResolvedValue({
        result: {
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_456',
          expiresAt: '2025-12-31T23:59:59Z',
          merchantId: 'merchant_789',
        },
      });

      const result = await squareOAuthService.handleCallback(mockReq, 'auth_code', state);

      expect(mockObtainToken).toHaveBeenCalledWith({
        clientId: 'test_square_app_id',
        clientSecret: 'test_square_secret',
        grantType: 'authorization_code',
        code: 'auth_code',
        redirectUri: 'https://morestars.io/api/auth/square/callback',
      });
      expect(result.userId).toBe(123);
      expect(result.tokens.accessToken).toBe('access_token_123');
      expect(result.tokens.refreshToken).toBe('refresh_token_456');
      expect(result.tokens.merchantId).toBe('merchant_789');
    });

    it('should handle response without result wrapper', async () => {
      const mockReq = { session: {} };
      const { state } = squareOAuthService.getAuthorizationUrl(mockReq, 456);

      mockObtainToken.mockResolvedValue({
        accessToken: 'direct_token',
        refreshToken: 'direct_refresh',
        merchantId: 'direct_merchant',
      });

      const result = await squareOAuthService.handleCallback(mockReq, 'code', state);

      expect(result.tokens.accessToken).toBe('direct_token');
    });

    it('should throw on invalid state (no session)', async () => {
      const mockReq = { session: {} };

      await expect(squareOAuthService.handleCallback(mockReq, 'code', '123:invalidtoken'))
        .rejects.toThrow('Invalid or expired OAuth state');
    });

    it('should throw on tampered state', async () => {
      const mockReq = { session: {} };
      const { state } = squareOAuthService.getAuthorizationUrl(mockReq, 123);

      // Tamper with the token part (not just userId)
      const parts = state.split(':');
      const tamperedToken = parts[1].substring(0, 60) + 'fake';
      const tamperedState = `${parts[0]}:${tamperedToken}`;

      await expect(squareOAuthService.handleCallback(mockReq, 'code', tamperedState))
        .rejects.toThrow('Invalid or expired OAuth state');
    });

    it('should throw when no access token returned', async () => {
      const mockReq = { session: {} };
      const { state } = squareOAuthService.getAuthorizationUrl(mockReq, 1);

      mockObtainToken.mockResolvedValue({ result: {} });

      await expect(squareOAuthService.handleCallback(mockReq, 'code', state))
        .rejects.toThrow('Failed to obtain access token from Square');
    });

    it('should handle Square API errors', async () => {
      const mockReq = { session: {} };
      const { state } = squareOAuthService.getAuthorizationUrl(mockReq, 1);

      mockObtainToken.mockRejectedValue(new Error('API rate limit'));

      await expect(squareOAuthService.handleCallback(mockReq, 'code', state))
        .rejects.toThrow('Square API error: API rate limit');
    });

    it('should log token exchange attempt', async () => {
      const mockReq = { session: {} };
      const { state } = squareOAuthService.getAuthorizationUrl(mockReq, 1);

      mockObtainToken.mockResolvedValue({
        result: { accessToken: 'token', merchantId: 'merch' },
      });

      await squareOAuthService.handleCallback(mockReq, 'code', state);

      expect(logger.info).toHaveBeenCalledWith(
        'Square OAuth: Exchanging code for token',
        expect.any(Object)
      );
    });
  });

  // ===========================================
  // refreshToken Tests
  // ===========================================
  describe('refreshToken', () => {
    it('should refresh expired token', async () => {
      const mockIntegration = {
        getRefreshToken: jest.fn().mockReturnValue('old_refresh_token'),
        setAccessToken: jest.fn(),
        setRefreshToken: jest.fn(),
        tokenExpiresAt: null,
        save: jest.fn().mockResolvedValue(true),
      };

      mockObtainToken.mockResolvedValue({
        result: {
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
          expiresAt: '2026-01-01T00:00:00Z',
        },
      });

      const result = await squareOAuthService.refreshToken(mockIntegration);

      expect(mockObtainToken).toHaveBeenCalledWith({
        clientId: 'test_square_app_id',
        clientSecret: 'test_square_secret',
        grantType: 'refresh_token',
        refreshToken: 'old_refresh_token',
      });
      expect(mockIntegration.setAccessToken).toHaveBeenCalledWith('new_access_token');
      expect(mockIntegration.setRefreshToken).toHaveBeenCalledWith('new_refresh_token');
      expect(mockIntegration.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw when no refresh token available', async () => {
      const mockIntegration = {
        getRefreshToken: jest.fn().mockReturnValue(null),
      };

      await expect(squareOAuthService.refreshToken(mockIntegration))
        .rejects.toThrow('No refresh token available');
    });

    it('should throw when token refresh fails', async () => {
      const mockIntegration = {
        getRefreshToken: jest.fn().mockReturnValue('token'),
      };
      mockObtainToken.mockResolvedValue({ result: {} });

      await expect(squareOAuthService.refreshToken(mockIntegration))
        .rejects.toThrow('Failed to refresh access token');
    });

    it('should update expires_at when provided', async () => {
      const mockIntegration = {
        getRefreshToken: jest.fn().mockReturnValue('token'),
        setAccessToken: jest.fn(),
        setRefreshToken: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockObtainToken.mockResolvedValue({
        result: {
          accessToken: 'new_token',
          expiresAt: '2026-06-01T12:00:00Z',
        },
      });

      await squareOAuthService.refreshToken(mockIntegration);

      expect(mockIntegration.tokenExpiresAt).toEqual(new Date('2026-06-01T12:00:00Z'));
    });
  });

  // ===========================================
  // revokeAccess Tests
  // ===========================================
  describe('revokeAccess', () => {
    it('should revoke token and deactivate integration', async () => {
      const mockIntegration = {
        getAccessToken: jest.fn().mockReturnValue('access_token'),
        isActive: true,
        accessTokenEncrypted: 'encrypted',
        refreshTokenEncrypted: 'encrypted',
        save: jest.fn().mockResolvedValue(true),
      };

      mockRevokeToken.mockResolvedValue({ success: true });

      await squareOAuthService.revokeAccess(mockIntegration);

      expect(mockRevokeToken).toHaveBeenCalledWith({
        clientId: 'test_square_app_id',
        clientSecret: 'test_square_secret',
        accessToken: 'access_token',
      });
      expect(mockIntegration.isActive).toBe(false);
      expect(mockIntegration.accessTokenEncrypted).toBeNull();
      expect(mockIntegration.refreshTokenEncrypted).toBeNull();
      expect(mockIntegration.save).toHaveBeenCalled();
    });

    it('should deactivate integration even if revoke fails', async () => {
      const mockIntegration = {
        getAccessToken: jest.fn().mockReturnValue('token'),
        isActive: true,
        accessTokenEncrypted: 'enc',
        refreshTokenEncrypted: 'enc',
        save: jest.fn().mockResolvedValue(true),
      };

      mockRevokeToken.mockRejectedValue(new Error('Token already revoked'));

      await squareOAuthService.revokeAccess(mockIntegration);

      expect(logger.error).toHaveBeenCalledWith(
        'Error revoking Square token',
        { error: 'Token already revoked' }
      );
      expect(mockIntegration.isActive).toBe(false);
      expect(mockIntegration.save).toHaveBeenCalled();
    });

    it('should skip revoke if no access token', async () => {
      const mockIntegration = {
        getAccessToken: jest.fn().mockReturnValue(null),
        isActive: true,
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        save: jest.fn().mockResolvedValue(true),
      };

      await squareOAuthService.revokeAccess(mockIntegration);

      expect(mockRevokeToken).not.toHaveBeenCalled();
      expect(mockIntegration.isActive).toBe(false);
    });
  });

  // ===========================================
  // fetchLocations Tests
  // ===========================================
  describe('fetchLocations', () => {
    it('should fetch and format locations', async () => {
      mockLocationsList.mockResolvedValue({
        locations: [
          {
            id: 'loc1',
            name: 'Main Store',
            address: {
              addressLine1: '123 Main St',
              locality: 'City',
              administrativeDistrictLevel1: 'State',
            },
            status: 'ACTIVE',
          },
          {
            id: 'loc2',
            name: 'Branch',
            address: null,
            status: 'ACTIVE',
          },
        ],
      });

      const result = await squareOAuthService.fetchLocations('token');

      expect(result.success).toBe(true);
      expect(result.locations).toHaveLength(2);
      expect(result.locations[0]).toEqual({
        id: 'loc1',
        name: 'Main Store',
        address: '123 Main St, City, State',
        status: 'ACTIVE',
      });
      expect(result.locations[1].address).toBeNull();
    });

    it('should return empty locations array when no locations', async () => {
      mockLocationsList.mockResolvedValue({});

      const result = await squareOAuthService.fetchLocations('token');

      expect(result.success).toBe(true);
      expect(result.locations).toEqual([]);
    });

    it('should handle partial address', async () => {
      mockLocationsList.mockResolvedValue({
        locations: [
          {
            id: 'loc1',
            name: 'Store',
            address: { locality: 'City' },
            status: 'ACTIVE',
          },
        ],
      });

      const result = await squareOAuthService.fetchLocations('token');

      expect(result.success).toBe(true);
      expect(result.locations[0].address).toBe(', City,');
    });

    it('should return error result on API error', async () => {
      mockLocationsList.mockRejectedValue(new Error('API error'));

      const result = await squareOAuthService.fetchLocations('token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });
  });

  // ===========================================
  // fetchCustomer Tests
  // ===========================================
  describe('fetchCustomer', () => {
    it('should fetch customer details', async () => {
      mockCustomersGet.mockResolvedValue({
        customer: {
          id: 'cust123',
          givenName: 'John',
          familyName: 'Doe',
          phoneNumber: '+15555551234',
          emailAddress: 'john@example.com',
        },
      });

      const result = await squareOAuthService.fetchCustomer('token', 'cust123');

      expect(mockCustomersGet).toHaveBeenCalledWith({ customerId: 'cust123' });
      expect(result.success).toBe(true);
      expect(result.customer).toEqual({
        id: 'cust123',
        givenName: 'John',
        familyName: 'Doe',
        phoneNumber: '+15555551234',
        emailAddress: 'john@example.com',
      });
    });

    it('should return failure for missing customerId', async () => {
      const result = await squareOAuthService.fetchCustomer('token', null);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('no_customer_id');
      expect(mockCustomersGet).not.toHaveBeenCalled();
    });

    it('should return failure when customer not found', async () => {
      mockCustomersGet.mockResolvedValue({});

      const result = await squareOAuthService.fetchCustomer('token', 'cust123');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('customer_not_found');
    });

    it('should return failure on API error', async () => {
      mockCustomersGet.mockRejectedValue(new Error('Customer not found'));

      const result = await squareOAuthService.fetchCustomer('token', 'cust123');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('api_error');
      expect(result.error).toBe('Customer not found');
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching Square customer',
        expect.objectContaining({ error: 'Customer not found' })
      );
    });
  });

  // ===========================================
  // syncLocations Tests
  // ===========================================
  describe('syncLocations', () => {
    it('should sync locations to database', async () => {
      const mockIntegration = {
        id: 10,
        getAccessToken: jest.fn().mockReturnValue('token'),
      };

      mockLocationsList.mockResolvedValue({
        locations: [
          { id: 'loc1', name: 'Store 1', status: 'ACTIVE' },
          { id: 'loc2', name: 'Store 2', status: 'ACTIVE' },
        ],
      });

      const locations = await squareOAuthService.syncLocations(mockIntegration);

      expect(PosLocation.upsert).toHaveBeenCalledTimes(2);
      expect(PosLocation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          posIntegrationId: 10,
          externalLocationId: 'loc1',
          locationName: 'Store 1',
          isEnabled: false,
        }),
        expect.any(Object)
      );
      expect(PosLocation.destroy).toHaveBeenCalled();
      expect(locations).toHaveLength(2);
    });

    it('should throw when no access token', async () => {
      const mockIntegration = {
        getAccessToken: jest.fn().mockReturnValue(null),
      };

      await expect(squareOAuthService.syncLocations(mockIntegration))
        .rejects.toThrow('No access token available');
    });
  });

  // ===========================================
  // createOrUpdateIntegration Tests
  // ===========================================
  describe('createOrUpdateIntegration', () => {
    const mockTokens = {
      accessToken: 'access123',
      refreshToken: 'refresh456',
      expiresAt: new Date('2026-01-01'),
      merchantId: 'merchant789',
    };

    it('should update existing integration', async () => {
      const existingIntegration = {
        id: 5,
        setAccessToken: jest.fn(),
        setRefreshToken: jest.fn(),
        getAccessToken: jest.fn().mockReturnValue('token'),
        save: jest.fn().mockResolvedValue(true),
      };

      PosIntegration.findOne.mockResolvedValue(existingIntegration);
      mockLocationsList.mockResolvedValue({ locations: [] });

      const result = await squareOAuthService.createOrUpdateIntegration(1, mockTokens);

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: { userId: 1, provider: 'square' },
      });
      expect(existingIntegration.setAccessToken).toHaveBeenCalledWith('access123');
      expect(existingIntegration.setRefreshToken).toHaveBeenCalledWith('refresh456');
      expect(existingIntegration.isActive).toBe(true);
      expect(existingIntegration.save).toHaveBeenCalled();
      expect(result).toBe(existingIntegration);
    });

    it('should create new integration', async () => {
      const newIntegration = {
        id: 10,
        setAccessToken: jest.fn(),
        setRefreshToken: jest.fn(),
        getAccessToken: jest.fn().mockReturnValue('token'),
        save: jest.fn().mockResolvedValue(true),
      };

      PosIntegration.findOne.mockResolvedValue(null);
      PosIntegration.create.mockResolvedValue(newIntegration);
      mockLocationsList.mockResolvedValue({ locations: [] });

      const result = await squareOAuthService.createOrUpdateIntegration(1, mockTokens);

      expect(PosIntegration.create).toHaveBeenCalledWith({
        userId: 1,
        provider: 'square',
        merchantId: 'merchant789',
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        tokenExpiresAt: mockTokens.expiresAt,
        isActive: true,
        testMode: true,
        consentConfirmed: false,
        connectedAt: expect.any(Date),
      });
      expect(newIntegration.setAccessToken).toHaveBeenCalledWith('access123');
      expect(newIntegration.setRefreshToken).toHaveBeenCalledWith('refresh456');
      expect(result).toBe(newIntegration);
    });

    it('should sync locations after creating integration', async () => {
      const integration = {
        id: 10,
        setAccessToken: jest.fn(),
        setRefreshToken: jest.fn(),
        getAccessToken: jest.fn().mockReturnValue('token'),
        save: jest.fn().mockResolvedValue(true),
      };

      PosIntegration.findOne.mockResolvedValue(null);
      PosIntegration.create.mockResolvedValue(integration);
      mockLocationsList.mockResolvedValue({
        locations: [{ id: 'loc1', name: 'Store', status: 'ACTIVE' }],
      });

      await squareOAuthService.createOrUpdateIntegration(1, mockTokens);

      expect(PosLocation.upsert).toHaveBeenCalled();
    });
  });

  // ===========================================
  // getClient Tests
  // ===========================================
  describe('getClient', () => {
    it('should return configured Square client', () => {
      const client = squareOAuthService.getClient('test_token');

      expect(client).toBeDefined();
    });
  });

});
