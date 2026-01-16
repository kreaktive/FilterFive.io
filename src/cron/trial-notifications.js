/**
 * Trial Notifications Cron Job
 *
 * Sends trial expiration warning emails at 7 days, 3 days, 1 day, and day-of.
 * Also sends verification reminder emails at 24h for unverified users.
 * Runs every hour to catch users in their correct notification window.
 *
 * Schedule: 0 * * * * (top of every hour)
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const { User } = require('../models');
const logger = require('../services/logger');

/**
 * Execute trial notifications
 */
async function executeTrialNotifications() {
  logger.cron('trial-notifications', 'started');
  const now = new Date();

  // Lazy load email service to avoid circular dependencies
  let sendTrialWarning7DaysEmail, sendTrialEndingEmail, sendTrialWarning1DayEmail, sendTrialExpiredEmail, sendAdminAlert, sendVerificationReminderEmail;

  try {
    const emailService = require('../services/emailService');
    sendTrialWarning7DaysEmail = emailService.sendTrialWarning7DaysEmail;
    sendTrialEndingEmail = emailService.sendTrialEndingEmail;
    sendTrialWarning1DayEmail = emailService.sendTrialWarning1DayEmail;
    sendTrialExpiredEmail = emailService.sendTrialExpiredEmail;
    sendVerificationReminderEmail = emailService.sendVerificationReminderEmail;
    sendAdminAlert = emailService.sendAdminAlert;
  } catch (err) {
    logger.error('Failed to load email service', { error: err.message });
    return;
  }

  const results = {
    sentVerificationReminder: 0,
    sent7Day: 0,
    sent3Day: 0,
    sent1Day: 0,
    sentExpired: 0,
    errors: 0
  };

  try {
    // Verification reminder: 24h after signup, still unverified
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const unverifiedUsers = await User.findAll({
      where: {
        isVerified: false,
        verificationReminderSentAt: null,
        verificationToken: { [Op.ne]: null }, // Has a valid token
        createdAt: { [Op.between]: [fortyEightHoursAgo, twentyFourHoursAgo] }
      }
    });

    for (const user of unverifiedUsers) {
      try {
        if (sendVerificationReminderEmail) {
          await sendVerificationReminderEmail(user.email, user.businessName, user.verificationToken);
          await user.update({ verificationReminderSentAt: now });
          results.sentVerificationReminder++;
          logger.info('Sent verification reminder email', { userId: user.id, email: user.email });
        }
      } catch (err) {
        results.errors++;
        logger.error('Failed to send verification reminder', { userId: user.id, error: err.message });
      }
    }

    // 7-day warning: trial ends between 6-7 days from now
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sixDaysOut = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    const users7Day = await User.findAll({
      where: {
        subscriptionStatus: 'trial',
        isVerified: true,
        trialEndsAt: { [Op.between]: [sixDaysOut, sevenDaysOut] },
        trialWarning7DaySentAt: null
      }
    });

    for (const user of users7Day) {
      try {
        if (sendTrialWarning7DaysEmail) {
          await sendTrialWarning7DaysEmail(user.email, user.businessName, user.trialEndsAt);
          await user.update({ trialWarning7DaySentAt: now });
          results.sent7Day++;
          logger.info('Sent 7-day trial warning', { userId: user.id, email: user.email });
        }
      } catch (err) {
        results.errors++;
        logger.error('Failed to send 7-day warning', { userId: user.id, error: err.message });
      }
    }

    // 3-day warning: trial ends between 2-3 days from now
    const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const twoDaysOut = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const users3Day = await User.findAll({
      where: {
        subscriptionStatus: 'trial',
        isVerified: true,
        trialEndsAt: { [Op.between]: [twoDaysOut, threeDaysOut] },
        trialWarning3DaySentAt: null
      }
    });

    for (const user of users3Day) {
      try {
        if (sendTrialEndingEmail) {
          await sendTrialEndingEmail(user.email, user.businessName, user.trialEndsAt);
          await user.update({ trialWarning3DaySentAt: now });
          results.sent3Day++;
          logger.info('Sent 3-day trial warning', { userId: user.id, email: user.email });
        }
      } catch (err) {
        results.errors++;
        logger.error('Failed to send 3-day warning', { userId: user.id, error: err.message });
      }
    }

    // 1-day warning: trial ends between 0-1 days from now
    const oneDayOut = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const users1Day = await User.findAll({
      where: {
        subscriptionStatus: 'trial',
        isVerified: true,
        trialEndsAt: { [Op.between]: [now, oneDayOut] },
        trialWarning1DaySentAt: null
      }
    });

    for (const user of users1Day) {
      try {
        if (sendTrialWarning1DayEmail) {
          await sendTrialWarning1DayEmail(user.email, user.businessName, user.trialEndsAt);
          await user.update({ trialWarning1DaySentAt: now });
          results.sent1Day++;
          logger.info('Sent 1-day trial warning', { userId: user.id, email: user.email });
        }
      } catch (err) {
        results.errors++;
        logger.error('Failed to send 1-day warning', { userId: user.id, error: err.message });
      }
    }

    // Trial expired: trial ended in past 24h, email not sent
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const usersExpired = await User.findAll({
      where: {
        subscriptionStatus: 'trial',
        isVerified: true,
        trialEndsAt: { [Op.between]: [oneDayAgo, now] },
        trialExpiredEmailSentAt: null
      }
    });

    for (const user of usersExpired) {
      try {
        if (sendTrialExpiredEmail) {
          await sendTrialExpiredEmail(user.email, user.businessName);
          await user.update({
            trialExpiredEmailSentAt: now,
            marketingStatus: 'trial_expired'
          });
          results.sentExpired++;
          logger.info('Sent trial expired email', { userId: user.id, email: user.email });
        }
      } catch (err) {
        results.errors++;
        logger.error('Failed to send expired email', { userId: user.id, error: err.message });
      }
    }

    logger.cron('trial-notifications', 'completed', results);

  } catch (error) {
    logger.error('Cron job failed: trial-notifications', {
      error: error.message,
      stack: error.stack,
      job: 'trial-notifications'
    });

    // Send admin alert
    if (sendAdminAlert) {
      try {
        await sendAdminAlert(
          'Cron Job Failed: Trial Notifications',
          error.message,
          error.stack,
          { cronJob: 'trial-notifications', timestamp: now.toISOString() }
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
function initTrialNotificationsCron() {
  const schedule = '0 * * * *'; // Every hour
  logger.info('Scheduling trial notifications cron job', { schedule });

  cron.schedule(schedule, executeTrialNotifications, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
  });

  logger.cron('trial-notifications', 'scheduled');
}

module.exports = {
  initTrialNotificationsCron,
  executeTrialNotifications
};
