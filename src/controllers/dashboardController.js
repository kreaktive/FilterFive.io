const { User, FeedbackRequest, Review, PosIntegration, PosLocation, PosTransaction } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const analyticsService = require('../services/analyticsService');
const { sendSupportRequestEmail } = require('../services/emailService');
const { buildTrialStatus } = require('../middleware/trialManager');
const { invalidateUserSessionCache } = require('../middleware/auth');
const { rotateToken: rotateCsrfToken } = require('../middleware/csrf');
const { validateSmsTemplate } = require('../utils/smsTemplateValidator');
const { getTimeAgo, maskPhone } = require('../utils/formatters');
const logger = require('../services/logger');
const smsLimitService = require('../services/smsLimitService');
const shortUrlService = require('../services/shortUrlService');

// GET /dashboard/login - Show login form
const showLogin = (req, res) => {
  res.render('dashboard/login', {
    title: 'Login - MoreStars',
    error: null
  });
};

// POST /dashboard/login - Handle login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('dashboard/login', {
        title: 'Login - MoreStars',
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render('dashboard/login', {
        title: 'Login - MoreStars',
        error: 'Invalid email or password'
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.render('dashboard/login', {
        title: 'Login - MoreStars',
        error: 'Invalid email or password'
      });
    }

    // Check if user is verified (only for non-super-admins)
    if (!user.isVerified && user.role !== 'super_admin') {
      return res.render('dashboard/login', {
        title: 'Login - MoreStars',
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        showResendVerification: true,
        unverifiedEmail: user.email
      });
    }

    // Regenerate session to prevent session fixation attacks (S1 fix)
    // This creates a new session ID while preserving the session data
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Session regeneration failed', { error: err.message, userId: user.id });
        return res.render('dashboard/login', {
          title: 'Login - MoreStars',
          error: 'Something went wrong. Please try again.'
        });
      }

      // Set session data AFTER regeneration
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.businessName = user.businessName;

      // Rotate CSRF token after login to prevent session fixation attacks
      rotateCsrfToken(req);

      // Save session explicitly before redirect
      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error('Session save failed', { error: saveErr.message, userId: user.id });
          return res.render('dashboard/login', {
            title: 'Login - MoreStars',
            error: 'Something went wrong. Please try again.'
          });
        }
        res.redirect('/dashboard');
      });
    });

  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.render('dashboard/login', {
      title: 'Login - MoreStars',
      error: 'Something went wrong. Please try again.'
    });
  }
};

// GET /dashboard/logout - Handle logout
const logout = async (req, res) => {
  const userId = req.session.userId;

  // Invalidate user session cache before destroying session
  if (userId) {
    await invalidateUserSessionCache(userId);
  }

  req.session.destroy((err) => {
    if (err) {
      logger.error('Error destroying session', { error: err.message });
    }
    res.redirect('/dashboard/login');
  });
};

