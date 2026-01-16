const { FeedbackRequest, User } = require('../models');
const { sendReviewRequest } = require('../services/smsService');
const analyticsService = require('../services/analyticsService');
const shortUrlService = require('../services/shortUrlService');
const logger = require('../services/logger');

const receiveCustomerData = async (req, res) => {
  try {
    const { name, phone, tenantId } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate tenant exists
    const tenant = await User.findOne({
      where: { id: tenantId, role: 'tenant', isActive: true }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found or inactive'
      });
    }

    // Create feedback request with short URL
    const { feedbackRequest, reviewLink } = await shortUrlService.createFeedbackRequestWithShortUrl({
      userId: tenantId,
      customerName: name || null,
      customerPhone: phone,
      status: 'pending',
      source: 'zapier'
    });

    logger.info('Feedback request created', {
      uuid: feedbackRequest.uuid,
      shortCode: feedbackRequest.shortCode,
      tenantId
    });

    try {
      const smsResult = await sendReviewRequest(
        phone,
        name || 'there',
        tenant.businessName,
        reviewLink,
        tenant.smsMessageTone || 'friendly',
        tenant.customSmsMessage
      );

      // Update feedback request with SMS sent details
      await feedbackRequest.update({
        status: 'sent',
        smsSentAt: new Date(),
        twilioMessageSid: smsResult.messageSid
      });

      // Invalidate analytics cache
      await analyticsService.invalidateCache(tenantId);

      logger.sms('sent', phone, { shortCode: feedbackRequest.shortCode });

      return res.status(201).json({
        success: true,
        uuid: feedbackRequest.uuid,
        message: 'Feedback request created and SMS sent successfully'
      });

    } catch (smsError) {
      logger.error('SMS sending failed', {
        uuid: feedbackRequest.uuid,
        error: smsError.message,
        errorCode: smsError.code
      });

      // Update feedback request to reflect SMS failure
      await feedbackRequest.update({
        status: 'sms_failed',
        skipReason: smsError.message
      });

      // Check if it's a circuit breaker error (Twilio is down)
      if (smsError.code === 'CIRCUIT_OPEN') {
        return res.status(503).json({
          success: false,
          uuid: feedbackRequest.uuid,
          error: 'SMS service temporarily unavailable. Record created but SMS not sent.',
          retryable: true
        });
      }

      // For other SMS errors, return 207 Multi-Status (partial success)
      // Record was created but SMS failed
      return res.status(207).json({
        success: true,
        uuid: feedbackRequest.uuid,
        message: 'Feedback request created but SMS sending failed',
        smsError: {
          message: smsError.message,
          code: smsError.code,
          retryable: false
        }
      });
    }

  } catch (error) {
    logger.error('Error in receiveCustomerData', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  receiveCustomerData
};
