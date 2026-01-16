const express = require('express');
const router = express.Router();
const { showReviewByShortCode } = require('../controllers/reviewController');

// GET /r/:shortCode - Short URL redirect to review platform
// New shorter URL format: /r/A7x9Kp2m instead of /review/59183d17-8b19-4bc6-a1e0-9b1049dcf61d
router.get('/:shortCode', showReviewByShortCode);

module.exports = router;
