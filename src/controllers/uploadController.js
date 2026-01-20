// src/controllers/uploadController.js
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit');
const { FeedbackRequest, CsvUpload, User } = require('../models');
const { validateRow, batchCheckDuplicatePhones } = require('../utils/csvValidator');
const { processCSVStream, validateFileSize } = require('../utils/csvStreamProcessor');
const smsService = require('../services/smsService');
const smsLimitService = require('../services/smsLimitService');
const shortUrlService = require('../services/shortUrlService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

// Store for SSE progress streams (keyed by sessionId)
const progressStreams = new Map();

// Helper to send SSE progress event
const sendProgressEvent = (sessionId, data) => {
  const res = progressStreams.get(sessionId);
  if (res && !res.finished) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

// Configure multer
// S10 FIX: Validate both extension AND MIME type for CSV uploads
const ALLOWED_CSV_MIMES = [
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel', // Excel sometimes sends CSVs with this
  'text/x-csv'
];

const upload = multer({
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check extension
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    // S10 FIX: Also check MIME type to prevent disguised files
    if (!ALLOWED_CSV_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
    cb(null, true);
  }
});

// GET /dashboard/upload - Show upload form
const showUploadPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    // Always fetch fresh user data to ensure we have the latest reviewUrl
    const user = await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Prevent browser caching of this page
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.render('upload', {
      title: 'Upload Customers',
      user: user,
      blocked: false,
      message: null
    });
  } catch (error) {
    logger.error('Upload page error', { error: error.message });
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

    logger.info('Processing upload', {
      userId: user.id,
      hasReviewUrl: !!user.reviewUrl,
      reviewUrlValue: user.reviewUrl?.substring(0, 30) + '...',
      hasFile: !!req.file
    });

    // Get uploaded file
    if (!req.file) {
      return res.status(400).render('upload', {
        title: 'Upload Customers',
        user: user,
        blocked: false,
        error: 'No file uploaded. Please select a CSV file.'
      });
    }

    uploadedFilePath = req.file.path;
    const filename = req.file.originalname;

    logger.info('Parsing CSV upload', { filename, userId: user.id });

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
            phone: row.phone?.trim() || row.customer_phone?.trim() || row.number?.trim() || row.mobile?.trim() || row.cell?.trim() || '',
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

    // First pass: validate all rows and collect formatted phones
    const validatedRows = [];
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
      validatedRows.push({
        row,
        rowNumber,
        formattedPhone,
        validation
      });
    }

    // Batch check all phones for duplicates (single query instead of N)
    const phonesToCheck = validatedRows.map(r => r.formattedPhone);
    const duplicateMap = await batchCheckDuplicatePhones(user.id, phonesToCheck);

    // Second pass: categorize based on duplicate check results
    for (const { row, rowNumber, formattedPhone, validation } of validatedRows) {
      const duplicateCheck = duplicateMap.get(formattedPhone) || { isDuplicate: false, lastContactedAt: null };

      if (duplicateCheck.isDuplicate) {
        // Format the date for display
        const contactDate = duplicateCheck.lastContactedAt
          ? new Date(duplicateCheck.lastContactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'within last 30 days';

        duplicateRows.push({
          ...row,
          rowNumber: rowNumber,
          phoneFormatted: validation.phoneFormatted,
          lastContactedAt: duplicateCheck.lastContactedAt
        });
        errors.push({
          row: rowNumber,
          name: row.name,
          phone: row.phone,
          error: `Duplicate: Already contacted on ${contactDate}`
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

    logger.info('CSV parsing complete', { totalRows: rows.length, validRows: validRows.length, invalidRows: invalidRows.length, duplicateRows: duplicateRows.length });

    // Build parsed data object
    const parsedData = {
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

    // Store parsed data in database for persistence
    await uploadRecord.update({
      parsedData: parsedData,
      validRows: validRows.length,
      duplicateCount: duplicateRows.length,
      failedCount: invalidRows.length
    });

    logger.info('Parsed data saved to database', { uploadId: uploadRecord.id });

    // Store just the upload ID in session (lightweight)
    req.session.csvUploadId = uploadRecord.id;

    req.session.save((err) => {
      if (err) {
        logger.error('Session save error', { error: err.message });
        return res.status(500).render('upload', {
          title: 'Upload Customers',
          user: user,
          error: 'Failed to save upload data. Please try again.'
        });
      }
      logger.debug('Session saved successfully - redirecting to preview');
      // Redirect to preview page
      res.redirect('/dashboard/upload/preview');
    });

  } catch (error) {
    logger.error('CSV parsing error', { error: error.message });

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
// Also handles /dashboard/uploads/:id for viewing past uploads
const showPreview = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { User } = require('../models');

    // Load full user data including SMS settings (not from req.user which has limited attributes)
    const user = await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }


    // Get upload ID from URL param (for history links) or session (for fresh uploads)
    const uploadId = req.params.id || req.session.csvUploadId;

    let previewData = null;
    let uploadRecord = null;

    if (uploadId) {
      // Load from database
      uploadRecord = await CsvUpload.findOne({
        where: { id: uploadId, userId: user.id }
      });

      if (uploadRecord && uploadRecord.parsedData) {
        previewData = uploadRecord.parsedData;
        logger.debug('Preview data loaded from database', {
          uploadId: uploadRecord.id,
          filename: previewData.filename,
          validRows: previewData.validRows?.length,
          totalRows: previewData.totalRows
        });
      }
    }

    if (!previewData) {
      // Check if this is a historical upload without parsedData
      if (uploadRecord && !uploadRecord.parsedData) {
        logger.info('Viewing historical upload without parsedData', { uploadId: uploadRecord.id });
        return res.render('upload-preview', {
          title: 'Upload Details',
          user: user,
          preview: null,
          uploadRecord: uploadRecord,
          isHistorical: true,
          alreadySent: uploadRecord.status === 'completed'
        });
      }

      logger.warn('No preview data found - redirecting to upload');
      return res.redirect('/dashboard/upload');
    }

    // Check if this upload has been worked on (status is not_started, in_progress, or completed)
    const alreadySent = uploadRecord && ['not_started', 'in_progress', 'completed'].includes(uploadRecord.status);

    res.render('upload-preview', {
      title: 'Review Upload',
      user: user,
      preview: previewData,
      uploadId: uploadRecord?.id,
      uploadStatus: uploadRecord?.status,
      alreadySent: alreadySent
    });
  } catch (error) {
    logger.error('Preview error', { error: error.message });
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load preview',
      error: { status: 500 }
    });
  }
};

// POST /dashboard/upload/send - Initiate sending and show progress page
const sendToSelected = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Get upload ID from form body (for existing uploads) or session (for fresh uploads)
    const uploadId = req.body.uploadId || req.session.csvUploadId;

    logger.debug('Send page', { sessionId: req.sessionID, uploadId, fromBody: !!req.body.uploadId });

    let previewData = null;
    let uploadRecord = null;

    if (uploadId) {
      // Load from database - allow any status so users can send in batches
      uploadRecord = await CsvUpload.findOne({
        where: { id: uploadId, userId: user.id }
      });

      if (uploadRecord && uploadRecord.parsedData) {
        previewData = uploadRecord.parsedData;
      }
    }

    if (!previewData) {
      logger.warn('No preview data found - redirecting to upload page');
      return res.redirect('/dashboard/upload');
    }

    // Get selected row numbers from POST data
    const selectedRows = req.body.selectedRows || [];
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

    // Check SMS limit BEFORE sending
    const smsLimit = user.smsLimit || 100;
    const smsUsed = user.smsUsageCount || 0;
    const remainingLimit = smsLimit - smsUsed;

    if (rowsToSend.length > remainingLimit) {
      return res.status(400).render('upload-preview', {
        title: 'Review Upload',
        user: user,
        preview: previewData,
        error: `SMS limit exceeded. You can only send ${remainingLimit} more SMS this period. Please select fewer contacts or upgrade your plan.`
      });
    }

    logger.info('Preparing to send SMS', { customerCount: rowsToSend.length, filename: previewData.filename });

    // Generate unique session ID for progress tracking
    const progressSessionId = uuidv4();

    // Store sending data in session for background processing
    req.session.sendingData = {
      progressSessionId,
      rowsToSend,
      previewData,
      uploadId: uploadRecord.id,
      startTime: Date.now()
    };

    // Save session and render progress page
    req.session.save((err) => {
      if (err) {
        logger.error('Session save error', { error: err.message });
        return res.status(500).render('upload', {
          title: 'Upload Customers',
          user: user,
          error: 'Failed to initiate sending. Please try again.'
        });
      }

      // Render progress page with SSE session ID
      res.render('upload-sending', {
        title: 'Sending SMS',
        user: user,
        progressSessionId,
        totalToSend: rowsToSend.length,
        filename: previewData.filename
      });
    });

  } catch (error) {
    logger.error('Send initiation error', { error: error.message });
    const userId = req.session.userId;
    const user = req.user || await User.findByPk(userId);

    res.status(500).render('upload', {
      title: 'Upload Customers',
      user: user,
      error: `Send failed: ${error.message}`
    });
  }
};

