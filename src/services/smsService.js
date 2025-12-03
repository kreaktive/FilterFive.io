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

/**
 * Get SMS message based on tone preference
 */
const getSmsMessage = (customerName, businessName, reviewLink, tone = 'friendly') => {
  const name = customerName || 'there';

  const toneMessages = {
    friendly: `Hi ${name}! Thanks for visiting ${businessName}. Reviews help small businesses like ours thrive! Would you mind sharing your experience? ${reviewLink}`,

    professional: `Hello ${name}, thank you for choosing ${businessName}. Your feedback is valuable to us. Please take a moment to leave a review: ${reviewLink}`,

    grateful: `Hi ${name}, we're grateful for your business at ${businessName}! Reviews mean the world to us. Would you share your thoughts? ${reviewLink}`
  };

  return toneMessages[tone] || toneMessages.friendly;
};

const sendReviewRequest = async (phone, customerName, businessName, reviewLink, tone = 'friendly') => {
  try {
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Use Messaging Service if available, otherwise fall back to phone number
    if (!messagingServiceSid && !twilioPhoneNumber) {
      throw new Error('Twilio Messaging Service SID or phone number not configured');
    }

    const client = getTwilioClient();

    // Generate message with tone
    const messageBody = getSmsMessage(customerName, businessName, reviewLink, tone);

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

    console.log(`✓ SMS sent successfully to ${phone} (tone: ${tone}) - Message SID: ${message.sid}`);

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
