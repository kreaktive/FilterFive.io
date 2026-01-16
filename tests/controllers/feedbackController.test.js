/**
 * Feedback Controller Tests
 *
 * Tests for feedback management dashboard:
 * - GET /dashboard/feedback - Show paginated feedback list
 * - POST /dashboard/feedback/:id/view - Mark feedback as viewed
 * - POST /dashboard/feedback/:id/respond - Send SMS response
 * - POST /dashboard/feedback/:id/note - Add internal note
 * - POST /dashboard/feedback/:id/status - Update feedback status
 * - POST /dashboard/feedback/bulk-update - Bulk update status
 * - GET /dashboard/feedback/export - Export feedback to CSV
 * - GET /dashboard/feedback/word-cloud - Generate word cloud data
 *
 * CRITICAL PATH: Feedback management is how businesses respond to
 * customer reviews and track negative feedback for recovery.
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../src/services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ messageSid: 'SM12345' }),
}));

jest.mock('../../src/services/analyticsService', () => ({
  invalidateCache: jest.fn().mockResolvedValue(true),
}));

// Mock sequelize Op
jest.mock('sequelize', () => ({
  Op: {
    gte: Symbol('gte'),
    iLike: Symbol('iLike'),
    in: Symbol('in'),
    ne: Symbol('ne'),
  },
}));

// Mock models
const mockUser = {
  id: 1,
  email: 'test@example.com',
  businessName: 'Test Business',
};

const mockReview = {
  id: 1,
  userId: 1,
  feedbackRequestId: 1,
  rating: 3,
  feedbackText: 'Could be better service',
  feedbackStatus: 'new',
  internalNotes: null,
  viewedAt: null,
  respondedAt: null,
  resolvedAt: null,
  createdAt: new Date(),
  update: jest.fn().mockResolvedValue(true),
  feedbackRequest: {
    id: 1,
    customerName: 'John Doe',
    customerPhone: '+15551234567',
  },
};

const mockFeedbackRequest = {
  id: 1,
  uuid: 'test-uuid-1234',
  userId: 1,
  customerName: 'John Doe',
  customerPhone: '+15551234567',
  deliveryMethod: 'sms',
  status: 'rated',
  createdAt: new Date(),
  review: mockReview,
};

jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
  FeedbackRequest: {
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
  },
  Review: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

const { User, FeedbackRequest, Review } = require('../../src/models');
const smsService = require('../../src/services/smsService');
const analyticsService = require('../../src/services/analyticsService');
const logger = require('../../src/services/logger');

describe('Feedback Controller', () => {
  let mockReq;
  let mockRes;
  let feedbackController;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    mockReq = {
      session: {
        userId: 1,
      },
      user: mockUser,
      query: {},
      params: {},
      body: {},
    };

    mockRes = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    // Default mocks
    User.findByPk.mockResolvedValue(mockUser);
    FeedbackRequest.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [mockFeedbackRequest],
    });
    Review.findOne.mockResolvedValue({ ...mockReview });

    jest.isolateModules(() => {
      feedbackController = require('../../src/controllers/feedbackController');
    });
  });

  // ===========================================
  // GET /dashboard/feedback (showFeedbackList)
  // ===========================================
  describe('GET /dashboard/feedback (showFeedbackList)', () => {
    describe('Happy Path', () => {
      test('should render feedback list with default pagination', async () => {
        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          title: 'Feedback Management - MoreStars',
          user: mockUser,
          feedbackList: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            limit: 25,
          }),
        }));
      });

      test('should include default filters in response', async () => {
        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          filters: expect.objectContaining({
            rating: 'all',
            status: 'all',
            hasFeedback: 'all',
            dateRange: 30,
            search: '',
          }),
        }));
      });

      test('should apply query parameter filters', async () => {
        mockReq.query = {
          page: '2',
          limit: '50',
          rating: '4',
          status: 'new',
          hasFeedback: 'true',
          dateRange: '7',
          search: 'great service',
        };

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(FeedbackRequest.findAndCountAll).toHaveBeenCalled();
        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          pagination: expect.objectContaining({
            currentPage: 2,
            limit: 50,
          }),
          filters: expect.objectContaining({
            rating: '4',
            status: 'new',
            dateRange: 7,
            search: 'great service',
          }),
        }));
      });

      test('should calculate pagination metadata correctly', async () => {
        FeedbackRequest.findAndCountAll.mockResolvedValue({
          count: 100,
          rows: Array(25).fill(mockFeedbackRequest),
        });

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 4,
            totalItems: 100,
            hasNext: true,
            hasPrev: false,
          }),
        }));
      });
    });

    describe('Bounds Validation (DoS Protection)', () => {
      test('should cap page number at 1000', async () => {
        mockReq.query = { page: '9999' };

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          pagination: expect.objectContaining({
            currentPage: 1000,
          }),
        }));
      });

      test('should cap limit at 100', async () => {
        mockReq.query = { limit: '500' };

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          pagination: expect.objectContaining({
            limit: 100,
          }),
        }));
      });

      test('should cap dateRange at 365 days', async () => {
        mockReq.query = { dateRange: '999' };

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          filters: expect.objectContaining({
            dateRange: 365,
          }),
        }));
      });

      test('should truncate search to 200 characters', async () => {
        mockReq.query = { search: 'a'.repeat(300) };

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          filters: expect.objectContaining({
            search: 'a'.repeat(200),
          }),
        }));
      });

      test('should enforce minimum page of 1', async () => {
        mockReq.query = { page: '-5' };

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.render).toHaveBeenCalledWith('dashboard/feedback', expect.objectContaining({
          pagination: expect.objectContaining({
            currentPage: 1,
          }),
        }));
      });
    });

    describe('Authentication', () => {
      test('should redirect to login if user not found', async () => {
        mockReq.user = null;
        User.findByPk.mockResolvedValue(null);

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard/login');
      });
    });

    describe('Error Handling', () => {
      test('should return 500 on database error', async () => {
        FeedbackRequest.findAndCountAll.mockRejectedValue(new Error('Database error'));

        await feedbackController.showFeedbackList(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.render).toHaveBeenCalledWith('error', expect.objectContaining({
          message: 'Failed to load feedback list',
        }));
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  // ===========================================
  // POST /dashboard/feedback/:id/view (markAsViewed)
  // ===========================================
  describe('POST /dashboard/feedback/:id/view (markAsViewed)', () => {
    beforeEach(() => {
      mockReq.params = { id: '1' };
    });

    describe('Happy Path', () => {
      test('should mark review as viewed', async () => {
        const review = {
          ...mockReview,
          feedbackStatus: 'new',
          update: jest.fn().mockImplementation(function(data) {
            // Simulate Sequelize update mutating the instance
            Object.assign(this, data);
            return Promise.resolve(true);
          }),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.markAsViewed(mockReq, mockRes);

        expect(review.update).toHaveBeenCalledWith({
          feedbackStatus: 'viewed',
          viewedAt: expect.any(Date),
        });
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          status: 'viewed',
        });
      });

      test('should not update if already viewed', async () => {
        const review = {
          ...mockReview,
          feedbackStatus: 'viewed',
          update: jest.fn(),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.markAsViewed(mockReq, mockRes);

        expect(review.update).not.toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          status: 'viewed',
        });
      });
    });

    describe('Error Cases', () => {
      test('should return 404 if review not found', async () => {
        Review.findOne.mockResolvedValue(null);

        await feedbackController.markAsViewed(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review not found' });
      });

      test('should return 500 on database error', async () => {
        Review.findOne.mockRejectedValue(new Error('Database error'));

        await feedbackController.markAsViewed(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update status' });
      });
    });
  });

  // ===========================================
  // POST /dashboard/feedback/:id/respond (respondToFeedback)
  // ===========================================
  describe('POST /dashboard/feedback/:id/respond (respondToFeedback)', () => {
    beforeEach(() => {
      mockReq.params = { id: '1' };
      mockReq.body = { message: 'Thank you for your feedback!' };
    });

    describe('Happy Path', () => {
      test('should send SMS and update review status', async () => {
        const review = {
          ...mockReview,
          feedbackStatus: 'new',
          viewedAt: null,
          update: jest.fn().mockResolvedValue(true),
          feedbackRequest: {
            customerPhone: '+15551234567',
          },
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(smsService.sendSMS).toHaveBeenCalledWith(
          '+15551234567',
          'Thank you for your feedback!'
        );
        expect(review.update).toHaveBeenCalledWith({
          feedbackStatus: 'responded',
          respondedAt: expect.any(Date),
          viewedAt: expect.any(Date),
        });
        expect(analyticsService.invalidateCache).toHaveBeenCalledWith(1);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Response sent successfully',
          twilioSid: 'SM12345',
        });
      });

      test('should preserve existing viewedAt timestamp', async () => {
        const existingViewedAt = new Date('2024-01-01');
        const review = {
          ...mockReview,
          feedbackStatus: 'viewed',
          viewedAt: existingViewedAt,
          update: jest.fn().mockResolvedValue(true),
          feedbackRequest: {
            customerPhone: '+15551234567',
          },
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(review.update).toHaveBeenCalledWith({
          feedbackStatus: 'responded',
          respondedAt: expect.any(Date),
          viewedAt: existingViewedAt,
        });
      });

      test('should log successful response', async () => {
        const review = {
          ...mockReview,
          update: jest.fn().mockResolvedValue(true),
          feedbackRequest: { customerPhone: '+15551234567' },
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(logger.info).toHaveBeenCalledWith(
          'Responded to feedback via SMS',
          expect.objectContaining({ userId: 1, reviewId: '1' })
        );
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 if message is empty', async () => {
        mockReq.body = { message: '' };

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Message is required' });
        expect(smsService.sendSMS).not.toHaveBeenCalled();
      });

      test('should return 400 if message is whitespace only', async () => {
        mockReq.body = { message: '   ' };

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Message is required' });
      });

      test('should return 400 if message is missing', async () => {
        mockReq.body = {};

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Message is required' });
      });

      test('should return 400 if no phone number available', async () => {
        const review = {
          ...mockReview,
          feedbackRequest: { customerPhone: null },
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'No phone number available for this customer',
        });
      });
    });

    describe('Error Cases', () => {
      test('should return 404 if review not found', async () => {
        Review.findOne.mockResolvedValue(null);

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review not found' });
      });

      test('should return 500 if SMS fails', async () => {
        const review = {
          ...mockReview,
          update: jest.fn(),
          feedbackRequest: { customerPhone: '+15551234567' },
        };
        Review.findOne.mockResolvedValue(review);
        smsService.sendSMS.mockRejectedValue(new Error('Twilio error'));

        await feedbackController.respondToFeedback(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Failed to send response',
          message: 'Twilio error',
        });
      });
    });
  });

  // ===========================================
  // POST /dashboard/feedback/:id/note (addInternalNote)
  // ===========================================
  describe('POST /dashboard/feedback/:id/note (addInternalNote)', () => {
    beforeEach(() => {
      mockReq.params = { id: '1' };
      mockReq.body = { note: 'Follow up with customer next week' };
    });

    describe('Happy Path', () => {
      test('should add note to review without existing notes', async () => {
        const review = {
          ...mockReview,
          internalNotes: null,
          update: jest.fn().mockResolvedValue(true),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.addInternalNote(mockReq, mockRes);

        expect(review.update).toHaveBeenCalledWith({
          internalNotes: expect.stringContaining('Follow up with customer next week'),
        });
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Note added successfully',
          internalNotes: expect.stringContaining('Follow up with customer next week'),
        });
      });

      test('should append note to existing notes', async () => {
        const review = {
          ...mockReview,
          internalNotes: '[2024-01-01] Previous note',
          update: jest.fn().mockResolvedValue(true),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.addInternalNote(mockReq, mockRes);

        expect(review.update).toHaveBeenCalledWith({
          internalNotes: expect.stringContaining('[2024-01-01] Previous note'),
        });
        expect(review.update).toHaveBeenCalledWith({
          internalNotes: expect.stringContaining('Follow up with customer next week'),
        });
      });

      test('should include timestamp in note', async () => {
        const review = {
          ...mockReview,
          internalNotes: null,
          update: jest.fn().mockResolvedValue(true),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.addInternalNote(mockReq, mockRes);

        const updateCall = review.update.mock.calls[0][0];
        expect(updateCall.internalNotes).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 if note is empty', async () => {
        mockReq.body = { note: '' };

        await feedbackController.addInternalNote(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Note is required' });
      });

      test('should return 400 if note is whitespace only', async () => {
        mockReq.body = { note: '   ' };

        await feedbackController.addInternalNote(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      test('should return 400 if note is missing', async () => {
        mockReq.body = {};

        await feedbackController.addInternalNote(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Error Cases', () => {
      test('should return 404 if review not found', async () => {
        Review.findOne.mockResolvedValue(null);

        await feedbackController.addInternalNote(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review not found' });
      });

      test('should return 500 on database error', async () => {
        const review = {
          ...mockReview,
          update: jest.fn().mockRejectedValue(new Error('Database error')),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.addInternalNote(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to add note' });
      });
    });
  });

  // ===========================================
  // POST /dashboard/feedback/:id/status (updateStatus)
  // ===========================================
  describe('POST /dashboard/feedback/:id/status (updateStatus)', () => {
    beforeEach(() => {
      mockReq.params = { id: '1' };
      mockReq.body = { status: 'viewed' };
    });

    describe('Happy Path', () => {
      test('should update status to viewed', async () => {
        const review = {
          ...mockReview,
          feedbackStatus: 'new',
          viewedAt: null,
          update: jest.fn().mockResolvedValue(true),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.updateStatus(mockReq, mockRes);

        expect(review.update).toHaveBeenCalledWith({
          feedbackStatus: 'viewed',
          viewedAt: expect.any(Date),
        });
        expect(analyticsService.invalidateCache).toHaveBeenCalledWith(1);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          status: 'viewed',
          message: 'Status updated to viewed',
        });
      });

      test('should update status to resolved and set timestamps', async () => {
        mockReq.body = { status: 'resolved' };
        const review = {
          ...mockReview,
          feedbackStatus: 'new',
          viewedAt: null,
          resolvedAt: null,
          update: jest.fn().mockResolvedValue(true),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.updateStatus(mockReq, mockRes);

        expect(review.update).toHaveBeenCalledWith({
          feedbackStatus: 'resolved',
          resolvedAt: expect.any(Date),
          viewedAt: expect.any(Date),
        });
      });

      test('should not overwrite existing viewedAt when resolving', async () => {
        mockReq.body = { status: 'resolved' };
        const existingViewedAt = new Date('2024-01-01');
        const review = {
          ...mockReview,
          feedbackStatus: 'viewed',
          viewedAt: existingViewedAt,
          resolvedAt: null,
          update: jest.fn().mockResolvedValue(true),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.updateStatus(mockReq, mockRes);

        expect(review.update).toHaveBeenCalledWith({
          feedbackStatus: 'resolved',
          resolvedAt: expect.any(Date),
        });
      });

      test('should accept all valid statuses', async () => {
        const validStatuses = ['new', 'viewed', 'responded', 'resolved'];

        for (const status of validStatuses) {
          jest.clearAllMocks();
          mockReq.body = { status };
          const review = {
            ...mockReview,
            update: jest.fn().mockResolvedValue(true),
          };
          Review.findOne.mockResolvedValue(review);

          await feedbackController.updateStatus(mockReq, mockRes);

          expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            status: status,
          }));
        }
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 for invalid status', async () => {
        mockReq.body = { status: 'invalid' };

        await feedbackController.updateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid status' });
      });

      test('should return 400 for empty status', async () => {
        mockReq.body = { status: '' };

        await feedbackController.updateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Error Cases', () => {
      test('should return 404 if review not found', async () => {
        Review.findOne.mockResolvedValue(null);

        await feedbackController.updateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review not found' });
      });

      test('should return 500 on database error', async () => {
        const review = {
          ...mockReview,
          update: jest.fn().mockRejectedValue(new Error('Database error')),
        };
        Review.findOne.mockResolvedValue(review);

        await feedbackController.updateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to update status' });
      });
    });
  });

  // ===========================================
  // POST /dashboard/feedback/bulk-update (bulkUpdateStatus)
  // ===========================================
  describe('POST /dashboard/feedback/bulk-update (bulkUpdateStatus)', () => {
    beforeEach(() => {
      mockReq.body = {
        reviewIds: [1, 2, 3],
        status: 'viewed',
      };
    });

    describe('Happy Path', () => {
      test('should bulk update reviews to viewed status', async () => {
        Review.update.mockResolvedValue([3]); // 3 records updated

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(Review.update).toHaveBeenCalledWith(
          expect.objectContaining({
            feedbackStatus: 'viewed',
            viewedAt: expect.any(Date),
          }),
          expect.objectContaining({
            where: expect.any(Object),
          })
        );
        expect(analyticsService.invalidateCache).toHaveBeenCalledWith(1);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          updatedCount: 3,
          message: '3 feedback items updated to viewed',
        });
      });

      test('should bulk update to resolved status', async () => {
        mockReq.body = { reviewIds: [1, 2], status: 'resolved' };
        Review.update.mockResolvedValue([2]);

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(Review.update).toHaveBeenCalledWith(
          expect.objectContaining({
            feedbackStatus: 'resolved',
            resolvedAt: expect.any(Date),
          }),
          expect.any(Object)
        );
      });

      test('should log bulk update action', async () => {
        Review.update.mockResolvedValue([3]);

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(logger.info).toHaveBeenCalledWith(
          'Bulk updated reviews',
          expect.objectContaining({
            userId: 1,
            updatedCount: 3,
            status: 'viewed',
          })
        );
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 if reviewIds is empty array', async () => {
        mockReq.body = { reviewIds: [], status: 'viewed' };

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Review IDs array is required',
        });
      });

      test('should return 400 if reviewIds is not an array', async () => {
        mockReq.body = { reviewIds: 'not-an-array', status: 'viewed' };

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      test('should return 400 if reviewIds is missing', async () => {
        mockReq.body = { status: 'viewed' };

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      test('should return 400 for invalid status', async () => {
        mockReq.body = { reviewIds: [1, 2], status: 'invalid' };

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid status' });
      });
    });

    describe('Error Cases', () => {
      test('should return 500 on database error', async () => {
        Review.update.mockRejectedValue(new Error('Database error'));

        await feedbackController.bulkUpdateStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to bulk update' });
      });
    });
  });

  // ===========================================
  // GET /dashboard/feedback/export (exportFeedback)
  // ===========================================
  describe('GET /dashboard/feedback/export (exportFeedback)', () => {
    beforeEach(() => {
      mockReq.query = {};
    });

    describe('Happy Path', () => {
      test('should export feedback as CSV', async () => {
        FeedbackRequest.findAll.mockResolvedValue([
          {
            customerName: 'John Doe',
            customerPhone: '+15551234567',
            createdAt: new Date('2024-01-15'),
            review: {
              rating: 4,
              feedbackText: 'Great service!',
              feedbackStatus: 'new',
              internalNotes: null,
            },
          },
        ]);

        await feedbackController.exportFeedback(mockReq, mockRes);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
        expect(mockRes.setHeader).toHaveBeenCalledWith(
          'Content-Disposition',
          expect.stringContaining('attachment; filename="feedback-export-')
        );
        expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Customer Name'));
        expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('John Doe'));
      });

      test('should include CSV headers', async () => {
        FeedbackRequest.findAll.mockResolvedValue([]);

        await feedbackController.exportFeedback(mockReq, mockRes);

        expect(mockRes.send).toHaveBeenCalledWith(
          'Customer Name,Phone,Rating,Feedback,Status,Date,Internal Notes'
        );
      });

      test('should escape quotes in feedback text', async () => {
        FeedbackRequest.findAll.mockResolvedValue([
          {
            customerName: 'John',
            customerPhone: '+15551234567',
            createdAt: new Date(),
            review: {
              rating: 3,
              feedbackText: 'Said "needs improvement"',
              feedbackStatus: 'new',
              internalNotes: null,
            },
          },
        ]);

        await feedbackController.exportFeedback(mockReq, mockRes);

        expect(mockRes.send).toHaveBeenCalledWith(
          expect.stringContaining('""needs improvement""')
        );
      });

      test('should apply query filters', async () => {
        mockReq.query = {
          rating: '4',
          status: 'new',
          dateRange: '7',
          search: 'great',
        };
        FeedbackRequest.findAll.mockResolvedValue([]);

        await feedbackController.exportFeedback(mockReq, mockRes);

        expect(FeedbackRequest.findAll).toHaveBeenCalled();
      });

      test('should handle anonymous customers', async () => {
        FeedbackRequest.findAll.mockResolvedValue([
          {
            customerName: null,
            customerPhone: null,
            createdAt: new Date(),
            review: {
              rating: 5,
              feedbackText: 'Amazing!',
              feedbackStatus: 'new',
              internalNotes: null,
            },
          },
        ]);

        await feedbackController.exportFeedback(mockReq, mockRes);

        expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Anonymous'));
      });
    });

    describe('Bounds Validation', () => {
      test('should cap dateRange at 365', async () => {
        mockReq.query = { dateRange: '999' };
        FeedbackRequest.findAll.mockResolvedValue([]);

        await feedbackController.exportFeedback(mockReq, mockRes);

        // Function should complete without error
        expect(mockRes.send).toHaveBeenCalled();
      });

      test('should truncate search to 200 characters', async () => {
        mockReq.query = { search: 'a'.repeat(300) };
        FeedbackRequest.findAll.mockResolvedValue([]);

        await feedbackController.exportFeedback(mockReq, mockRes);

        expect(mockRes.send).toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      test('should return 500 on database error', async () => {
        FeedbackRequest.findAll.mockRejectedValue(new Error('Database error'));

        await feedbackController.exportFeedback(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to export feedback' });
      });
    });
  });

  // ===========================================
  // GET /dashboard/feedback/word-cloud (generateWordCloud)
  // ===========================================
  describe('GET /dashboard/feedback/word-cloud (generateWordCloud)', () => {
    beforeEach(() => {
      mockReq.query = {};
    });

    describe('Happy Path', () => {
      test('should generate word cloud data', async () => {
        Review.findAll.mockResolvedValue([
          { feedbackText: 'Great service excellent food' },
          { feedbackText: 'Excellent service great experience' },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          words: expect.any(Array),
          totalReviews: 2,
        });
      });

      test('should filter out stop words', async () => {
        Review.findAll.mockResolvedValue([
          { feedbackText: 'The service was great and the food was excellent' },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        const words = response.words.map(w => w.text);
        expect(words).not.toContain('the');
        expect(words).not.toContain('was');
        expect(words).not.toContain('and');
      });

      test('should filter out short words (< 4 characters)', async () => {
        Review.findAll.mockResolvedValue([
          { feedbackText: 'It was a very good day for me' },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        const words = response.words.map(w => w.text);
        expect(words).not.toContain('was');
        expect(words).not.toContain('day');
        expect(words).not.toContain('for');
      });

      test('should count word frequency correctly', async () => {
        Review.findAll.mockResolvedValue([
          { feedbackText: 'service service service excellent' },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        const serviceWord = response.words.find(w => w.text === 'service');
        expect(serviceWord.value).toBe(3);
      });

      test('should limit to top 50 words', async () => {
        const manyWords = Array(100).fill('word').map((w, i) => 'uniqueword' + i).join(' ');
        Review.findAll.mockResolvedValue([
          { feedbackText: manyWords },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        expect(response.words.length).toBeLessThanOrEqual(50);
      });

      test('should sort words by frequency descending', async () => {
        Review.findAll.mockResolvedValue([
          { feedbackText: 'excellent excellent excellent great great service' },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        const values = response.words.map(w => w.value);
        expect(values).toEqual([...values].sort((a, b) => b - a));
      });

      test('should apply dateRange filter', async () => {
        mockReq.query = { dateRange: '7' };
        Review.findAll.mockResolvedValue([]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        expect(Review.findAll).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
          }),
        }));
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty feedback list', async () => {
        Review.findAll.mockResolvedValue([]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          words: [],
          totalReviews: 0,
        });
      });

      test('should handle null feedbackText', async () => {
        Review.findAll.mockResolvedValue([
          { feedbackText: null },
          { feedbackText: 'Great service' },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          words: expect.any(Array),
          totalReviews: 2,
        });
      });

      test('should handle punctuation in text', async () => {
        Review.findAll.mockResolvedValue([
          { feedbackText: 'Great! Excellent... Amazing!!!' },
        ]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        const response = mockRes.json.mock.calls[0][0];
        const words = response.words.map(w => w.text);
        expect(words).toContain('great');
        expect(words).toContain('excellent');
        expect(words).toContain('amazing');
      });
    });

    describe('Bounds Validation', () => {
      test('should cap dateRange at 365', async () => {
        mockReq.query = { dateRange: '999' };
        Review.findAll.mockResolvedValue([]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          words: [],
          totalReviews: 0,
        });
      });

      test('should enforce minimum dateRange of 1', async () => {
        mockReq.query = { dateRange: '-5' };
        Review.findAll.mockResolvedValue([]);

        await feedbackController.generateWordCloud(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
      });
    });

    describe('Error Cases', () => {
      test('should return 500 on database error', async () => {
        Review.findAll.mockRejectedValue(new Error('Database error'));

        await feedbackController.generateWordCloud(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to generate word cloud' });
      });
    });
  });

  // ===========================================
  // Security Tests
  // ===========================================
  describe('Security', () => {
    test('markAsViewed should only access reviews for current user', async () => {
      mockReq.params = { id: '1' };
      Review.findOne.mockResolvedValue(null);

      await feedbackController.markAsViewed(mockReq, mockRes);

      expect(Review.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: 1 },
      });
    });

    test('respondToFeedback should only access reviews for current user', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { message: 'test' };
      Review.findOne.mockResolvedValue(null);

      await feedbackController.respondToFeedback(mockReq, mockRes);

      expect(Review.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1', userId: 1 },
      }));
    });

    test('bulkUpdateStatus should only update reviews for current user', async () => {
      mockReq.body = { reviewIds: [1, 2, 3], status: 'viewed' };
      Review.update.mockResolvedValue([3]);

      await feedbackController.bulkUpdateStatus(mockReq, mockRes);

      expect(Review.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
          }),
        })
      );
    });
  });
});