// GET /dashboard - Show main dashboard with analytics
const showDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get user with full attributes including reviewUrl for setup check
    // req.user from auth middleware only has basic attributes
    const user = await User.findByPk(userId);
    const trialStatus = req.trialStatus || buildTrialStatus(user);

    // Run all independent queries in parallel for better performance
    const [totalSent, totalClicked, totalRated, reviews, recentRequests, pulseActivities] = await Promise.all([
      // Get analytics counts
      FeedbackRequest.count({
        where: {
          userId,
          status: {
            [Op.in]: ['sent', 'clicked', 'rated']
          }
        }
      }),
      FeedbackRequest.count({
        where: {
          userId,
          status: {
            [Op.in]: ['clicked', 'rated']
          }
        }
      }),
      FeedbackRequest.count({
        where: {
          userId,
          status: 'rated'
        }
      }),
      // Get rating distribution
      Review.findAll({
        where: { userId },
        attributes: ['rating'],
        raw: true
      }),
      // Get recent feedback requests
      FeedbackRequest.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{
          model: Review,
          as: 'review',
          required: false
        }]
      }),
      // Get last 20 activities for Pulse feed
      FeedbackRequest.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 20,
        include: [{
          model: Review,
          as: 'review',
          required: false
        }]
      })
    ]);

    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    reviews.forEach(review => {
      ratingCounts[review.rating]++;
    });

    // Calculate percentages
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0;
    const rateRate = totalClicked > 0 ? ((totalRated / totalClicked) * 100).toFixed(1) : 0;

    // Format pulse data with status, time, and customer info
    const pulseData = pulseActivities.map(activity => {
      const review = activity.review;
      let statusLabel, statusColor, content = null;

      // Priority 1: Failed status
      if (activity.status === 'failed') {
        statusLabel = 'Failed';
        statusColor = 'red';
      }
      // Priority 2: Review exists
      else if (review) {
        statusLabel = `${review.rating} ⭐️`;
        statusColor = review.rating >= 4 ? 'green' : 'orange';

        if (review.rating >= 4) {
          content = 'Redirected to Google';
        } else {
          content = review.comment || 'No comment provided';
        }
      }
      // Priority 3: Clicked
      else if (activity.clickedAt || activity.status === 'clicked') {
        statusLabel = 'Clicked';
        statusColor = 'blue';
      }
      // Priority 4: Sent
      else {
        statusLabel = 'Sent';
        statusColor = 'gray';
      }

      // Calculate relative time
      const timeAgo = getTimeAgo(activity.createdAt);

      // Format customer name or mask phone
      const customer = activity.customerName || maskPhone(activity.customerPhone);

      return {
        id: activity.id,
        customer,
        statusLabel,
        statusColor,
        timeAgo,
        hasReview: !!review,
        reviewData: review ? {
          rating: review.rating,
          comment: review.comment,
          customerName: activity.customerName,
          createdAt: review.createdAt
        } : null,
        content
      };
    });

    // Calculate trial days remaining
    let trialDaysRemaining = null;
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
      const msRemaining = new Date(user.trialEndsAt) - new Date();
      trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    }

    // Calculate SMS usage data
    const smsUsage = {
      used: user.smsUsageCount || 0,
      limit: user.smsUsageLimit || 10,
      remaining: (user.smsUsageLimit || 10) - (user.smsUsageCount || 0),
      percentUsed: user.smsUsageLimit > 0 ? Math.round((user.smsUsageCount / user.smsUsageLimit) * 100) : 0
    };

    // Check if setup is incomplete (no review URL)
    const setupIncomplete = !user.reviewUrl;

    // Fetch analytics data if enabled
    let analyticsData = null;
    if (user.analyticsEnabled) {
      try {
        // Get date range (default 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Fetch analytics metrics
        const metrics = await analyticsService.getDashboardMetrics(userId, {
          startDate,
          endDate
        });

        // Fetch user locations
        const locations = await analyticsService.getUserLocations(userId);

        analyticsData = {
          roi: metrics.roi,
          reviews: metrics.reviews,
          requests: metrics.requests,
          locations: locations
        };
      } catch (error) {
        logger.error('Error fetching analytics data', { userId, error: error.message });
        // Continue without analytics data if there's an error
      }
    }

    res.render('dashboard/index', {
      title: 'Dashboard - MoreStars',
      businessName: req.session.businessName,
      user,
      trialStatus,
      trialDaysRemaining,
      smsUsage,
      setupIncomplete,
      analytics: {
        totalSent,
        totalClicked,
        totalRated,
        clickRate,
        rateRate,
        ratingCounts
      },
      recentRequests,
      analyticsData,
      pulseData
    });

  } catch (error) {
    logger.error('Error in showDashboard', { error: error.message });
    res.status(500).send('Something went wrong');
  }
};

