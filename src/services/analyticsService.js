/**
 * Analytics Service
 *
 * Core service for fetching analytics data for the dashboard.
 * Uses pre-calculated snapshots for performance and real-time data for immediate updates.
 * Includes Redis caching for improved performance.
 *
 * @module services/analyticsService
 */

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const {
  AnalyticsSnapshot,
  TimingPerformance,
  FeedbackRequest,
  Review,
  SmsEvent,
  User
} = require('../models');
const roiCalculator = require('../utils/roiCalculator');
const cacheService = require('./cacheService');

class AnalyticsService {
  /**
   * Get dashboard metrics for a user within a date range
   *
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date (inclusive)
   * @param {Date} options.endDate - End date (inclusive)
   * @param {string} [options.location] - Optional location filter
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics(userId, { startDate, endDate, location = null }) {
    // Fetch user to get review value estimate and subscription info
    const user = await User.findByPk(userId, {
      attributes: ['reviewValueEstimate', 'subscriptionPlan', 'subscriptionStatus']
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Build where clause for snapshots
    const where = {
      userId,
      snapshotDate: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (location) {
      where.location = location;
    }

    // Fetch aggregated metrics from snapshots
    // B7 FIX: Use imported sequelize instance instead of this.sequelize
    const snapshots = await AnalyticsSnapshot.findAll({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('requests_sent')), 'totalRequestsSent'],
        [sequelize.fn('SUM', sequelize.col('requests_sms')), 'totalRequestsSms'],
        [sequelize.fn('SUM', sequelize.col('requests_qr')), 'totalRequestsQr'],
        [sequelize.fn('SUM', sequelize.col('requests_clicked')), 'totalRequestsClicked'],
        [sequelize.fn('SUM', sequelize.col('requests_rated')), 'totalRequestsRated'],
        [sequelize.fn('SUM', sequelize.col('reviews_positive')), 'totalReviewsPositive'],
        [sequelize.fn('SUM', sequelize.col('reviews_negative')), 'totalReviewsNegative'],
        [sequelize.fn('SUM', sequelize.col('reviews_1_star')), 'totalReviews1Star'],
        [sequelize.fn('SUM', sequelize.col('reviews_2_star')), 'totalReviews2Star'],
        [sequelize.fn('SUM', sequelize.col('reviews_3_star')), 'totalReviews3Star'],
        [sequelize.fn('SUM', sequelize.col('reviews_4_star')), 'totalReviews4Star'],
        [sequelize.fn('SUM', sequelize.col('reviews_5_star')), 'totalReviews5Star'],
        [sequelize.fn('AVG', sequelize.col('average_rating')), 'avgRating']
      ],
      raw: true
    });

    const metrics = snapshots[0] || {};

    // Calculate derived metrics
    const requestsSent = parseInt(metrics.totalRequestsSent) || 0;
    const requestsClicked = parseInt(metrics.totalRequestsClicked) || 0;
    const requestsRated = parseInt(metrics.totalRequestsRated) || 0;
    const reviewsPositive = parseInt(metrics.totalReviewsPositive) || 0;
    const reviewsNegative = parseInt(metrics.totalReviewsNegative) || 0;

    const clickRate = requestsSent > 0 ? (requestsClicked / requestsSent) * 100 : 0;
    const conversionRate = requestsClicked > 0 ? (requestsRated / requestsClicked) * 100 : 0;
    const positiveRate = requestsRated > 0 ? (reviewsPositive / requestsRated) * 100 : 0;
    const averageRating = parseFloat(metrics.avgRating) || 0;

    // Calculate ROI
    const subscriptionPrice = roiCalculator.getMonthlyPrice(user.subscriptionPlan);
    const roiMetrics = roiCalculator.calculateComprehensiveROI({
      subscriptionPrice,
      positiveReviews: reviewsPositive,
      reviewValueEstimate: parseFloat(user.reviewValueEstimate),
      subscriptionPlan: user.subscriptionPlan
    });

    return {
      period: {
        startDate,
        endDate
      },
      requests: {
        total: requestsSent,
        sms: parseInt(metrics.totalRequestsSms) || 0,
        qr: parseInt(metrics.totalRequestsQr) || 0,
        clicked: requestsClicked,
        rated: requestsRated,
        clickRate: parseFloat(clickRate.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2))
      },
      reviews: {
        total: requestsRated,
        positive: reviewsPositive,
        negative: reviewsNegative,
        positiveRate: parseFloat(positiveRate.toFixed(2)),
        averageRating: parseFloat(averageRating.toFixed(2)),
        breakdown: {
          oneStar: parseInt(metrics.totalReviews1Star) || 0,
          twoStar: parseInt(metrics.totalReviews2Star) || 0,
          threeStar: parseInt(metrics.totalReviews3Star) || 0,
          fourStar: parseInt(metrics.totalReviews4Star) || 0,
          fiveStar: parseInt(metrics.totalReviews5Star) || 0
        }
      },
      roi: roiMetrics
    };
  }

  /**
   * Get trend data for sparkline charts (last 30 days)
   *
   * @param {number} userId - User ID
   * @param {string} [location] - Optional location filter
   * @returns {Promise<Object>} Trend data for charts
   */
  async getTrendData(userId, location = null) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const where = {
      userId,
      snapshotDate: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (location) {
      where.location = location;
    }

    const snapshots = await AnalyticsSnapshot.findAll({
      where,
      attributes: [
        'snapshotDate',
        'requestsSent',
        'reviewsPositive',
        'averageRating',
        'clickRate'
      ],
      order: [['snapshotDate', 'ASC']],
      raw: true
    });

    return {
      dates: snapshots.map(s => s.snapshotDate),
      requestsSent: snapshots.map(s => s.requestsSent),
      reviewsPositive: snapshots.map(s => s.reviewsPositive),
      averageRating: snapshots.map(s => parseFloat(s.averageRating) || 0),
      clickRate: snapshots.map(s => parseFloat(s.clickRate) || 0)
    };
  }

