/**
 * WooCommerce Webhook Service Tests
 *
 * Tests for:
 * - Signature verification (HMAC-SHA256)
 * - Event processing (order.created, order.completed)
 * - Store URL lookup with normalization
 * - Setup instructions generation
 */

const crypto = require('crypto');

// Mock dependencies before importing service
jest.mock('../../src/models/PosIntegration', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../src/models/PosWebhookEvent', () => ({
  isProcessed: jest.fn(),
  markProcessed: jest.fn(),
}));

jest.mock('../../src/services/posSmsService', () => ({
  logTransaction: jest.fn(),
  processTransaction: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Import after mocks
const PosIntegration = require('../../src/models/PosIntegration');
const PosWebhookEvent = require('../../src/models/PosWebhookEvent');
const posSmsService = require('../../src/services/posSmsService');
const logger = require('../../src/services/logger');
const woocommerceWebhookService = require('../../src/services/woocommerceWebhookService');

describe('WooCommerce Webhook Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // verifySignature Tests
  // ============================================
  describe('verifySignature', () => {
    const secret = 'test_webhook_secret_123';
    const payload = JSON.stringify({ id: 12345, total: '99.99' });

    // Generate a valid signature for testing
    const generateValidSignature = (body, webhookSecret) => {
      return crypto
        .createHmac('sha256', webhookSecret)
        .update(body, 'utf8')
        .digest('base64');
    };

    test('should return false when signature is missing', () => {
      const result = woocommerceWebhookService.verifySignature(payload, null, secret);
      expect(result).toBe(false);
    });

    test('should return false when signature is empty string', () => {
      const result = woocommerceWebhookService.verifySignature(payload, '', secret);
      expect(result).toBe(false);
    });

    test('should return false when secret is missing', () => {
      const signature = generateValidSignature(payload, secret);
      const result = woocommerceWebhookService.verifySignature(payload, signature, null);
      expect(result).toBe(false);
    });

    test('should return false when secret is empty string', () => {
      const signature = generateValidSignature(payload, secret);
      const result = woocommerceWebhookService.verifySignature(payload, signature, '');
      expect(result).toBe(false);
    });

    test('should return true for valid signature with string body', () => {
      const signature = generateValidSignature(payload, secret);
      const result = woocommerceWebhookService.verifySignature(payload, signature, secret);
      expect(result).toBe(true);
    });

    test('should return true for valid signature with Buffer body', () => {
      const bufferPayload = Buffer.from(payload);
      const signature = generateValidSignature(payload, secret);
      const result = woocommerceWebhookService.verifySignature(bufferPayload, signature, secret);
      expect(result).toBe(true);
    });

    test('should return false for invalid signature', () => {
      const invalidSignature = 'invalid_base64_signature_here';
      const result = woocommerceWebhookService.verifySignature(payload, invalidSignature, secret);
      expect(result).toBe(false);
    });

    test('should return false for tampered payload', () => {
      const signature = generateValidSignature(payload, secret);
      const tamperedPayload = JSON.stringify({ id: 12345, total: '999.99' }); // Changed total
      const result = woocommerceWebhookService.verifySignature(tamperedPayload, signature, secret);
      expect(result).toBe(false);
    });

    test('should return false for wrong secret', () => {
      const signature = generateValidSignature(payload, secret);
      const result = woocommerceWebhookService.verifySignature(payload, signature, 'wrong_secret');
      expect(result).toBe(false);
    });

    test('should handle signature verification errors gracefully', () => {
      // Create a signature with different length to cause timingSafeEqual to throw
      const shortSignature = 'short';
      const result = woocommerceWebhookService.verifySignature(payload, shortSignature, secret);
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'WooCommerce signature verification error',
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    test('should verify signature with special characters in payload', () => {
      const specialPayload = JSON.stringify({
        id: 123,
        billing: {
          first_name: "José",
          last_name: "García",
          address: "123 Calle Niño"
        }
      });
      const signature = generateValidSignature(specialPayload, secret);
      const result = woocommerceWebhookService.verifySignature(specialPayload, signature, secret);
      expect(result).toBe(true);
    });
  });

  // ============================================
  // processEvent Tests
  // ============================================
  describe('processEvent', () => {
    const mockIntegration = {
      id: 1,
      userId: 100,
      provider: 'woocommerce',
      storeUrl: 'https://example-store.com',
      webhookSecret: 'secret_123',
      isActive: true,
    };

    const validOrderPayload = {
      id: 12345,
      order_key: 'wc_order_abc123',
      status: 'completed',
      total: '149.99',
      billing: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+15551234567',
      },
      line_items: [
        { name: 'Product A', quantity: 2, total: '99.99' },
        { name: 'Product B', quantity: 1, total: '50.00' },
      ],
    };

    test('should skip duplicate events (idempotency)', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(true);

      const result = await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('duplicate');
      expect(logger.info).toHaveBeenCalledWith(
        'Skipping duplicate WooCommerce event',
        expect.objectContaining({ eventId: expect.any(String) })
      );
      expect(posSmsService.processTransaction).not.toHaveBeenCalled();
    });

    test('should skip unhandled topics', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);

      const result = await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.updated',
        'https://example-store.com',
        mockIntegration
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('unhandled_topic');
      expect(posSmsService.processTransaction).not.toHaveBeenCalled();
    });

    test('should process order.created topic', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true, queued: true });

      const result = await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.created',
        'https://example-store.com',
        mockIntegration
      );

      expect(result.success).toBe(true);
      expect(posSmsService.processTransaction).toHaveBeenCalled();
      expect(PosWebhookEvent.markProcessed).toHaveBeenCalledWith(
        'woocommerce',
        'woo_12345_order.created',
        'order.created'
      );
    });

    test('should process order.completed topic', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true, queued: true });

      const result = await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(result.success).toBe(true);
      expect(posSmsService.processTransaction).toHaveBeenCalled();
    });

    test('should skip orders without phone number', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.logTransaction.mockResolvedValue(true);

      const orderWithoutPhone = {
        ...validOrderPayload,
        billing: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '', // No phone
        },
      };

      const result = await woocommerceWebhookService.processEvent(
        orderWithoutPhone,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
      expect(posSmsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockIntegration.userId,
          posIntegrationId: mockIntegration.id,
          smsStatus: 'skipped_no_phone',
          skipReason: 'No phone number in order billing',
        })
      );
      expect(posSmsService.processTransaction).not.toHaveBeenCalled();
      expect(PosWebhookEvent.markProcessed).toHaveBeenCalled();
    });

    test('should skip orders with null phone number', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.logTransaction.mockResolvedValue(true);

      const orderWithNullPhone = {
        ...validOrderPayload,
        billing: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: null,
        },
      };

      const result = await woocommerceWebhookService.processEvent(
        orderWithNullPhone,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
    });

    test('should extract customer name correctly', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John Doe',
          customerPhone: '+15551234567',
        })
      );
    });

    test('should use "Customer" when name is missing', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const orderWithoutName = {
        ...validOrderPayload,
        billing: {
          phone: '+15551234567',
          email: 'test@example.com',
        },
      };

      await woocommerceWebhookService.processEvent(
        orderWithoutName,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Customer',
        })
      );
    });

    test('should extract purchase amount correctly', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseAmount: 149.99,
        })
      );
    });

    test('should handle missing total gracefully', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const orderWithoutTotal = {
        ...validOrderPayload,
        total: undefined,
      };

      await woocommerceWebhookService.processEvent(
        orderWithoutTotal,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseAmount: null,
        })
      );
    });

    test('should use source URL as location name', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://my-awesome-store.com',
        mockIntegration
      );

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          locationName: 'https://my-awesome-store.com',
        })
      );
    });

    test('should use "WooCommerce" as fallback location name', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        null,
        mockIntegration
      );

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          locationName: 'WooCommerce',
        })
      );
    });

    test('should generate correct event ID', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(PosWebhookEvent.isProcessed).toHaveBeenCalledWith(
        'woocommerce',
        'woo_12345_order.completed'
      );
    });

    test('should handle missing billing object', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.logTransaction.mockResolvedValue(true);

      const orderWithoutBilling = {
        id: 12345,
        total: '99.99',
      };

      const result = await woocommerceWebhookService.processEvent(
        orderWithoutBilling,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('no_phone_number');
    });

    test('should pass integration to processTransaction', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(posSmsService.processTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          integration: mockIntegration,
          externalTransactionId: '12345',
        })
      );
    });

    test('should log event processing', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosWebhookEvent.markProcessed.mockResolvedValue(true);
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      await woocommerceWebhookService.processEvent(
        validOrderPayload,
        'order.completed',
        'https://example-store.com',
        mockIntegration
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Processing WooCommerce webhook',
        expect.objectContaining({
          topic: 'order.completed',
          orderId: 12345,
          source: 'https://example-store.com',
        })
      );
    });
  });

  // ============================================
  // findIntegrationByStoreUrl Tests
  // ============================================
  describe('findIntegrationByStoreUrl', () => {
    const mockIntegration = {
      id: 1,
      userId: 100,
      provider: 'woocommerce',
      storeUrl: 'https://example-store.com',
      isActive: true,
    };

    beforeEach(() => {
      PosIntegration.findOne.mockReset();
    });

    test('should return null for empty URL', async () => {
      const result = await woocommerceWebhookService.findIntegrationByStoreUrl('');
      expect(result).toBeNull();
      expect(PosIntegration.findOne).not.toHaveBeenCalled();
    });

    test('should return null for null URL', async () => {
      const result = await woocommerceWebhookService.findIntegrationByStoreUrl(null);
      expect(result).toBeNull();
      expect(PosIntegration.findOne).not.toHaveBeenCalled();
    });

    test('should return null for undefined URL', async () => {
      const result = await woocommerceWebhookService.findIntegrationByStoreUrl(undefined);
      expect(result).toBeNull();
      expect(PosIntegration.findOne).not.toHaveBeenCalled();
    });

    test('should find integration by exact URL match', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const result = await woocommerceWebhookService.findIntegrationByStoreUrl('https://example-store.com');

      expect(result).toEqual(mockIntegration);
      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'woocommerce',
          storeUrl: 'https://example-store.com',
          isActive: true,
        },
      });
    });

    test('should normalize URL to lowercase', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await woocommerceWebhookService.findIntegrationByStoreUrl('HTTPS://EXAMPLE-STORE.COM');

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'woocommerce',
          storeUrl: 'https://example-store.com',
          isActive: true,
        },
      });
    });

    test('should remove trailing slash from URL', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await woocommerceWebhookService.findIntegrationByStoreUrl('https://example-store.com/');

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'woocommerce',
          storeUrl: 'https://example-store.com',
          isActive: true,
        },
      });
    });

    test('should add https:// prefix if missing', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await woocommerceWebhookService.findIntegrationByStoreUrl('example-store.com');

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'woocommerce',
          storeUrl: 'https://example-store.com',
          isActive: true,
        },
      });
    });

    test('should try without www if exact match fails', async () => {
      PosIntegration.findOne
        .mockResolvedValueOnce(null) // First call: exact match fails
        .mockResolvedValueOnce(mockIntegration); // Second call: without www succeeds

      const result = await woocommerceWebhookService.findIntegrationByStoreUrl('https://www.example-store.com');

      expect(result).toEqual(mockIntegration);
      expect(PosIntegration.findOne).toHaveBeenCalledTimes(2);
      expect(PosIntegration.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          provider: 'woocommerce',
          storeUrl: 'https://example-store.com',
          isActive: true,
        },
      });
    });

    test('should try with www if other attempts fail', async () => {
      PosIntegration.findOne
        .mockResolvedValueOnce(null) // First call: exact match fails
        .mockResolvedValueOnce(null) // Second call: without www fails
        .mockResolvedValueOnce(mockIntegration); // Third call: with www succeeds

      const result = await woocommerceWebhookService.findIntegrationByStoreUrl('https://example-store.com');

      expect(result).toEqual(mockIntegration);
      expect(PosIntegration.findOne).toHaveBeenCalledTimes(3);
      expect(PosIntegration.findOne).toHaveBeenNthCalledWith(3, {
        where: {
          provider: 'woocommerce',
          storeUrl: 'https://www.example-store.com',
          isActive: true,
        },
      });
    });

    test('should return null if all attempts fail', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const result = await woocommerceWebhookService.findIntegrationByStoreUrl('https://unknown-store.com');

      expect(result).toBeNull();
      expect(PosIntegration.findOne).toHaveBeenCalledTimes(3);
    });

    test('should trim whitespace from URL', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await woocommerceWebhookService.findIntegrationByStoreUrl('  https://example-store.com  ');

      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'woocommerce',
          storeUrl: 'https://example-store.com',
          isActive: true,
        },
      });
    });

    test('should handle http:// URLs', async () => {
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      await woocommerceWebhookService.findIntegrationByStoreUrl('http://example-store.com');

      // Should keep http:// as-is (not convert to https)
      expect(PosIntegration.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'woocommerce',
          storeUrl: 'http://example-store.com',
          isActive: true,
        },
      });
    });
  });

  // ============================================
  // getSetupInstructions Tests
  // ============================================
  describe('getSetupInstructions', () => {
    const mockIntegration = {
      id: 1,
      userId: 100,
      webhookSecret: 'woo_secret_abc123',
    };

    beforeEach(() => {
      // Set APP_URL for consistent testing
      process.env.APP_URL = 'https://app.morestars.io';
    });

    test('should return correct webhook URL', () => {
      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      expect(instructions.webhookUrl).toBe('https://app.morestars.io/api/webhooks/woocommerce');
    });

    test('should include webhook secret from integration', () => {
      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      expect(instructions.webhookSecret).toBe('woo_secret_abc123');
    });

    test('should return correct topics', () => {
      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      expect(instructions.topics).toEqual(['order.created', 'order.completed']);
    });

    test('should return instructions array', () => {
      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      expect(Array.isArray(instructions.instructions)).toBe(true);
      expect(instructions.instructions.length).toBeGreaterThan(0);
    });

    test('should include webhook URL in instructions', () => {
      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      const hasWebhookUrlInstruction = instructions.instructions.some(
        i => i.includes('https://app.morestars.io/api/webhooks/woocommerce')
      );
      expect(hasWebhookUrlInstruction).toBe(true);
    });

    test('should include secret in instructions', () => {
      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      const hasSecretInstruction = instructions.instructions.some(
        i => i.includes('woo_secret_abc123')
      );
      expect(hasSecretInstruction).toBe(true);
    });

    test('should use default APP_URL if not set', () => {
      delete process.env.APP_URL;

      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      expect(instructions.webhookUrl).toBe('https://app.morestars.io/api/webhooks/woocommerce');
    });

    test('should use custom APP_URL when set', () => {
      process.env.APP_URL = 'https://custom.domain.com';

      const instructions = woocommerceWebhookService.getSetupInstructions(mockIntegration);

      expect(instructions.webhookUrl).toBe('https://custom.domain.com/api/webhooks/woocommerce');
    });
  });
});
