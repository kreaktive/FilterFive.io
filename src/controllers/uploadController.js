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
    res.render('upload', {
      title: 'Upload Customers',
      user: req.user
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

// POST /dashboard/upload - Process CSV
const processUpload = async (req, res) => {
  const startTime = Date.now();
  let uploadRecord = null;
  let uploadedFilePath = null;

  try {
    // Get uploaded file
    if (!req.file) {
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: req.user,
        error: 'No file uploaded. Please select a CSV file.'
      });
    }

    uploadedFilePath = req.file.path;
    const filename = req.file.originalname;

    console.log(`Processing CSV upload: ${filename} for user ${req.user.id}`);

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
        user: req.user,
        error: 'CSV file is empty. Please upload a file with customer data.'
      });
    }

    if (rows.length > 500) {
      fs.unlinkSync(uploadedFilePath); // Clean up
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: req.user,
        error: `Too many rows (${rows.length}). Maximum 500 rows allowed per upload.`
      });
    }

    // Create upload record
    uploadRecord = await CsvUpload.create({
      userId: req.user.id,
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

      // Validate row
      const validation = validateRow(row);
      if (!validation.isValid) {
        invalidRows.push(row);
        errors.push({
          row: rowNumber,
          name: row.name,
          phone: row.phone,
          error: validation.errors.join(', ')
        });
        continue;
      }

      // Check for duplicates
      const isDuplicate = await isDuplicatePhone(req.user.id, row.phone);
      if (isDuplicate) {
        duplicateRows.push(row);
        errors.push({
          row: rowNumber,
          name: row.name,
          phone: row.phone,
          error: 'Duplicate: Already sent SMS to this number in last 30 days'
        });
        continue;
      }

      validRows.push({ ...row, rowNumber });
    }

    // Bulk create FeedbackRequests
    const feedbackRequests = validRows.map(row => ({
      user_id: req.user.id,
      uuid: uuidv4(),
      customer_name: row.name,
      customer_phone: row.phone,
      customer_email: row.email || null,
      status: 'pending',
      source: 'csv_upload'
    }));

    const createdRequests = await FeedbackRequest.bulkCreate(feedbackRequests);

    // Send SMS with rate limiting (1 per second)
    const limit = pLimit(1); // Concurrency: 1
    const smsDelay = 1000; // 1 second between each SMS

    const smsResults = await Promise.all(
      createdRequests.map((request, index) =>
        limit(async () => {
          try {
            // Wait before sending (rate limiting)
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, smsDelay));
            }

            const result = await smsService.sendSMS(
              request.customer_phone,
              request.customer_name,
              request.uuid
            );

            // Update status
            await request.update({
              status: 'sent',
              sms_sent_at: new Date(),
              twilio_message_sid: result.messageSid
            });

            return { success: true, requestId: request.id };
          } catch (error) {
            console.error(`SMS failed for ${request.customer_phone}:`, error);
            errors.push({
              row: validRows[index].rowNumber,
              name: request.customer_name,
              phone: request.customer_phone,
              error: `SMS failed: ${error.message}`
            });
            return { success: false, requestId: request.id, error: error.message };
          }
        })
      )
    );

    // Calculate results
    const successCount = smsResults.filter(r => r.success).length;
    const smsFailedCount = smsResults.filter(r => !r.success).length;
    const totalFailedCount = invalidRows.length + smsFailedCount;

    // Update upload record
    const processingTime = Date.now() - startTime;
    await uploadRecord.update({
      validRows: validRows.length,
      successCount: successCount,
      failedCount: totalFailedCount,
      duplicateCount: duplicateRows.length,
      errors: errors,
      status: successCount > 0 ? 'completed' : 'failed',
      processingTimeMs: processingTime,
      completedAt: new Date()
    });

    // Clean up uploaded file
    fs.unlinkSync(uploadedFilePath);

    // Render results
    res.render('upload-results', {
      title: 'Upload Results',
      user: req.user,
      results: {
        filename: filename,
        totalRows: rows.length,
        successCount: successCount,
        failedCount: totalFailedCount,
        duplicateCount: duplicateRows.length,
        errors: errors,
        processingTimeSeconds: Math.round(processingTime / 1000)
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);

    // Clean up file
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    // Update upload record if exists
    if (uploadRecord) {
      await uploadRecord.update({
        status: 'failed',
        errors: [{ error: error.message }],
        completedAt: new Date()
      });
    }

    res.status(500).render('upload', {
      title: 'Upload Customers',
      user: req.user,
      error: `Upload failed: ${error.message}`
    });
  }
};

// GET /dashboard/uploads - View upload history
const showUploadHistory = async (req, res) => {
  try {
    const uploads = await CsvUpload.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.render('upload-history', {
      title: 'Upload History',
      user: req.user,
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

module.exports = {
  upload,
  showUploadPage,
  processUpload,
  showUploadHistory
};
