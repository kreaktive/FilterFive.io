/**
 * Uptime Monitor Cron Job
 *
 * Self-monitoring for MoreStars critical services.
 * Runs every 5 minutes and sends SMS alerts via Twilio when services fail.
 *
 * Schedule: Every 5 minutes (cron: star-slash-5 * * * *)
 *
 * Features:
 * - Only alerts on state CHANGE (down to up or up to down)
 * - Tracks which specific services failed
 * - Sends recovery notification when services come back
 *
 * @module cron/uptime-monitor
 */

const cron = require('node-cron');
const logger = require('../services/logger');

// Alert configuration
const ALERT_PHONE = process.env.UPTIME_ALERT_PHONE || '+17199675177';
const PREFLIGHT_URL = process.env.APP_URL || 'https://morestars.io';

// State tracking (in-memory, resets on restart)
let lastStatus = 'healthy';
let lastFailedServices = [];
let consecutiveFailures = 0;

/**
 * Check preflight endpoint
 */
async function checkPreflight() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${PREFLIGHT_URL}/health/preflight`, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { status: 'critical', error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: 'critical',
      error: error.name === 'AbortError' ? 'Timeout (30s)' : error.message
    };
  }
}

/**
 * Send SMS alert
 */
async function sendAlert(message) {
  try {
    const { sendSMS } = require('../services/smsService');
    await sendSMS(ALERT_PHONE, message);
    logger.info('Uptime alert SMS sent', { phone: ALERT_PHONE.slice(-4) });
  } catch (error) {
    logger.error('Failed to send uptime alert SMS', { error: error.message });
  }
}

/**
 * Get failed services from preflight result
 */
function getFailedServices(result) {
  if (!result.checks) return ['unknown'];

  return Object.entries(result.checks)
    .filter(([_, check]) => check.status !== 'ok')
    .map(([name, check]) => `${name}: ${check.error || check.status}`);
}

/**
 * Execute uptime check
 */
async function executeUptimeCheck() {
  logger.debug('Running uptime check...');

  const result = await checkPreflight();
  const currentStatus = result.status;
  const failedServices = getFailedServices(result);

  // State change: Was healthy, now failing
  if (lastStatus === 'healthy' && currentStatus !== 'healthy') {
    consecutiveFailures++;

    // Alert immediately on critical, wait for 2 consecutive failures on degraded
    if (currentStatus === 'critical' || consecutiveFailures >= 2) {
      const emoji = currentStatus === 'critical' ? '🔴' : '🟡';
      const message = `${emoji} MoreStars ${currentStatus.toUpperCase()}\n\n` +
        `Failed:\n${failedServices.join('\n')}\n\n` +
        `Checking every 5 min`;

      await sendAlert(message);

      logger.warn('Uptime check failed - alert sent', {
        status: currentStatus,
        failedServices,
        consecutiveFailures
      });

      lastStatus = currentStatus;
      lastFailedServices = failedServices;
    } else {
      logger.warn('Uptime check degraded - waiting for confirmation', {
        status: currentStatus,
        failedServices,
        consecutiveFailures
      });
    }
  }

  // State change: Was failing, now healthy (just log, no SMS)
  else if (lastStatus !== 'healthy' && currentStatus === 'healthy') {
    logger.info('Uptime check recovered', {
      previousStatus: lastStatus,
      previousFailures: lastFailedServices
    });

    lastStatus = 'healthy';
    lastFailedServices = [];
    consecutiveFailures = 0;
  }

  // Still failing (no state change, but log it)
  else if (currentStatus !== 'healthy') {
    logger.warn('Uptime check still failing', {
      status: currentStatus,
      failedServices,
      minutesDown: consecutiveFailures * 5
    });
  }

  // Still healthy
  else {
    consecutiveFailures = 0;
    logger.debug('Uptime check passed', { status: currentStatus });
  }
}

/**
 * Initialize the cron job
 */
function initUptimeMonitorCron() {
  // Schedule: Every 5 minutes
  const schedule = '*/5 * * * *';

  logger.info('Scheduling uptime monitor cron job', { schedule, alertPhone: ALERT_PHONE.slice(-4) });

  cron.schedule(schedule, executeUptimeCheck, {
    scheduled: true,
    timezone: 'America/Denver' // Mountain Time for 719 area code
  });

  logger.cron('uptime-monitor', 'scheduled');

  // Run initial check after 30 seconds (let server fully start)
  setTimeout(() => {
    logger.info('Running initial uptime check...');
    executeUptimeCheck();
  }, 30000);
}

/**
 * Manually trigger check (for testing)
 */
async function manualTrigger() {
  logger.info('Manual uptime check triggered');
  await executeUptimeCheck();
}

/**
 * Force send a test alert
 */
async function sendTestAlert() {
  const message = `🧪 MoreStars TEST ALERT\n\nThis is a test. Your uptime monitoring is working!`;
  await sendAlert(message);
  logger.info('Test alert sent');
}

module.exports = {
  initUptimeMonitorCron,
  executeUptimeCheck,
  manualTrigger,
  sendTestAlert
};