// GET /dashboard/upload/progress/:sessionId - SSE stream for progress
const progressStream = (req, res) => {
  const { sessionId } = req.params;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Store response for sending events
  progressStreams.set(sessionId, res);

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Clean up on close
  req.on('close', () => {
    progressStreams.delete(sessionId);
  });
};

// POST /dashboard/upload/start-sending - Actually send the SMS messages
const startSending = async (req, res) => {
  const { sessionId } = req.body;
  let uploadRecord = null;
  let bulkReservation = null;

  try {
    const userId = req.session.userId;

    // IMPORTANT: Load full user data from DB, not req.user which only has basic attributes
    // req.user doesn't include smsMessageTone/customSmsMessage, causing wrong template to be sent
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({ error: 'Not authenticated' });
    }

    // Get sending data from session
    const sendingData = req.session.sendingData;
    if (!sendingData || sendingData.progressSessionId !== sessionId) {
      return res.json({ error: 'Session expired' });
    }

    const { rowsToSend, previewData, uploadId, startTime } = sendingData;
    const smsDelay = 150; // 150ms between SMS sends

    logger.info('Starting SMS send', {
      customerCount: rowsToSend.length,
      uploadId,
      smsMessageTone: user.smsMessageTone || 'friendly (default)',
      hasCustomMessage: !!user.customSmsMessage
    });

    // B5 FIX: Start trial on first CSV SMS send (if not already started)
    // IMPORTANT: Must be done BEFORE bulk reservation to avoid deadlock
    // (bulk reservation locks user row, startTrial() tries to update same row)
    logger.info('Checking trial status', { trialStartsAt: user.trialStartsAt, subscriptionStatus: user.subscriptionStatus });
    if (!user.trialStartsAt && user.subscriptionStatus === 'trial') {
      logger.info('Starting trial for user');
      await user.startTrial();
      logger.info('Trial started successfully');
    }

    // D1 FIX: Reserve bulk SMS slots atomically before sending
    logger.info('Reserving bulk SMS slots', { userId, count: rowsToSend.length });
    bulkReservation = await smsLimitService.reserveBulkSmsSlots(userId, rowsToSend.length);
    logger.info('Bulk reservation result', { canSend: bulkReservation.canSend, error: bulkReservation.error });

    if (!bulkReservation.canSend) {
      logger.warn('Bulk SMS reservation failed', { error: bulkReservation.error });
      sendProgressEvent(sessionId, {
        type: 'error',
        error: `${bulkReservation.error}. Available: ${bulkReservation.availableSlots}, Requested: ${rowsToSend.length}`
      });
      return res.json({
        error: bulkReservation.error,
        availableSlots: bulkReservation.availableSlots,
        requestedCount: rowsToSend.length
      });
    }

    // Get the transaction from bulk reservation to avoid FK deadlock
    // (CsvUpload and FeedbackRequest have FK to users, which is locked)
    const { transaction } = bulkReservation;

    // Get existing upload record (created during processUpload)
    logger.info('Loading existing CsvUpload record', { uploadId });
    uploadRecord = await CsvUpload.findByPk(uploadId, { transaction });
    if (!uploadRecord) {
      throw new Error('Upload record not found');
    }
    logger.info('CsvUpload record loaded', { uploadId: uploadRecord.id });

    // Generate unique short codes for all requests
    logger.info('Generating short codes', { count: rowsToSend.length });
    const shortCodes = [];
    for (let i = 0; i < rowsToSend.length; i++) {
      const shortCode = await shortUrlService.generateShortCode();
      shortCodes.push(shortCode);
    }
    logger.info('Short codes generated', { count: shortCodes.length });

    // Bulk create FeedbackRequests with short codes - use same transaction
    logger.info('Creating FeedbackRequests', { count: rowsToSend.length });
    const feedbackRequests = rowsToSend.map((row, index) => ({
      userId: user.id,
      uuid: uuidv4(),
      shortCode: shortCodes[index],
      customerName: row.name,
      customerPhone: row.phone,
      customerEmail: row.email || null,
      status: 'pending',
      source: 'csv_upload'
    }));

    const createdRequests = await FeedbackRequest.bulkCreate(feedbackRequests, { transaction });
    logger.info('FeedbackRequests created', { count: createdRequests.length });

    const successfulSends = [];
    const errors = [];
    let actualSentCount = 0;

    logger.info('Starting SMS send loop', { requestCount: createdRequests.length });

    // Send SMS sequentially with progress updates
    for (let i = 0; i < createdRequests.length; i++) {
      const request = createdRequests[i];
      const row = rowsToSend[i];

      // Send progress event
      sendProgressEvent(sessionId, {
        type: 'sending',
        current: i + 1,
        total: createdRequests.length,
        customerName: request.customerName || 'Customer',
        phone: request.customerPhone.slice(-4) // Last 4 digits
      });

      try {
        // Use short URL for shorter SMS
        const reviewLink = shortUrlService.buildShortUrl(request.shortCode);

        const result = await smsService.sendReviewRequest(
          request.customerPhone,
          request.customerName,
          user.businessName,
          reviewLink,
          user.smsMessageTone || 'friendly',
          user.customSmsMessage
        );

        const sentAt = new Date();
        await request.update({
          status: 'sent',
          smsSentAt: sentAt,
          twilioMessageSid: result.messageSid
        }, { transaction });

        // D1 FIX: Track successful sends for atomic increment at end
        actualSentCount++;

        successfulSends.push({
          success: true,
          requestId: request.id,
          name: request.customerName || '-',
          phone: request.customerPhone,
          sentAt: sentAt,
          twilioSid: result.messageSid,
          reviewLink: reviewLink,
          shortCode: request.shortCode
        });

        // Send success event
        sendProgressEvent(sessionId, {
          type: 'sent',
          current: i + 1,
          total: createdRequests.length,
          customerName: request.customerName || 'Customer'
        });

      } catch (error) {
        logger.error('SMS failed', { customerPhone: request.customerPhone, error: error.message });

        await request.update({ status: 'failed' }, { transaction });

        errors.push({
          row: row.rowNumber,
          name: request.customerName,
          phone: request.customerPhone,
          error: error.message
        });

        // Send failure event
        sendProgressEvent(sessionId, {
          type: 'failed',
          current: i + 1,
          total: createdRequests.length,
          customerName: request.customerName || 'Customer',
          error: error.message
        });
      }

      // Delay between sends (except for last one)
      if (i < createdRequests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, smsDelay));
      }
    }

    // D1 FIX: Atomically increment SMS count for all successful sends and release lock
    await bulkReservation.incrementAndRelease(actualSentCount);
    bulkReservation = null; // Mark as released

    // Calculate final results
    const processingTime = Date.now() - startTime;
    const successCount = successfulSends.length;
    const failedCount = errors.length;

    // Update upload record
    await uploadRecord.update({
      validRows: rowsToSend.length,
      successCount: successCount,
      failedCount: failedCount + previewData.invalidRows.length + previewData.duplicateRows.length,
      duplicateCount: previewData.duplicateRows.length,
      errors: [...previewData.errors, ...errors],
      status: successCount > 0 ? 'in_progress' : 'failed',
      processingTimeMs: processingTime,
      completedAt: new Date()
    });

    // Store results in session for results page
    req.session.uploadResults = {
      filename: previewData.filename,
      totalRows: previewData.totalRows,
      successCount: successCount,
      failedCount: failedCount,
      duplicateCount: previewData.duplicateRows.length,
      invalidCount: previewData.invalidRows.length,
      processingTimeSeconds: Math.round(processingTime / 1000),
      successfulSends: successfulSends,
      failedSends: errors,
      duplicates: previewData.duplicateRows,
      invalidRows: previewData.invalidRows
    };

    // Clear session data
    delete req.session.csvUploadId;
    delete req.session.sendingData;

    // Send completion event
    sendProgressEvent(sessionId, {
      type: 'complete',
      successCount,
      failedCount,
      processingTimeSeconds: Math.round(processingTime / 1000)
    });

    // Save session
    req.session.save(() => {
      res.json({ success: true, successCount, failedCount });
    });

  } catch (error) {
    logger.error('Send SMS error', { error: error.message });

    // D1 FIX: Rollback bulk reservation if it wasn't released
    if (bulkReservation) {
      try {
        await bulkReservation.rollback();
      } catch (rollbackError) {
        logger.error('Error rolling back bulk reservation', { error: rollbackError.message });
      }
    }

    if (uploadRecord) {
      await uploadRecord.update({
        status: 'failed',
        errors: [{ error: error.message }],
        completedAt: new Date()
      });
    }

    // Send error event
    sendProgressEvent(sessionId, {
      type: 'error',
      error: error.message
    });

    res.json({ error: error.message });
  }
};

