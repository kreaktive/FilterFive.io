/**
 * Review Controller Tests
 *
 * Tests for customer-facing review URLs:
 * - GET /review/:uuid - Direct redirect to review platform
 * - GET /r/:shortCode - Short URL redirect
 * - GET /review/:uuid/thank-you - Thank you page
 *
 * CRITICAL PATH: These are customer-facing endpoints that
 * directly impact review collection conversion rates.
 */

const { feedbackRequestFactory, userFactory } = require('../helpers/factories');
const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock models
const mockFeedbackRequest = {
  id: 1,
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  shortCode: 'abcd1234',
  userId: 1,
  status: 'sent',
  customerName: 'John Doe',
  customerPhone: '+12125551234',
  update: jest.fn().mockResolvedValue(true),
  user: {
    id: 1,
    businessName: 'Test Business',
    reviewUrl: 'https://g.page/test-business/review',
  },
};

jest.mock('../../src/models', () => ({
  FeedbackRequest: {
    findOne: jest.fn(),
  },
  Review: {},
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../src/utils/shortCode', () => ({
  isValidShortCode: jest.fn((code) => /^[a-zA-Z0-9]{8}$/.test(code)),
}));

jest.mock('validator', () => ({
  isUUID: jest.fn((uuid, version) => {
    if (version === 4) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    }
    return false;
  }),
}));

const { FeedbackRequest } = require('../../src/models');
const { isValidShortCode } = require('../../src/utils/shortCode');
const validator = require('validator');

