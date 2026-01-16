const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

// All routes require authentication
router.use(requireAuth);

// GET /dashboard/feedback - Show paginated feedback list with filters
router.get('/feedback', feedbackController.showFeedbackList);

// POST /dashboard/feedback/:id/view - Mark feedback as viewed
router.post('/feedback/:id/view', feedbackController.markAsViewed);

// POST /dashboard/feedback/:id/respond - Send SMS response to customer
router.post('/feedback/:id/respond', feedbackController.respondToFeedback);

// POST /dashboard/feedback/:id/note - Add internal note
router.post('/feedback/:id/note', feedbackController.addInternalNote);

// POST /dashboard/feedback/:id/status - Update feedback status
router.post('/feedback/:id/status', feedbackController.updateStatus);

// POST /dashboard/feedback/bulk-update - Bulk update feedback status
router.post('/feedback/bulk-update', feedbackController.bulkUpdateStatus);

// GET /dashboard/feedback/export - Export feedback to CSV
router.get('/feedback/export', feedbackController.exportFeedback);

// GET /dashboard/feedback/word-cloud - Generate word cloud data
router.get('/feedback/word-cloud', feedbackController.generateWordCloud);

module.exports = router;
