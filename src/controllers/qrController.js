/**
 * QR Code Controller
 *
 * Handles QR code scans and creates anonymous feedback requests
 */

const { FeedbackRequest, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

/**
 * Handle QR Code Scan
 * GET /r/:businessId
 *
 * Flow:
 * 1. Validate business exists
 * 2. Get customer IP address
 * 3. Create "ghost" FeedbackRequest (no phone)
 * 4. Redirect to star rating page
 */
const handleQrScan = async (req, res) => {
  try {
    const { businessId } = req.params;

    // SECURITY: Validate businessId is a positive integer before database query
    const parsedId = parseInt(businessId, 10);
    if (!businessId || isNaN(parsedId) || parsedId <= 0 || String(parsedId) !== businessId) {
      return res.status(404).render('error', {
        title: 'Business Not Found',
        message: 'This QR code is invalid or the business is no longer active.',
        error: { status: 404 }
      });
    }

    // Get customer IP address (works behind nginx proxy)
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    logger.info('QR scan attempt', { businessId: parsedId, ipAddress });

    // Find business/tenant by ID
    const business = await User.findOne({
      where: {
        id: parsedId,
        role: 'tenant'
      }
    });

    if (!business) {
      logger.warn('QR scan failed - Business not found', { businessId: parsedId });
      return res.status(404).render('error', {
        title: 'Business Not Found',
        message: 'This QR code is invalid or the business is no longer active.',
        error: { status: 404 }
      });
    }

    // Start trial on first QR page view (Phase 2 requirement)
    if (!business.trialStartsAt && business.subscriptionStatus === 'trial') {
      await business.startTrial();
      logger.info('Trial started via QR scan', { userId: business.id, businessName: business.businessName });
    }

    // Generate unique UUID for this feedback request
    const uuid = uuidv4();

    // Create FeedbackRequest "ghost record"
    const feedbackRequest = await FeedbackRequest.create({
      userId: business.id,
      uuid: uuid,
      customerPhone: null,      // No phone for QR visitors
      customerName: null,       // Anonymous
      customerEmail: null,      // No email
      deliveryMethod: 'qr',     // Mark as QR-originated
      source: 'manual',         // Source tracking (manual vs zapier/csv)
      ipAddress: ipAddress,     // Store for rate limiting
      status: 'clicked',        // Skip 'sent' status (no SMS sent)
      linkClickedAt: new Date() // Mark as immediately clicked
    });

    logger.info('QR feedback request created', { userId: business.id, uuid });

    // Redirect to star rating page
    // The existing review flow at /review/:uuid will handle the rest
    res.redirect(`/review/${uuid}`);

  } catch (error) {
    logger.error('QR scan error', { error: error.message });
    res.status(500).render('error', {
      title: 'Something Went Wrong',
      message: 'Unable to process your request. Please try scanning the QR code again.',
      error: { status: 500 }
    });
  }
};

module.exports = {
  handleQrScan
};
