/**
 * QR Code Controller
 *
 * Handles QR code scans and creates anonymous feedback requests
 */

const { FeedbackRequest, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

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

    // Get customer IP address (works behind nginx proxy)
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    console.log(`📱 QR scan attempt - Business: ${businessId}, IP: ${ipAddress}`);

    // Find business/tenant by ID
    const business = await User.findOne({
      where: {
        id: businessId,
        role: 'tenant'
      }
    });

    if (!business) {
      console.warn(`❌ QR scan failed - Business not found: ${businessId}`);
      return res.status(404).render('error', {
        title: 'Business Not Found',
        message: 'This QR code is invalid or the business is no longer active.',
        error: { status: 404 }
      });
    }

    // Start trial on first QR page view (Phase 2 requirement)
    if (!business.trialStartsAt && business.subscriptionStatus === 'trial') {
      await business.startTrial();
      console.log(`✓ Trial started for ${business.businessName} (ID: ${business.id}) - First QR scan`);
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

    console.log(`✓ QR feedback request created: ${business.businessName} (ID: ${business.id}) - UUID: ${uuid}`);

    // Redirect to star rating page
    // The existing review flow at /review/:uuid will handle the rest
    res.redirect(`/review/${uuid}`);

  } catch (error) {
    console.error('❌ QR scan error:', error);
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