// GET /dashboard/settings - Show settings page
const showSettings = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Always fetch fresh user data for settings page (don't use cached req.user)
    const user = await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const trialStatus = req.trialStatus || buildTrialStatus(user);

    // Fetch POS integrations with locations
    const posIntegrations = await PosIntegration.findAll({
      where: { userId },
      include: [{ model: PosLocation, as: 'locations' }]
    });

    const squareIntegration = posIntegrations.find(i => i.provider === 'square');
    const shopifyIntegration = posIntegrations.find(i => i.provider === 'shopify');
    const zapierIntegration = posIntegrations.find(i => i.provider === 'zapier');
    const webhookIntegration = posIntegrations.find(i => i.provider === 'webhook');
    const stripeIntegration = posIntegrations.find(i => i.provider === 'stripe_pos');
    const woocommerceIntegration = posIntegrations.find(i => i.provider === 'woocommerce');
    const cloverIntegration = posIntegrations.find(i => i.provider === 'clover');

    // Fetch recent POS transactions
    const recentTransactions = await PosTransaction.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.render('dashboard/settings', {
      title: 'Settings - MoreStars',
      businessName: req.session.businessName,
      user,
      trialStatus,
      success: null,
      error: null,
      posSuccess: null,
      posError: null,
      squareIntegration,
      shopifyIntegration,
      zapierIntegration,
      webhookIntegration,
      stripeIntegration,
      woocommerceIntegration,
      cloverIntegration,
      recentTransactions
    });

  } catch (error) {
    logger.error('Error in showSettings', { error: error.message });
    res.status(500).send('Something went wrong');
  }
};

// POST /dashboard/settings - Update settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { businessName, reviewUrl, smsMessageTone, customSmsMessage, reviewValueEstimate } = req.body;

    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // B8 FIX: Validate review URL if provided - requires https://
    if (reviewUrl && reviewUrl.trim() !== '') {
      const urlTrimmed = reviewUrl.trim();
      // Basic URL validation
      try {
        const parsedUrl = new URL(urlTrimmed);
        // Only allow https URLs (http is insecure for redirect)
        if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
          throw new Error('Review URL must start with https:// or http://');
        }
        // Validate it's a real domain (not localhost in production)
        if (process.env.NODE_ENV === 'production' &&
            (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')) {
          throw new Error('Review URL cannot be localhost in production');
        }
      } catch (urlError) {
        if (urlError.message.includes('localhost') || urlError.message.includes('https')) {
          throw urlError;
        }
        throw new Error('Invalid review URL. Please enter a valid URL starting with https://');
      }
    }

    // Validate custom SMS message if tone is 'custom'
    if (smsMessageTone === 'custom') {
      if (!customSmsMessage || customSmsMessage.trim() === '') {
        throw new Error('Custom message cannot be empty when using custom tone');
      }
      // Comprehensive template validation
      const validation = validateSmsTemplate(customSmsMessage);
      if (!validation.valid) {
        throw new Error(validation.errors.join('. '));
      }
    }

    // Validate and parse reviewValueEstimate
    let parsedReviewValue = user.reviewValueEstimate;
    if (reviewValueEstimate !== undefined && reviewValueEstimate !== '') {
      const value = parseFloat(reviewValueEstimate);
      if (!isNaN(value) && value >= 1 && value <= 10000) {
        parsedReviewValue = value;
      }
    }

    // Update user settings
    await user.update({
      businessName: businessName || user.businessName,
      reviewUrl: reviewUrl || null,
      smsMessageTone: smsMessageTone || user.smsMessageTone || 'friendly',
      customSmsMessage: smsMessageTone === 'custom' ? (customSmsMessage || null) : user.customSmsMessage,
      reviewValueEstimate: parsedReviewValue
    });

    // Invalidate user session cache since user data changed
    await invalidateUserSessionCache(userId);

    // Update session
    req.session.businessName = user.businessName;

    const trialStatus = req.trialStatus || buildTrialStatus(user);

    // Fetch POS integrations with locations
    const posIntegrations = await PosIntegration.findAll({
      where: { userId },
      include: [{ model: PosLocation, as: 'locations' }]
    });

    const squareIntegration = posIntegrations.find(i => i.provider === 'square');
    const shopifyIntegration = posIntegrations.find(i => i.provider === 'shopify');

    // Fetch recent POS transactions
    const recentTransactions = await PosTransaction.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.render('dashboard/settings', {
      title: 'Settings - MoreStars',
      businessName: user.businessName,
      user,
      trialStatus,
      success: 'Settings updated successfully!',
      error: null,
      posSuccess: null,
      posError: null,
      squareIntegration,
      shopifyIntegration,
      recentTransactions
    });

  } catch (error) {
    logger.error('Error in updateSettings', { error: error.message });

    const userId = req.session.userId;
    const user = req.user || await User.findByPk(userId);

    const trialStatus = {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

    // Fetch POS integrations with locations
    const posIntegrations = await PosIntegration.findAll({
      where: { userId },
      include: [{ model: PosLocation, as: 'locations' }]
    });

    const squareIntegration = posIntegrations.find(i => i.provider === 'square');
    const shopifyIntegration = posIntegrations.find(i => i.provider === 'shopify');

    // Fetch recent POS transactions
    const recentTransactions = await PosTransaction.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.render('dashboard/settings', {
      title: 'Settings - MoreStars',
      businessName: req.session.businessName,
      user,
      trialStatus,
      success: null,
      error: error.message || 'Failed to update settings. Please try again.',
      posSuccess: null,
      posError: null,
      squareIntegration,
      shopifyIntegration,
      recentTransactions
    });
  }
};