// GET /dashboard/upload/results - Show results page (after SSE completion)
const showResults = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const results = req.session.uploadResults;

    if (!results) {
      return res.redirect('/dashboard/upload');
    }

    // Clear results from session after displaying
    delete req.session.uploadResults;

    res.render('upload-results', {
      title: 'Upload Results',
      user: user,
      results: results
    });
  } catch (error) {
    logger.error('Results page error', { error: error.message });
    res.redirect('/dashboard/upload');
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
    logger.error('Upload history error', { error: error.message });
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

    // IMPORTANT: Load full user data from DB, not req.user which only has basic attributes
    // req.user doesn't include smsMessageTone/customSmsMessage, causing wrong template to be sent
    const user = await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    logger.info('Resending SMS', { name: name || 'unknown', phone });

    // Create feedback request with short URL
    const { feedbackRequest, reviewLink } = await shortUrlService.createFeedbackRequestWithShortUrl({
      userId: user.id,
      customerName: name || '',
      customerPhone: phone,
      customerEmail: null,
      status: 'pending',
      source: 'manual_resend'
    });

    const result = await smsService.sendReviewRequest(
      feedbackRequest.customerPhone,
      feedbackRequest.customerName,
      user.businessName,
      reviewLink,
      user.smsMessageTone || 'friendly',
      user.customSmsMessage
    );

    await feedbackRequest.update({
      status: 'sent',
      smsSentAt: new Date(),
      twilioMessageSid: result.messageSid
    });

    logger.info('SMS resent successfully', { phone });

    // Redirect back with success indicator for toast notification
    const referer = req.get('Referer') || '/dashboard';
    const url = new URL(referer, `${req.protocol}://${req.get('host')}`);
    url.searchParams.set('resent', 'true');
    res.redirect(url.pathname + url.search);

  } catch (error) {
    logger.error('Resend SMS error', { error: error.message });
    res.status(500).json({
      error: 'Failed to resend SMS',
      message: error.message
    });
  }
};

