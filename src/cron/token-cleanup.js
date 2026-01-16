/**
 * Token Cleanup Cron Job
 *
 * Cleans up expired verification tokens (24h) and password reset tokens (1h).
 * Also cleans up old Stripe webhook events.
 * Runs every 4 hours.
 *
 * Schedule: 0 *​/4 * * * (every 4 hours)
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const { User, StripeWebhookEvent, PosWebhookEvent } = require('../models');
const logger = require('../services/logger');

/**
 * Execute token and webhook cleanup
 */
async function executeTokenCleanup() {
  logger.cron('token-cleanup', 'started');
  const now = new Date();

  const results = {
    verificationTokensCleaned: 0,
    resetTokensCleaned: 0,
    stripeWebhooksCleaned: 0,
    posWebhooksCleaned: 0,
    errors: []
  };

  try {
    // Clean expired verification tokens (24h old)
    const verificationResult = await User.update(
      {
        verificationToken: null,
        verificationTokenExpires: null
      },
      {
        where: {
          verificationToken: { [Op.ne]: null },
          verificationTokenExpires: { [Op.lt]: now }
        }
      }
    );
    results.verificationTokensCleaned = verificationResult[0];

    // Clean expired password reset tokens (1h old)
    const resetResult = await User.update(
      {
        resetPasswordToken: null,
        resetPasswordTokenExpires: null
      },
      {
        where: {
          resetPasswordToken: { [Op.ne]: null },
          resetPasswordTokenExpires: { [Op.lt]: now }
        }
      }
    );
    results.resetTokensCleaned = resetResult[0];

    // Clean old Stripe webhook events (7 days old)
    try {
      const stripeDeleted = await StripeWebhookEvent.cleanup(7);
      results.stripeWebhooksCleaned = stripeDeleted;
    } catch (err) {
      results.errors.push(`Stripe cleanup: ${err.message}`);
      logger.error('Failed to clean Stripe webhook events', { error: err.message });
    }

    // Clean old POS webhook events (7 days old)
    try {
      if (PosWebhookEvent && PosWebhookEvent.cleanup) {
        const posDeleted = await PosWebhookEvent.cleanup(7);
        results.posWebhooksCleaned = posDeleted;
      }
    } catch (err) {
      results.errors.push(`POS cleanup: ${err.message}`);
      logger.error('Failed to clean POS webhook events', { error: err.message });
    }

    logger.cron('token-cleanup', 'completed', results);

  } catch (error) {
    logger.error('Cron job failed: token-cleanup', {
      error: error.message,
      stack: error.stack,
      job: 'token-cleanup'
    });

    // Send admin alert
    try {
      const { sendAdminAlert } = require('../services/emailService');
      await sendAdminAlert(
        'Cron Job Failed: Token Cleanup',
        error.message,
        error.stack,
        { cronJob: 'token-cleanup', timestamp: now.toISOString() }
      );
    } catch (alertError) {
      logger.error('Failed to send admin alert', { error: alertError.message });
    }
  }
}

/**
 * Initialize the cron job
 */
function initTokenCleanupCron() {
  const schedule = '0 */4 * * *'; // Every 4 hours
  logger.info('Scheduling token cleanup cron job', { schedule });

  cron.schedule(schedule, executeTokenCleanup, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
  });

  logger.cron('token-cleanup', 'scheduled');
}

module.exports = {
  initTokenCleanupCron,
  executeTokenCleanup
};
