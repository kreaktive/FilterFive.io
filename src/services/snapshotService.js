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

    console.log(`Generating snapshots for ${users.length} users for date: ${snapshotDate.toISOString().split('T')[0]}`);

    let snapshotsCreated = 0;
    let snapshotsUpdated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Get user's locations
        const locations = await this._getUserLocations(user.id);

        // Generate snapshot for each location (+ aggregated)
        const locationsToProcess = [null, ...locations]; // null = all locations

        for (const location of locationsToProcess) {
          const result = await this._generateSnapshotForUserAndLocation(
            user.id,
            snapshotDate,
            location
          );

          if (result.created) {
            snapshotsCreated++;
          } else {
            snapshotsUpdated++;
          }
        }
      } catch (error) {
        console.error(`Error generating snapshot for user ${user.id}:`, error);
        errors++;
      }
    }

    console.log(`✓ Snapshot generation complete:`, {
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
      include: [{
        model: Review,
        as: 'review',
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

    console.log(`Generating timing performance for ${users.length} users`);

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const locations = await this._getUserLocations(user.id);
        const locationsToProcess = [null, ...locations];

        for (const location of locationsToProcess) {
          const result = await this._generateTimingPerformanceForUserAndLocation(
            user.id,
            location
          );

          recordsCreated += result.created;
          recordsUpdated += result.updated;
        }
      } catch (error) {
        console.error(`Error generating timing performance for user ${user.id}:`, error);
        errors++;
      }
    }

    console.log(`✓ Timing performance generation complete:`, {
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
   *
   * @private
   * @param {number} userId - User ID
   * @param {string|null} location - Location name (null for aggregated)
   * @returns {Promise<Object>} Count of created/updated records
   */
  async _generateTimingPerformanceForUserAndLocation(userId, location) {
    let created = 0;
    let updated = 0;

    // Loop through all day/hour combinations (7 days × 24 hours = 168 records)
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      for (let hourOfDay = 0; hourOfDay < 24; hourOfDay++) {
        const requestWhere = { userId };
        if (location) {
          requestWhere.location = location;
        }

        // Get all requests for this time slot (all-time aggregation)
        const requests = await FeedbackRequest.findAll({
          where: requestWhere,
          include: [{
            model: Review,
            as: 'review',
            required: false
          }]
        });

        // Filter by day of week and hour
        const filteredRequests = requests.filter(r => {
          const date = new Date(r.createdAt);
          return date.getDay() === dayOfWeek && date.getHours() === hourOfDay;
        });

        if (filteredRequests.length === 0) {
          continue; // Skip empty time slots
        }

        // Calculate metrics for this time slot
        const requestsSent = filteredRequests.length;
        const requestsClicked = filteredRequests.filter(r => r.linkClickedAt).length;
        const requestsRated = filteredRequests.filter(r => r.review).length;
        const reviewsPositive = filteredRequests.filter(r => r.review && r.review.rating >= 4).length;

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
   * Backfill snapshots for a user (useful for new analytics feature)
   *
   * @param {number} userId - User ID
   * @param {number} [daysBack=90] - Number of days to backfill
   * @returns {Promise<Object>} Summary of backfill operation
   */
  async backfillSnapshots(userId, daysBack = 90) {
    console.log(`Backfilling ${daysBack} days of snapshots for user ${userId}`);

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

    console.log(`✓ Backfill complete for user ${userId}:`, { created, updated });

    return { userId, daysBack, created, updated };
  }
}

// Export singleton instance
module.exports = new SnapshotService();
