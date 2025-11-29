// src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

// All routes require authentication
router.use(requireAuth);

// GET /dashboard/upload - Show upload form
router.get('/upload', uploadController.showUploadPage);

// POST /dashboard/upload - Process CSV
router.post(
  '/upload',
  uploadController.upload.single('csvFile'),
  uploadController.processUpload
);

// GET /dashboard/uploads - View upload history
router.get('/uploads', uploadController.showUploadHistory);

module.exports = router;
