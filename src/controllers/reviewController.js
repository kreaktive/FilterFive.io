const { FeedbackRequest, Review, User } = require('../models');
const { sendNegativeFeedbackAlert } = require('../services/emailService');

// GET /review/:uuid - Landing page
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
        title: 'Not Found'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      where: { feedbackRequestId: feedbackRequest.id }
    });

    if (existingReview) {
      return res.render('thank_you', {
        businessName: feedbackRequest.user.businessName,
        title: 'Already Reviewed'
      });
    }

    // Update status to 'clicked'
    if (feedbackRequest.status === 'sent') {
      await feedbackRequest.update({
        status: 'clicked',
        linkClickedAt: new Date()
      });
    }

    res.render('landing', {
      uuid: feedbackRequest.uuid,
      businessName: feedbackRequest.user.businessName,
      title: 'How did we do?'
    });

  } catch (error) {
    console.error('Error in showReviewLanding:', error);
    res.status(500).send('Something went wrong');
  }
};

// POST /review/:uuid/rate - Handle star rating
const submitRating = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rating'
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
      return res.status(404).json({
        success: false,
        error: 'Feedback request not found'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      where: { feedbackRequestId: feedbackRequest.id }
    });

    if (existingReview) {
      return res.json({
        action: 'thank_you'
      });
    }

    // Determine redirect destination for high ratings (4-5 stars)
    let redirectTo = null;
    let redirectUrl = null;

    if (rating >= 4) {
      if (feedbackRequest.user.googleReviewLink) {
        redirectTo = 'google';
        redirectUrl = feedbackRequest.user.googleReviewLink;
      } else if (feedbackRequest.user.facebookLink) {
        redirectTo = 'facebook';
        redirectUrl = feedbackRequest.user.facebookLink;
      }
    }

    // Create review record
    await Review.create({
      feedbackRequestId: feedbackRequest.id,
      userId: feedbackRequest.userId,
      rating: rating,
      redirectedTo: redirectTo || 'thank_you',
      isPublic: rating >= 4
    });

    // Update feedback request status
    await feedbackRequest.update({
      status: 'rated'
    });

    // Return action based on rating
    if (rating >= 4) {
      if (redirectUrl) {
        return res.json({
          action: 'redirect',
          url: redirectUrl
        });
      } else {
        return res.json({
          action: 'thank_you'
        });
      }
    } else {
      return res.json({
        action: 'feedback_form'
      });
    }

  } catch (error) {
    console.error('Error in submitRating:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// GET /review/:uuid/feedback - Show feedback form
const showFeedbackForm = async (req, res) => {
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
      return res.status(404).send('Not found');
    }

    res.render('feedback_form', {
      uuid: feedbackRequest.uuid,
      businessName: feedbackRequest.user.businessName,
      title: 'Tell us more'
    });

  } catch (error) {
    console.error('Error in showFeedbackForm:', error);
    res.status(500).send('Something went wrong');
  }
};

// POST /review/:uuid/comment - Handle feedback submission
const submitComment = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required'
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
      return res.status(404).json({
        success: false,
        error: 'Feedback request not found'
      });
    }

    // Find existing review
    const review = await Review.findOne({
      where: { feedbackRequestId: feedbackRequest.id }
    });

    if (review) {
      await review.update({
        feedbackText: comment
      });
    }

    // Send email notification to tenant
    try {
      await sendNegativeFeedbackAlert(
        feedbackRequest.user.email,
        feedbackRequest.customerName || 'Anonymous',
        review ? review.rating : 1,
        comment,
        feedbackRequest.customerPhone
      );

      // Mark email as sent
      if (review) {
        await review.update({
          emailSentToTenant: true
        });
      }

      console.log(`✓ Negative feedback alert sent to ${feedbackRequest.user.email}`);
    } catch (emailError) {
      console.error('✗ Failed to send email alert:', emailError.message);
      // Continue even if email fails - don't block the user
    }

    res.json({
      action: 'thank_you'
    });

  } catch (error) {
    console.error('Error in submitComment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
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

    res.render('thank_you', {
      businessName: businessName,
      title: 'Thank You'
    });

  } catch (error) {
    console.error('Error in showThankYou:', error);
    res.render('thank_you', {
      businessName: 'Business',
      title: 'Thank You'
    });
  }
};

module.exports = {
  showReviewLanding,
  submitRating,
  showFeedbackForm,
  submitComment,
  showThankYou
};
