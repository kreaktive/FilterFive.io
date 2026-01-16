/**
 * Abandoned Checkout Cron Job
 *
 * Sends recovery emails:
 * - 30 minutes after checkout initiation (first touchpoint)
 * - 2 hours after checkout initiation (follow-up)
 * Runs every 15 minutes to catch abandoned checkouts.
 *
 * Schedule: *​/15 * * * * (every 15 minutes)
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const { User } = require('../models');
const logger = require('../services/logger');

/**
 * Execute abandoned checkout recovery
 */
async function executeAbandonedCheckoutRecovery() {
  logger.cron('abandoned-checkout', 'started');
  const now = new Date();

  // Lazy load email service
  let sendAbandonedCheckoutEmail, sendAbandonedCheckout30MinEmail, sendAdminAlert;

  try {
    const emailService = require('../services/emailService');
    sendAbandonedCheckoutEmail = emailService.sendAbandonedCheckoutEmail;
    sendAbandonedCheckout30MinEmail = emailService.sendAbandonedCheckout30MinEmail;
    sendAdminAlert = emailService.sendAdminAlert;
  } catch (err) {
    logger.error('Failed to load email service', { error: err.message });
    return;
  }

  const results = {
    sent30Min: 0,
    sent2Hour: 0,
    errors: 0
  };

  try {
    // 30-minute recovery: First touchpoint for users who abandoned 30min-2h ago
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const users30Min = await User.findAll({
      where: {
        checkoutStartedAt: { [Op.between]: [twoHoursAgo, thirtyMinAgo] },
        checkoutRecovery30MinSentAt: null,
        subscriptionStatus: { [Op.in]: ['trial', 'cancelled', 'inactive'] }
      }
    });

    for (const user of users30Min) {
      try {
        if (sendAbandonedCheckout30MinEmail) {
          await sendAbandonedCheckout30MinEmail(user.email, user.businessName);
          await user.update({ checkoutRecovery30MinSentAt: now });
          results.sent30Min++;
          logger.info('Sent 30-min abandoned checkout email', { userId: user.id, email: user.email });
        }
      } catch (err) {
        results.errors++;
        logger.error('Failed to send 30-min abandoned checkout email', {
          userId: user.id,
          error: err.message
        });
      }
    }

    // 2-hour recovery: Follow-up for users who haven't completed after first email
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const abandonedUsers = await User.findAll({
      where: {
        checkoutStartedAt: { [Op.between]: [twelveHoursAgo, twoHoursAgo] },
        checkoutRecoveryEmailSentAt: null,
        subscriptionStatus: { [Op.in]: ['trial', 'cancelled', 'inactive'] }
      }
    });

    for (const user of abandonedUsers) {
      try {
        if (sendAbandonedCheckoutEmail) {
          await sendAbandonedCheckoutEmail(user.email, user.businessName);
          await user.update({ checkoutRecoveryEmailSentAt: now });
          results.sent2Hour++;
          logger.info('Sent 2-hour abandoned checkout email', { userId: user.id, email: user.email });
        }
      } catch (err) {
        results.errors++;
        logger.error('Failed to send abandoned checkout email', {
          userId: user.id,
          error: err.message
        });
      }
    }

    logger.cron('abandoned-checkout', 'completed', results);

  } catch (error) {
    logger.error('Cron job failed: abandoned-checkout', {
      error: error.message,
      stack: error.stack,
      job: 'abandoned-checkout'
    });

    // Send admin alert
    if (sendAdminAlert) {
      try {
        await sendAdminAlert(
          'Cron Job Failed: Abandoned Checkout',
          error.message,
          error.stack,
          { cronJob: 'abandoned-checkout', timestamp: now.toISOString() }
        );
      } catch (alertError) {
        logger.error('Failed to send admin alert', { error: alertError.message });
      }
    }
  }
}

/**
 * Initialize the cron job
 */
function initAbandonedCheckoutCron() {
  const schedule = '*/15 * * * *'; // Every 15 minutes
  logger.info('Scheduling abandoned checkout cron job', { schedule });

  cron.schedule(schedule, executeAbandonedCheckoutRecovery, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
  });

  logger.cron('abandoned-checkout', 'scheduled');
}

module.exports = {
  initAbandonedCheckoutCron,
  executeAbandonedCheckoutRecovery
};
