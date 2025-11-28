const express = require('express');
const router = express.Router();
const {
  showReviewLanding,
  submitRating,
  showFeedbackForm,
  submitComment,
  showThankYou
} = require('../controllers/reviewController');

// GET /review/:uuid - Landing page with star selector
router.get('/:uuid', showReviewLanding);

// POST /review/:uuid/rate - Submit star rating
router.post('/:uuid/rate', submitRating);

// GET /review/:uuid/feedback - Show feedback form
router.get('/:uuid/feedback', showFeedbackForm);

// POST /review/:uuid/comment - Submit feedback comment
router.post('/:uuid/comment', submitComment);

// GET /review/:uuid/thank-you - Thank you page
router.get('/:uuid/thank-you', showThankYou);

module.exports = router;
