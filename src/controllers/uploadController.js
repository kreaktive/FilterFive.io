// src/controllers/uploadController.js
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit');
const { FeedbackRequest, CsvUpload } = require('../models');
const { validateRow, isDuplicatePhone } = require('../utils/csvValidator');
const smsService = require('../services/smsService');
const { v4: uuidv4 } = require('uuid');

// Configure multer
const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// GET /dashboard/upload - Show upload form
const showUploadPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    res.render('upload', {
      title: 'Upload Customers',
      user: user
    });
  } catch (error) {
    console.error('Upload page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load upload page',
      error: { status: 500 }
    });
  }
};

// POST /dashboard/upload - Parse CSV and show preview
const processUpload = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Load user from session
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Get uploaded file
    if (!req.file) {
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: user,
        error: 'No file uploaded. Please select a CSV file.'
      });
    }

    uploadedFilePath = req.file.path;
    const filename = req.file.originalname;

    console.log(`📄 Parsing CSV upload: ${filename} for user ${user.id}`);

    // Parse CSV
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(uploadedFilePath)
        .pipe(csv({
          mapHeaders: ({ header }) => header.toLowerCase().trim()
        }))
        .on('data', (row) => {
          rows.push({
            name: row.name?.trim() || row.customer_name?.trim() || '',
            phone: row.phone?.trim() || row.customer_phone?.trim() || '',
            email: row.email?.trim() || row.customer_email?.trim() || ''
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Check row count
    if (rows.length === 0) {
      fs.unlinkSync(uploadedFilePath); // Clean up
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: user,
        error: 'CSV file is empty. Please upload a file with customer data.'
      });
    }

    if (rows.length > 500) {
      fs.unlinkSync(uploadedFilePath); // Clean up
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: user,
        error: `Too many rows (${rows.length}). Maximum 500 rows allowed per upload.`
      });
    }

    // Create upload record
    uploadRecord = await CsvUpload.create({
      userId: user.id,
      filename: filename,
      totalRows: rows.length,
      status: 'processing'
    });

    // Validate and categorize rows
    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      // Validate row with smart phone formatting
      const validation = validateRow(row);
      if (!validation.isValid) {
        invalidRows.push({
          ...row,
          rowNumber: rowNumber
        });
        errors.push({
          row: rowNumber,
          name: row.name,
          phone: row.phone,
          error: validation.errors.join(', ')
        });
        continue;
      }

      // Use formatted phone number for duplicate check
      const formattedPhone = validation.phoneFormatted?.formatted || row.phone;

      // Check for duplicates
      const isDuplicate = await isDuplicatePhone(user.id, formattedPhone);
      if (isDuplicate) {
        duplicateRows.push({
          ...row,
          rowNumber: rowNumber,
          phoneFormatted: validation.phoneFormatted
        });
        errors.push({
          row: rowNumber,
          name: row.name,
          phone: row.phone,
          error: 'Duplicate: Already sent SMS to this number in last 30 days'
        });
        continue;
      }

      // Add to valid rows with formatted phone and confidence data
      validRows.push({
        ...row,
        rowNumber,
        phoneOriginal: row.phone,
        phone: formattedPhone, // Use formatted phone
        phoneFormatted: validation.phoneFormatted, // Keep format metadata
        warnings: validation.warnings // Keep warnings
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(uploadedFilePath);

    console.log(`✅ Parsed ${rows.length} rows: ${validRows.length} valid, ${invalidRows.length} invalid, ${duplicateRows.length} duplicates`);

    // Store parsed data in session for preview
    req.session.csvPreview = {
      filename: filename,
      validRows: validRows,
      invalidRows: invalidRows.map((row, i) => ({
        ...row,
        error: errors.find(e => e.phone === row.phone)?.error || 'Invalid data'
      })),
      duplicateRows: duplicateRows.map((row, i) => ({
        ...row,
        error: errors.find(e => e.phone === row.phone)?.error || 'Duplicate'
      })),
      errors: errors,
      totalRows: rows.length,
      uploadedAt: new Date()
    };

    // Save session before redirecting to ensure data persists
    console.log('💾 Saving session data - Session ID:', req.sessionID);
    console.log('💾 Data to save:', {
      filename: req.session.csvPreview.filename,
      validRows: req.session.csvPreview.validRows.length,
      totalRows: req.session.csvPreview.totalRows
    });

    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).render('upload', {
          title: 'Upload Customers',
          user: user,
          error: 'Failed to save upload data. Please try again.'
        });
      }
      console.log('✅ Session saved successfully - redirecting to preview');
      // Redirect to preview page
      res.redirect('/dashboard/upload/preview');
    });

  } catch (error) {
    console.error('CSV parsing error:', error);

    // Clean up file
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    // Re-load user for error render
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    res.status(500).render('upload', {
      title: 'Upload Customers',
      user: user,
      error: `Upload failed: ${error.message}`
    });
  }
};

