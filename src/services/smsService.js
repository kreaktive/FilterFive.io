require('dotenv').config();
const twilio = require('twilio');
const { validateSmsTemplate, previewTemplate } = require('../utils/smsTemplateValidator');
const { withRetry, isRetryableError } = require('../utils/retryUtils');
const { getCircuitBreaker } = require('./circuitBreakerService');
const logger = require('./logger');

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(accountSid, authToken);
};

/**
 * Replace template tags in a message with actual values
 * @param {string} template - Message template with {{tags}}
 * @param {string} customerName - Customer's name
 * @param {string} businessName - Business name
 * @param {string} reviewLink - Review URL
 * @returns {string} - Message with tags replaced
 */
const replaceTemplateTags = (template, customerName, businessName, reviewLink) => {
  const name = customerName || 'there';

  return template
    .replace(/\{\{CustomerName\}\}/gi, name)
    .replace(/\{\{BusinessName\}\}/gi, businessName)
    .replace(/\{\{ReviewLink\}\}/gi, reviewLink);
};

/**
 * Get SMS message based on tone preference
 * @param {string} customerName - Customer's first name
 * @param {string} businessName - Business name
 * @param {string} reviewLink - Review URL
 * @param {string} tone - Message tone (friendly, professional, grateful, custom)
 * @param {string} customMessage - Custom message template (used when tone is 'custom')
 * @returns {string} - Formatted SMS message
 */
const getSmsMessage = (customerName, businessName, reviewLink, tone = 'friendly', customMessage = null) => {
  const name = customerName || 'there';

  // Handle custom message
  if (tone === 'custom' && customMessage) {
    const processedMessage = replaceTemplateTags(customMessage, customerName, businessName, reviewLink);
    // Validate that the message contains the review link
    if (!processedMessage.includes(reviewLink) && !customMessage.toLowerCase().includes('{{reviewlink}}')) {
      logger.warn('Custom message does not include review link, appending it');
      return `${processedMessage} ${reviewLink}`;
    }
    return processedMessage;
  }

  // If custom was selected but no message provided, fall back to friendly
  if (tone === 'custom' && !customMessage) {
    logger.warn('Custom tone selected but no custom message provided, falling back to friendly');
    tone = 'friendly';
  }

  const toneMessages = {
    friendly: `Hi ${name}! Thanks for visiting ${businessName}. Reviews help small businesses like ours thrive! Would you mind sharing your experience? ${reviewLink}`,

    professional: `Hello ${name}, thank you for choosing ${businessName}. Your feedback is valuable to us. Please take a moment to leave a review: ${reviewLink}`,

    grateful: `Hi ${name}, we're grateful for your business at ${businessName}! Reviews mean the world to us. Would you share your thoughts? ${reviewLink}`
  };

  return toneMessages[tone] || toneMessages.friendly;
};

/**
 * Send a review request SMS with retry logic and circuit breaker protection
 * @param {string} phone - Phone number in E.164 format
 * @param {string} customerName - Customer's name
 * @param {string} businessName - Business name
 * @param {string} reviewLink - Review URL
 * @param {string} tone - Message tone
 * @param {string} customMessage - Custom message template
 * @returns {Promise<Object>} - Result with messageSid and status
 */
const sendReviewRequest = async (phone, customerName, businessName, reviewLink, tone = 'friendly', customMessage = null) => {
  const circuitBreaker = getCircuitBreaker('twilio');

  // Check circuit breaker first (fail fast if Twilio is down)
  if (!circuitBreaker.canRequest()) {
    const error = new Error('SMS service temporarily unavailable (circuit breaker open)');
    error.code = 'CIRCUIT_OPEN';
    error.circuitState = circuitBreaker.getState();
    logger.error('SMS send blocked by circuit breaker', {
      phoneLast4: phone.slice(-4),
      circuitState: circuitBreaker.getState().state
    });
    throw error;
  }

  // Define the actual send function
  const sendFn = async () => {
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!messagingServiceSid && !twilioPhoneNumber) {
      throw new Error('Twilio Messaging Service SID or phone number not configured');
    }

    const client = getTwilioClient();
    const messageBody = getSmsMessage(customerName, businessName, reviewLink, tone, customMessage);

    const messageOptions = {
      body: messageBody,
      to: phone
    };

    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
    } else {
      messageOptions.from = twilioPhoneNumber;
    }

    return await client.messages.create(messageOptions);
  };

  try {
    // Execute with retry logic
    const message = await withRetry(sendFn, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      shouldRetry: isRetryableError,
      context: {
        operation: 'sendReviewRequest',
        phoneLast4: phone.slice(-4),
        tone
      }
    });

    // Record success with circuit breaker
    circuitBreaker.recordSuccess();

    logger.sms('sent', phone, {
      messageSid: message.sid,
      tone,
      status: message.status
    });

    return {
      success: true,
      messageSid: message.sid,
      status: message.status
    };

  } catch (error) {
    // Record failure with circuit breaker
    circuitBreaker.recordFailure();

    logger.error('SMS sending failed after retries', {
      phoneLast4: phone.slice(-4),
      errorCode: error.code,
      errorMessage: error.message,
      tone
    });

    throw error;
  }
};

/**
 * Send a custom SMS message with retry logic and circuit breaker protection
 * @param {string} phone - Phone number in E.164 format
 * @param {string} message - Custom message body
 * @returns {Promise<Object>} - Twilio message response
 */
const sendSMS = async (phone, message) => {
  const circuitBreaker = getCircuitBreaker('twilio');

  // Check circuit breaker first
  if (!circuitBreaker.canRequest()) {
    const error = new Error('SMS service temporarily unavailable (circuit breaker open)');
    error.code = 'CIRCUIT_OPEN';
    error.circuitState = circuitBreaker.getState();
    logger.error('Custom SMS send blocked by circuit breaker', {
      phoneLast4: phone.slice(-4),
      circuitState: circuitBreaker.getState().state
    });
    throw error;
  }

  // Define the actual send function
  const sendFn = async () => {
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

    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid;
    } else {
      messageOptions.from = twilioPhoneNumber;
    }

    return await client.messages.create(messageOptions);
  };

  try {
    logger.debug('Sending custom SMS', { phoneLast4: phone.slice(-4) });

    // Execute with retry logic
    const result = await withRetry(sendFn, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      shouldRetry: isRetryableError,
      context: {
        operation: 'sendSMS',
        phoneLast4: phone.slice(-4)
      }
    });

    // Record success with circuit breaker
    circuitBreaker.recordSuccess();

    logger.sms('sent', phone, {
      messageSid: result.sid,
      status: result.status
    });

    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
      to: result.to
    };

  } catch (error) {
    // Record failure with circuit breaker
    circuitBreaker.recordFailure();

    logger.error('Custom SMS sending failed after retries', {
      phoneLast4: phone.slice(-4),
      errorCode: error.code,
      errorMessage: error.message
    });

    throw error;
  }
};

module.exports = {
  sendReviewRequest,
  sendSMS,
  getSmsMessage,
  replaceTemplateTags,
  validateSmsTemplate,
  previewTemplate
};
