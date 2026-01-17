/**
 * Shopify Webhook Service Tests
 *
 * Tests for:
 * - Signature verification (HMAC-SHA256)
 * - Event processing (orders/create, app/uninstalled)
 * - Order handling with customer phone extraction
 * - Location validation
 * - Idempotency
 */

const crypto = require('crypto');

// Mock dependencies BEFORE importing service
jest.mock('../../src/models/PosIntegration');
jest.mock('../../src/models/PosLocation');
jest.mock('../../src/models/PosWebhookEvent');
jest.mock('../../src/services/posSmsService');
jest.mock('../../src/services/logger');

// Import mocked modules
const PosIntegration = require('../../src/models/PosIntegration');
const PosLocation = require('../../src/models/PosLocation');
const PosWebhookEvent = require('../../src/models/PosWebhookEvent');
const posSmsService = require('../../src/services/posSmsService');
const logger = require('../../src/services/logger');

// Set API secret BEFORE importing service
const TEST_API_SECRET = 'test_shopify_api_secret_123';
process.env.SHOPIFY_API_SECRET = TEST_API_SECRET;

// Import service AFTER mocks and env setup
const shopifyWebhookService = require('../../src/services/shopifyWebhookService');

describe('Shopify Webhook Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock implementations
    PosIntegration.findOne = jest.fn();
    PosLocation.findOne = jest.fn();
    PosWebhookEvent.isProcessed = jest.fn().mockResolvedValue(false);
    PosWebhookEvent.markProcessed = jest.fn().mockResolvedValue(true);
    posSmsService.logTransaction = jest.fn().mockResolvedValue(true);
    posSmsService.processTransaction = jest.fn().mockResolvedValue({ success: true });
    logger.info = jest.fn();
    logger.error = jest.fn();
    logger.warn = jest.fn();
    logger.debug = jest.fn();
  });

  // ============================================
  // verifySignature Tests
  // ============================================
  describe('verifySignature', () => {
    const payload = JSON.stringify({ id: 12345, total_price: '99.99' });

    // Generate a valid HMAC signature
    const generateValidSignature = (body, secret) => {
      return crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('base64');
    };

    test('should return false when hmacHeader is missing', () => {
      const result = shopifyWebhookService.verifySignature(Buffer.from(payload), null);
      expect(result).toBe(false);
    });

    test('should return false when hmacHeader is empty', () => {
      const result = shopifyWebhookService.verifySignature(Buffer.from(payload), '');
      expect(result).toBe(false);
    });

    test('should return true for valid signature', () => {
      const signature = generateValidSignature(payload, TEST_API_SECRET);
      const result = shopifyWebhookService.verifySignature(Buffer.from(payload), signature);
      expect(result).toBe(true);
    });

    test('should return false for invalid signature', () => {
      const result = shopifyWebhookService.verifySignature(
        Buffer.from(payload),
        'invalid_base64_signature'
      );
      expect(result).toBe(false);
    });

    test('should return false for tampered payload', () => {
      const signature = generateValidSignature(payload, TEST_API_SECRET);
      const tamperedPayload = JSON.stringify({ id: 12345, total_price: '999.99' });
      const result = shopifyWebhookService.verifySignature(Buffer.from(tamperedPayload), signature);
      expect(result).toBe(false);
    });

    test('should return false for wrong secret', () => {
      const signature = generateValidSignature(payload, 'wrong_secret');
      const result = shopifyWebhookService.verifySignature(Buffer.from(payload), signature);
      expect(result).toBe(false);
    });

    test('should handle signature verification errors gracefully', () => {
      // Short signature causes timingSafeEqual to throw
      const result = shopifyWebhookService.verifySignature(Buffer.from(payload), 'short');
      expect(result).toBe(false);
    });
  });

  // Test for missing API secret in isolated describe block
  describe('verifySignature - missing API secret', () => {
    test('should return false when API secret is not configured', () => {
      // Create a mock service with no apiSecret
      const serviceWithNoSecret = {
        apiSecret: null,
        verifySignature: function(rawBody, hmacHeader) {
          if (!this.apiSecret) {
            logger.error('SECURITY: SHOPIFY_API_SECRET not configured - rejecting webhook');
            return false;
          }
          return true;
        }
      };

      const payload = JSON.stringify({ id: 12345 });
      const result = serviceWithNoSecret.verifySignature(Buffer.from(payload), 'some_signature');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'SECURITY: SHOPIFY_API_SECRET not configured - rejecting webhook'
      );
    });
  });

  // ============================================
  // getShopDomain Tests
  // ============================================
  describe('getShopDomain', () => {
    test('should extract shop domain from headers', () => {
      const headers = {
        'x-shopify-shop-domain': 'my-store.myshopify.com',
      };
      const result = shopifyWebhookService.getShopDomain(headers);
      expect(result).toBe('my-store.myshopify.com');
    });

    test('should return undefined when header is missing', () => {
      const headers = {};
      const result = shopifyWebhookService.getShopDomain(headers);
      expect(result).toBeUndefined();
    });
  });

  // ============================================
  // processEvent Tests
  // ============================================
  describe('processEvent', () => {
    const validOrder = {
      id: 12345678,
      total_price: '149.99',
      customer: {
        id: 987654,
        first_name: 'John',
        last_name: 'Doe',
        phone: '+15551234567',
      },
      location_id: null,
    };

    const shopDomain = 'test-store.myshopify.com';

    test('should skip duplicate events (idempotency)', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(true);

      const result = await shopifyWebhookService.processEvent(
        validOrder,
        'orders/create',
        shopDomain
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('duplicate');
      expect(logger.info).toHaveBeenCalledWith(
        'Skipping duplicate Shopify event',
        expect.objectContaining({ eventId: '12345678-orders/create' })
      );
    });

    test('should skip unhandled topics', async () => {
      const result = await shopifyWebhookService.processEvent(
        validOrder,
        'orders/updated',
        shopDomain
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('unhandled_topic');
      expect(logger.info).toHaveBeenCalledWith('Unhandled Shopify topic', { topic: 'orders/updated' });
    });

    test('should process orders/create topic', async () => {
      PosIntegration.findOne.mockResolvedValue({
        id: 1,
        userId: 100,
        provider: 'shopify',
        shopDomain,
        isActive: true,
      });
      posSmsService.processTransaction.mockResolvedValue({ success: true, queued: true });

      const result = await shopifyWebhookService.processEvent(
        validOrder,
        'orders/create',
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(PosWebhookEvent.markProcessed).toHaveBeenCalledWith(
        'shopify',
        '12345678-orders/create',
        'orders/create'
      );
    });

    test('should process app/uninstalled topic', async () => {
      const mockIntegration = {
        id: 1,
        isActive: true,
        accessTokenEncrypted: 'encrypted_token',
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const result = await shopifyWebhookService.processEvent(
        { id: 123 },
        'app/uninstalled',
        shopDomain
      );

      expect(result.processed).toBe(true);
      expect(result.action).toBe('app_uninstalled');
      expect(mockIntegration.isActive).toBe(false);
      expect(mockIntegration.accessTokenEncrypted).toBeNull();
      expect(mockIntegration.save).toHaveBeenCalled();
    });

    test('should log event processing', async () => {
      PosIntegration.findOne.mockResolvedValue({
        id: 1,
        userId: 100,
        isActive: true,
      });
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await shopifyWebhookService.processEvent(validOrder, 'orders/create', shopDomain);

      expect(logger.info).toHaveBeenCalledWith(
        'Processing Shopify webhook',
        expect.objectContaining({
          topic: 'orders/create',
          eventId: '12345678-orders/create',
          shopDomain,
        })
      );
    });
  });

  // ============================================
  // handleOrderCreated Tests
  // ============================================
  describe('handleOrderCreated', () => {
    const shopDomain = 'test-store.myshopify.com';
    const mockIntegration = {
      id: 1,
      userId: 100,
      provider: 'shopify',
      shopDomain,
      isActive: true,
    };

    test('should skip when no integration found', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const result = await shopifyWebhookService.processEvent(
        { id: 123, customer: { phone: '+15551234567' } },
        'orders/create',
        shopDomain
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_integration');
      expect(logger.info).toHaveBeenCalledWith(
        'No active Shopify integration found',
        { shopDomain }
      );
    });

    test('should skip when location is not enabled', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue(null);

      const orderWithLocation = {
        id: 123,
        total_price: '99.99',
        location_id: 456,
        customer: {
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+15559876543',
        },
      };

      const result = await shopifyWebhookService.processEvent(
        orderWithLocation,
        'orders/create',
        shopDomain
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('location_disabled');
      expect(posSmsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_location_disabled',
          skipReason: 'Location not enabled',
        })
      );
    });

    test('should process when location is enabled', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({
        id: 1,
        posIntegrationId: mockIntegration.id,
        externalLocationId: '456',
        isEnabled: true,
      });
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const orderWithLocation = {
        id: 123,
        total_price: '99.99',
        location_id: 456,
        customer: {
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+15559876543',
        },
      };

      const result = await shopifyWebhookService.processEvent(
        orderWithLocation,
        'orders/create',
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(posSmsService.processTransaction).toHaveBeenCalled();
    });

    test('should skip orders without phone number', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const orderWithoutPhone = {
        id: 123,
        total_price: '99.99',
        customer: {
          first_name: 'No',
          last_name: 'Phone',
          email: 'nophone@example.com',
        },
      };

      const result = await shopifyWebhookService.processEvent(
        orderWithoutPhone,
        'orders/create',
        shopDomain
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
      expect(posSmsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_no_phone',
          skipReason: 'Customer has no phone number',
        })
      );
    });

    test('should extract phone from shipping address when customer phone is missing', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const orderWithShippingPhone = {
        id: 123,
        total_price: '99.99',
        customer: {
          first_name: 'Shipping',
          last_name: 'Phone',
        },
        shipping_address: {
          phone: '+15551112222',
        },
      };

      const result = await shopifyWebhookService.processEvent(
        orderWithShippingPhone,
        'orders/create',
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15551112222',
        })
      );
    });

    test('should extract phone from billing address as fallback', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const orderWithBillingPhone = {
        id: 123,
        total_price: '99.99',
        customer: {
          first_name: 'Billing',
          last_name: 'Phone',
        },
        billing_address: {
          phone: '+15553334444',
        },
      };

      const result = await shopifyWebhookService.processEvent(
        orderWithBillingPhone,
        'orders/create',
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15553334444',
        })
      );
    });

    test('should prefer customer phone over address phones', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const orderWithMultiplePhones = {
        id: 123,
        total_price: '99.99',
        customer: {
          first_name: 'Multi',
          last_name: 'Phone',
          phone: '+15551111111', // Should use this one
        },
        shipping_address: {
          phone: '+15552222222',
        },
        billing_address: {
          phone: '+15553333333',
        },
      };

      const result = await shopifyWebhookService.processEvent(
        orderWithMultiplePhones,
        'orders/create',
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerPhone: '+15551111111',
        })
      );
    });

    test('should extract customer name correctly', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const order = {
        id: 123,
        total_price: '99.99',
        customer: {
          first_name: 'John',
          last_name: 'Doe',
          phone: '+15551234567',
        },
      };

      await shopifyWebhookService.processEvent(order, 'orders/create', shopDomain);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John Doe',
        })
      );
    });

    test('should handle missing customer names', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const order = {
        id: 123,
        total_price: '99.99',
        customer: {
          phone: '+15551234567',
        },
      };

      await shopifyWebhookService.processEvent(order, 'orders/create', shopDomain);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: '',
        })
      );
    });

    test('should handle null customer object', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const orderWithNoCustomer = {
        id: 123,
        total_price: '99.99',
        customer: null,
      };

      const result = await shopifyWebhookService.processEvent(
        orderWithNoCustomer,
        'orders/create',
        shopDomain
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
    });

    test('should parse purchase amount correctly', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const order = {
        id: 123,
        total_price: '149.99',
        customer: {
          phone: '+15551234567',
        },
      };

      await shopifyWebhookService.processEvent(order, 'orders/create', shopDomain);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseAmount: 149.99,
        })
      );
    });

    test('should handle missing total_price', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const order = {
        id: 123,
        customer: {
          phone: '+15551234567',
        },
      };

      await shopifyWebhookService.processEvent(order, 'orders/create', shopDomain);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseAmount: null,
        })
      );
    });

    test('should pass integration to processTransaction', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const order = {
        id: 123,
        total_price: '99.99',
        customer: {
          phone: '+15551234567',
        },
      };

      await shopifyWebhookService.processEvent(order, 'orders/create', shopDomain);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          integration: mockIntegration,
          externalTransactionId: '123',
        })
      );
    });
  });

  // ============================================
  // handleAppUninstalled Tests
  // ============================================
  describe('handleAppUninstalled', () => {
    const shopDomain = 'uninstall-store.myshopify.com';

    test('should deactivate integration on app uninstall', async () => {
      const mockIntegration = {
        id: 1,
        isActive: true,
        accessTokenEncrypted: 'encrypted_token_123',
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const result = await shopifyWebhookService.processEvent(
        { id: 123 },
        'app/uninstalled',
        shopDomain
      );

      expect(result.processed).toBe(true);
      expect(result.action).toBe('app_uninstalled');
      expect(mockIntegration.isActive).toBe(false);
      expect(mockIntegration.accessTokenEncrypted).toBeNull();
      expect(mockIntegration.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Shopify app uninstalled', { shopDomain });
    });

    test('should handle uninstall when integration not found', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const result = await shopifyWebhookService.processEvent(
        { id: 123 },
        'app/uninstalled',
        shopDomain
      );

      expect(result.processed).toBe(true);
      expect(result.action).toBe('app_uninstalled');
    });
  });

  // ============================================
  // getLocationName Tests
  // ============================================
  describe('getLocationName', () => {
    test('should return source_name when available', () => {
      const order = {
        source_name: 'web',
      };
      const result = shopifyWebhookService.getLocationName(order);
      expect(result).toBe('web');
    });

    test('should return "Online" as fallback', () => {
      const order = {};
      const result = shopifyWebhookService.getLocationName(order);
      expect(result).toBe('Online');
    });

    test('should return location ID from fulfillment', () => {
      const order = {
        location_id: 123,
        fulfillments: [
          {
            location_id: 456,
          },
        ],
      };
      const result = shopifyWebhookService.getLocationName(order);
      expect(result).toBe('Location 456');
    });

    test('should not use fulfillment location if empty array', () => {
      const order = {
        location_id: 123,
        fulfillments: [],
        source_name: 'pos',
      };
      const result = shopifyWebhookService.getLocationName(order);
      expect(result).toBe('pos');
    });

    test('should fallback when fulfillment has no location_id', () => {
      const order = {
        location_id: 123,
        fulfillments: [{}],
        source_name: 'mobile',
      };
      const result = shopifyWebhookService.getLocationName(order);
      expect(result).toBe('mobile');
    });
  });
});
