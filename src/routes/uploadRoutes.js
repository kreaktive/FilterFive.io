// src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

// All routes require authentication
router.use(requireAuth);

// GET /dashboard/upload - Show upload form
router.get('/upload', uploadController.showUploadPage);

// POST /dashboard/upload - Parse CSV and show preview
router.post(
  '/upload',
  uploadController.upload.single('csvFile'),
  uploadController.processUpload
);

// GET /dashboard/upload/preview - Show preview with checkboxes
router.get('/upload/preview', uploadController.showPreview);

// POST /dashboard/upload/send - Send SMS to selected customers
router.post('/upload/send', uploadController.sendToSelected);

// GET /dashboard/uploads - View upload history
router.get('/uploads', uploadController.showUploadHistory);

// POST /dashboard/send-single - Resend SMS to single customer
router.post('/send-single', uploadController.sendSingleSMS);

module.exports = router;
