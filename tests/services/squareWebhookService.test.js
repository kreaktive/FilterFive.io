/**
 * Square Webhook Service Tests
 *
 * Tests for Square webhook handling:
 * - Signature verification
 * - Event idempotency
 * - Payment event processing
 * - Order event processing
 * - Refund handling
 * - OAuth revocation
 */

const crypto = require('crypto');
const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/models/PosIntegration', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../src/models/PosLocation', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../src/models/PosWebhookEvent', () => ({
  isProcessed: jest.fn(),
  markProcessed: jest.fn(),
}));

jest.mock('../../src/models/PosTransaction', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../src/services/squareOAuthService', () => ({
  refreshToken: jest.fn(),
  fetchCustomer: jest.fn(),
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

// Set env vars before importing service
process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = 'test_webhook_key_12345';
process.env.APP_URL = 'https://morestars.io';

const PosIntegration = require('../../src/models/PosIntegration');
const PosLocation = require('../../src/models/PosLocation');
const PosWebhookEvent = require('../../src/models/PosWebhookEvent');
const PosTransaction = require('../../src/models/PosTransaction');
const squareOAuthService = require('../../src/services/squareOAuthService');
const posSmsService = require('../../src/services/posSmsService');
const logger = require('../../src/services/logger');
const squareWebhookService = require('../../src/services/squareWebhookService');

describe('Square Webhook Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  // ===========================================
  // verifySignature Tests
  // ===========================================
  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const rawBody = Buffer.from('{"event_id":"123"}');
      const notificationUrl = 'https://morestars.io/api/webhooks/square';
      const payload = notificationUrl + rawBody.toString();
      const expectedSignature = crypto
        .createHmac('sha256', 'test_webhook_key_12345')
        .update(payload)
        .digest('base64');

      const result = squareWebhookService.verifySignature(rawBody, expectedSignature);

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const rawBody = Buffer.from('{"event_id":"123"}');

      const result = squareWebhookService.verifySignature(rawBody, 'invalid_signature');

      expect(result).toBe(false);
    });

    it('should reject missing signature', () => {
      const rawBody = Buffer.from('{"event_id":"123"}');

      const result = squareWebhookService.verifySignature(rawBody, null);

      expect(result).toBe(false);
    });

    it('should reject when signature key not configured', () => {
      // Temporarily remove key
      const originalKey = squareWebhookService.signatureKey;
      squareWebhookService.signatureKey = null;

      const rawBody = Buffer.from('test');
      const result = squareWebhookService.verifySignature(rawBody, 'any_signature');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'SECURITY: SQUARE_WEBHOOK_SIGNATURE_KEY not configured - rejecting webhook'
      );

      // Restore
      squareWebhookService.signatureKey = originalKey;
    });

    it('should handle signature length mismatch', () => {
      const rawBody = Buffer.from('test');

      const result = squareWebhookService.verifySignature(rawBody, 'short');

      expect(result).toBe(false);
    });
  });

  // ===========================================
  // processEvent Tests
  // ===========================================
  describe('processEvent', () => {
    it('should skip duplicate events', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(true);

      const event = {
        event_id: 'evt_123',
        type: 'payment.created',
        merchant_id: 'merch_1',
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'duplicate' });
      expect(PosWebhookEvent.markProcessed).not.toHaveBeenCalled();
    });

    it('should mark event as processed after handling', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
      PosIntegration.findOne.mockResolvedValue(null);

      const event = {
        event_id: 'evt_456',
        type: 'payment.created',
        merchant_id: 'merch_1',
        data: {
          object: {
            payment: { status: 'COMPLETED', location_id: 'loc1' },
          },
        },
      };

      await squareWebhookService.processEvent(event);

      expect(PosWebhookEvent.markProcessed).toHaveBeenCalledWith('square', 'evt_456', 'payment.created');
    });

    it('should handle unhandled event types', async () => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);

      const event = {
        event_id: 'evt_789',
        type: 'unknown.event.type',
        merchant_id: 'merch_1',
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'unhandled_event_type' });
      expect(logger.info).toHaveBeenCalledWith('Unhandled Square event type', { eventType: 'unknown.event.type' });
    });
  });

  // ===========================================
  // handlePaymentEvent Tests
  // ===========================================
  describe('handlePaymentEvent', () => {
    const createPaymentEvent = (overrides = {}) => ({
      event_id: 'evt_pay_1',
      type: 'payment.created',
      merchant_id: 'merch_1',
      data: {
        object: {
          payment: {
            id: 'pay_123',
            status: 'COMPLETED',
            location_id: 'loc_1',
            customer_id: 'cust_1',
            total_money: { amount: 5000, currency: 'USD' },
            ...overrides,
          },
        },
      },
    });

    beforeEach(() => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
    });

    it('should skip payment without data', async () => {
      const event = {
        event_id: 'evt_1',
        type: 'payment.created',
        merchant_id: 'merch_1',
        data: { object: {} },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_payment_data' });
    });

    it('should skip non-completed payments', async () => {
      const event = createPaymentEvent({ status: 'PENDING' });

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'payment_not_completed', status: 'PENDING' });
    });

    it('should skip when no integration found', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const event = createPaymentEvent();
      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_integration' });
      expect(logger.info).toHaveBeenCalledWith('No active Square integration found', { merchantId: 'merch_1' });
    });

    it('should skip when location is disabled', async () => {
      PosIntegration.findOne.mockResolvedValue({ id: 1, userId: 10 });
      PosLocation.findOne.mockResolvedValue(null);

      const event = createPaymentEvent();
      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'location_disabled' });
    });

    it('should skip and log when no customer ID', async () => {
      const mockIntegration = { id: 1, userId: 10 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({ locationName: 'Main Store' });

      const event = createPaymentEvent({ customer_id: null });
      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_customer_id' });
      expect(posSmsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          smsStatus: 'skipped_no_phone',
          skipReason: 'No customer ID in payment',
        })
      );
    });

    it('should skip when no access token', async () => {
      const mockIntegration = {
        id: 1,
        userId: 10,
        getAccessToken: jest.fn().mockReturnValue(null),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({ locationName: 'Store' });

      const event = createPaymentEvent();
      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_access_token' });
    });

    it('should refresh token if expired', async () => {
      const mockIntegration = {
        id: 1,
        userId: 10,
        getAccessToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({ locationName: 'Store' });
      squareOAuthService.refreshToken.mockResolvedValue(true);
      squareOAuthService.fetchCustomer.mockResolvedValue(null);

      const event = createPaymentEvent();
      await squareWebhookService.processEvent(event);

      expect(squareOAuthService.refreshToken).toHaveBeenCalledWith(mockIntegration);
    });

    it('should skip when token refresh fails', async () => {
      const mockIntegration = {
        id: 1,
        userId: 10,
        getAccessToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({ locationName: 'Store' });
      squareOAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      const event = createPaymentEvent();
      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'token_refresh_failed' });
      expect(logger.error).toHaveBeenCalledWith('Failed to refresh Square token', { error: 'Refresh failed' });
    });

    it('should skip and log when customer has no phone', async () => {
      const mockIntegration = {
        id: 1,
        userId: 10,
        getAccessToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({ locationName: 'Store' });
      squareOAuthService.fetchCustomer.mockResolvedValue({
        givenName: 'John',
        familyName: 'Doe',
        phoneNumber: null,
      });

      const event = createPaymentEvent();
      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_phone_number' });
      expect(posSmsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John Doe',
          smsStatus: 'skipped_no_phone',
          skipReason: 'Customer has no phone number',
        })
      );
    });

    it('should process transaction when all conditions met', async () => {
      const mockIntegration = {
        id: 1,
        userId: 10,
        getAccessToken: jest.fn().mockReturnValue('token'),
        isTokenExpired: jest.fn().mockReturnValue(false),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({ locationName: 'Main Store' });
      squareOAuthService.fetchCustomer.mockResolvedValue({
        givenName: 'Jane',
        familyName: 'Smith',
        phoneNumber: '+15551234567',
      });
      posSmsService.processTransaction.mockResolvedValue({ success: true });

      const event = createPaymentEvent();
      const result = await squareWebhookService.processEvent(event);

      expect(posSmsService.processTransaction).toHaveBeenCalledWith({
        integration: mockIntegration,
        externalTransactionId: 'pay_123',
        customerName: 'Jane Smith',
        customerPhone: '+15551234567',
        purchaseAmount: 50, // 5000 cents = $50
        locationName: 'Main Store',
      });
      expect(result).toEqual({ success: true });
    });
  });

  // ===========================================
  // handleRefundEvent Tests
  // ===========================================
  describe('handleRefundEvent', () => {
    beforeEach(() => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
    });

    it('should skip refund without data', async () => {
      const event = {
        event_id: 'evt_1',
        type: 'refund.created',
        merchant_id: 'merch_1',
        data: { object: {} },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_refund_data' });
    });

    it('should skip incomplete refunds', async () => {
      const event = {
        event_id: 'evt_1',
        type: 'refund.created',
        merchant_id: 'merch_1',
        data: {
          object: {
            refund: { status: 'PENDING', payment_id: 'pay_1' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'refund_not_completed', status: 'PENDING' });
    });

    it('should cancel pending SMS for refunded transaction', async () => {
      const mockTransaction = {
        id: 5,
        smsStatus: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      PosTransaction.findOne.mockResolvedValue(mockTransaction);

      const event = {
        event_id: 'evt_ref_1',
        type: 'refund.created',
        merchant_id: 'merch_1',
        data: {
          object: {
            refund: { status: 'COMPLETED', payment_id: 'pay_1' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(mockTransaction.smsStatus).toBe('skipped_refunded');
      expect(mockTransaction.skipReason).toBe('Order was refunded');
      expect(mockTransaction.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Cancelled pending SMS for refunded transaction',
        { transactionId: 5 }
      );
      expect(result).toEqual({ processed: true, action: 'transaction_marked_refunded' });
    });

    it('should log refund when no matching transaction', async () => {
      PosTransaction.findOne.mockResolvedValue(null);

      const event = {
        event_id: 'evt_ref_2',
        type: 'refund.created',
        merchant_id: 'merch_1',
        data: {
          object: {
            refund: { status: 'APPROVED', payment_id: 'pay_unknown' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(logger.info).toHaveBeenCalledWith('Refund processed', { paymentId: 'pay_unknown' });
      expect(result).toEqual({ processed: true, action: 'refund_logged' });
    });
  });

  // ===========================================
  // handleOAuthRevoked Tests
  // ===========================================
  describe('handleOAuthRevoked', () => {
    beforeEach(() => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
    });

    it('should deactivate integration when OAuth revoked', async () => {
      const mockIntegration = {
        id: 1,
        isActive: true,
        accessTokenEncrypted: 'enc',
        refreshTokenEncrypted: 'enc',
        save: jest.fn().mockResolvedValue(true),
      };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);

      const event = {
        event_id: 'evt_oauth_1',
        type: 'oauth.authorization.revoked',
        merchant_id: 'merch_1',
      };

      const result = await squareWebhookService.processEvent(event);

      expect(mockIntegration.isActive).toBe(false);
      expect(mockIntegration.accessTokenEncrypted).toBeNull();
      expect(mockIntegration.refreshTokenEncrypted).toBeNull();
      expect(mockIntegration.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Square OAuth revoked', { merchantId: 'merch_1' });
      expect(result).toEqual({ processed: true, action: 'oauth_revoked' });
    });

    it('should handle revocation when no integration found', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const event = {
        event_id: 'evt_oauth_2',
        type: 'oauth.authorization.revoked',
        merchant_id: 'unknown_merch',
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ processed: true, action: 'oauth_revoked' });
    });
  });

  // ===========================================
  // handleCustomerEvent Tests
  // ===========================================
  describe('handleCustomerEvent', () => {
    beforeEach(() => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
    });

    it('should log customer events', async () => {
      const event = {
        event_id: 'evt_cust_1',
        type: 'customer.created',
        merchant_id: 'merch_1',
        data: {
          object: {
            customer: { id: 'cust_123' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(logger.info).toHaveBeenCalledWith('Square customer event', {
        eventType: 'customer.created',
        customerId: 'cust_123',
      });
      expect(result).toEqual({ processed: true, action: 'customer_event_logged' });
    });

    it('should skip customer event without data', async () => {
      const event = {
        event_id: 'evt_cust_2',
        type: 'customer.updated',
        merchant_id: 'merch_1',
        data: { object: {} },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_customer_data' });
    });
  });

  // ===========================================
  // handleLocationEvent Tests
  // ===========================================
  describe('handleLocationEvent', () => {
    beforeEach(() => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
    });

    it('should update existing location', async () => {
      const mockIntegration = { id: 1 };
      const mockLocation = {
        locationName: 'Old Name',
        save: jest.fn().mockResolvedValue(true),
      };

      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue(mockLocation);

      const event = {
        event_id: 'evt_loc_1',
        type: 'location.updated',
        merchant_id: 'merch_1',
        data: {
          object: {
            location: { id: 'loc_1', name: 'New Name' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(mockLocation.locationName).toBe('New Name');
      expect(mockLocation.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Updated Square location', { locationName: 'New Name' });
      expect(result).toEqual({ processed: true, action: 'location_synced', locationId: undefined });
    });

    it('should skip location event when no integration', async () => {
      PosIntegration.findOne.mockResolvedValue(null);

      const event = {
        event_id: 'evt_loc_2',
        type: 'location.created',
        merchant_id: 'unknown_merch',
        data: {
          object: {
            location: { id: 'loc_1', name: 'New Location' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_integration' });
    });
  });

  // ===========================================
  // handleLoyaltyEvent Tests
  // ===========================================
  describe('handleLoyaltyEvent', () => {
    beforeEach(() => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
    });

    it('should log loyalty events', async () => {
      const event = {
        event_id: 'evt_loy_1',
        type: 'loyalty.account.created',
        merchant_id: 'merch_1',
        data: {
          object: {
            loyalty_account: { id: 'loy_123', customer_id: 'cust_456' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(logger.info).toHaveBeenCalledWith('Square loyalty event', {
        eventType: 'loyalty.account.created',
        accountId: 'loy_123',
        customerId: 'cust_456',
      });
      expect(result).toEqual({ processed: true, action: 'loyalty_event_logged' });
    });

    it('should skip loyalty event without data', async () => {
      const event = {
        event_id: 'evt_loy_2',
        type: 'loyalty.account.updated',
        merchant_id: 'merch_1',
        data: { object: {} },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_loyalty_data' });
    });
  });

  // ===========================================
  // handleOrderEvent Tests
  // ===========================================
  describe('handleOrderEvent', () => {
    beforeEach(() => {
      PosWebhookEvent.isProcessed.mockResolvedValue(false);
    });

    it('should skip order event without data', async () => {
      const event = {
        event_id: 'evt_ord_1',
        type: 'order.created',
        merchant_id: 'merch_1',
        data: { object: {} },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'no_order_data' });
    });

    it('should skip non-completed orders', async () => {
      const event = {
        event_id: 'evt_ord_2',
        type: 'order.updated',
        merchant_id: 'merch_1',
        data: {
          object: {
            order: { id: 'ord_1', state: 'OPEN', location_id: 'loc_1' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'order_not_completed', state: 'OPEN' });
    });

    it('should skip already processed orders', async () => {
      const mockIntegration = { id: 1, userId: 10 };
      PosIntegration.findOne.mockResolvedValue(mockIntegration);
      PosLocation.findOne.mockResolvedValue({ locationName: 'Store' });
      PosTransaction.findOne.mockResolvedValue({ id: 5 }); // Already exists

      const event = {
        event_id: 'evt_ord_3',
        type: 'order.created',
        merchant_id: 'merch_1',
        data: {
          object: {
            order: { id: 'ord_1', state: 'COMPLETED', location_id: 'loc_1', customer_id: 'cust_1' },
          },
        },
      };

      const result = await squareWebhookService.processEvent(event);

      expect(result).toEqual({ skipped: true, reason: 'already_processed' });
    });
  });
});
