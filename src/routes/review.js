const express = require('express');
const router = express.Router();
const {
  showReviewLanding,
  showReviewByShortCode,
  showThankYou
} = require('../controllers/reviewController');

// GET /review/:uuid - Direct redirect to review platform (Google-compliant)
// Kept for backwards compatibility with existing SMS links
router.get('/:uuid', showReviewLanding);

// GET /review/:uuid/thank-you - Thank you page
router.get('/:uuid/thank-you', showThankYou);

// REMOVED ROUTES (review gating removed):
// - POST /review/:uuid/rate (rating collection)
// - GET /review/:uuid/feedback (feedback form)
// - POST /review/:uuid/comment (feedback submission)

module.exports = router;
