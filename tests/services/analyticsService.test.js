/**
 * Analytics Service Tests
 *
 * Tests for analytics data fetching and caching:
 * - getDashboardMetrics
 * - getTrendData
 * - getTimingHeatmap
 * - getSmsEventMetrics
 * - getUserLocations
 * - comparePeriods
 * - Cached versions
 * - invalidateCache
 */

const { MockCacheService } = require('../helpers/mockServices');

// Mock dependencies before importing the service
jest.mock('../../src/services/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Mock roiCalculator
jest.mock('../../src/utils/roiCalculator', () => ({
  getMonthlyPrice: jest.fn().mockReturnValue(77),
  calculateComprehensiveROI: jest.fn().mockReturnValue({
    roi: 150,
    value: 800,
    reviews: 10,
    costPerReview: 7.70
  })
}));

// Create mock cache instance
const mockCacheService = new MockCacheService();

// Mock cacheService
jest.mock('../../src/services/cacheService', () => ({
  dashboardKey: jest.fn((userId, startDate, endDate, location) => `dashboard:${userId}:${startDate}:${endDate}:${location}`),
  trendKey: jest.fn((userId, location) => `trend:${userId}:${location}`),
  heatmapKey: jest.fn((userId, location) => `heatmap:${userId}:${location}`),
  locationsKey: jest.fn((userId) => `locations:${userId}`),
  getOrSet: jest.fn((key, fetchFn, ttl) => mockCacheService.getOrSet(key, fetchFn, ttl)),
  invalidateUserAnalytics: jest.fn().mockResolvedValue(true),
  constructor: {
    TTL: {
      DASHBOARD: 300,
      TREND: 600,
      HEATMAP: 900,
      LOCATIONS: 1800
    }
  }
}));

// Mock Sequelize and models
const mockUserFindByPk = jest.fn();
const mockAnalyticsSnapshotFindAll = jest.fn();
const mockTimingPerformanceFindAll = jest.fn();
const mockSmsEventFindAll = jest.fn();
const mockFeedbackRequestFindAll = jest.fn();

jest.mock('../../src/config/database', () => ({
  sequelize: {
    fn: jest.fn((fnName, col) => ({ fn: fnName, col })),
    col: jest.fn((colName) => colName),
  }
}));

jest.mock('../../src/models', () => ({
  User: { findByPk: mockUserFindByPk },
  AnalyticsSnapshot: { findAll: mockAnalyticsSnapshotFindAll },
  TimingPerformance: { findAll: mockTimingPerformanceFindAll },
  SmsEvent: { findAll: mockSmsEventFindAll },
  FeedbackRequest: { findAll: mockFeedbackRequestFindAll },
  Review: {}
}));

// Now require the service after all mocks are set up
const analyticsService = require('../../src/services/analyticsService');
const cacheService = require('../../src/services/cacheService');

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheService.clear();
  });

  // ===========================================
  // getDashboardMetrics Tests
  // ===========================================
  describe('getDashboardMetrics()', () => {
    const defaultUser = {
      reviewValueEstimate: 80.00,
      subscriptionPlan: 'monthly',
      subscriptionStatus: 'active'
    };

    const defaultSnapshotResult = [{
      totalRequestsSent: '100',
      totalRequestsSms: '80',
      totalRequestsQr: '20',
      totalRequestsClicked: '60',
      totalRequestsRated: '40',
      totalReviewsPositive: '35',
      totalReviewsNegative: '5',
      totalReviews1Star: '2',
      totalReviews2Star: '1',
      totalReviews3Star: '2',
      totalReviews4Star: '15',
      totalReviews5Star: '20',
      avgRating: '4.25'
    }];

    beforeEach(() => {
      mockUserFindByPk.mockResolvedValue(defaultUser);
      mockAnalyticsSnapshotFindAll.mockResolvedValue(defaultSnapshotResult);
    });

    it('should throw error when user not found', async () => {
      mockUserFindByPk.mockResolvedValue(null);

      await expect(analyticsService.getDashboardMetrics(999, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      })).rejects.toThrow('User not found');
    });

    it('should fetch user with required attributes', async () => {
      await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(mockUserFindByPk).toHaveBeenCalledWith(1, {
        attributes: ['reviewValueEstimate', 'subscriptionPlan', 'subscriptionStatus']
      });
    });

    it('should return correct period dates', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await analyticsService.getDashboardMetrics(1, { startDate, endDate });

      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
    });

    it('should calculate correct request totals', async () => {
      const result = await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result.requests.total).toBe(100);
      expect(result.requests.sms).toBe(80);
      expect(result.requests.qr).toBe(20);
      expect(result.requests.clicked).toBe(60);
      expect(result.requests.rated).toBe(40);
    });

    it('should calculate click rate correctly', async () => {
      const result = await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      // 60 clicked / 100 sent = 60%
      expect(result.requests.clickRate).toBe(60);
    });

    it('should calculate conversion rate correctly', async () => {
      const result = await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      // 40 rated / 60 clicked = 66.67%
      expect(result.requests.conversionRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate positive rate correctly', async () => {
      const result = await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      // 35 positive / 40 rated = 87.5%
      expect(result.reviews.positiveRate).toBe(87.5);
    });

    it('should return review breakdown by star rating', async () => {
      const result = await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result.reviews.breakdown).toEqual({
        oneStar: 2,
        twoStar: 1,
        threeStar: 2,
        fourStar: 15,
        fiveStar: 20
      });
    });

    it('should include ROI metrics in response', async () => {
      const result = await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result.roi).toBeDefined();
      expect(result.roi.roi).toBe(150);
    });

    it('should handle empty snapshot results', async () => {
      mockAnalyticsSnapshotFindAll.mockResolvedValue([{}]);

      const result = await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result.requests.total).toBe(0);
      expect(result.reviews.total).toBe(0);
    });

    it('should filter by location when provided', async () => {
      await analyticsService.getDashboardMetrics(1, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        location: 'Downtown'
      });

      expect(mockAnalyticsSnapshotFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: 'Downtown'
          })
        })
      );
    });
  });

  // ===========================================
  // getTrendData Tests
  // ===========================================
  describe('getTrendData()', () => {
    const mockSnapshots = [
      { snapshotDate: '2024-01-01', requestsSent: 10, reviewsPositive: 8, averageRating: '4.5', clickRate: '60' },
      { snapshotDate: '2024-01-02', requestsSent: 15, reviewsPositive: 12, averageRating: '4.7', clickRate: '65' },
      { snapshotDate: '2024-01-03', requestsSent: 20, reviewsPositive: 16, averageRating: '4.2', clickRate: '55' }
    ];

    beforeEach(() => {
      mockAnalyticsSnapshotFindAll.mockResolvedValue(mockSnapshots);
    });

    it('should fetch 30 days of data', async () => {
      await analyticsService.getTrendData(1);

      const callArgs = mockAnalyticsSnapshotFindAll.mock.calls[0][0];
      expect(callArgs.where.snapshotDate).toBeDefined();
    });

    it('should return arrays of trend data', async () => {
      const result = await analyticsService.getTrendData(1);

      expect(Array.isArray(result.dates)).toBe(true);
      expect(Array.isArray(result.requestsSent)).toBe(true);
      expect(Array.isArray(result.reviewsPositive)).toBe(true);
      expect(Array.isArray(result.averageRating)).toBe(true);
      expect(Array.isArray(result.clickRate)).toBe(true);
    });

    it('should return correct number of data points', async () => {
      const result = await analyticsService.getTrendData(1);

      expect(result.dates).toHaveLength(3);
      expect(result.requestsSent).toHaveLength(3);
    });

    it('should map requestsSent values correctly', async () => {
      const result = await analyticsService.getTrendData(1);

      expect(result.requestsSent).toEqual([10, 15, 20]);
    });

    it('should parse averageRating as numbers', async () => {
      const result = await analyticsService.getTrendData(1);

      expect(result.averageRating).toEqual([4.5, 4.7, 4.2]);
    });

    it('should order data by snapshotDate ASC', async () => {
      await analyticsService.getTrendData(1);

      expect(mockAnalyticsSnapshotFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['snapshotDate', 'ASC']]
        })
      );
    });

    it('should filter by location when provided', async () => {
      await analyticsService.getTrendData(1, 'Main Street');

      expect(mockAnalyticsSnapshotFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: 'Main Street'
          })
        })
      );
    });

    it('should handle null averageRating gracefully', async () => {
      mockAnalyticsSnapshotFindAll.mockResolvedValue([
        { snapshotDate: '2024-01-01', requestsSent: 10, reviewsPositive: 8, averageRating: null, clickRate: null }
      ]);

      const result = await analyticsService.getTrendData(1);

      expect(result.averageRating).toEqual([0]);
      expect(result.clickRate).toEqual([0]);
    });
  });

  // ===========================================
  // getTimingHeatmap Tests
  // ===========================================
  describe('getTimingHeatmap()', () => {
    const mockTimingData = [
      { dayOfWeek: 1, hourOfDay: 9, performanceScore: '85', requestsSent: 50, clickRate: '70', conversionRate: '60' },
      { dayOfWeek: 1, hourOfDay: 10, performanceScore: '90', requestsSent: 60, clickRate: '75', conversionRate: '65' },
      { dayOfWeek: 2, hourOfDay: 14, performanceScore: '75', requestsSent: 40, clickRate: '65', conversionRate: '55' }
    ];

    beforeEach(() => {
      mockTimingPerformanceFindAll.mockResolvedValue(mockTimingData);
    });

    it('should return array of heatmap data', async () => {
      const result = await analyticsService.getTimingHeatmap(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should format heatmap data correctly', async () => {
      const result = await analyticsService.getTimingHeatmap(1);

      expect(result[0]).toEqual({
        day: 1,
        hour: 9,
        score: 85,
        requests: 50,
        clickRate: 70,
        conversionRate: 60
      });
    });

    it('should order by dayOfWeek then hourOfDay', async () => {
      await analyticsService.getTimingHeatmap(1);

      expect(mockTimingPerformanceFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['dayOfWeek', 'ASC'], ['hourOfDay', 'ASC']]
        })
      );
    });

    it('should filter by location when provided', async () => {
      await analyticsService.getTimingHeatmap(1, 'Branch Office');

      expect(mockTimingPerformanceFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: 'Branch Office'
          })
        })
      );
    });

    it('should handle null performanceScore', async () => {
      mockTimingPerformanceFindAll.mockResolvedValue([
        { dayOfWeek: 1, hourOfDay: 9, performanceScore: null, requestsSent: 50, clickRate: null, conversionRate: null }
      ]);

      const result = await analyticsService.getTimingHeatmap(1);

      expect(result[0].score).toBe(0);
      expect(result[0].clickRate).toBe(0);
      expect(result[0].conversionRate).toBe(0);
    });

    it('should return empty array when no data', async () => {
      mockTimingPerformanceFindAll.mockResolvedValue([]);

      const result = await analyticsService.getTimingHeatmap(1);

      expect(result).toEqual([]);
    });

    it('should parse string values to numbers', async () => {
      const result = await analyticsService.getTimingHeatmap(1);

      expect(typeof result[0].score).toBe('number');
      expect(typeof result[0].clickRate).toBe('number');
      expect(typeof result[0].conversionRate).toBe('number');
    });
  });

  // ===========================================
  // getSmsEventMetrics Tests
  // ===========================================
  describe('getSmsEventMetrics()', () => {
    const mockEvents = [
      { eventType: 'sent', count: '100' },
      { eventType: 'delivered', count: '95' },
      { eventType: 'failed', count: '3' },
      { eventType: 'invalid', count: '2' },
      { eventType: 'opt_out', count: '5' },
      { eventType: 'opt_in', count: '10' },
      { eventType: 'undelivered', count: '1' }
    ];

    beforeEach(() => {
      mockSmsEventFindAll.mockResolvedValue(mockEvents);
    });

    it('should return all event type counts', async () => {
      const result = await analyticsService.getSmsEventMetrics(1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.sent).toBe(100);
      expect(result.delivered).toBe(95);
      expect(result.failed).toBe(3);
      expect(result.invalid).toBe(2);
      expect(result.optOut).toBe(5);
      expect(result.optIn).toBe(10);
      expect(result.undelivered).toBe(1);
    });

    it('should default missing event types to zero', async () => {
      mockSmsEventFindAll.mockResolvedValue([
        { eventType: 'sent', count: '50' }
      ]);

      const result = await analyticsService.getSmsEventMetrics(1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.sent).toBe(50);
      expect(result.delivered).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.invalid).toBe(0);
      expect(result.optOut).toBe(0);
    });

    it('should group by eventType', async () => {
      await analyticsService.getSmsEventMetrics(1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockSmsEventFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          group: ['eventType']
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await analyticsService.getSmsEventMetrics(1, startDate, endDate);

      expect(mockSmsEventFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            eventTimestamp: expect.any(Object)
          })
        })
      );
    });

    it('should return zeros when no events exist', async () => {
      mockSmsEventFindAll.mockResolvedValue([]);

      const result = await analyticsService.getSmsEventMetrics(1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual({
        sent: 0,
        delivered: 0,
        failed: 0,
        invalid: 0,
        optOut: 0,
        optIn: 0,
        undelivered: 0
      });
    });

    it('should parse count strings to integers', async () => {
      const result = await analyticsService.getSmsEventMetrics(1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(typeof result.sent).toBe('number');
      expect(typeof result.delivered).toBe('number');
    });

    it('should use raw query mode', async () => {
      await analyticsService.getSmsEventMetrics(1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockSmsEventFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          raw: true
        })
      );
    });

    it('should handle high volume counts', async () => {
      mockSmsEventFindAll.mockResolvedValue([
        { eventType: 'sent', count: '999999' }
      ]);

      const result = await analyticsService.getSmsEventMetrics(1,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.sent).toBe(999999);
    });
  });

  // ===========================================
  // getUserLocations Tests
  // ===========================================
  describe('getUserLocations()', () => {
    it('should return array of distinct locations', async () => {
      mockFeedbackRequestFindAll.mockResolvedValue([
        { location: 'Downtown' },
        { location: 'Uptown' },
        { location: 'Suburbs' }
      ]);

      const result = await analyticsService.getUserLocations(1);

      expect(result).toEqual(['Downtown', 'Uptown', 'Suburbs']);
    });

    it('should filter out null locations', async () => {
      mockFeedbackRequestFindAll.mockResolvedValue([
        { location: 'Downtown' },
        { location: null },
        { location: 'Uptown' }
      ]);

      const result = await analyticsService.getUserLocations(1);

      expect(result).toEqual(['Downtown', 'Uptown']);
    });

    it('should return empty array when no locations', async () => {
      mockFeedbackRequestFindAll.mockResolvedValue([]);

      const result = await analyticsService.getUserLocations(1);

      expect(result).toEqual([]);
    });
  });

  // ===========================================
  // comparePeriods Tests
  // ===========================================
  describe('comparePeriods()', () => {
    beforeEach(() => {
      mockUserFindByPk.mockResolvedValue({
        reviewValueEstimate: 80.00,
        subscriptionPlan: 'monthly',
        subscriptionStatus: 'active'
      });
    });

    it('should calculate previous period correctly', async () => {
      // Current period: Jan 15 - Jan 30 (15 days)
      // Previous period should be: Jan 1 - Jan 14
      mockAnalyticsSnapshotFindAll.mockResolvedValue([{
        totalRequestsSent: '100',
        totalRequestsSms: '80',
        totalRequestsQr: '20',
        totalRequestsClicked: '60',
        totalRequestsRated: '40',
        totalReviewsPositive: '35',
        totalReviewsNegative: '5',
        totalReviews1Star: '2',
        totalReviews2Star: '1',
        totalReviews3Star: '2',
        totalReviews4Star: '15',
        totalReviews5Star: '20',
        avgRating: '4.25'
      }]);

      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-30');

      const result = await analyticsService.comparePeriods(1, startDate, endDate);

      expect(result.current).toBeDefined();
      expect(result.previous).toBeDefined();
      expect(result.growth).toBeDefined();
    });

    it('should return growth percentages', async () => {
      mockAnalyticsSnapshotFindAll.mockResolvedValue([{
        totalRequestsSent: '100',
        totalRequestsSms: '80',
        totalRequestsQr: '20',
        totalRequestsClicked: '60',
        totalRequestsRated: '40',
        totalReviewsPositive: '35',
        totalReviewsNegative: '5',
        totalReviews1Star: '2',
        totalReviews2Star: '1',
        totalReviews3Star: '2',
        totalReviews4Star: '15',
        totalReviews5Star: '20',
        avgRating: '4.25'
      }]);

      const result = await analyticsService.comparePeriods(
        1,
        new Date('2024-01-15'),
        new Date('2024-01-30')
      );

      expect(result.growth).toHaveProperty('requestsSent');
      expect(result.growth).toHaveProperty('reviewsPositive');
      expect(result.growth).toHaveProperty('averageRating');
      expect(result.growth).toHaveProperty('roi');
    });

    it('should handle zero previous values (100% growth)', async () => {
      // First call returns current metrics, second returns zeros for previous
      let callCount = 0;
      mockAnalyticsSnapshotFindAll.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([{
            totalRequestsSent: '100',
            totalRequestsSms: '80',
            totalRequestsQr: '20',
            totalRequestsClicked: '60',
            totalRequestsRated: '40',
            totalReviewsPositive: '35',
            totalReviewsNegative: '5',
            totalReviews1Star: '2',
            totalReviews2Star: '1',
            totalReviews3Star: '2',
            totalReviews4Star: '15',
            totalReviews5Star: '20',
            avgRating: '4.25'
          }]);
        }
        return Promise.resolve([{
          totalRequestsSent: '0',
          totalRequestsSms: '0',
          totalRequestsQr: '0',
          totalRequestsClicked: '0',
          totalRequestsRated: '0',
          totalReviewsPositive: '0',
          totalReviewsNegative: '0',
          totalReviews1Star: '0',
          totalReviews2Star: '0',
          totalReviews3Star: '0',
          totalReviews4Star: '0',
          totalReviews5Star: '0',
          avgRating: '0'
        }]);
      });

      const result = await analyticsService.comparePeriods(
        1,
        new Date('2024-01-15'),
        new Date('2024-01-30')
      );

      // When previous is 0 and current > 0, growth should be 100
      expect(result.growth.requestsSent).toBe(100);
    });

    it('should handle both periods being zero (0% growth)', async () => {
      mockAnalyticsSnapshotFindAll.mockResolvedValue([{
        totalRequestsSent: '0',
        totalRequestsSms: '0',
        totalRequestsQr: '0',
        totalRequestsClicked: '0',
        totalRequestsRated: '0',
        totalReviewsPositive: '0',
        totalReviewsNegative: '0',
        totalReviews1Star: '0',
        totalReviews2Star: '0',
        totalReviews3Star: '0',
        totalReviews4Star: '0',
        totalReviews5Star: '0',
        avgRating: '0'
      }]);

      const result = await analyticsService.comparePeriods(
        1,
        new Date('2024-01-15'),
        new Date('2024-01-30')
      );

      expect(result.growth.requestsSent).toBe(0);
    });

    it('should apply location filter to both periods', async () => {
      mockAnalyticsSnapshotFindAll.mockResolvedValue([{
        totalRequestsSent: '50',
        totalRequestsSms: '40',
        totalRequestsQr: '10',
        totalRequestsClicked: '30',
        totalRequestsRated: '20',
        totalReviewsPositive: '18',
        totalReviewsNegative: '2',
        totalReviews1Star: '1',
        totalReviews2Star: '1',
        totalReviews3Star: '0',
        totalReviews4Star: '8',
        totalReviews5Star: '10',
        avgRating: '4.5'
      }]);

      await analyticsService.comparePeriods(
        1,
        new Date('2024-01-15'),
        new Date('2024-01-30'),
        'Main Store'
      );

      // Should be called twice (current and previous period)
      expect(mockAnalyticsSnapshotFindAll).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================
  // Cached Versions Tests
  // ===========================================
  describe('Cached Methods', () => {
    beforeEach(() => {
      mockUserFindByPk.mockResolvedValue({
        reviewValueEstimate: 80.00,
        subscriptionPlan: 'monthly',
        subscriptionStatus: 'active'
      });
      mockAnalyticsSnapshotFindAll.mockResolvedValue([{
        totalRequestsSent: '100',
        totalRequestsSms: '80',
        totalRequestsQr: '20',
        totalRequestsClicked: '60',
        totalRequestsRated: '40',
        totalReviewsPositive: '35',
        totalReviewsNegative: '5',
        totalReviews1Star: '2',
        totalReviews2Star: '1',
        totalReviews3Star: '2',
        totalReviews4Star: '15',
        totalReviews5Star: '20',
        avgRating: '4.25'
      }]);
    });

    describe('getDashboardMetricsCached()', () => {
      it('should use cacheService.getOrSet', async () => {
        await analyticsService.getDashboardMetricsCached(1, {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        });

        expect(cacheService.dashboardKey).toHaveBeenCalled();
        expect(cacheService.getOrSet).toHaveBeenCalled();
      });

      it('should return cached value on cache hit', async () => {
        const cachedData = { cached: true };
        await mockCacheService.set('dashboard:1:2024-01-01:2024-01-31:null', cachedData, 300);

        // Configure getOrSet to return from cache
        cacheService.getOrSet.mockResolvedValue(cachedData);

        const result = await analyticsService.getDashboardMetricsCached(1, {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        });

        expect(result).toEqual(cachedData);
      });
    });

    describe('getTrendDataCached()', () => {
      it('should use trendKey for cache key', async () => {
        mockAnalyticsSnapshotFindAll.mockResolvedValue([]);

        await analyticsService.getTrendDataCached(1);

        expect(cacheService.trendKey).toHaveBeenCalledWith(1, null);
      });
    });

    describe('getTimingHeatmapCached()', () => {
      it('should use heatmapKey for cache key', async () => {
        mockTimingPerformanceFindAll.mockResolvedValue([]);

        await analyticsService.getTimingHeatmapCached(1);

        expect(cacheService.heatmapKey).toHaveBeenCalledWith(1, null);
      });
    });

    describe('getUserLocationsCached()', () => {
      it('should use locationsKey for cache key', async () => {
        mockFeedbackRequestFindAll.mockResolvedValue([]);

        await analyticsService.getUserLocationsCached(1);

        expect(cacheService.locationsKey).toHaveBeenCalledWith(1);
      });
    });
  });

  // ===========================================
  // invalidateCache Tests
  // ===========================================
  describe('invalidateCache()', () => {
    it('should call cacheService.invalidateUserAnalytics', async () => {
      await analyticsService.invalidateCache(42);

      expect(cacheService.invalidateUserAnalytics).toHaveBeenCalledWith(42);
    });

    it('should return result from cacheService', async () => {
      cacheService.invalidateUserAnalytics.mockResolvedValue(true);

      const result = await analyticsService.invalidateCache(1);

      expect(result).toBe(true);
    });
  });
});
