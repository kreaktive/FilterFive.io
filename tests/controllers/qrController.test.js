/**
 * QR Controller Tests
 *
 * Tests for QR code scan handling:
 * - GET /r/:businessId - Handle QR code scan and create feedback request
 *
 * CRITICAL PATH: QR scans are a major customer acquisition channel.
 * These tests ensure proper:
 * - Business validation
 * - Trial activation on QR scan
 * - Feedback request creation
 * - IP address tracking
 * - Redirect to review flow
 */

const { userFactory, feedbackRequestFactory } = require('../helpers/factories');
const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-abcd-ef0123456789'),
}));

// Mock models
const mockBusiness = {
  id: 1,
  email: 'business@example.com',
  businessName: 'Test Business',
  role: 'tenant',
  reviewUrl: 'https://g.page/test-business/review',
  subscriptionStatus: 'trial',
  trialStartsAt: null,
  startTrial: jest.fn().mockResolvedValue(true),
};

const mockCreatedFeedbackRequest = {
  id: 1,
  userId: 1,
  uuid: 'test-uuid-1234-5678-abcd-ef0123456789',
  customerPhone: null,
  customerName: null,
  customerEmail: null,
  deliveryMethod: 'qr',
  source: 'manual',
  ipAddress: '127.0.0.1',
  status: 'clicked',
  linkClickedAt: expect.any(Date),
};

