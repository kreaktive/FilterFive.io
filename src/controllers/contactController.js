const { ContactSubmission } = require('../models');
const { sendContactNotification } = require('../services/emailService');
const { isValidEmail } = require('../services/validationService');
const logger = require('../services/logger');
const validator = require('validator');

/**
 * Contact Controller
 * Handles contact form display and submission
 */

/**
 * Show Contact Page
 * GET /contact
 */
const showContact = (req, res) => {
  try {
    return res.render('contact', {
      title: 'Contact Us - Get in Touch | MoreStars',
      description: 'Have questions about MoreStars review management software? Contact our support team for help with sales, billing, integrations, or general inquiries.',
      csrfToken: res.locals.csrfToken
    });
  } catch (error) {
    logger.error('Contact page render error', { error: error.message });
    return res.status(500).render('error', {
      message: 'Unable to load contact page',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

/**
 * Validate Contact Form Data
 * Returns {isValid, errors}
 */
const validateContactForm = (data) => {
  const errors = {};

  // Validate Name
  if (!data.name || typeof data.name !== 'string') {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.trim().length > 255) {
    errors.name = 'Name must be less than 255 characters';
  }

  // Validate Email
  if (!data.email || typeof data.email !== 'string') {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate Phone
  if (!data.phone || typeof data.phone !== 'string') {
    errors.phone = 'Phone number is required';
  } else if (data.phone.trim().length < 10) {
    errors.phone = 'Please enter a valid phone number';
  } else if (data.phone.trim().length > 20) {
    errors.phone = 'Phone number is too long';
  }

  // Validate Business Name
  if (!data.businessName || typeof data.businessName !== 'string') {
    errors.businessName = 'Business name is required';
  } else if (data.businessName.trim().length < 2) {
    errors.businessName = 'Business name must be at least 2 characters';
  } else if (data.businessName.trim().length > 255) {
    errors.businessName = 'Business name must be less than 255 characters';
  }

  // Validate Topic
  const validTopics = ['sales', 'support', 'billing', 'partnership', 'general'];
  if (!data.topic || !validTopics.includes(data.topic)) {
    errors.topic = 'Please select a valid topic';
  }

  // Validate Message
  if (!data.message || typeof data.message !== 'string') {
    errors.message = 'Message is required';
  } else if (data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (data.message.trim().length > 2000) {
    errors.message = 'Message must be less than 2000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Check for Duplicate Submission
 * Prevents spam by checking for duplicate emails with similar messages within 1 hour
 */
const checkDuplicateSubmission = async (email) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const existingSubmission = await ContactSubmission.findOne({
      where: {
        email,
        createdAt: {
          [require('sequelize').Op.gt]: oneHourAgo
        }
      }
    });

    return !!existingSubmission;
  } catch (error) {
    logger.error('Error checking duplicate submission', { email, error: error.message });
    return false; // Don't block on error
  }
};

/**
 * Submit Contact Form
 * POST /contact
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, businessName, topic, message } = req.body;

    // Validate form data
    const validation = validateContactForm({
      name,
      email,
      phone,
      businessName,
      topic,
      message
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      name: validator.escape(name.trim()),
      email: validator.escape(email.trim()),
      phone: phone.trim(),
      businessName: validator.escape(businessName.trim()),
      topic,
      message: validator.escape(message.trim()),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || null
    };

    // Check for duplicate submissions
    const isDuplicate = await checkDuplicateSubmission(sanitizedData.email);
    if (isDuplicate) {
      return res.status(429).json({
        success: false,
        error: 'You have already submitted a message recently. Please wait before submitting another.'
      });
    }

    // Create database record
    const submission = await ContactSubmission.create({
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      businessName: sanitizedData.businessName,
      topic: sanitizedData.topic,
      message: sanitizedData.message,
      ipAddress: sanitizedData.ipAddress,
      userAgent: sanitizedData.userAgent,
      status: 'new'
    });

    logger.info('Contact form submitted', {
      submissionId: submission.id,
      email: sanitizedData.email,
      topic: sanitizedData.topic,
      businessName: sanitizedData.businessName
    });

    // Send email notification to support
    try {
      await sendContactNotification({
        id: submission.id,
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        businessName: sanitizedData.businessName,
        topic: sanitizedData.topic,
        message: sanitizedData.message,
        submittedAt: submission.createdAt
      });
    } catch (emailError) {
      logger.error('Failed to send contact notification email', {
        submissionId: submission.id,
        error: emailError.message
      });
      // Don't fail the submission if email fails - just log it
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you! We received your message and will respond within 24 hours.'
    });
  } catch (error) {
    logger.error('Contact form submission error', {
      error: error.message,
      email: req.body.email
    });

    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing your message. Please try again later.'
    });
  }
};

module.exports = {
  showContact,
  submitContact
};
