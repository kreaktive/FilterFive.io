const { v4: uuidv4 } = require('uuid');
const { FeedbackRequest, User } = require('../models');
const { sendReviewRequest } = require('../services/smsService');

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

    // Generate UUID for the public link
    const generatedUuid = uuidv4();

    // Create feedback request
    const feedbackRequest = await FeedbackRequest.create({
      uuid: generatedUuid,
      userId: tenantId,
      customerName: name || null,
      customerPhone: phone,
      status: 'pending',
      source: 'zapier'
    });

    console.log(`✓ Feedback request created: ${feedbackRequest.uuid} for tenant ${tenant.businessName}`);

    // Construct review link and send SMS
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const reviewLink = `${baseUrl}/review/${feedbackRequest.uuid}`;

    try {
      const smsResult = await sendReviewRequest(
        phone,
        name || 'there',
        user.businessName,
        reviewLink,
        user.smsMessageTone || 'friendly'
      );

      // Update feedback request with SMS sent details
      await feedbackRequest.update({
        status: 'sent',
        smsSentAt: new Date(),
        twilioMessageSid: smsResult.messageSid
      });

      console.log(`✓ SMS sent and feedback request updated to 'sent'`);

    } catch (smsError) {
      console.error(`✗ SMS sending failed, but database record created:`, smsError.message);
      // Continue - we still return success because the record was created
    }

    return res.status(201).json({
      success: true,
      uuid: feedbackRequest.uuid,
      message: 'Feedback request created successfully'
    });

  } catch (error) {
    console.error('Error in receiveCustomerData:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  receiveCustomerData
};