// GET /dashboard/qr - Show QR code page
const showQrCode = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const trialStatus = req.trialStatus || buildTrialStatus(user);

    // Generate QR code URL
    const qrUrl = `${process.env.APP_URL}/r/${user.id}`;

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.render('dashboard/qr', {
      title: 'My QR Code - MoreStars',
      businessName: req.session.businessName,
      user,
      trialStatus,
      qrCodeImage: qrCodeDataUrl,
      qrUrl: qrUrl
    });

  } catch (error) {
    logger.error('Error in showQrCode', { error: error.message });
    res.status(500).send('Something went wrong');
  }
};

// POST /dashboard/send-test-sms - Send test SMS to single number
// D1 fix: Uses atomic SMS limit checking with row locking to prevent race conditions
const sendTestSms = async (req, res) => {
  logger.info('sendTestSms: Request received', {
    body: req.body,
    sessionId: req.session?.id?.substring(0, 8) || 'none',
    userId: req.session?.userId
  });

  try {
    const userId = req.session.userId;
    logger.info('sendTestSms: Got userId', { userId });

    const smsService = require('../services/smsService');

    // Get input early for validation
    const { phone, customerName } = req.body;
    logger.info('sendTestSms: Parsed body', { phone, customerName });

    // Validate phone (must be E.164 format: +15551234567)
    if (!phone || !/^\+1[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Please enter a valid US phone number.'
      });
    }

    // D1 fix: Reserve SMS slot with row locking before proceeding
    // This prevents race conditions where two requests could both pass the limit check
    logger.info('sendTestSms: About to reserve SMS slot', { userId });
    const reservation = await smsLimitService.reserveSmsSlot(userId, 1);
    logger.info('sendTestSms: Reservation result', { canSend: reservation.canSend, error: reservation.error });

    if (!reservation.canSend) {
      const errorMessage = reservation.error === 'Payment past due'
        ? 'Your payment is past due. Please update your payment method to continue sending SMS.'
        : 'SMS limit reached. Please upgrade your plan to send more messages.';

      return res.status(403).json({
        success: false,
        error: errorMessage
      });
    }

    // Now we have the lock - proceed with sending
    const user = reservation.user;
    let smsSuccess = false;
    logger.info('sendTestSms: Got user from reservation', { userId: user.id, reviewUrl: user.reviewUrl?.substring(0, 30) || 'none' });

    try {
      // B5 FIX: Start trial on first SMS send (if not already started)
      // Note: We can't call user.startTrial() because it doesn't support transactions
      // Instead, we set the fields and they'll be committed when reservation.release() is called
      if (!user.trialStartsAt && user.subscriptionStatus === 'trial') {
        logger.info('sendTestSms: Starting trial');
        const now = new Date();
        const TRIAL_DURATION_DAYS = 14;
        user.trialStartsAt = now;
        user.trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
        user.marketingStatus = 'trial_active';
        await user.save({ transaction: reservation.transaction });
      }

      // Validate review URL configured
      if (!user.reviewUrl || user.reviewUrl.trim() === '') {
        logger.warn('sendTestSms: No review URL configured');
        await reservation.release(false, 0); // Release without incrementing
        return res.status(400).json({
          success: false,
          error: 'Review platform URL not configured. Please add your review URL in Settings first.'
        });
      }

      const name = customerName?.trim() || 'Test Customer';

      // Create FeedbackRequest with short URL WITHIN the same transaction
      logger.info('sendTestSms: About to create FeedbackRequest with short URL', { userId: user.id, name, phone });
      let feedbackRequest, reviewLink;
      try {
        const result = await shortUrlService.createFeedbackRequestWithShortUrl({
          userId: user.id,
          customerName: name,
          customerPhone: phone,
          deliveryMethod: 'sms',
          location: 'dashboard_test',
          status: 'pending'
        }, { transaction: reservation.transaction });

        feedbackRequest = result.feedbackRequest;
        reviewLink = result.reviewLink;
        logger.info('sendTestSms: Created FeedbackRequest with short URL', {
          feedbackRequestId: feedbackRequest.id,
          shortCode: feedbackRequest.shortCode,
          reviewLink
        });
      } catch (dbError) {
        logger.error('sendTestSms: FeedbackRequest.create failed', { error: dbError.message, stack: dbError.stack });
        await reservation.release(false, 0);
        return res.status(500).json({
          success: false,
          error: 'Database error creating feedback request.'
        });
      }

      logger.sms('sending_test', phone, { customerName: name });
      logger.info('sendTestSms: About to call smsService.sendReviewRequest');

      // Send SMS
      const smsResult = await smsService.sendReviewRequest(
        phone,
        name,
        user.businessName,
        reviewLink,
        user.smsMessageTone || 'friendly',
        user.customSmsMessage
      );

      logger.info('sendTestSms: smsService result', { success: smsResult.success, error: smsResult.error });

      if (smsResult.success) {
        smsSuccess = true;
        await feedbackRequest.update({ status: 'sent' }, { transaction: reservation.transaction });
        logger.info('sendTestSms: Updated FeedbackRequest to sent');

        // Release lock and increment count atomically (this commits the transaction)
        await reservation.release(true, 1);
        logger.info('sendTestSms: Released reservation');

        // Invalidate analytics cache
        await analyticsService.invalidateCache(userId);

        logger.sms('test_sent', phone, { shortCode: feedbackRequest.shortCode });
        logger.info('sendTestSms: SUCCESS - returning response');

        return res.json({
          success: true,
          reviewLink: reviewLink,
          shortCode: feedbackRequest.shortCode,
          message: 'SMS sent successfully!'
        });
      } else {
        logger.warn('sendTestSms: SMS failed', { error: smsResult.error });
        // SMS failed - release lock without incrementing
        await reservation.release(false, 0);
        return res.status(500).json({
          success: false,
          error: 'Failed to send SMS. Please try again.'
        });
      }
    } catch (innerError) {
      // Ensure lock is released on any error
      if (!smsSuccess) {
        await reservation.release(false, 0);
      }
      throw innerError;
    }
  } catch (error) {
    logger.error('Send test SMS error', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      success: false,
      error: 'An error occurred while sending SMS.'
    });
  }
};

