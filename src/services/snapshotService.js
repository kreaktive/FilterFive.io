/**
 * Snapshot Service
 *
 * Generates daily analytics snapshots and timing performance aggregations.
 * Runs nightly via cron job to pre-calculate metrics for fast dashboard loading.
 *
 * @module services/snapshotService
 */

const { Op } = require('sequelize');
const {
  AnalyticsSnapshot,
  TimingPerformance,
  FeedbackRequest,
  Review,
  User
} = require('../models');
const logger = require('./logger');

class SnapshotService {
  /**
   * Generate daily snapshots for all active users
   *
   * @param {Date} [targetDate] - Date to generate snapshots for (defaults to yesterday)
   * @returns {Promise<Object>} Summary of snapshots created
   */
  async generateDailySnapshots(targetDate = null) {
    // Default to yesterday (snapshots are for completed days)
    if (!targetDate) {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }

    // Set to start of day (00:00:00)
    const snapshotDate = new Date(targetDate);
    snapshotDate.setHours(0, 0, 0, 0);

    // Get all active users (trial or active subscription)
    const users = await User.findAll({
      where: {
        subscriptionStatus: {
          [Op.in]: ['trial', 'active']
        },
        isActive: true
      },
      attributes: ['id']
    });

    const userIds = users.map(u => u.id);

    logger.cron('snapshot_generation', 'started', { userCount: users.length, date: snapshotDate.toISOString().split('T')[0] });

    // Batch fetch all locations for all users in a single query (fixes N+1)
    const locationsByUser = await this._getAllUsersLocations(userIds);

    let snapshotsCreated = 0;
    let snapshotsUpdated = 0;
    let errors = 0;

    // Process users in parallel batches for better performance
    const BATCH_SIZE = 10;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (user) => {
          const locations = locationsByUser[user.id] || [];
          const locationsToProcess = [null, ...locations]; // null = all locations

          let created = 0;
          let updated = 0;

          for (const location of locationsToProcess) {
            const result = await this._generateSnapshotForUserAndLocation(
              user.id,
              snapshotDate,
              location
            );

            if (result.created) {
              created++;
            } else {
              updated++;
            }
          }

          return { created, updated };
        })
      );

      // Aggregate results from batch
      for (const result of results) {
        if (result.status === 'fulfilled') {
          snapshotsCreated += result.value.created;
          snapshotsUpdated += result.value.updated;
        } else {
          logger.error('Error generating snapshot for user in batch', { error: result.reason?.message });
          errors++;
        }
      }
    }

    logger.cron('snapshot_generation', 'completed', {
      created: snapshotsCreated,
      updated: snapshotsUpdated,
      errors
    });

    return {
      snapshotDate: snapshotDate.toISOString().split('T')[0],
      usersProcessed: users.length,
      snapshotsCreated,
      snapshotsUpdated,
      errors
    };
  }

  /**
   * Generate snapshot for a specific user and location
   *
   * @private
   * @param {number} userId - User ID
   * @param {Date} snapshotDate - Date for snapshot
   * @param {string|null} location - Location name (null for aggregated)
   * @returns {Promise<Object>} Created or updated snapshot with metadata
   */
  async _generateSnapshotForUserAndLocation(userId, snapshotDate, location) {
    // Date range for this snapshot (full day)
    const startOfDay = new Date(snapshotDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(snapshotDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause for feedback requests
    const requestWhere = {
      userId,
      createdAt: {
        [Op.between]: [startOfDay, endOfDay]
      }
    };

    if (location) {
      requestWhere.location = location;
    }

    // Get all feedback requests for this day
    const requests = await FeedbackRequest.findAll({
      where: requestWhere,
      attributes: ['id', 'deliveryMethod', 'linkClickedAt', 'createdAt'],
      include: [{
        model: Review,
        as: 'review',
        attributes: ['rating'], // Only fetch rating - we don't need other Review fields
        required: false
      }]
    });

    // Calculate metrics
    const metrics = {
      requestsSent: requests.length,
      requestsSms: requests.filter(r => r.deliveryMethod === 'sms').length,
      requestsQr: requests.filter(r => r.deliveryMethod === 'qr').length,
      requestsClicked: requests.filter(r => r.linkClickedAt).length,
      requestsRated: requests.filter(r => r.review).length,

      reviewsPositive: requests.filter(r => r.review && r.review.rating >= 4).length,
      reviewsNegative: requests.filter(r => r.review && r.review.rating < 4).length,

      reviews1Star: requests.filter(r => r.review && r.review.rating === 1).length,
      reviews2Star: requests.filter(r => r.review && r.review.rating === 2).length,
      reviews3Star: requests.filter(r => r.review && r.review.rating === 3).length,
      reviews4Star: requests.filter(r => r.review && r.review.rating === 4).length,
      reviews5Star: requests.filter(r => r.review && r.review.rating === 5).length
    };

    // Calculate average rating
    const ratings = requests.filter(r => r.review).map(r => r.review.rating);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;

    // Calculate rates
    const clickRate = metrics.requestsSent > 0
      ? (metrics.requestsClicked / metrics.requestsSent) * 100
      : null;

    const conversionRate = metrics.requestsClicked > 0
      ? (metrics.requestsRated / metrics.requestsClicked) * 100
      : null;

    const positiveRate = metrics.requestsRated > 0
      ? (metrics.reviewsPositive / metrics.requestsRated) * 100
      : null;

    // Upsert snapshot
    const [snapshot, created] = await AnalyticsSnapshot.upsert({
      userId,
      snapshotDate: snapshotDate.toISOString().split('T')[0],
      location,
      ...metrics,
      averageRating: averageRating ? parseFloat(averageRating.toFixed(2)) : null,
      clickRate: clickRate ? parseFloat(clickRate.toFixed(2)) : null,
      conversionRate: conversionRate ? parseFloat(conversionRate.toFixed(2)) : null,
      positiveRate: positiveRate ? parseFloat(positiveRate.toFixed(2)) : null
    }, {
      returning: true
    });

    return { snapshot, created };
  }

  /**
   * Generate timing performance aggregations for all users
   *
   * @returns {Promise<Object>} Summary of timing records created/updated
   */
  async generateTimingPerformance() {
    const users = await User.findAll({
      where: {
        subscriptionStatus: {
          [Op.in]: ['trial', 'active']
        },
        isActive: true
      },
      attributes: ['id']
    });

    const userIds = users.map(u => u.id);

    logger.cron('timing_performance', 'started', { userCount: users.length });

    // Batch fetch all locations for all users in a single query (fixes N+1)
    const locationsByUser = await this._getAllUsersLocations(userIds);

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let errors = 0;

    // Process users in parallel batches for better performance
    const BATCH_SIZE = 5; // Smaller batch for timing (more intensive)
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (user) => {
          const locations = locationsByUser[user.id] || [];
          const locationsToProcess = [null, ...locations];

          let created = 0;
          let updated = 0;

          for (const location of locationsToProcess) {
            const result = await this._generateTimingPerformanceForUserAndLocation(
              user.id,
              location
            );

            created += result.created;
            updated += result.updated;
          }

          return { created, updated };
        })
      );

      // Aggregate results from batch
      for (const result of results) {
        if (result.status === 'fulfilled') {
          recordsCreated += result.value.created;
          recordsUpdated += result.value.updated;
        } else {
          logger.error('Error generating timing performance for user in batch', { error: result.reason?.message });
          errors++;
        }
      }
    }

    logger.cron('timing_performance', 'completed', {
      created: recordsCreated,
      updated: recordsUpdated,
      errors
    });

    return {
      usersProcessed: users.length,
      recordsCreated,
      recordsUpdated,
      errors
    };
  }

  /**
   * Generate timing performance for a specific user and location
   * Optimized: Fetches all requests once and groups by day/hour in memory
   *
   * @private
   * @param {number} userId - User ID
   * @param {string|null} location - Location name (null for aggregated)
   * @returns {Promise<Object>} Count of created/updated records
   */
  async _generateTimingPerformanceForUserAndLocation(userId, location) {
    let created = 0;
    let updated = 0;

    // Fetch ALL requests for this user/location once (instead of 168 times)
    const requestWhere = { userId };
    if (location) {
      requestWhere.location = location;
    }

    const allRequests = await FeedbackRequest.findAll({
      where: requestWhere,
      attributes: ['id', 'linkClickedAt', 'createdAt'],
      include: [{
        model: Review,
        as: 'review',
        attributes: ['rating'],
        required: false
      }]
    });

    // Group requests by day of week and hour in memory
    const requestsByTimeSlot = {};
    for (const request of allRequests) {
      const date = new Date(request.createdAt);
      const dayOfWeek = date.getDay();
      const hourOfDay = date.getHours();
      const key = `${dayOfWeek}-${hourOfDay}`;

      if (!requestsByTimeSlot[key]) {
        requestsByTimeSlot[key] = [];
      }
      requestsByTimeSlot[key].push(request);
    }

    // Process only time slots that have data
    for (const [key, requests] of Object.entries(requestsByTimeSlot)) {
      const [dayOfWeek, hourOfDay] = key.split('-').map(Number);

      // Calculate metrics for this time slot
      const requestsSent = requests.length;
      const requestsClicked = requests.filter(r => r.linkClickedAt).length;
      const requestsRated = requests.filter(r => r.review).length;
      const reviewsPositive = requests.filter(r => r.review && r.review.rating >= 4).length;

      const clickRate = requestsSent > 0
        ? (requestsClicked / requestsSent) * 100
        : null;

      const conversionRate = requestsClicked > 0
        ? (requestsRated / requestsClicked) * 100
        : null;

      const positiveRate = requestsRated > 0
        ? (reviewsPositive / requestsRated) * 100
        : null;

      // Calculate performance score (weighted average)
      const performanceScore = (clickRate && conversionRate && positiveRate)
        ? (clickRate * 0.3) + (conversionRate * 0.3) + (positiveRate * 0.4)
        : null;

      // Upsert timing performance record
      const [record, wasCreated] = await TimingPerformance.upsert({
        userId,
        dayOfWeek,
        hourOfDay,
        location,
        requestsSent,
        requestsClicked,
        requestsRated,
        reviewsPositive,
        clickRate: clickRate ? parseFloat(clickRate.toFixed(2)) : null,
        conversionRate: conversionRate ? parseFloat(conversionRate.toFixed(2)) : null,
        positiveRate: positiveRate ? parseFloat(positiveRate.toFixed(2)) : null,
        performanceScore: performanceScore ? parseFloat(performanceScore.toFixed(2)) : null
      }, {
        returning: true
      });

      if (wasCreated) {
        created++;
      } else {
        updated++;
      }
    }

    return { created, updated };
  }

  /**
   * Get distinct locations for a user
   *
   * @private
   * @param {number} userId - User ID
   * @returns {Promise<Array<string>>} List of location names
   */
  async _getUserLocations(userId) {
    const locations = await FeedbackRequest.findAll({
      where: {
        userId,
        location: {
          [Op.ne]: null
        }
      },
      attributes: [
        [FeedbackRequest.sequelize.fn('DISTINCT', FeedbackRequest.sequelize.col('location')), 'location']
      ],
      raw: true
    });

    return locations.map(l => l.location).filter(Boolean);
  }

  /**
   * Batch fetch distinct locations for multiple users in a single query
   * Returns a map of userId -> array of locations
   *
   * @private
   * @param {Array<number>} userIds - Array of user IDs
   * @returns {Promise<Object>} Map of userId to location arrays
   */
  async _getAllUsersLocations(userIds) {
    if (!userIds.length) {
      return {};
    }

    const locations = await FeedbackRequest.findAll({
      where: {
        userId: { [Op.in]: userIds },
        location: { [Op.ne]: null }
      },
      attributes: ['userId', 'location'],
      group: ['userId', 'location'],
      raw: true
    });

    // Group locations by userId
    const locationsByUser = {};
    for (const row of locations) {
      if (!locationsByUser[row.userId]) {
        locationsByUser[row.userId] = [];
      }
      if (row.location && !locationsByUser[row.userId].includes(row.location)) {
        locationsByUser[row.userId].push(row.location);
      }
    }

    return locationsByUser;
  }

  /**
   * Backfill snapshots for a user (useful for new analytics feature)
   *
   * @param {number} userId - User ID
   * @param {number} [daysBack=90] - Number of days to backfill
   * @returns {Promise<Object>} Summary of backfill operation
   */
  async backfillSnapshots(userId, daysBack = 90) {
    logger.cron('backfill_snapshots', 'started', { userId, daysBack });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let created = 0;
    let updated = 0;

    for (let i = 0; i < daysBack; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);

      const locations = await this._getUserLocations(userId);
      const locationsToProcess = [null, ...locations];

      for (const location of locationsToProcess) {
        const result = await this._generateSnapshotForUserAndLocation(
          userId,
          targetDate,
          location
        );

        if (result.created) {
          created++;
        } else {
          updated++;
        }
      }
    }

    logger.cron('backfill_snapshots', 'completed', { userId, created, updated });

    return { userId, daysBack, created, updated };
  }
}

// Export singleton instance
module.exports = new SnapshotService();