// GET /dashboard/upload/preview - Show CSV preview with checkboxes
const showPreview = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Get preview data from session
    const previewData = req.session.csvPreview;
    console.log('🔍 Preview page - Session ID:', req.sessionID);
    console.log('🔍 Preview page - Has preview data:', !!previewData);
    if (previewData) {
      console.log('🔍 Preview data found:', {
        filename: previewData.filename,
        validRows: previewData.validRows?.length,
        totalRows: previewData.totalRows
      });
    }

    if (!previewData) {
      console.log('⚠️  No preview data in session - redirecting to upload');
      return res.redirect('/dashboard/upload');
    }

    res.render('upload-preview', {
      title: 'Review Upload',
      user: user,
      preview: previewData
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load preview',
      error: { status: 500 }
    });
  }
};

// POST /dashboard/upload/send - Send SMS to selected customers
const sendToSelected = async (req, res) => {
  const startTime = Date.now();
  let uploadRecord = null;

  try {
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Get preview data from session
    const previewData = req.session.csvPreview;

    console.log('🔍 Send page - Session ID:', req.sessionID);
    console.log('🔍 Send page - Has preview data:', !!previewData);
    console.log('🔍 Send page - Session keys:', Object.keys(req.session));

    if (!previewData) {
      console.log('⚠️  Session data lost - redirecting to upload page');
      console.log('⚠️  Full session:', JSON.stringify(req.session, null, 2));
      return res.redirect('/dashboard/upload');
    }

    console.log(`📤 Sending SMS to selected customers from CSV: ${previewData.filename}`);

    // Get selected row numbers from POST data
    const selectedRows = req.body.selectedRows || [];

    // Convert to array if single value
    const selectedRowNumbers = Array.isArray(selectedRows)
      ? selectedRows.map(Number)
      : [Number(selectedRows)];

    // Filter valid rows to only selected ones
    const rowsToSend = previewData.validRows.filter(row =>
      selectedRowNumbers.includes(row.rowNumber)
    );

    if (rowsToSend.length === 0) {
      return res.status(400).render('upload-preview', {
        title: 'Review Upload',
        user: user,
        preview: previewData,
        error: 'Please select at least one customer to send SMS.'
      });
    }

    console.log(`Sending SMS to ${rowsToSend.length} selected customers`);

    // Create upload record
    uploadRecord = await CsvUpload.create({
      userId: user.id,
      filename: previewData.filename,
      totalRows: previewData.totalRows,
      status: 'processing'
    });

    // Bulk create FeedbackRequests (use camelCase for Sequelize model)
    const feedbackRequests = rowsToSend.map(row => ({
      userId: user.id,
      uuid: uuidv4(),
      customerName: row.name,
      customerPhone: row.phone,
      customerEmail: row.email || null,
      status: 'pending',
      source: 'csv_upload'
    }));

    const createdRequests = await FeedbackRequest.bulkCreate(feedbackRequests);

    // Send SMS with rate limiting
    const limit = pLimit(1);
    const smsDelay = 1000;
    const errors = [];

    const smsResults = await Promise.all(
      createdRequests.map((request, index) =>
        limit(async () => {
          try {
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, smsDelay));
            }

            const baseUrl = process.env.APP_URL || 'http://localhost:3000';
            const reviewLink = `${baseUrl}/review/${request.uuid}`;

            const result = await smsService.sendReviewRequest(
              request.customerPhone,
              request.customerName,
              reviewLink
            );

            const sentAt = new Date();
            await request.update({
              status: 'sent',
              smsSentAt: sentAt,
              twilioMessageSid: result.messageSid
            });

            return {
              success: true,
              requestId: request.id,
              name: request.customerName || '-',
              phone: request.customerPhone,
              sentAt: sentAt,
              twilioSid: result.messageSid,
              reviewLink: reviewLink,
              uuid: request.uuid
            };
          } catch (error) {
            console.error(`SMS failed for ${request.customerPhone}:`, error);
            errors.push({
              row: rowsToSend[index].rowNumber,
              name: request.customerName,
              phone: request.customerPhone,
              error: `SMS failed: ${error.message}`
            });
            return { success: false, requestId: request.id, error: error.message };
          }
        })
      )
    );

    // Calculate results
    const successfulSends = smsResults.filter(r => r.success);
    const failedSends = smsResults.filter(r => !r.success);
    const successCount = successfulSends.length;
    const smsFailedCount = failedSends.length;

    // Update upload record
    const processingTime = Date.now() - startTime;
    await uploadRecord.update({
      validRows: rowsToSend.length,
      successCount: successCount,
      failedCount: smsFailedCount + previewData.invalidRows.length + previewData.duplicateRows.length,
      duplicateCount: previewData.duplicateRows.length,
      errors: [...previewData.errors, ...errors],
      status: successCount > 0 ? 'completed' : 'failed',
      processingTimeMs: processingTime,
      completedAt: new Date()
    });

    // Clear session data
    delete req.session.csvPreview;

    // Render results
    res.render('upload-results', {
      title: 'Upload Results',
      user: user,
      results: {
        filename: previewData.filename,
        totalRows: previewData.totalRows,
        successCount: successCount,
        failedCount: smsFailedCount,
        duplicateCount: previewData.duplicateRows.length,
        invalidCount: previewData.invalidRows.length,
        processingTimeSeconds: Math.round(processingTime / 1000),

        // Detailed arrays for tables
        successfulSends: successfulSends,
        failedSends: errors, // Already has row, name, phone, error
        duplicates: previewData.duplicateRows,
        invalidRows: previewData.invalidRows
      }
    });

  } catch (error) {
    console.error('Send SMS error:', error);

    if (uploadRecord) {
      await uploadRecord.update({
        status: 'failed',
        errors: [{ error: error.message }],
        completedAt: new Date()
      });
    }

    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    res.status(500).render('upload', {
      title: 'Upload Customers',
      user: user,
      error: `Send failed: ${error.message}`
    });
  }
};