// POST /dashboard/api-key/regenerate - Regenerate API key
const regenerateApiKey = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const newApiKey = await user.regenerateApiKey();

    return res.json({
      success: true,
      apiKey: newApiKey,
      message: 'API key regenerated successfully. Update your Zapier integration with the new key.'
    });
  } catch (error) {
    logger.error('Regenerate API key error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key. Please try again.'
    });
  }
};

// POST /dashboard/settings/support - Submit support request
const submitSupportRequest = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Log the support request
    logger.info('Support request received', { userId: user.id, subject });

    // Send email notification to support team
    try {
      await sendSupportRequestEmail(user.email, user.businessName, user.id, subject, message);
      logger.info('Support request email sent', { userId: user.id });
    } catch (emailError) {
      logger.error('Failed to send support email', { userId: user.id, error: emailError.message });
      // Don't fail the request if email fails - the user still submitted their request
    }

    res.json({ success: true, message: 'Your message has been sent! We will get back to you within 24-48 hours.' });

  } catch (error) {
    logger.error('Error submitting support request', { error: error.message });
    res.status(500).json({ error: 'Failed to submit request. Please try again.' });
  }
};

module.exports = {
  showLogin,
  login,
  logout,
  showDashboard,
  showSettings,
  updateSettings,
  showQrCode,
  sendTestSms,
  regenerateApiKey,
  submitSupportRequest
};
