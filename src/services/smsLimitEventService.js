/**
 * SMS Limit Event Service
 *
 * Handles logging and alerting when users hit or approach their SMS limits.
 * Provides visibility into limit events for admin monitoring.
 */

const { SmsEvent, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('./logger');

// Alert configuration
const ALERT_CONFIG = {
  // Send alert when user hits these thresholds (percentage of limit)
  warningThreshold: 0.8,  // 80% - approaching limit
  criticalThreshold: 1.0, // 100% - limit reached

  // Cooldown to prevent spam (don't re-alert same user within this period)
  alertCooldownHours: 24,

  // Admin phone for SMS alerts (optional)
  adminPhone: process.env.ADMIN_ALERT_PHONE || null,

  // Alert email - same as business alerts (signups, trials, etc.)
  alertEmail: process.env.BUSINESS_ALERTS_EMAIL || 'kristian@kreaktive.design',

  // Enable/disable different alert types
  emailAlerts: true,
  smsAlerts: process.env.ADMIN_ALERT_PHONE ? true : false
};

class SmsLimitEventService {
  /**
   * Log a limit reached event and send alerts
   *
   * @param {Object} params - Event parameters
   * @param {number} params.userId - User ID
   * @param {number} params.currentUsage - Current SMS usage count
   * @param {number} params.limit - SMS limit
   * @param {string} params.attemptedAction - What the user was trying to do
   * @param {number} params.requestedCount - Number of SMS attempted
   */
  async logLimitReached({ userId, currentUsage, limit, attemptedAction, requestedCount = 1 }) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'businessName', 'smsUsageCount', 'smsUsageLimit']
      });

      if (!user) {
        logger.error('Cannot log limit event - user not found', { userId });
        return;
      }

      // Create the event record
      await SmsEvent.create({
        userId,
        phoneNumber: 'N/A', // No specific phone for limit events
        eventType: 'limit_reached',
        errorMessage: `Limit reached: ${currentUsage}/${limit}. Attempted: ${attemptedAction} (${requestedCount} SMS)`,
        eventTimestamp: new Date()
      });

      logger.warn('SMS limit reached', {
        userId,
        email: user.email,
        businessName: user.businessName,
        currentUsage,
        limit,
        attemptedAction,
        requestedCount
      });

      // Check if we should send alerts
      await this._maybeAlert(user, 'limit_reached', currentUsage, limit);

    } catch (error) {
      // Don't throw - logging failures shouldn't break the main flow
      logger.error('Failed to log limit reached event', { userId, error: error.message });
    }
  }

  /**
   * Log a limit warning event (user approaching limit)
   *
   * @param {Object} params - Event parameters
   * @param {number} params.userId - User ID
   * @param {number} params.currentUsage - Current SMS usage count
   * @param {number} params.limit - SMS limit
   */
  async logLimitWarning({ userId, currentUsage, limit }) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'businessName']
      });

      if (!user) return;

      const percentUsed = (currentUsage / limit) * 100;

      await SmsEvent.create({
        userId,
        phoneNumber: 'N/A',
        eventType: 'limit_warning',
        errorMessage: `Usage at ${percentUsed.toFixed(0)}%: ${currentUsage}/${limit}`,
        eventTimestamp: new Date()
      });

      logger.info('SMS limit warning', {
        userId,
        email: user.email,
        businessName: user.businessName,
        percentUsed: percentUsed.toFixed(1),
        currentUsage,
        limit
      });

      // Check if we should send alerts
      await this._maybeAlert(user, 'limit_warning', currentUsage, limit);

    } catch (error) {
      logger.error('Failed to log limit warning event', { userId, error: error.message });
    }
  }

  /**
   * Check if user should trigger a warning (80%+ usage)
   *
   * @param {number} currentUsage - Current usage
   * @param {number} limit - Usage limit
   * @returns {boolean}
   */
  shouldWarn(currentUsage, limit) {
    if (limit <= 0) return false;
    return currentUsage >= (limit * ALERT_CONFIG.warningThreshold) && currentUsage < limit;
  }

  /**
   * Get recent limit events for admin dashboard
   *
   * @param {Object} options - Query options
   * @param {number} options.days - Number of days to look back (default 7)
   * @param {number} options.limit - Max results (default 100)
   * @returns {Promise<Array>}
   */
  async getRecentLimitEvents({ days = 7, limit = 100 } = {}) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await SmsEvent.findAll({
      where: {
        eventType: {
          [Op.in]: ['limit_reached', 'limit_warning']
        },
        eventTimestamp: {
          [Op.gte]: since
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'businessName', 'smsUsageCount', 'smsUsageLimit', 'subscriptionStatus']
      }],
      order: [['eventTimestamp', 'DESC']],
      limit
    });

    return events;
  }

  /**
   * Get users currently at or near their SMS limit
   *
   * @param {Object} options - Query options
   * @param {number} options.thresholdPercent - Minimum usage percentage (default 80)
   * @returns {Promise<Array>}
   */
  async getUsersNearLimit({ thresholdPercent = 80 } = {}) {
    const users = await User.findAll({
      where: {
        smsUsageLimit: {
          [Op.gt]: 0
        }
      },
      attributes: [
        'id', 'email', 'businessName', 'smsUsageCount', 'smsUsageLimit',
        'subscriptionStatus', 'createdAt'
      ],
      order: [['smsUsageCount', 'DESC']]
    });

    // Filter to users at or above threshold
    const threshold = thresholdPercent / 100;
    return users.filter(u => {
      const percentUsed = u.smsUsageCount / u.smsUsageLimit;
      return percentUsed >= threshold;
    }).map(u => ({
      ...u.toJSON(),
      percentUsed: ((u.smsUsageCount / u.smsUsageLimit) * 100).toFixed(1),
      remaining: u.smsUsageLimit - u.smsUsageCount,
      atLimit: u.smsUsageCount >= u.smsUsageLimit
    }));
  }

  /**
   * Get limit event statistics
   *
   * @param {Object} options - Query options
   * @param {number} options.days - Number of days to analyze (default 30)
   * @returns {Promise<Object>}
   */
  async getLimitStats({ days = 30 } = {}) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [limitReachedCount, limitWarningCount, uniqueUsers] = await Promise.all([
      SmsEvent.count({
        where: {
          eventType: 'limit_reached',
          eventTimestamp: { [Op.gte]: since }
        }
      }),
      SmsEvent.count({
        where: {
          eventType: 'limit_warning',
          eventTimestamp: { [Op.gte]: since }
        }
      }),
      SmsEvent.count({
        where: {
          eventType: 'limit_reached',
          eventTimestamp: { [Op.gte]: since }
        },
        distinct: true,
        col: 'userId'
      })
    ]);

    return {
      period: `Last ${days} days`,
      limitReachedEvents: limitReachedCount,
      limitWarningEvents: limitWarningCount,
      uniqueUsersHitLimit: uniqueUsers
    };
  }

  /**
   * Internal: Check if we should send an alert and do so if needed
   */
  async _maybeAlert(user, eventType, currentUsage, limit) {
    try {
      // Check cooldown - don't spam alerts
      const cooldownSince = new Date();
      cooldownSince.setHours(cooldownSince.getHours() - ALERT_CONFIG.alertCooldownHours);

      const recentAlert = await SmsEvent.findOne({
        where: {
          userId: user.id,
          eventType: eventType,
          eventTimestamp: { [Op.gte]: cooldownSince }
        },
        order: [['eventTimestamp', 'DESC']]
      });

      // If alerted recently (within last 24h for same event type), skip
      // But allow if this is the very first time (the one we just created)
      if (recentAlert && recentAlert.createdAt < new Date(Date.now() - 1000)) {
        logger.debug('Skipping alert - within cooldown period', { userId: user.id, eventType });
        return;
      }

      // Send email alert to business alerts email (same as signup/trial notifications)
      if (ALERT_CONFIG.emailAlerts) {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const emailTemplates = require('./emailTemplates');

        const subject = eventType === 'limit_reached'
          ? `[MoreStars] Client hit SMS limit: ${user.businessName}`
          : `[MoreStars] Client approaching SMS limit: ${user.businessName}`;

        const percentUsed = ((currentUsage / limit) * 100).toFixed(0);

        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'MoreStars <noreply@morestars.io>',
          to: ALERT_CONFIG.alertEmail,
          subject,
          html: emailTemplates.adminAlertEmail(
            subject,
            `Client SMS limit ${eventType === 'limit_reached' ? 'reached' : 'warning'}`,
            null,
            {
              client: user.businessName,
              email: user.email,
              userId: user.id,
              usage: `${currentUsage}/${limit} (${percentUsed}%)`,
              remaining: limit - currentUsage,
              status: eventType === 'limit_reached' ? 'BLOCKED' : 'WARNING'
            }
          )
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        logger.info('Sent SMS limit alert email', {
          userId: user.id,
          eventType,
          toEmail: ALERT_CONFIG.alertEmail,
          emailId: result?.data?.id
        });
      }

      // Send SMS alert (if configured)
      if (ALERT_CONFIG.smsAlerts && ALERT_CONFIG.adminPhone && eventType === 'limit_reached') {
        // Only SMS for critical (limit reached), not warnings
        try {
          const smsService = require('./smsService');
          await smsService.sendSMS(
            ALERT_CONFIG.adminPhone,
            `[MoreStars Alert] ${user.businessName} hit SMS limit (${currentUsage}/${limit}). User: ${user.email}`
          );
          logger.info('Sent admin SMS alert for SMS limit', { userId: user.id });
        } catch (smsError) {
          logger.error('Failed to send admin SMS alert', { error: smsError.message });
        }
      }

    } catch (error) {
      logger.error('Failed to send limit alert', { userId: user.id, error: error.message });
    }
  }
}

// Export singleton instance
module.exports = new SmsLimitEventService();