  /**
   * Get timing heatmap data (day of week × hour of day)
   *
   * @param {number} userId - User ID
   * @param {string} [location] - Optional location filter
   * @returns {Promise<Array>} Heatmap data
   */
  async getTimingHeatmap(userId, location = null) {
    const where = { userId };

    if (location) {
      where.location = location;
    }

    const timingData = await TimingPerformance.findAll({
      where,
      attributes: [
        'dayOfWeek',
        'hourOfDay',
        'performanceScore',
        'requestsSent',
        'clickRate',
        'conversionRate'
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['hourOfDay', 'ASC']
      ],
      raw: true
    });

    // Format for heatmap visualization
    return timingData.map(record => ({
      day: record.dayOfWeek,
      hour: record.hourOfDay,
      score: parseFloat(record.performanceScore) || 0,
      requests: record.requestsSent,
      clickRate: parseFloat(record.clickRate) || 0,
      conversionRate: parseFloat(record.conversionRate) || 0
    }));
  }

  /**
   * Get SMS event metrics (failures, opt-outs, invalid numbers)
   *
   * @param {number} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} SMS event metrics
   */
  async getSmsEventMetrics(userId, startDate, endDate) {
    const where = {
      userId,
      eventTimestamp: {
        [Op.between]: [startDate, endDate]
      }
    };

    // B7 FIX: Use imported sequelize instance
    const events = await SmsEvent.findAll({
      where,
      attributes: [
        'eventType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['eventType'],
      raw: true
    });

    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.eventType] = parseInt(event.count);
    });

    return {
      sent: eventCounts.sent || 0,
      delivered: eventCounts.delivered || 0,
      failed: eventCounts.failed || 0,
      invalid: eventCounts.invalid || 0,
      optOut: eventCounts.opt_out || 0,
      optIn: eventCounts.opt_in || 0,
      undelivered: eventCounts.undelivered || 0
    };
  }

  /**
   * Get list of locations for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Array<string>>} List of location names
   */
  async getUserLocations(userId) {
    // B7 FIX: Use imported sequelize instance
    const locations = await FeedbackRequest.findAll({
      where: {
        userId,
        location: {
          [Op.ne]: null
        }
      },
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('location')), 'location']
      ],
      raw: true
    });

    return locations.map(l => l.location).filter(Boolean);
  }

  /**
   * Compare current period with previous period
   *
   * @param {number} userId - User ID
   * @param {Date} startDate - Current period start date
   * @param {Date} endDate - Current period end date
   * @param {string} [location] - Optional location filter
   * @returns {Promise<Object>} Comparison metrics with growth percentages
   */
  async comparePeriods(userId, startDate, endDate, location = null) {
    // Calculate previous period (same duration)
    const duration = endDate - startDate;
    const previousStart = new Date(startDate.getTime() - duration);
    const previousEnd = new Date(startDate.getTime() - 1);

    const currentMetrics = await this.getDashboardMetrics(userId, { startDate, endDate, location });
    const previousMetrics = await this.getDashboardMetrics(userId, {
      startDate: previousStart,
      endDate: previousEnd,
      location
    });

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current: currentMetrics,
      previous: previousMetrics,
      growth: {
        requestsSent: parseFloat(calculateGrowth(
          currentMetrics.requests.total,
          previousMetrics.requests.total
        ).toFixed(2)),
        reviewsPositive: parseFloat(calculateGrowth(
          currentMetrics.reviews.positive,
          previousMetrics.reviews.positive
        ).toFixed(2)),
        averageRating: parseFloat(calculateGrowth(
          currentMetrics.reviews.averageRating,
          previousMetrics.reviews.averageRating
        ).toFixed(2)),
        roi: parseFloat(calculateGrowth(
          currentMetrics.roi.roi,
          previousMetrics.roi.roi
        ).toFixed(2))
      }
    };
  }

  // ============================================
  // Cached versions of analytics methods
  // ============================================

  /**
   * Get dashboard metrics with caching
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Dashboard metrics (from cache or fresh)
   */
  async getDashboardMetricsCached(userId, { startDate, endDate, location = null }) {
    const cacheKey = cacheService.dashboardKey(userId, startDate, endDate, location);

    return cacheService.getOrSet(
      cacheKey,
      () => this.getDashboardMetrics(userId, { startDate, endDate, location }),
      cacheService.constructor.TTL.DASHBOARD
    );
  }

  /**
   * Get trend data with caching
   * @param {number} userId - User ID
   * @param {string} [location] - Optional location filter
   * @returns {Promise<Object>} Trend data (from cache or fresh)
   */
  async getTrendDataCached(userId, location = null) {
    const cacheKey = cacheService.trendKey(userId, location);

    return cacheService.getOrSet(
      cacheKey,
      () => this.getTrendData(userId, location),
      cacheService.constructor.TTL.TREND
    );
  }

  /**
   * Get timing heatmap with caching
   * @param {number} userId - User ID
   * @param {string} [location] - Optional location filter
   * @returns {Promise<Array>} Heatmap data (from cache or fresh)
   */
  async getTimingHeatmapCached(userId, location = null) {
    const cacheKey = cacheService.heatmapKey(userId, location);

    return cacheService.getOrSet(
      cacheKey,
      () => this.getTimingHeatmap(userId, location),
      cacheService.constructor.TTL.HEATMAP
    );
  }

  /**
   * Get user locations with caching
   * @param {number} userId - User ID
   * @returns {Promise<Array<string>>} Location list (from cache or fresh)
   */
  async getUserLocationsCached(userId) {
    const cacheKey = cacheService.locationsKey(userId);

    return cacheService.getOrSet(
      cacheKey,
      () => this.getUserLocations(userId),
      cacheService.constructor.TTL.LOCATIONS
    );
  }

  /**
   * Invalidate all cached analytics for a user
   * Call this when data changes (new SMS sent, review received, etc.)
   * @param {number} userId - User ID
   */
  async invalidateCache(userId) {
    return cacheService.invalidateUserAnalytics(userId);
  }
}

// Export singleton instance
module.exports = new AnalyticsService();
