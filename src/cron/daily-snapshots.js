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

/**
 * Execute daily snapshot generation
 */
async function executeDailySnapshots() {
  console.log('============================================');
  console.log(`[Cron] Daily Snapshot Generation Started`);
  console.log(`[Cron] Time: ${new Date().toISOString()}`);
  console.log('============================================');

  try {
    // Generate daily snapshots (for yesterday)
    const snapshotResult = await snapshotService.generateDailySnapshots();
    console.log('[Cron] Snapshot generation completed:', snapshotResult);

    // Generate timing performance aggregations
    const timingResult = await snapshotService.generateTimingPerformance();
    console.log('[Cron] Timing performance generation completed:', timingResult);

    console.log('============================================');
    console.log('[Cron] Daily Snapshot Generation Completed Successfully');
    console.log('============================================');
  } catch (error) {
    console.error('============================================');
    console.error('[Cron] ERROR in Daily Snapshot Generation:');
    console.error(error);
    console.error('============================================');

    // TODO: Send error alert to admin
    // You might want to integrate with your alerting system here
  }
}

/**
 * Initialize the cron job
 */
function initDailySnapshotsCron() {
  // Schedule: Every day at 2:00 AM
  // Cron format: minute hour day month dayOfWeek
  const schedule = '0 2 * * *';

  console.log(`[Cron] Scheduling daily snapshots job: ${schedule} (2:00 AM daily)`);

  cron.schedule(schedule, executeDailySnapshots, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // Adjust to your timezone
  });

  console.log('[Cron] Daily snapshots job scheduled successfully');
}

/**
 * Manually trigger snapshot generation (for testing or backfill)
 *
 * @param {Date} [targetDate] - Specific date to generate snapshots for
 */
async function manualTrigger(targetDate = null) {
  console.log('[Manual Trigger] Starting snapshot generation...');
  await executeDailySnapshots(targetDate);
  console.log('[Manual Trigger] Snapshot generation completed');
}

module.exports = {
  initDailySnapshotsCron,
  executeDailySnapshots,
  manualTrigger
};
