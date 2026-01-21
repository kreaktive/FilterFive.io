/**
 * Webhook Routes
 * Handles external webhooks (Stripe, UptimeRobot, etc.)
 *
 * IMPORTANT: Webhooks need raw body for signature verification
 * These routes must be registered BEFORE express.json() middleware
 */

const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/subscriptionController');
const logger = require('../services/logger');

// Stripe webhook
// Note: This route needs express.raw() middleware for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), handleWebhook);

/**
 * Test uptime alert - sends a test SMS to verify monitoring works
 * GET /webhooks/test-alert?key=API_SECRET
 */
router.get('/test-alert', async (req, res) => {
  // Require API secret for security
  if (req.query.key !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Invalid key' });
  }

  try {
    const { sendTestAlert } = require('../cron/uptime-monitor');
    await sendTestAlert();
    res.json({ success: true, message: 'Test alert sent' });
  } catch (error) {
    logger.error('Test alert failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * UptimeRobot Webhook
 * Receives downtime alerts and sends SMS via Twilio
 *
 * UptimeRobot sends POST with form data:
 * - monitorID, monitorURL, monitorFriendlyName
 * - alertType (1=down, 2=up, 3=ssl expiry)
 * - alertDetails, alertDuration
 */
router.post('/uptimerobot', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const {
      monitorFriendlyName,
      monitorURL,
      alertType,
      alertTypeFriendlyName,
      alertDetails,
      alertDuration
    } = req.body;

    // Alert types: 1 = down, 2 = up, 3 = SSL expiry warning
    const alertTypeNames = {
      '1': '🔴 DOWN',
      '2': '🟢 UP',
      '3': '⚠️ SSL EXPIRING'
    };

    const statusEmoji = alertTypeNames[alertType] || alertTypeFriendlyName || 'ALERT';

    // Build SMS message
    let message = `MoreStars ${statusEmoji}\n${monitorFriendlyName}`;

    if (alertType === '2' && alertDuration) {
      // Include downtime duration when coming back up
      const minutes = Math.round(parseInt(alertDuration) / 60);
      message += `\nWas down for ${minutes} min`;
    }

    if (alertDetails) {
      message += `\n${alertDetails}`;
    }

    // Send SMS via Twilio
    const ALERT_PHONE = process.env.UPTIME_ALERT_PHONE || '+17199675177';
    const { sendSMS } = require('../services/smsService');

    await sendSMS(ALERT_PHONE, message);

    logger.info('UptimeRobot alert SMS sent', {
      monitor: monitorFriendlyName,
      alertType: statusEmoji,
      phone: ALERT_PHONE.slice(-4)
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('UptimeRobot webhook failed', { error: error.message });
    // Return 200 anyway so UptimeRobot doesn't retry
    res.status(200).json({ success: false, error: error.message });
  }
});

module.exports = router;