// POST /dashboard/upload/add-contact - Add manual contact to an upload
const addManualContact = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { uploadId, name, phone, email } = req.body;

    if (!uploadId) {
      return res.status(400).json({ error: 'Upload ID is required' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Find the upload record
    const uploadRecord = await CsvUpload.findOne({
      where: { id: uploadId, userId: user.id }
    });

    if (!uploadRecord) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (uploadRecord.status === 'completed') {
      return res.status(400).json({ error: 'Cannot add contacts to a completed upload' });
    }

    // Validate the phone number
    const validation = validateRow({ name, phone, email });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Get the formatted phone
    const formattedPhone = validation.phoneFormatted?.formatted || phone;

    // Check for duplicates in existing contacts
    const { batchCheckDuplicatePhones } = require('../utils/csvValidator');
    const duplicateMap = await batchCheckDuplicatePhones(user.id, [formattedPhone]);
    const duplicateCheck = duplicateMap.get(formattedPhone) || { isDuplicate: false };

    if (duplicateCheck.isDuplicate) {
      const contactDate = duplicateCheck.lastContactedAt
        ? new Date(duplicateCheck.lastContactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'within last 30 days';
      return res.status(400).json({ error: `Duplicate: Already contacted on ${contactDate}` });
    }

    // Get current parsed data - deep clone to ensure Sequelize detects changes
    let parsedData = uploadRecord.parsedData
      ? JSON.parse(JSON.stringify(uploadRecord.parsedData))
      : {
          validRows: [],
          invalidRows: [],
          duplicateRows: [],
          errors: [],
          totalRows: 0
        };

    // Calculate next row number
    const allRowNumbers = [
      ...parsedData.validRows.map(r => r.rowNumber),
      ...parsedData.invalidRows.map(r => r.rowNumber),
      ...parsedData.duplicateRows.map(r => r.rowNumber)
    ];
    const nextRowNumber = allRowNumbers.length > 0 ? Math.max(...allRowNumbers) + 1 : 1;

    // Create the new row
    const newRow = {
      name: name?.trim() || '',
      phone: formattedPhone,
      phoneOriginal: phone,
      email: email?.trim() || '',
      rowNumber: nextRowNumber,
      phoneFormatted: validation.phoneFormatted,
      warnings: validation.warnings || [],
      manuallyAdded: true
    };

    // Add to valid rows
    parsedData.validRows.push(newRow);
    parsedData.totalRows = parsedData.validRows.length + parsedData.invalidRows.length + parsedData.duplicateRows.length;

    // Update the database - use set() + save() to ensure JSONB change is detected
    uploadRecord.set('parsedData', parsedData);
    uploadRecord.set('validRows', parsedData.validRows.length);
    uploadRecord.set('totalRows', parsedData.totalRows);
    await uploadRecord.save();

    logger.info('Manual contact added', {
      uploadId: uploadRecord.id,
      rowNumber: nextRowNumber,
      phone: formattedPhone
    });

    res.json({
      success: true,
      rowNumber: nextRowNumber,
      name: newRow.name,
      phone: formattedPhone,
      email: newRow.email
    });

  } catch (error) {
    logger.error('Add manual contact error', { error: error.message });
    res.status(500).json({ error: 'Failed to add contact' });
  }
};

// POST /dashboard/uploads/:id/status - Toggle upload completion status
const toggleUploadStatus = async (req, res) => {
  try {
    const userId = req.session.userId;
    const uploadId = req.params.id;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Find the upload
    const uploadRecord = await CsvUpload.findOne({
      where: { id: uploadId, userId: userId }
    });

    if (!uploadRecord) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Don't allow changing status of uploads that haven't been sent yet
    if (uploadRecord.status === 'processing' || uploadRecord.status === 'failed') {
      return res.status(400).json({ error: `Cannot change status of ${uploadRecord.status} uploads` });
    }

    // Update status
    await uploadRecord.update({ status });

    logger.info('Upload status toggled', { uploadId, oldStatus: uploadRecord.status, newStatus: status });

    res.json({ success: true, status });

  } catch (error) {
    logger.error('Toggle upload status error', { error: error.message });
    res.status(500).json({ error: 'Failed to update status' });
  }
};

module.exports = {
  upload,
  showUploadPage,
  processUpload,
  showPreview,
  sendToSelected,
  progressStream,
  startSending,
  showResults,
  showUploadHistory,
  sendSingleSMS,
  addManualContact,
  toggleUploadStatus
};
