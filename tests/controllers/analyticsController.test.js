/**
 * Analytics Controller Tests
 *
 * Tests for analytics dashboard and API endpoints.
 * Phase 6 of the Dashboard Testing Plan.
 */

// Mock dependencies before requiring controller
jest.mock('../../src/services/analyticsService');
jest.mock('../../src/services/snapshotService');
jest.mock('../../src/services/logger');
jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

const analyticsController = require('../../src/controllers/analyticsController');
const analyticsService = require('../../src/services/analyticsService');
const snapshotService = require('../../src/services/snapshotService');
const { User } = require('../../src/models');
const logger = require('../../src/services/logger');

describe('Analytics Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      session: {
        userId: 1,
        user: { id: 1, email: 'test@example.com' },
      },
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis(),
    };

    logger.error = jest.fn();
    logger.info = jest.fn();
  });

  // ===========================================
  // getAnalyticsDashboard Tests
  // ===========================================
  describe('getAnalyticsDashboard', () => {
    it('should render analytics dashboard when analytics enabled', async () => {
      const mockUser = {
        analyticsEnabled: true,
        businessName: 'Test Business',
      };
      User.findByPk.mockResolvedValue(mockUser);
      analyticsService.getUserLocationsCached = jest.fn().mockResolvedValue(['Location 1', 'Location 2']);

      await analyticsController.getAnalyticsDashboard(mockReq, mockRes);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['analyticsEnabled', 'businessName'],
      });
      expect(mockRes.render).toHaveBeenCalledWith('dashboard/analytics', expect.objectContaining({
        title: 'Analytics Dashboard',
        businessName: 'Test Business',
        locations: ['Location 1', 'Location 2'],
      }));
    });

    it('should render coming-soon page when analytics disabled', async () => {
      const mockUser = {
        analyticsEnabled: false,
        businessName: 'Test Business',
      };
      User.findByPk.mockResolvedValue(mockUser);

      await analyticsController.getAnalyticsDashboard(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('dashboard/analytics-coming-soon', expect.objectContaining({
        title: 'Analytics Dashboard - Coming Soon',
        businessName: 'Test Business',
      }));
    });

    it('should return 404 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await analyticsController.getAnalyticsDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith('User not found');
    });

    it('should return 500 on error', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      await analyticsController.getAnalyticsDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Error loading analytics dashboard');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should provide default date range for last 30 days', async () => {
      const mockUser = {
        analyticsEnabled: true,
        businessName: 'Test Business',
      };
      User.findByPk.mockResolvedValue(mockUser);
      analyticsService.getUserLocationsCached = jest.fn().mockResolvedValue([]);

      await analyticsController.getAnalyticsDashboard(mockReq, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith(
        'dashboard/analytics',
        expect.objectContaining({
          defaultStartDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          defaultEndDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
    });
  });

  // ===========================================
  // getMetrics Tests
  // ===========================================
  describe('getMetrics', () => {
    it('should return metrics for valid date range', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const mockMetrics = {
        period: { startDate: new Date('2025-01-01'), endDate: new Date('2025-01-31') },
        requests: { total: 100, sms: 80, qr: 20 },
        reviews: { total: 50, positive: 45, negative: 5 },
        roi: { monthlyValue: 4500 },
      };
      analyticsService.getDashboardMetricsCached = jest.fn().mockResolvedValue(mockMetrics);

      await analyticsController.getMetrics(mockReq, mockRes);

      expect(analyticsService.getDashboardMetricsCached).toHaveBeenCalledWith(1, {
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        location: null,
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockMetrics);
    });

    it('should return 400 when startDate missing', async () => {
      mockReq.query = { endDate: '2025-01-31' };

      await analyticsController.getMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'startDate and endDate are required',
      });
    });

    it('should return 400 when endDate missing', async () => {
      mockReq.query = { startDate: '2025-01-01' };

      await analyticsController.getMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'startDate and endDate are required',
      });
    });

    it('should return 400 for invalid date format', async () => {
      mockReq.query = {
        startDate: 'not-a-date',
        endDate: '2025-01-31',
      };

      await analyticsController.getMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid date format',
      });
    });

    it('should return 400 for invalid endDate format', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: 'invalid-date',
      };

      await analyticsController.getMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid date format',
      });
    });

    it('should apply location filter when provided', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        location: 'Downtown',
      };
      analyticsService.getDashboardMetricsCached = jest.fn().mockResolvedValue({});

      await analyticsController.getMetrics(mockReq, mockRes);

      expect(analyticsService.getDashboardMetricsCached).toHaveBeenCalledWith(1, {
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        location: 'Downtown',
      });
    });

    it('should return 500 on service error', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      analyticsService.getDashboardMetricsCached = jest.fn().mockRejectedValue(new Error('Service error'));

      await analyticsController.getMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch metrics',
      });
    });
  });

  // ===========================================
  // getTrends Tests
  // ===========================================
  describe('getTrends', () => {
    it('should return trend data', async () => {
      const mockTrends = {
        requests: [10, 12, 15, 8, 20],
        reviews: [5, 6, 8, 4, 10],
        ratings: [4.5, 4.3, 4.7, 4.2, 4.8],
      };
      analyticsService.getTrendDataCached = jest.fn().mockResolvedValue(mockTrends);

      await analyticsController.getTrends(mockReq, mockRes);

      expect(analyticsService.getTrendDataCached).toHaveBeenCalledWith(1, null);
      expect(mockRes.json).toHaveBeenCalledWith(mockTrends);
    });

    it('should apply location filter when provided', async () => {
      mockReq.query = { location: 'West Side' };
      analyticsService.getTrendDataCached = jest.fn().mockResolvedValue({});

      await analyticsController.getTrends(mockReq, mockRes);

      expect(analyticsService.getTrendDataCached).toHaveBeenCalledWith(1, 'West Side');
    });

    it('should return 500 on service error', async () => {
      analyticsService.getTrendDataCached = jest.fn().mockRejectedValue(new Error('Service error'));

      await analyticsController.getTrends(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch trends',
      });
    });
  });

  // ===========================================
  // getTimingHeatmap Tests
  // ===========================================
  describe('getTimingHeatmap', () => {
    it('should return heatmap data', async () => {
      const mockHeatmap = {
        data: [
          { hour: 9, day: 'Monday', value: 15 },
          { hour: 10, day: 'Monday', value: 20 },
        ],
      };
      analyticsService.getTimingHeatmapCached = jest.fn().mockResolvedValue(mockHeatmap);

      await analyticsController.getTimingHeatmap(mockReq, mockRes);

      expect(analyticsService.getTimingHeatmapCached).toHaveBeenCalledWith(1, null);
      expect(mockRes.json).toHaveBeenCalledWith(mockHeatmap);
    });

    it('should apply location filter when provided', async () => {
      mockReq.query = { location: 'North Branch' };
      analyticsService.getTimingHeatmapCached = jest.fn().mockResolvedValue({});

      await analyticsController.getTimingHeatmap(mockReq, mockRes);

      expect(analyticsService.getTimingHeatmapCached).toHaveBeenCalledWith(1, 'North Branch');
    });

    it('should return 500 on service error', async () => {
      analyticsService.getTimingHeatmapCached = jest.fn().mockRejectedValue(new Error('Service error'));

      await analyticsController.getTimingHeatmap(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch timing heatmap',
      });
    });
  });

  // ===========================================
  // getComparison Tests
  // ===========================================
  describe('getComparison', () => {
    it('should return comparison data for valid date range', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const mockComparison = {
        currentPeriod: { requests: 100, reviews: 50 },
        previousPeriod: { requests: 80, reviews: 40 },
        change: { requests: 25, reviews: 25 },
      };
      analyticsService.comparePeriods = jest.fn().mockResolvedValue(mockComparison);

      await analyticsController.getComparison(mockReq, mockRes);

      expect(analyticsService.comparePeriods).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date),
        null
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockComparison);
    });

    it('should return 400 when startDate missing', async () => {
      mockReq.query = { endDate: '2025-01-31' };

      await analyticsController.getComparison(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'startDate and endDate are required',
      });
    });

    it('should return 400 when endDate missing', async () => {
      mockReq.query = { startDate: '2025-01-01' };

      await analyticsController.getComparison(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'startDate and endDate are required',
      });
    });

    it('should return 400 for invalid date format', async () => {
      mockReq.query = {
        startDate: 'invalid',
        endDate: '2025-01-31',
      };

      await analyticsController.getComparison(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid date format',
      });
    });

    it('should apply location filter when provided', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        location: 'Main Street',
      };
      analyticsService.comparePeriods = jest.fn().mockResolvedValue({});

      await analyticsController.getComparison(mockReq, mockRes);

      expect(analyticsService.comparePeriods).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date),
        'Main Street'
      );
    });

    it('should return 500 on service error', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      analyticsService.comparePeriods = jest.fn().mockRejectedValue(new Error('Service error'));

      await analyticsController.getComparison(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch comparison',
      });
    });
  });

  // ===========================================
  // getSmsEvents Tests
  // ===========================================
  describe('getSmsEvents', () => {
    it('should return SMS event metrics for valid date range', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const mockEvents = {
        delivered: 95,
        failed: 3,
        optOuts: 2,
        bounced: 0,
      };
      analyticsService.getSmsEventMetrics = jest.fn().mockResolvedValue(mockEvents);

      await analyticsController.getSmsEvents(mockReq, mockRes);

      expect(analyticsService.getSmsEventMetrics).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockEvents);
    });

    it('should return 400 when startDate missing', async () => {
      mockReq.query = { endDate: '2025-01-31' };

      await analyticsController.getSmsEvents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'startDate and endDate are required',
      });
    });

    it('should return 400 when endDate missing', async () => {
      mockReq.query = { startDate: '2025-01-01' };

      await analyticsController.getSmsEvents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'startDate and endDate are required',
      });
    });

    it('should return 400 for invalid date format', async () => {
      mockReq.query = {
        startDate: 'bad-date',
        endDate: '2025-01-31',
      };

      await analyticsController.getSmsEvents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid date format',
      });
    });

    it('should return 500 on service error', async () => {
      mockReq.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      analyticsService.getSmsEventMetrics = jest.fn().mockRejectedValue(new Error('Service error'));

      await analyticsController.getSmsEvents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch SMS events',
      });
    });
  });

  // ===========================================
  // adminGenerateSnapshots Tests
  // ===========================================
  describe('adminGenerateSnapshots', () => {
    it('should generate snapshots for super admin', async () => {
      const mockAdmin = { role: 'super_admin' };
      User.findByPk.mockResolvedValue(mockAdmin);
      const mockResult = { usersProcessed: 10, snapshotsCreated: 10 };
      snapshotService.generateDailySnapshots = jest.fn().mockResolvedValue(mockResult);

      await analyticsController.adminGenerateSnapshots(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Snapshots generated successfully',
        result: mockResult,
      });
    });

    it('should accept optional targetDate', async () => {
      const mockAdmin = { role: 'super_admin' };
      User.findByPk.mockResolvedValue(mockAdmin);
      mockReq.body = { targetDate: '2025-01-15' };
      snapshotService.generateDailySnapshots = jest.fn().mockResolvedValue({});

      await analyticsController.adminGenerateSnapshots(mockReq, mockRes);

      expect(snapshotService.generateDailySnapshots).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should return 403 for non-admin user', async () => {
      const mockUser = { role: 'user' };
      User.findByPk.mockResolvedValue(mockUser);

      await analyticsController.adminGenerateSnapshots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized - Admin access required',
      });
    });

    it('should return 403 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await analyticsController.adminGenerateSnapshots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized - Admin access required',
      });
    });

    it('should return 500 on service error', async () => {
      const mockAdmin = { role: 'super_admin' };
      User.findByPk.mockResolvedValue(mockAdmin);
      snapshotService.generateDailySnapshots = jest.fn().mockRejectedValue(new Error('Snapshot error'));

      await analyticsController.adminGenerateSnapshots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to generate snapshots',
      });
    });
  });

  // ===========================================
  // adminBackfillSnapshots Tests
  // ===========================================
  describe('adminBackfillSnapshots', () => {
    it('should backfill snapshots for super admin', async () => {
      const mockAdmin = { role: 'super_admin' };
      User.findByPk.mockResolvedValue(mockAdmin);
      mockReq.body = { userId: 123, daysBack: 30 };
      const mockResult = { snapshotsCreated: 30 };
      snapshotService.backfillSnapshots = jest.fn().mockResolvedValue(mockResult);

      await analyticsController.adminBackfillSnapshots(mockReq, mockRes);

      expect(snapshotService.backfillSnapshots).toHaveBeenCalledWith(123, 30);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Backfill completed successfully',
        result: mockResult,
      });
    });

    it('should use default daysBack of 90', async () => {
      const mockAdmin = { role: 'super_admin' };
      User.findByPk.mockResolvedValue(mockAdmin);
      mockReq.body = { userId: 123 };
      snapshotService.backfillSnapshots = jest.fn().mockResolvedValue({});

      await analyticsController.adminBackfillSnapshots(mockReq, mockRes);

      expect(snapshotService.backfillSnapshots).toHaveBeenCalledWith(123, 90);
    });

    it('should return 400 when userId missing', async () => {
      const mockAdmin = { role: 'super_admin' };
      User.findByPk.mockResolvedValue(mockAdmin);
      mockReq.body = { daysBack: 30 };

      await analyticsController.adminBackfillSnapshots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'userId is required',
      });
    });

    it('should return 403 for non-admin user', async () => {
      const mockUser = { role: 'user' };
      User.findByPk.mockResolvedValue(mockUser);
      mockReq.body = { userId: 123 };

      await analyticsController.adminBackfillSnapshots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized - Admin access required',
      });
    });

    it('should return 403 when user not found', async () => {
      User.findByPk.mockResolvedValue(null);
      mockReq.body = { userId: 123 };

      await analyticsController.adminBackfillSnapshots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized - Admin access required',
      });
    });

    it('should return 500 on service error', async () => {
      const mockAdmin = { role: 'super_admin' };
      User.findByPk.mockResolvedValue(mockAdmin);
      mockReq.body = { userId: 123 };
      snapshotService.backfillSnapshots = jest.fn().mockRejectedValue(new Error('Backfill error'));

      await analyticsController.adminBackfillSnapshots(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to backfill snapshots',
      });
    });
  });
});
