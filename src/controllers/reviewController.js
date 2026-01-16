const { FeedbackRequest, Review, User } = require('../models');
const logger = require('../services/logger');
const { isValidShortCode } = require('../utils/shortCode');
const validator = require('validator');

/**
 * Helper: Detect review platform from URL
 */
const detectPlatform = (url) => {
  if (!url) return 'custom';
  const urlLower = url.toLowerCase();
  if (urlLower.includes('google.com') || urlLower.includes('g.page')) return 'google';
  if (urlLower.includes('facebook.com')) return 'facebook';
  if (urlLower.includes('yelp.com')) return 'yelp';
  if (urlLower.includes('tripadvisor.com')) return 'tripadvisor';
  return 'custom';
};

// GET /review/:uuid - Direct redirect to review platform (NO RATING COLLECTION)
const showReviewLanding = async (req, res) => {
  try {
    const { uuid } = req.params;

    // SECURITY: Validate UUID format before database query
    if (!uuid || !validator.isUUID(uuid, 4)) {
      return res.status(404).render('thank_you', {
        businessName: 'Business',
        title: 'Not Found',
        message: 'This review link is invalid or has expired.'
      });
    }

    const feedbackRequest = await FeedbackRequest.findOne({
      where: { uuid },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!feedbackRequest) {
      return res.status(404).render('thank_you', {
        businessName: 'Business',
        title: 'Not Found',
        message: 'This review link is invalid or has expired.'
      });
    }

    // Update status to 'clicked' on first click (allow multiple clicks)
    if (feedbackRequest.status === 'sent') {
      await feedbackRequest.update({
        status: 'clicked',
        linkClickedAt: new Date()
      });
    }

    // Check if review URL is configured
    if (!feedbackRequest.user.reviewUrl || feedbackRequest.user.reviewUrl.trim() === '') {
      return res.render('thank_you', {
        businessName: feedbackRequest.user.businessName,
        title: 'Configuration Error',
        message: 'Review link not configured. Please contact the business directly.'
      });
    }

    logger.info('Redirecting to review platform', {
      userId: feedbackRequest.userId,
      platform: detectPlatform(feedbackRequest.user.reviewUrl)
    });

    // DIRECT REDIRECT to review platform (Google-compliant, no rating gate)
    // No Review record created - users can click the link multiple times
    return res.redirect(feedbackRequest.user.reviewUrl);

  } catch (error) {
    logger.error('Error in showReviewLanding', { error: error.message });
    res.status(500).send('Something went wrong');
  }
};

// GET /r/:shortCode - Short URL redirect to review platform
const showReviewByShortCode = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Validate short code format
    if (!isValidShortCode(shortCode)) {
      return res.status(404).render('thank_you', {
        businessName: 'Business',
        title: 'Not Found',
        message: 'This review link is invalid or has expired.'
      });
    }

    const feedbackRequest = await FeedbackRequest.findOne({
      where: { shortCode },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!feedbackRequest) {
      return res.status(404).render('thank_you', {
        businessName: 'Business',
        title: 'Not Found',
        message: 'This review link is invalid or has expired.'
      });
    }

    // Update status to 'clicked' on first click (allow multiple clicks)
    if (feedbackRequest.status === 'sent') {
      await feedbackRequest.update({
        status: 'clicked',
        linkClickedAt: new Date()
      });
    }

    // Check if review URL is configured
    if (!feedbackRequest.user.reviewUrl || feedbackRequest.user.reviewUrl.trim() === '') {
      return res.render('thank_you', {
        businessName: feedbackRequest.user.businessName,
        title: 'Configuration Error',
        message: 'Review link not configured. Please contact the business directly.'
      });
    }

    logger.info('Redirecting to review platform (short URL)', {
      userId: feedbackRequest.userId,
      shortCode,
      platform: detectPlatform(feedbackRequest.user.reviewUrl)
    });

    // DIRECT REDIRECT to review platform (Google-compliant, no rating gate)
    // No Review record created - users can click the link multiple times
    return res.redirect(feedbackRequest.user.reviewUrl);

  } catch (error) {
    logger.error('Error in showReviewByShortCode', { error: error.message });
    res.status(500).send('Something went wrong');
  }
};

// GET /review/:uuid/thank-you - Show thank you page
const showThankYou = async (req, res) => {
  try {
    const { uuid } = req.params;

    // SECURITY: Validate UUID format before database query
    if (!uuid || !validator.isUUID(uuid, 4)) {
      return res.render('thank_you', {
        businessName: 'Business',
        title: 'Thank You',
        message: 'Thank you!'
      });
    }

    const feedbackRequest = await FeedbackRequest.findOne({
      where: { uuid },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    const businessName = feedbackRequest ? feedbackRequest.user.businessName : 'Business';
    const message = 'Thank you for your feedback!';

    res.render('thank_you', {
      businessName: businessName,
      title: 'Thank You',
      message: message
    });

  } catch (error) {
    logger.error('Error in showThankYou', { error: error.message });
    res.render('thank_you', {
      businessName: 'Business',
      title: 'Thank You',
      message: 'Thank you!'
    });
  }
};

module.exports = {
  showReviewLanding,
  showReviewByShortCode,
  showThankYou
};