describe('Review Controller', () => {
  let mockReq;
  let mockRes;
  let reviewController;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      params: {},
      session: {},
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Clear module cache to get fresh controller with mocks
    jest.isolateModules(() => {
      reviewController = require('../../src/controllers/reviewController');
    });
  });

  describe('GET /review/:uuid - showReviewLanding', () => {
    describe('Happy Path', () => {
      test('should redirect to review URL for valid UUID with status=sent', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          status: 'sent',
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith('https://g.page/test-business/review');
      });

      test('should update status to "clicked" on first click', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          status: 'sent',
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(feedbackRequest.update).toHaveBeenCalledWith({
          status: 'clicked',
          linkClickedAt: expect.any(Date),
        });
      });

      test('should NOT update status if already clicked', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          status: 'clicked', // Already clicked
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(feedbackRequest.update).not.toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalledWith('https://g.page/test-business/review');
      });

      test('should redirect to Google review URL', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          user: {
            ...mockFeedbackRequest.user,
            reviewUrl: 'https://g.page/my-business/review',
          },
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith('https://g.page/my-business/review');
      });

      test('should redirect to Facebook review URL', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          user: {
            ...mockFeedbackRequest.user,
            reviewUrl: 'https://facebook.com/mybusiness/reviews',
          },
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith('https://facebook.com/mybusiness/reviews');
      });
    });

    describe('Error Cases', () => {
      test('should return 404 for invalid UUID format', async () => {
        mockReq.params = { uuid: 'invalid-uuid' };

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          title: 'Not Found',
          message: expect.stringContaining('invalid'),
        }));
        expect(FeedbackRequest.findOne).not.toHaveBeenCalled();
      });

      test('should return 404 for null UUID', async () => {
        mockReq.params = { uuid: null };

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(FeedbackRequest.findOne).not.toHaveBeenCalled();
      });

      test('should return 404 for empty UUID', async () => {
        mockReq.params = { uuid: '' };

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should return 404 for non-existent feedback request', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };
        FeedbackRequest.findOne.mockResolvedValue(null);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          message: expect.stringContaining('invalid'),
        }));
      });

      test('should show error page when review URL not configured', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          user: {
            ...mockFeedbackRequest.user,
            reviewUrl: null, // Not configured
          },
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          title: 'Configuration Error',
          message: expect.stringContaining('not configured'),
        }));
        expect(mockRes.redirect).not.toHaveBeenCalled();
      });

      test('should show error page when review URL is empty string', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          user: {
            ...mockFeedbackRequest.user,
            reviewUrl: '   ', // Whitespace only
          },
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          title: 'Configuration Error',
        }));
      });

      test('should handle database errors gracefully', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };
        FeedbackRequest.findOne.mockRejectedValue(new Error('Database connection failed'));

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith('Something went wrong');
      });

      test('should handle update failure gracefully', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          status: 'sent',
          update: jest.fn().mockRejectedValue(new Error('Update failed')),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewLanding(mockReq, mockRes);

        // Should still fail gracefully even if update throws
        expect(mockRes.status).toHaveBeenCalledWith(500);
      });
    });

    describe('Security', () => {
      test('should prevent SQL injection in UUID parameter', async () => {
        mockReq.params = { uuid: "'; DROP TABLE users; --" };

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(FeedbackRequest.findOne).not.toHaveBeenCalled();
      });

      test('should validate UUID format strictly (v4 only)', async () => {
        // UUID v1 format (should be rejected)
        mockReq.params = { uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' };

        await reviewController.showReviewLanding(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });
    });
  });

  describe('GET /r/:shortCode - showReviewByShortCode', () => {
    describe('Happy Path', () => {
      test('should redirect to review URL for valid short code', async () => {
        mockReq.params = { shortCode: 'abcd1234' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          shortCode: 'abcd1234',
          status: 'sent',
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith('https://g.page/test-business/review');
      });

      test('should update status to "clicked" on first click', async () => {
        mockReq.params = { shortCode: 'abcd1234' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          status: 'sent',
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(feedbackRequest.update).toHaveBeenCalledWith({
          status: 'clicked',
          linkClickedAt: expect.any(Date),
        });
      });

      test('should NOT update status if already clicked', async () => {
        mockReq.params = { shortCode: 'abcd1234' };

        const feedbackRequest = {
          ...mockFeedbackRequest,
          status: 'clicked',
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(feedbackRequest.update).not.toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      test('should return 404 for invalid short code format', async () => {
        mockReq.params = { shortCode: 'invalid!' };
        isValidShortCode.mockReturnValue(false);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          title: 'Not Found',
        }));
      });

      test('should return 404 for short code too short', async () => {
        mockReq.params = { shortCode: 'abc' };
        isValidShortCode.mockReturnValue(false);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should return 404 for short code too long', async () => {
        mockReq.params = { shortCode: 'abcdefghijklmnop' };
        isValidShortCode.mockReturnValue(false);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should return 404 for non-existent short code', async () => {
        mockReq.params = { shortCode: 'abcd1234' };
        isValidShortCode.mockReturnValue(true);
        FeedbackRequest.findOne.mockResolvedValue(null);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
      });

      test('should show error when review URL not configured', async () => {
        mockReq.params = { shortCode: 'abcd1234' };
        isValidShortCode.mockReturnValue(true);

        const feedbackRequest = {
          ...mockFeedbackRequest,
          user: {
            ...mockFeedbackRequest.user,
            reviewUrl: '',
          },
          update: jest.fn().mockResolvedValue(true),
        };
        FeedbackRequest.findOne.mockResolvedValue(feedbackRequest);

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          title: 'Configuration Error',
        }));
      });

      test('should handle database errors gracefully', async () => {
        mockReq.params = { shortCode: 'abcd1234' };
        isValidShortCode.mockReturnValue(true);
        FeedbackRequest.findOne.mockRejectedValue(new Error('Database error'));

        await reviewController.showReviewByShortCode(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
      });
    });
  });

  describe('GET /review/:uuid/thank-you - showThankYou', () => {
    describe('Happy Path', () => {
      test('should show thank you page with business name', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };

        FeedbackRequest.findOne.mockResolvedValue(mockFeedbackRequest);

        await reviewController.showThankYou(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          businessName: 'Test Business',
          title: 'Thank You',
          message: 'Thank you for your feedback!',
        }));
      });
    });

    describe('Edge Cases', () => {
      test('should show generic thank you for invalid UUID', async () => {
        mockReq.params = { uuid: 'invalid' };

        await reviewController.showThankYou(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          businessName: 'Business',
          title: 'Thank You',
        }));
      });

      test('should show generic thank you for non-existent request', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };
        FeedbackRequest.findOne.mockResolvedValue(null);

        await reviewController.showThankYou(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          businessName: 'Business',
        }));
      });

      test('should handle database errors gracefully', async () => {
        mockReq.params = { uuid: '550e8400-e29b-41d4-a716-446655440000' };
        FeedbackRequest.findOne.mockRejectedValue(new Error('Database error'));

        await reviewController.showThankYou(mockReq, mockRes);

        // Should render thank you anyway (graceful degradation)
        expect(mockRes.render).toHaveBeenCalledWith('thank_you', expect.objectContaining({
          businessName: 'Business',
          message: 'Thank you!',
        }));
      });
    });
  });
});