// GET /dashboard/uploads - View upload history
const showUploadHistory = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const uploads = await CsvUpload.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.render('upload-history', {
      title: 'Upload History',
      user: user,
      uploads: uploads
    });
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load upload history',
      error: { status: 500 }
    });
  }
};

// POST /dashboard/send-single - Resend SMS to a single customer
const sendSingleSMS = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    console.log(`📤 Resending SMS to: ${name || phone}`);

    // Create feedback request
    const feedbackRequest = await FeedbackRequest.create({
      userId: user.id,
      uuid: uuidv4(),
      customerName: name || '',
      customerPhone: phone,
      customerEmail: null,
      status: 'pending',
      source: 'manual_resend'
    });

    // Send SMS
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const reviewLink = `${baseUrl}/review/${feedbackRequest.uuid}`;

    const result = await smsService.sendReviewRequest(
      feedbackRequest.customerPhone,
      feedbackRequest.customerName,
      reviewLink
    );

    await feedbackRequest.update({
      status: 'sent',
      smsSentAt: new Date(),
      twilioMessageSid: result.messageSid
    });

    console.log(`✅ SMS resent successfully to ${phone}`);

    // Redirect back to previous page or dashboard
    res.redirect('back');

  } catch (error) {
    console.error('Resend SMS error:', error);
    res.status(500).json({
      error: 'Failed to resend SMS',
      message: error.message
    });
  }
};

module.exports = {
  upload,
  showUploadPage,
  processUpload,
  showPreview,
  sendToSelected,
  showUploadHistory,
  sendSingleSMS
};
