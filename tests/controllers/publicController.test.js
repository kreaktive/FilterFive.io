/**
 * Public Controller Tests
 *
 * Tests for public-facing endpoints:
 * - Review landing pages (reviewController)
 * - QR code scan handling (qrController)
 * - Customer data ingest API (ingestController)
 *
 * These endpoints are accessed by customers, not authenticated users.
 */

const { faker } = require('@faker-js/faker');
const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  sms: jest.fn(),
}));

jest.mock('../../src/services/smsService', () => ({
  sendReviewRequest: jest.fn(),
}));

jest.mock('../../src/services/analyticsService', () => ({
  invalidateCache: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/shortUrlService', () => ({
  createFeedbackRequestWithShortUrl: jest.fn(),
}));

jest.mock('../../src/utils/shortCode', () => ({
  isValidShortCode: jest.fn(),
}));

jest.mock('validator', () => ({
  isUUID: jest.fn(),
}));

// Mock models
const mockFeedbackRequest = {
  id: 1,
  uuid: 'test-uuid-1234-5678-9012-abcdefabcdef',
  shortCode: 'abc123',
  userId: 1,
  customerPhone: '+12125551234',
  customerName: 'John Doe',
  status: 'sent',
  update: jest.fn().mockResolvedValue(true),
  user: {
    id: 1,
    businessName: 'Test Business',
    reviewUrl: 'https://g.page/test-business/review',
    smsMessageTone: 'friendly',
    customSmsMessage: null,
  },
};

const mockTenant = {
  id: 1,
  businessName: 'Test Business',
  reviewUrl: 'https://g.page/test-business/review',
  email: 'test@example.com',
  role: 'tenant',
  isActive: true,
  subscriptionStatus: 'trial',
  trialStartsAt: null,
  startTrial: jest.fn().mockResolvedValue(true),
};