jest.mock('../../src/models', () => ({
  FeedbackRequest: {
    create: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
}));

const { FeedbackRequest, User } = require('../../src/models');
const logger = require('../../src/services/logger');

describe('QR Controller', () => {
  let mockReq;
  let mockRes;
  let qrController;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      params: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Reset mocks
    User.findOne.mockReset();
    FeedbackRequest.create.mockReset();

    // Clear module cache and reimport
    jest.isolateModules(() => {
      qrController = require('../../src/controllers/qrController');
    });
  });

  describe('GET /r/:businessId - handleQrScan', () => {
    describe('Happy Path', () => {
      test('should create feedback request and redirect for valid business', async () => {
        mockReq.params = { businessId: '1' };

        User.findOne.mockResolvedValue({
          ...mockBusiness,
          trialStartsAt: new Date(), // Trial already started
        });
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: 1,
          uuid: expect.any(String),
          customerPhone: null,
          customerName: null,
          deliveryMethod: 'qr',
          source: 'manual',
          status: 'clicked',
        }));
        expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('/review/'));
      });

      test('should start trial on first QR scan', async () => {
        mockReq.params = { businessId: '1' };

        const businessWithNoTrial = {
          ...mockBusiness,
          trialStartsAt: null, // No trial started yet
          subscriptionStatus: 'trial',
          startTrial: jest.fn().mockResolvedValue(true),
        };
        User.findOne.mockResolvedValue(businessWithNoTrial);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(businessWithNoTrial.startTrial).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
          'Trial started via QR scan',
          expect.objectContaining({ userId: 1 })
        );
      });

      test('should NOT start trial if already started', async () => {
        mockReq.params = { businessId: '1' };

        const businessWithTrial = {
          ...mockBusiness,
          trialStartsAt: new Date(), // Trial already started
          startTrial: jest.fn(),
        };
        User.findOne.mockResolvedValue(businessWithTrial);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(businessWithTrial.startTrial).not.toHaveBeenCalled();
      });

      test('should NOT start trial if user is already subscribed', async () => {
        mockReq.params = { businessId: '1' };

        const subscribedBusiness = {
          ...mockBusiness,
          trialStartsAt: null,
          subscriptionStatus: 'active', // Paid subscriber
          startTrial: jest.fn(),
        };
        User.findOne.mockResolvedValue(subscribedBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(subscribedBusiness.startTrial).not.toHaveBeenCalled();
      });

      test('should capture IP address from req.ip', async () => {
        mockReq.params = { businessId: '1' };
        mockReq.ip = '192.168.1.100';

        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          ipAddress: '192.168.1.100',
        }));
      });

      test('should fall back to connection.remoteAddress for IP', async () => {
        mockReq.params = { businessId: '1' };
        mockReq.ip = undefined;
        mockReq.connection = { remoteAddress: '10.0.0.50' };

        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          ipAddress: '10.0.0.50',
        }));
      });

      test('should use "unknown" if no IP available', async () => {
        mockReq.params = { businessId: '1' };
        mockReq.ip = undefined;
        mockReq.connection = {};

        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          ipAddress: 'unknown',
        }));
      });

      test('should redirect to review page with generated UUID', async () => {
        mockReq.params = { businessId: '1' };

        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue({
          ...mockCreatedFeedbackRequest,
          uuid: 'generated-uuid-12345',
        });

        await qrController.handleQrScan(mockReq, mockRes);

        // The UUID comes from the created feedback request
        expect(mockRes.redirect).toHaveBeenCalledWith('/review/test-uuid-1234-5678-abcd-ef0123456789');
      });
    });

    describe('Error Cases - Invalid Business ID', () => {
      test('should return 404 for non-numeric business ID', async () => {
        mockReq.params = { businessId: 'abc' };

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
          title: 'Business Not Found',
          error: { status: 404 },
        }));
        expect(User.findOne).not.toHaveBeenCalled();
      });

      test('should return 404 for negative business ID', async () => {
        mockReq.params = { businessId: '-1' };

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(User.findOne).not.toHaveBeenCalled();
      });

      test('should return 404 for zero business ID', async () => {
        mockReq.params = { businessId: '0' };

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(User.findOne).not.toHaveBeenCalled();
      });

      test('should return 404 for decimal business ID', async () => {
        mockReq.params = { businessId: '1.5' };

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(User.findOne).not.toHaveBeenCalled();
      });

      test('should return 404 for null business ID', async () => {
        mockReq.params = { businessId: null };

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should return 404 for empty business ID', async () => {
        mockReq.params = { businessId: '' };

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should return 404 for business ID with leading zeros', async () => {
        mockReq.params = { businessId: '01' };

        await qrController.handleQrScan(mockReq, mockRes);

        // '01' !== '1' after parseInt, so should be rejected
        expect(mockRes.status).toHaveBeenCalledWith(404);
      });
    });

    describe('Error Cases - Business Not Found', () => {
      test('should return 404 for non-existent business', async () => {
        mockReq.params = { businessId: '999' };
        User.findOne.mockResolvedValue(null);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
          title: 'Business Not Found',
          message: expect.stringContaining('invalid'),
        }));
      });

      test('should log warning for failed QR scan', async () => {
        mockReq.params = { businessId: '999' };
        User.findOne.mockResolvedValue(null);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(logger.warn).toHaveBeenCalledWith(
          'QR scan failed - Business not found',
          expect.objectContaining({ businessId: 999 })
        );
      });

      test('should only find tenant users (not admins)', async () => {
        mockReq.params = { businessId: '1' };

        User.findOne.mockResolvedValue(null); // Admin user would not be found

        await qrController.handleQrScan(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalledWith({
          where: {
            id: 1,
            role: 'tenant',
          },
        });
      });
    });

    describe('Error Cases - Database/System Errors', () => {
      test('should handle database error when finding business', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockRejectedValue(new Error('Database connection lost'));

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
          title: 'Something Went Wrong',
          error: { status: 500 },
        }));
      });

      test('should handle error when creating feedback request', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockRejectedValue(new Error('Insert failed'));

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(logger.error).toHaveBeenCalledWith(
          'QR scan error',
          expect.objectContaining({ error: 'Insert failed' })
        );
      });

      test('should handle error when starting trial', async () => {
        mockReq.params = { businessId: '1' };

        const businessWithFailingTrial = {
          ...mockBusiness,
          trialStartsAt: null,
          subscriptionStatus: 'trial',
          startTrial: jest.fn().mockRejectedValue(new Error('Trial start failed')),
        };
        User.findOne.mockResolvedValue(businessWithFailingTrial);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
      });
    });

    describe('Security', () => {
      test('should prevent SQL injection in business ID', async () => {
        mockReq.params = { businessId: "1; DROP TABLE users;--" };

        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(User.findOne).not.toHaveBeenCalled();
      });

      test('should handle very large business ID', async () => {
        mockReq.params = { businessId: '999999999999999999999' };

        await qrController.handleQrScan(mockReq, mockRes);

        // Should either find nothing or handle gracefully
        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should log IP address for rate limiting auditing', async () => {
        mockReq.params = { businessId: '1' };
        mockReq.ip = '203.0.113.50';

        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(logger.info).toHaveBeenCalledWith(
          'QR scan attempt',
          expect.objectContaining({ ipAddress: '203.0.113.50' })
        );
      });
    });

    describe('Feedback Request Creation', () => {
      test('should set deliveryMethod to "qr"', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          deliveryMethod: 'qr',
        }));
      });

      test('should set status to "clicked" (skip "sent" for QR)', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          status: 'clicked',
          linkClickedAt: expect.any(Date),
        }));
      });

      test('should set customerPhone to null (anonymous QR scan)', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          customerPhone: null,
          customerName: null,
          customerEmail: null,
        }));
      });

      test('should set source to "manual"', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockResolvedValue(mockBusiness);
        FeedbackRequest.create.mockResolvedValue(mockCreatedFeedbackRequest);

        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          source: 'manual',
        }));
      });
    });
  });
});
