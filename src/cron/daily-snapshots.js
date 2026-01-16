/**
 * Daily Snapshots Cron Job
 *
 * Runs every night at 2:00 AM to generate analytics snapshots for all users.
 * Snapshots are pre-calculated metrics that make dashboard loading 10x faster.
 *
 * Schedule: 0 2 * * * (2:00 AM every day)
 *
 * @module cron/daily-snapshots
 */

const cron = require('node-cron');
const snapshotService = require('../services/snapshotService');
const { sendAdminAlert } = require('../services/emailService');
const logger = require('../services/logger');

/**
 * Execute daily snapshot generation
 */
async function executeDailySnapshots() {
  logger.cron('daily-snapshots', 'started');

  try {
    // Generate daily snapshots (for yesterday)
    const snapshotResult = await snapshotService.generateDailySnapshots();
    logger.cron('daily-snapshots', 'snapshots-completed', { result: snapshotResult });

    // Generate timing performance aggregations
    const timingResult = await snapshotService.generateTimingPerformance();
    logger.cron('daily-snapshots', 'timing-completed', { result: timingResult });

    logger.cron('daily-snapshots', 'completed');
  } catch (error) {
    logger.error('Cron job failed: daily-snapshots', {
      error: error.message,
      stack: error.stack,
      job: 'daily-snapshots'
    });

    // Send error alert to admin
    await sendAdminAlert(
      'Cron Job Failed: Daily Snapshots',
      error.message,
      error.stack,
      { cronJob: 'daily-snapshots', timestamp: new Date().toISOString() }
    );
  }
}

/**
 * Initialize the cron job
 */
function initDailySnapshotsCron() {
  // Schedule: Every day at 2:00 AM
  // Cron format: minute hour day month dayOfWeek
  const schedule = '0 2 * * *';

  logger.info('Scheduling daily snapshots cron job', { schedule, timezone: 'America/Los_Angeles' });

  cron.schedule(schedule, executeDailySnapshots, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // Adjust to your timezone
  });

  logger.cron('daily-snapshots', 'scheduled');
}

/**
 * Manually trigger snapshot generation (for testing or backfill)
 *
 * @param {Date} [targetDate] - Specific date to generate snapshots for
 */
async function manualTrigger(targetDate = null) {
  logger.info('Manual snapshot generation triggered', { targetDate });
  await executeDailySnapshots(targetDate);
  logger.info('Manual snapshot generation completed');
}

module.exports = {
  initDailySnapshotsCron,
  executeDailySnapshots,
  manualTrigger
};