jest.mock('../../src/models', () => ({
  FeedbackRequest: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  Review: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const { FeedbackRequest, User, Review } = require('../../src/models');
const smsService = require('../../src/services/smsService');
const shortUrlService = require('../../src/services/shortUrlService');
const { isValidShortCode } = require('../../src/utils/shortCode');
const validator = require('validator');
const logger = require('../../src/services/logger');

describe('Public Controllers', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  // ===========================================
  // Review Controller Tests
  // ===========================================
  describe('Review Controller', () => {
    describe('GET /review/:uuid (showReviewLanding)', () => {
      it('should redirect to review URL on valid feedback request', async () => {
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue({
          ...mockFeedbackRequest,
          status: 'sent',
        });

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(FeedbackRequest.findOne).toHaveBeenCalledWith({
          where: { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' },
          include: expect.any(Array),
        });
        expect(mockRes.redirect).toHaveBeenCalledWith('https://g.page/test-business/review');
      });

      it('should update status to clicked on first click', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue({
          ...mockFeedbackRequest,
          status: 'sent',
          update: updateMock,
        });

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(updateMock).toHaveBeenCalledWith({
          status: 'clicked',
          linkClickedAt: expect.any(Date),
        });
      });

      it('should NOT update status if already clicked', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue({
          ...mockFeedbackRequest,
          status: 'clicked', // Already clicked
          update: updateMock,
        });

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(updateMock).not.toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalled();
      });

      it('should return 404 for invalid UUID format', async () => {
        mockReq.params = { uuid: 'invalid-uuid' };
        validator.isUUID.mockReturnValue(false);

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          message: expect.stringContaining('invalid'),
        }));
      });

      it('should return 404 for non-existent feedback request', async () => {
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue(null);

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          message: expect.stringContaining('invalid'),
        }));
      });

      it('should handle missing review URL configuration', async () => {
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue({
          ...mockFeedbackRequest,
          user: {
            ...mockFeedbackRequest.user,
            reviewUrl: '', // Empty review URL
          },
        });

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          title: 'Configuration Error',
          message: expect.stringContaining('not configured'),
        }));
      });

      it('should return 500 on database error', async () => {
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockRejectedValue(new Error('Database error'));

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith('Something went wrong');
        expect(logger.error).toHaveBeenCalled();
      });
    });

    describe('GET /r/:shortCode (showReviewByShortCode)', () => {
      it('should redirect to review URL on valid short code', async () => {
        mockReq.params = { shortCode: 'abc123' };
        isValidShortCode.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue(mockFeedbackRequest);

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(FeedbackRequest.findOne).toHaveBeenCalledWith({
          where: { shortCode: 'abc123' },
          include: expect.any(Array),
        });
        expect(mockRes.redirect).toHaveBeenCalledWith('https://g.page/test-business/review');
      });

      it('should return 404 for invalid short code format', async () => {
        mockReq.params = { shortCode: 'invalid!' };
        isValidShortCode.mockReturnValue(false);

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          message: expect.stringContaining('invalid'),
        }));
      });

      it('should return 404 for non-existent short code', async () => {
        mockReq.params = { shortCode: 'xyz999' };
        isValidShortCode.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue(null);

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      it('should update status to clicked on first click', async () => {
        const updateMock = jest.fn().mockResolvedValue(true);
        mockReq.params = { shortCode: 'abc123' };
        isValidShortCode.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue({
          ...mockFeedbackRequest,
          status: 'sent',
          update: updateMock,
        });

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(updateMock).toHaveBeenCalledWith({
          status: 'clicked',
          linkClickedAt: expect.any(Date),
        });
      });
    });

    describe('GET /review/:uuid/thank-you (showThankYou)', () => {
      it('should render thank you page with business name', async () => {
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue(mockFeedbackRequest);

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showThankYou(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          businessName: 'Test Business',
          title: 'Thank You',
        }));
      });

      it('should render generic thank you for invalid UUID', async () => {
        mockReq.params = { uuid: 'invalid' };
        validator.isUUID.mockReturnValue(false);

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showThankYou(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          businessName: 'Business',
          title: 'Thank You',
        }));
      });

      it('should render generic thank you on database error', async () => {
        mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
        validator.isUUID.mockReturnValue(true);
        FeedbackRequest.findOne.mockRejectedValue(new Error('Database error'));

        const reviewController = require('../../src/controllers/reviewController');
        await reviewController.showThankYou(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          businessName: 'Business',
        }));
      });
    });
  });

  // ===========================================
  // QR Controller Tests
  // ===========================================
  describe('QR Controller', () => {
    describe('GET /r/:businessId (handleQrScan)', () => {
      it('should create feedback request and redirect for valid business', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockResolvedValue(mockTenant);
        FeedbackRequest.create.mockResolvedValue({
          uuid: 'new-uuid-1234',
          userId: 1,
        });

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalledWith({
          where: { id: 1, role: 'tenant' },
        });
        expect(FeedbackRequest.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: 1,
          deliveryMethod: 'qr',
          customerPhone: null,
          status: 'clicked',
        }));
        expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('/review/'));
      });

      it('should start trial on first QR scan if not started', async () => {
        mockReq.params = { businessId: '1' };
        const tenantWithoutTrial = {
          ...mockTenant,
          trialStartsAt: null,
          subscriptionStatus: 'trial',
        };
        User.findOne.mockResolvedValue(tenantWithoutTrial);
        FeedbackRequest.create.mockResolvedValue({ uuid: 'new-uuid-1234' });

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(tenantWithoutTrial.startTrial).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
          'Trial started via QR scan',
          expect.any(Object)
        );
      });

      it('should NOT start trial if already started', async () => {
        mockReq.params = { businessId: '1' };
        const tenantWithTrial = {
          ...mockTenant,
          trialStartsAt: new Date(),
          subscriptionStatus: 'trial',
          startTrial: jest.fn(),
        };
        User.findOne.mockResolvedValue(tenantWithTrial);
        FeedbackRequest.create.mockResolvedValue({ uuid: 'new-uuid-1234' });

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(tenantWithTrial.startTrial).not.toHaveBeenCalled();
      });

      it('should return 404 for invalid businessId format', async () => {
        mockReq.params = { businessId: 'abc' }; // Non-numeric

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
          title: 'Business Not Found',
        }));
      });

      it('should return 404 for negative businessId', async () => {
        mockReq.params = { businessId: '-1' };

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      it('should return 404 for decimal businessId', async () => {
        mockReq.params = { businessId: '1.5' };

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      it('should return 404 for non-existent business', async () => {
        mockReq.params = { businessId: '999' };
        User.findOne.mockResolvedValue(null);

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
          message: expect.stringContaining('invalid'),
        }));
      });

      it('should capture IP address from request', async () => {
        mockReq.params = { businessId: '1' };
        mockReq.ip = '192.168.1.100';
        User.findOne.mockResolvedValue(mockTenant);
        FeedbackRequest.create.mockResolvedValue({ uuid: 'new-uuid-1234' });

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(FeedbackRequest.create).toHaveBeenCalledWith(
          expect.objectContaining({
            ipAddress: '192.168.1.100',
          })
        );
      });

      it('should return 500 on database error', async () => {
        mockReq.params = { businessId: '1' };
        User.findOne.mockRejectedValue(new Error('Database error'));

        const qrController = require('../../src/controllers/qrController');
        await qrController.handleQrScan(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
          title: 'Something Went Wrong',
        }));
      });
    });
  });

  // ===========================================
  // Ingest Controller Tests
  // ===========================================
  describe('Ingest Controller', () => {
    describe('POST /api/v1/hooks/customer (receiveCustomerData)', () => {
      it('should create feedback request and send SMS successfully', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          tenantId: 1,
        };
        User.findOne.mockResolvedValue(mockTenant);

        const newFeedbackRequest = {
          uuid: 'new-uuid-1234',
          shortCode: 'abc123',
          update: jest.fn().mockResolvedValue(true),
        };
        shortUrlService.createFeedbackRequestWithShortUrl.mockResolvedValue({
          feedbackRequest: newFeedbackRequest,
          reviewLink: 'https://morestars.io/r/abc123',
        });
        smsService.sendReviewRequest.mockResolvedValue({
          messageSid: 'SM123456',
          status: 'queued',
        });

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalledWith({
          where: { id: 1, role: 'tenant', isActive: true },
        });
        expect(shortUrlService.createFeedbackRequestWithShortUrl).toHaveBeenCalled();
        expect(smsService.sendReviewRequest).toHaveBeenCalledWith(
          '+12125551234',
          'John Doe',
          'Test Business',
          'https://morestars.io/r/abc123',
          'friendly',
          undefined // customSmsMessage is undefined when not set
        );
        expect(newFeedbackRequest.update).toHaveBeenCalledWith({
          status: 'sent',
          smsSentAt: expect.any(Date),
          twilioMessageSid: 'SM123456',
        });
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          uuid: 'new-uuid-1234',
        }));
      });

      it('should use "there" as fallback name if not provided', async () => {
        mockReq.body = {
          phone: '+12125551234',
          tenantId: 1,
          // name is missing
        };
        User.findOne.mockResolvedValue(mockTenant);

        const newFeedbackRequest = {
          uuid: 'new-uuid-1234',
          update: jest.fn().mockResolvedValue(true),
        };
        shortUrlService.createFeedbackRequestWithShortUrl.mockResolvedValue({
          feedbackRequest: newFeedbackRequest,
          reviewLink: 'https://morestars.io/r/abc123',
        });
        smsService.sendReviewRequest.mockResolvedValue({ messageSid: 'SM123' });

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(smsService.sendReviewRequest).toHaveBeenCalledWith(
          '+12125551234',
          'there', // Fallback name
          expect.any(String),
          expect.any(String),
          expect.any(String),
          undefined // customSmsMessage is undefined when not set
        );
      });

      it('should return 400 if phone is missing', async () => {
        mockReq.body = {
          name: 'John Doe',
          tenantId: 1,
          // phone is missing
        };

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('Phone'),
        }));
      });

      it('should return 400 if tenantId is missing', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          // tenantId is missing
        };

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('Tenant'),
        }));
      });

      it('should return 404 for non-existent tenant', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          tenantId: 999,
        };
        User.findOne.mockResolvedValue(null);

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.stringContaining('not found'),
        }));
      });

      it('should return 404 for inactive tenant', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          tenantId: 1,
        };
        User.findOne.mockResolvedValue(null); // Query includes isActive: true

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      it('should return 503 when circuit breaker is open', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          tenantId: 1,
        };
        User.findOne.mockResolvedValue(mockTenant);

        const newFeedbackRequest = {
          uuid: 'new-uuid-1234',
          update: jest.fn().mockResolvedValue(true),
        };
        shortUrlService.createFeedbackRequestWithShortUrl.mockResolvedValue({
          feedbackRequest: newFeedbackRequest,
          reviewLink: 'https://morestars.io/r/abc123',
        });

        const circuitError = new Error('SMS service unavailable');
        circuitError.code = 'CIRCUIT_OPEN';
        smsService.sendReviewRequest.mockRejectedValue(circuitError);

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(503);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          uuid: 'new-uuid-1234',
          retryable: true,
        }));
        expect(newFeedbackRequest.update).toHaveBeenCalledWith({
          status: 'sms_failed',
          skipReason: 'SMS service unavailable',
        });
      });

      it('should return 207 partial success when SMS fails (non-circuit error)', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          tenantId: 1,
        };
        User.findOne.mockResolvedValue(mockTenant);

        const newFeedbackRequest = {
          uuid: 'new-uuid-1234',
          update: jest.fn().mockResolvedValue(true),
        };
        shortUrlService.createFeedbackRequestWithShortUrl.mockResolvedValue({
          feedbackRequest: newFeedbackRequest,
          reviewLink: 'https://morestars.io/r/abc123',
        });

        const smsError = new Error('Invalid phone number');
        smsError.code = 21211;
        smsService.sendReviewRequest.mockRejectedValue(smsError);

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(207);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          uuid: 'new-uuid-1234',
          message: expect.stringContaining('SMS sending failed'),
          smsError: expect.objectContaining({
            message: 'Invalid phone number',
            retryable: false,
          }),
        }));
      });

      it('should return 500 on unexpected error', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          tenantId: 1,
        };
        User.findOne.mockRejectedValue(new Error('Database connection failed'));

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: 'Internal server error',
        }));
        expect(logger.error).toHaveBeenCalled();
      });

      it('should invalidate analytics cache after successful SMS', async () => {
        mockReq.body = {
          name: 'John Doe',
          phone: '+12125551234',
          tenantId: 1,
        };
        User.findOne.mockResolvedValue(mockTenant);

        const newFeedbackRequest = {
          uuid: 'new-uuid-1234',
          update: jest.fn().mockResolvedValue(true),
        };
        shortUrlService.createFeedbackRequestWithShortUrl.mockResolvedValue({
          feedbackRequest: newFeedbackRequest,
          reviewLink: 'https://morestars.io/r/abc123',
        });
        smsService.sendReviewRequest.mockResolvedValue({ messageSid: 'SM123' });

        const analyticsService = require('../../src/services/analyticsService');

        const ingestController = require('../../src/controllers/ingestController');
        await ingestController.receiveCustomerData(mockReq, mockRes);

        expect(analyticsService.invalidateCache).toHaveBeenCalledWith(1);
      });
    });
  });

  // ===========================================
  // Platform Detection Tests
  // ===========================================
  describe('Platform Detection', () => {
    it('should detect Google review URLs', async () => {
      mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
      validator.isUUID.mockReturnValue(true);
      FeedbackRequest.findOne.mockResolvedValue({
        ...mockFeedbackRequest,
        user: {
          ...mockFeedbackRequest.user,
          reviewUrl: 'https://g.page/mybusiness/review',
        },
      });

      const reviewController = require('../../src/controllers/reviewController');
      await reviewController.showReviewLanding(mockReq, mockRes);

      expect(logger.info).toHaveBeenCalledWith(
        'Redirecting to review platform',
        expect.objectContaining({ platform: 'google' })
      );
    });

    it('should detect Facebook review URLs', async () => {
      mockReq.params = { uuid: 'test-uuid-1234-5678-9012-abcdefabcdef' };
      validator.isUUID.mockReturnValue(true);
      FeedbackRequest.findOne.mockResolvedValue({
        ...mockFeedbackRequest,
        user: {
          ...mockFeedbackRequest.user,
          reviewUrl: 'https://facebook.com/mybusiness/reviews',
        },
      });

      const reviewController = require('../../src/controllers/reviewController');
      await reviewController.showReviewLanding(mockReq, mockRes);

      expect(logger.info).toHaveBeenCalledWith(
        'Redirecting to review platform',
        expect.objectContaining({ platform: 'facebook' })
      );
    });
  });

  // ===========================================
  // Security Tests
  // ===========================================
  describe('Security', () => {
    it('should validate UUID format before database query', async () => {
      mockReq.params = { uuid: "'; DROP TABLE users; --" };
      validator.isUUID.mockReturnValue(false);

      const reviewController = require('../../src/controllers/reviewController');
      await reviewController.showReviewLanding(mockReq, mockRes);

      expect(FeedbackRequest.findOne).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should validate businessId format before database query', async () => {
      mockReq.params = { businessId: "1; DROP TABLE users; --" };

      const qrController = require('../../src/controllers/qrController');
      await qrController.handleQrScan(mockReq, mockRes);

      expect(User.findOne).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle XSS attempts in customer name', async () => {
      mockReq.body = {
        name: '<script>alert("xss")</script>',
        phone: '+12125551234',
        tenantId: 1,
      };
      User.findOne.mockResolvedValue(mockTenant);

      const newFeedbackRequest = {
        uuid: 'new-uuid-1234',
        update: jest.fn().mockResolvedValue(true),
      };
      shortUrlService.createFeedbackRequestWithShortUrl.mockResolvedValue({
        feedbackRequest: newFeedbackRequest,
        reviewLink: 'https://morestars.io/r/abc123',
      });
      smsService.sendReviewRequest.mockResolvedValue({ messageSid: 'SM123' });

      const ingestController = require('../../src/controllers/ingestController');
      await ingestController.receiveCustomerData(mockReq, mockRes);

      // Should proceed - XSS sanitization happens at render time or SMS service level
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
