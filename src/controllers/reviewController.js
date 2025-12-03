const { FeedbackRequest, Review, User } = require('../models');

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

    // Check if already reviewed
    const existingReview = await Review.findOne({
      where: { feedbackRequestId: feedbackRequest.id }
    });

    if (existingReview) {
      return res.render('thank_you', {
        businessName: feedbackRequest.user.businessName,
        title: 'Already Reviewed',
        message: 'Thank you! You\'ve already left your feedback.'
      });
    }

    // Update status to 'clicked'
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

    // Create review record for tracking (no rating collected)
    await Review.create({
      feedbackRequestId: feedbackRequest.id,
      userId: feedbackRequest.userId,
      rating: 5, // Default for tracking purposes only (not collected from user)
      redirectedTo: detectPlatform(feedbackRequest.user.reviewUrl),
      isPublic: true
    });

    console.log(`✓ Redirecting to review platform: ${feedbackRequest.user.reviewUrl}`);

    // DIRECT REDIRECT to review platform (Google-compliant, no rating gate)
    return res.redirect(feedbackRequest.user.reviewUrl);

  } catch (error) {
    console.error('Error in showReviewLanding:', error);
    res.status(500).send('Something went wrong');
  }
};

// GET /review/:uuid/thank-you - Show thank you page
const showThankYou = async (req, res) => {
  try {
    const { uuid } = req.params;

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
    console.error('Error in showThankYou:', error);
    res.render('thank_you', {
      businessName: 'Business',
      title: 'Thank You',
      message: 'Thank you!'
    });
  }
};

module.exports = {
  showReviewLanding,
  showThankYou
};
