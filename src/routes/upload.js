// src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');
const { uploadLimiter, smsSendLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(requireAuth);

// GET /dashboard/upload - Show upload form
router.get('/upload', uploadController.showUploadPage);

// POST /dashboard/upload - Parse CSV and show preview
// Rate limited to prevent abuse of CSV processing
router.post(
  '/upload',
  uploadLimiter,
  uploadController.upload.single('csvFile'),
  uploadController.processUpload
);

// GET /dashboard/upload/preview - Show preview with checkboxes
router.get('/upload/preview', uploadController.showPreview);

// POST /dashboard/upload/send - Initiate sending and show progress page
router.post('/upload/send', uploadController.sendToSelected);

// GET /dashboard/upload/progress/:sessionId - SSE stream for real-time progress
router.get('/upload/progress/:sessionId', uploadController.progressStream);

// POST /dashboard/upload/start-sending - Actually trigger the SMS sending
// Rate limited to prevent SMS abuse
router.post('/upload/start-sending', smsSendLimiter, uploadController.startSending);

// GET /dashboard/upload/results - Show final results page
router.get('/upload/results', uploadController.showResults);

// POST /dashboard/upload/add-contact - Add manual contact to upload
router.post('/upload/add-contact', uploadController.addManualContact);

// GET /dashboard/uploads - View upload history
router.get('/uploads', uploadController.showUploadHistory);

// GET /dashboard/uploads/:id - View specific upload details
router.get('/uploads/:id', uploadController.showPreview);

// POST /dashboard/uploads/:id/status - Toggle upload completion status
router.post('/uploads/:id/status', uploadController.toggleUploadStatus);

// POST /dashboard/send-single - Resend SMS to single customer
// Rate limited to prevent SMS abuse
router.post('/send-single', smsSendLimiter, uploadController.sendSingleSMS);

module.exports = router;
