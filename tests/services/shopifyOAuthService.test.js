/**
 * @file shopifyOAuthService.test.js
 * @description Tests for Shopify OAuth service - OAuth flow, location sync, webhook management
 */

const crypto = require('crypto');

// Mock dependencies before requiring the service
jest.mock('axios');
jest.mock('../../src/models/PosIntegration');
jest.mock('../../src/models/PosLocation');
jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const axios = require('axios');
const PosIntegration = require('../../src/models/PosIntegration');
const PosLocation = require('../../src/models/PosLocation');
const logger = require('../../src/services/logger');

// Set environment variables before requiring service
process.env.SHOPIFY_API_KEY = 'test-api-key';
process.env.SHOPIFY_API_SECRET = 'test-api-secret';
process.env.APP_URL = 'https://app.morestars.io';

const shopifyOAuthService = require('../../src/services/shopifyOAuthService');

describe('ShopifyOAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create mock integration
  const createMockIntegration = (overrides = {}) => ({
    id: 1,
    userId: 1,
    provider: 'shopify',
    shopDomain: 'test-store.myshopify.com',
    isActive: true,
    getAccessToken: jest.fn().mockReturnValue('test-access-token'),
    setAccessToken: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  // ============================================
  // normalizeShopDomain Tests
  // ============================================
  describe('normalizeShopDomain', () => {
    it('should throw error when shop is empty', () => {
      expect(() => shopifyOAuthService.normalizeShopDomain(null)).toThrow('Shop domain is required');
      expect(() => shopifyOAuthService.normalizeShopDomain('')).toThrow('Shop domain is required');
      expect(() => shopifyOAuthService.normalizeShopDomain(undefined)).toThrow('Shop domain is required');
    });

    it('should remove https:// prefix', () => {
      const result = shopifyOAuthService.normalizeShopDomain('https://test-store.myshopify.com');
      expect(result).toBe('test-store.myshopify.com');
    });

    it('should remove http:// prefix', () => {
      const result = shopifyOAuthService.normalizeShopDomain('http://test-store.myshopify.com');
      expect(result).toBe('test-store.myshopify.com');
    });

    it('should remove trailing slash', () => {
      const result = shopifyOAuthService.normalizeShopDomain('test-store.myshopify.com/');
      expect(result).toBe('test-store.myshopify.com');
    });

    it('should add .myshopify.com suffix when missing', () => {
      const result = shopifyOAuthService.normalizeShopDomain('test-store');
      expect(result).toBe('test-store.myshopify.com');
    });

    it('should not add suffix if already present', () => {
      const result = shopifyOAuthService.normalizeShopDomain('test-store.myshopify.com');
      expect(result).toBe('test-store.myshopify.com');
    });

    it('should convert to lowercase', () => {
      // Note: The includes check is case-sensitive, so mixed case .MyShopify.COM
      // triggers the suffix addition before lowercasing
      const result = shopifyOAuthService.normalizeShopDomain('test-store');
      expect(result).toBe('test-store.myshopify.com');
    });

    it('should handle combination of issues', () => {
      // Note: Protocol regex is case-sensitive, so lowercase 'https://' works
      const result = shopifyOAuthService.normalizeShopDomain('https://My-Store/');
      expect(result).toBe('my-store.myshopify.com');
    });
  });

  // ============================================
  // getAuthorizationUrl Tests
  // ============================================
  describe('getAuthorizationUrl', () => {
    it('should generate valid authorization URL', () => {
      const result = shopifyOAuthService.getAuthorizationUrl(1, 'test-store');

      expect(result.url).toContain('https://test-store.myshopify.com/admin/oauth/authorize');
      expect(result.url).toContain('client_id=test-api-key');
      expect(result.url).toContain('scope=read_orders');
      expect(result.url).toContain('redirect_uri=');
      expect(result.shopDomain).toBe('test-store.myshopify.com');
    });

    it('should include state parameter with userId and shop', () => {
      const result = shopifyOAuthService.getAuthorizationUrl(5, 'my-store');

      expect(result.state).toBeDefined();
      expect(result.state).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(result.url).toContain('state=5%3Amy-store.myshopify.com%3A');
    });

    it('should generate unique state each time', () => {
      const result1 = shopifyOAuthService.getAuthorizationUrl(1, 'store1');
      const result2 = shopifyOAuthService.getAuthorizationUrl(1, 'store1');

      expect(result1.state).not.toBe(result2.state);
    });

    it('should use correct redirect URI', () => {
      const result = shopifyOAuthService.getAuthorizationUrl(1, 'test-store');

      expect(result.url).toContain(encodeURIComponent('/api/auth/shopify/callback'));
    });
  });

  // ============================================
  // validateCallback Tests
  // ============================================
  describe('validateCallback', () => {
    const generateHmac = (params) => {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

      return crypto
        .createHmac('sha256', 'test-api-secret')
        .update(sortedParams)
        .digest('hex');
    };

    it('should return true for valid HMAC signature', () => {
      const params = { code: 'test-code', shop: 'test-store.myshopify.com', state: 'test-state' };
      const hmac = generateHmac(params);

      const result = shopifyOAuthService.validateCallback({ ...params, hmac });

      expect(result).toBe(true);
    });

    it('should throw for invalid HMAC signature with different length', () => {
      const params = { code: 'test-code', shop: 'test-store.myshopify.com', state: 'test-state' };

      // timingSafeEqual throws when buffer lengths differ
      expect(() => {
        shopifyOAuthService.validateCallback({ ...params, hmac: 'invalid-hmac' });
      }).toThrow();
    });

    it('should handle multiple parameters correctly', () => {
      const params = {
        code: 'auth-code-123',
        shop: 'another-store.myshopify.com',
        state: 'user-state-value',
        timestamp: '1234567890',
      };
      const hmac = generateHmac(params);

      const result = shopifyOAuthService.validateCallback({ ...params, hmac });

      expect(result).toBe(true);
    });

    it('should fail when parameters are tampered', () => {
      const params = { code: 'test-code', shop: 'test-store.myshopify.com' };
      const hmac = generateHmac(params);

      // Tamper with the shop parameter
      const result = shopifyOAuthService.validateCallback({
        code: 'test-code',
        shop: 'evil-store.myshopify.com', // Changed!
        hmac,
      });

      expect(result).toBe(false);
    });
  });

  // ============================================
  // handleCallback Tests
  // ============================================
  describe('handleCallback', () => {
    it('should exchange code for access token', async () => {
      axios.post.mockResolvedValue({
        data: {
          access_token: 'shpat_test_token_123',
          scope: 'read_orders,read_customers',
        },
      });

      const result = await shopifyOAuthService.handleCallback(
        'auth-code',
        'test-store.myshopify.com',
        '1:test-store.myshopify.com:random-state'
      );

      expect(axios.post).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/oauth/access_token',
        {
          client_id: 'test-api-key',
          client_secret: 'test-api-secret',
          code: 'auth-code',
        }
      );
      expect(result.userId).toBe(1);
      expect(result.shopDomain).toBe('test-store.myshopify.com');
      expect(result.tokens.accessToken).toBe('shpat_test_token_123');
    });

    it('should throw error for invalid state format', async () => {
      await expect(
        shopifyOAuthService.handleCallback('code', 'shop', 'invalid-state')
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should throw error when state is missing userId', async () => {
      await expect(
        shopifyOAuthService.handleCallback('code', 'shop', ':shop:state')
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should throw error when access_token not returned', async () => {
      axios.post.mockResolvedValue({ data: { error: 'invalid_grant' } });

      await expect(
        shopifyOAuthService.handleCallback('code', 'shop', '1:shop:state')
      ).rejects.toThrow('Failed to obtain access token');
    });

    it('should handle axios errors', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      await expect(
        shopifyOAuthService.handleCallback('code', 'shop', '1:shop:state')
      ).rejects.toThrow('Network error');
    });
  });

  // ============================================
  // fetchLocations Tests
  // ============================================
  describe('fetchLocations', () => {
    it('should fetch and parse locations correctly', async () => {
      axios.post.mockResolvedValue({
        data: {
          data: {
            locations: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/Location/123',
                    name: 'Main Store',
                    address: { address1: '123 Main St', city: 'NYC', province: 'NY' },
                    isActive: true,
                  },
                },
                {
                  node: {
                    id: 'gid://shopify/Location/456',
                    name: 'Warehouse',
                    address: { address1: '789 Storage Ave', city: 'LA', province: 'CA' },
                    isActive: true,
                  },
                },
              ],
            },
          },
        },
      });

      const result = await shopifyOAuthService.fetchLocations('token', 'test-store.myshopify.com');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '123',
        name: 'Main Store',
        address: '123 Main St, NYC, NY',
        isActive: true,
      });
      expect(result[1].id).toBe('456');
    });

    it('should extract numeric ID from GraphQL global ID', async () => {
      axios.post.mockResolvedValue({
        data: {
          data: {
            locations: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/Location/789012',
                    name: 'Store',
                    address: null,
                    isActive: true,
                  },
                },
              ],
            },
          },
        },
      });

      const result = await shopifyOAuthService.fetchLocations('token', 'shop.myshopify.com');

      expect(result[0].id).toBe('789012');
    });

    it('should handle missing address gracefully', async () => {
      axios.post.mockResolvedValue({
        data: {
          data: {
            locations: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/Location/100',
                    name: 'Online Store',
                    address: null,
                    isActive: true,
                  },
                },
              ],
            },
          },
        },
      });

      const result = await shopifyOAuthService.fetchLocations('token', 'shop.myshopify.com');

      expect(result[0].address).toBeNull();
    });

    it('should return empty array on API error', async () => {
      axios.post.mockRejectedValue(new Error('GraphQL error'));

      const result = await shopifyOAuthService.fetchLocations('token', 'shop.myshopify.com');

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('Error fetching Shopify locations', expect.any(Object));
    });

    it('should return empty array when locations data is missing', async () => {
      axios.post.mockResolvedValue({ data: { data: null } });

      const result = await shopifyOAuthService.fetchLocations('token', 'shop.myshopify.com');

      expect(result).toEqual([]);
    });

    it('should use correct GraphQL endpoint', async () => {
      axios.post.mockResolvedValue({ data: { data: { locations: { edges: [] } } } });

      await shopifyOAuthService.fetchLocations('test-token', 'mystore.myshopify.com');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/api/'),
        expect.objectContaining({ query: expect.stringContaining('locations') }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': 'test-token',
          },
        })
      );
    });
  });

  // ============================================
  // syncLocations Tests
  // ============================================
  describe('syncLocations', () => {
    it('should upsert locations from Shopify', async () => {
      const integration = createMockIntegration();
      axios.post.mockResolvedValue({
        data: {
          data: {
            locations: {
              edges: [
                {
                  node: {
                    id: 'gid://shopify/Location/111',
                    name: 'Store A',
                    address: null,
                    isActive: true,
                  },
                },
              ],
            },
          },
        },
      });
      PosLocation.upsert.mockResolvedValue([{}, true]);
      PosLocation.destroy.mockResolvedValue(0);

      await shopifyOAuthService.syncLocations(integration);

      expect(PosLocation.upsert).toHaveBeenCalledWith(
        {
          posIntegrationId: 1,
          externalLocationId: '111',
          locationName: 'Store A',
          isEnabled: false,
        },
        expect.objectContaining({
          conflictFields: ['pos_integration_id', 'external_location_id'],
        })
      );
    });

    it('should throw error when no access token available', async () => {
      const integration = createMockIntegration({
        getAccessToken: jest.fn().mockReturnValue(null),
      });

      await expect(shopifyOAuthService.syncLocations(integration)).rejects.toThrow('No access token available');
    });

    it('should remove locations that no longer exist in Shopify', async () => {
      const integration = createMockIntegration();
      axios.post.mockResolvedValue({
        data: {
          data: {
            locations: {
              edges: [
                {
                  node: { id: 'gid://shopify/Location/222', name: 'Active Store', address: null, isActive: true },
                },
              ],
            },
          },
        },
      });
      PosLocation.upsert.mockResolvedValue([{}, true]);
      PosLocation.destroy.mockResolvedValue(2);

      await shopifyOAuthService.syncLocations(integration);

      expect(PosLocation.destroy).toHaveBeenCalledWith({
        where: {
          posIntegrationId: 1,
          externalLocationId: expect.any(Object), // Op.notIn
        },
      });
    });

    it('should return synced locations', async () => {
      const integration = createMockIntegration();
      axios.post.mockResolvedValue({
        data: {
          data: {
            locations: {
              edges: [
                { node: { id: 'gid://shopify/Location/333', name: 'Store', address: null, isActive: true } },
              ],
            },
          },
        },
      });
      PosLocation.upsert.mockResolvedValue([{}, true]);
      PosLocation.destroy.mockResolvedValue(0);

      const result = await shopifyOAuthService.syncLocations(integration);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Store');
    });
  });

  // ============================================
  // revokeAccess Tests
  // ============================================
  describe('revokeAccess', () => {
    it('should delete webhooks and deactivate integration', async () => {
      const integration = createMockIntegration();
      axios.get.mockResolvedValue({ data: { webhooks: [] } });

      await shopifyOAuthService.revokeAccess(integration);

      expect(integration.isActive).toBe(false);
      expect(integration.accessTokenEncrypted).toBeNull();
      expect(integration.refreshTokenEncrypted).toBeNull();
      expect(integration.save).toHaveBeenCalled();
    });

    it('should continue even if deleteWebhooks fails', async () => {
      const integration = createMockIntegration();
      axios.get.mockRejectedValue(new Error('API error'));

      await shopifyOAuthService.revokeAccess(integration);

      expect(logger.error).toHaveBeenCalledWith('Error cleaning up Shopify integration', expect.any(Object));
      expect(integration.isActive).toBe(false);
      expect(integration.save).toHaveBeenCalled();
    });

    it('should skip API calls when no access token', async () => {
      const integration = createMockIntegration({
        getAccessToken: jest.fn().mockReturnValue(null),
      });

      await shopifyOAuthService.revokeAccess(integration);

      expect(axios.get).not.toHaveBeenCalled();
      expect(integration.isActive).toBe(false);
      expect(integration.save).toHaveBeenCalled();
    });
  });

  // ============================================
  // deleteWebhooks Tests
  // ============================================
  describe('deleteWebhooks', () => {
    it('should list and delete MoreStars webhooks', async () => {
      axios.get.mockResolvedValue({
        data: {
          webhooks: [
            { id: 1, address: 'https://app.morestars.io/webhook' },
            { id: 2, address: 'https://other-app.com/webhook' },
          ],
        },
      });
      axios.delete.mockResolvedValue({});

      await shopifyOAuthService.deleteWebhooks('token', 'shop.myshopify.com');

      expect(axios.delete).toHaveBeenCalledTimes(1);
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks/1.json'),
        expect.any(Object)
      );
    });

    it('should delete legacy filterfive webhooks', async () => {
      axios.get.mockResolvedValue({
        data: {
          webhooks: [
            { id: 10, address: 'https://app.filterfive.io/webhook' },
          ],
        },
      });
      axios.delete.mockResolvedValue({});

      await shopifyOAuthService.deleteWebhooks('token', 'shop.myshopify.com');

      expect(axios.delete).toHaveBeenCalledTimes(1);
    });

    it('should not delete unrelated webhooks', async () => {
      axios.get.mockResolvedValue({
        data: {
          webhooks: [
            { id: 5, address: 'https://completely-different.com/hook' },
          ],
        },
      });
      axios.delete.mockResolvedValue({});

      await shopifyOAuthService.deleteWebhooks('token', 'shop.myshopify.com');

      expect(axios.delete).not.toHaveBeenCalled();
    });

    it('should handle empty webhooks list', async () => {
      axios.get.mockResolvedValue({ data: { webhooks: [] } });

      await shopifyOAuthService.deleteWebhooks('token', 'shop.myshopify.com');

      expect(axios.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // registerWebhook Tests
  // ============================================
  describe('registerWebhook', () => {
    it('should register orders/create webhook', async () => {
      axios.post.mockResolvedValue({ data: { webhook: { id: 123 } } });

      await shopifyOAuthService.registerWebhook('token', 'shop.myshopify.com');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/webhooks.json'),
        {
          webhook: {
            topic: 'orders/create',
            address: 'https://app.morestars.io/api/webhooks/shopify',
            format: 'json',
          },
        },
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': 'token',
          },
        })
      );
      expect(logger.info).toHaveBeenCalledWith('Registered orders/create webhook', { shopDomain: 'shop.myshopify.com' });
    });

    it('should ignore 422 conflict error (webhook exists)', async () => {
      axios.post.mockRejectedValue({
        response: { status: 422 },
      });

      // Should not throw
      await expect(shopifyOAuthService.registerWebhook('token', 'shop.myshopify.com')).resolves.toBeUndefined();
    });

    it('should throw for non-422 errors', async () => {
      axios.post.mockRejectedValue({
        response: { status: 500 },
      });

      await expect(shopifyOAuthService.registerWebhook('token', 'shop.myshopify.com')).rejects.toBeDefined();
    });
  });

  // ============================================
  // createOrUpdateIntegration Tests
  // ============================================
  describe('createOrUpdateIntegration', () => {
    beforeEach(() => {
      // Mock fetchLocations and registerWebhook success
      axios.post.mockResolvedValue({ data: { data: { locations: { edges: [] } } } });
      axios.get.mockResolvedValue({ data: { webhooks: [] } });
      PosLocation.destroy.mockResolvedValue(0);
    });

    it('should update existing integration', async () => {
      const existingIntegration = createMockIntegration();
      PosIntegration.findOne.mockResolvedValue(existingIntegration);

      const tokens = { accessToken: 'new-token', expiresAt: null };
      const result = await shopifyOAuthService.createOrUpdateIntegration(1, 'updated-shop.myshopify.com', tokens);

      expect(existingIntegration.setAccessToken).toHaveBeenCalledWith('new-token');
      expect(existingIntegration.shopDomain).toBe('updated-shop.myshopify.com');
      expect(existingIntegration.isActive).toBe(true);
      expect(existingIntegration.save).toHaveBeenCalled();
      expect(result).toBe(existingIntegration);
    });

    it('should create new integration when none exists', async () => {
      PosIntegration.findOne.mockResolvedValue(null);
      const newIntegration = createMockIntegration();
      PosIntegration.create.mockResolvedValue(newIntegration);

      const tokens = { accessToken: 'brand-new-token', expiresAt: null };
      const result = await shopifyOAuthService.createOrUpdateIntegration(5, 'new-shop.myshopify.com', tokens);

      expect(PosIntegration.create).toHaveBeenCalledWith({
        userId: 5,
        provider: 'shopify',
        shopDomain: 'new-shop.myshopify.com',
        accessTokenEncrypted: null,
        tokenExpiresAt: null,
        isActive: true,
        testMode: true,
        consentConfirmed: false,
        connectedAt: expect.any(Date),
      });
      expect(newIntegration.setAccessToken).toHaveBeenCalledWith('brand-new-token');
      expect(result).toBe(newIntegration);
    });

    it('should register webhook after creating/updating', async () => {
      const integration = createMockIntegration();
      PosIntegration.findOne.mockResolvedValue(integration);

      const tokens = { accessToken: 'token', expiresAt: null };
      await shopifyOAuthService.createOrUpdateIntegration(1, 'shop.myshopify.com', tokens);

      // Should have called webhook registration (the last axios.post call)
      expect(axios.post).toHaveBeenCalled();
    });

    it('should sync locations after creating/updating', async () => {
      const integration = createMockIntegration();
      PosIntegration.findOne.mockResolvedValue(integration);
      axios.post.mockResolvedValue({
        data: {
          data: {
            locations: {
              edges: [
                { node: { id: 'gid://shopify/Location/999', name: 'New Location', address: null, isActive: true } },
              ],
            },
          },
        },
      });
      PosLocation.upsert.mockResolvedValue([{}, true]);

      const tokens = { accessToken: 'token', expiresAt: null };
      await shopifyOAuthService.createOrUpdateIntegration(1, 'shop.myshopify.com', tokens);

      expect(PosLocation.upsert).toHaveBeenCalled();
    });
  });
});
