require('dotenv').config();
const twilio = require('twilio');

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(accountSid, authToken);
};

const sendReviewRequest = async (phone, customerName, reviewLink) => {
  try {
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Use Messaging Service if available, otherwise fall back to phone number
    if (!messagingServiceSid && !twilioPhoneNumber) {
      throw new Error('Twilio Messaging Service SID or phone number not configured');
    }

    const client = getTwilioClient();

    const messageBody = `Hi ${customerName || 'there'}, thanks for visiting Mike's Mechanics! How did we do? ${reviewLink}`;

    const messageOptions = {
      body: messageBody,
      to: phone
    };

    // Use Messaging Service if available, otherwise use phone number
    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
    } else {
      messageOptions.from = twilioPhoneNumber;
    }

    const message = await client.messages.create(messageOptions);

    console.log(`✓ SMS sent successfully to ${phone} - Message SID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
      status: message.status
    };

  } catch (error) {
    console.error('✗ Twilio SMS sending failed:', error.message);
    throw error;
  }
};

/**
 * Send a custom SMS message
 * @param {string} phone - Phone number in E.164 format
 * @param {string} message - Custom message body
 * @returns {Promise<Object>} - Twilio message response
 */
const sendSMS = async (phone, message) => {
  try {
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!messagingServiceSid && !twilioPhoneNumber) {
      throw new Error('Twilio Messaging Service SID or phone number not configured');
    }

    const client = getTwilioClient();

    const messageOptions = {
      body: message,
      to: phone
    };

    // Use Messaging Service if available, otherwise use phone number
    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
    } else {
      messageOptions.from = twilioPhoneNumber;
    }

    console.log(`📤 Sending custom SMS to ${phone}`);
    const result = await client.messages.create(messageOptions);

    console.log(`✓ Custom SMS sent successfully. SID: ${result.sid}`);

    return {
      messageSid: result.sid,
      status: result.status,
      to: result.to
    };

  } catch (error) {
    console.error('✗ Twilio custom SMS sending failed:', error.message);
    throw error;
  }
};

module.exports = {
  sendReviewRequest,
  sendSMS
};
