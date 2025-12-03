const { User, FeedbackRequest, Review } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const analyticsService = require('../services/analyticsService');

// Helper function: Calculate relative time
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

// Helper function: Mask phone number
function maskPhone(phone) {
  if (!phone) return 'Unknown';
  // Format: +1 555-***-1234
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const areaCode = cleaned.slice(1, 4);
    const last4 = cleaned.slice(-4);
    return `+1 ${areaCode}-***-${last4}`;
  }
  return phone; // Return as-is if format doesn't match
}

// GET /dashboard/login - Show login form
const showLogin = (req, res) => {
  res.render('dashboard/login', {
    title: 'Login - FilterFive',
    error: null
  });
};

// POST /dashboard/login - Handle login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('dashboard/login', {
        title: 'Login - FilterFive',
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render('dashboard/login', {
        title: 'Login - FilterFive',
        error: 'Invalid email or password'
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.render('dashboard/login', {
        title: 'Login - FilterFive',
        error: 'Invalid email or password'
      });
    }

    // Check if user is verified (only for non-super-admins)
    if (!user.isVerified && user.role !== 'super_admin') {
      return res.render('dashboard/login', {
        title: 'Login - FilterFive',
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.'
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.businessName = user.businessName;

    res.redirect('/dashboard');

  } catch (error) {
    console.error('Error in login:', error);
    res.render('dashboard/login', {
      title: 'Login - FilterFive',
      error: 'Something went wrong. Please try again.'
    });
  }
};

// GET /dashboard/logout - Handle logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/dashboard/login');
  });
};

// GET /dashboard - Show main dashboard with analytics
const showDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get user and trial status (from middleware or load here)
    const user = req.user || await User.findByPk(userId);
    const trialStatus = req.trialStatus || {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

    // Get analytics counts
    const totalSent = await FeedbackRequest.count({
      where: {
        userId,
        status: {
          [Op.in]: ['sent', 'clicked', 'rated']
        }
      }
    });

    const totalClicked = await FeedbackRequest.count({
      where: {
        userId,
        status: {
          [Op.in]: ['clicked', 'rated']
        }
      }
    });

    const totalRated = await FeedbackRequest.count({
      where: {
        userId,
        status: 'rated'
      }
    });

    // Get rating distribution
    const reviews = await Review.findAll({
      where: { userId },
      attributes: ['rating'],
      raw: true
    });

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

    // Get recent feedback requests
    const recentRequests = await FeedbackRequest.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{
        model: Review,
        as: 'review',
        required: false
      }]
    });

    // Get last 20 activities for Pulse feed
    const pulseActivities = await FeedbackRequest.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
      include: [{
        model: Review,
        as: 'review',
        required: false
      }]
    });

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
        console.error('Error fetching analytics data:', error);
        // Continue without analytics data if there's an error
      }
    }

    res.render('dashboard/index', {
      title: 'Dashboard - FilterFive',
      businessName: req.session.businessName,
      user,
      trialStatus,
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
    console.error('Error in showDashboard:', error);
    res.status(500).send('Something went wrong');
  }
};

// GET /dashboard/settings - Show settings page
const showSettings = async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const trialStatus = req.trialStatus || {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

    res.render('dashboard/settings', {
      title: 'Settings - FilterFive',
      businessName: req.session.businessName,
      user,
      trialStatus,
      success: null,
      error: null
    });

  } catch (error) {
    console.error('Error in showSettings:', error);
    res.status(500).send('Something went wrong');
  }
};

// POST /dashboard/settings - Update settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { businessName, reviewUrl, smsMessageTone, googleReviewLink, facebookLink } = req.body;

    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Validate review URL if provided
    if (reviewUrl && reviewUrl.trim() !== '') {
      const urlTrimmed = reviewUrl.trim();
      // Basic URL validation
      try {
        new URL(urlTrimmed);
      } catch (urlError) {
        throw new Error('Invalid review URL. Please enter a valid URL starting with http:// or https://');
      }
    }

    // Update user settings
    await user.update({
      businessName: businessName || user.businessName,
      reviewUrl: reviewUrl || null,
      smsMessageTone: smsMessageTone || user.smsMessageTone || 'friendly',
      // Keep old fields for backwards compatibility
      googleReviewLink: googleReviewLink || user.googleReviewLink || null,
      facebookLink: facebookLink || user.facebookLink || null
    });

    // Update session
    req.session.businessName = user.businessName;

    const trialStatus = req.trialStatus || {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

    res.render('dashboard/settings', {
      title: 'Settings - FilterFive',
      businessName: user.businessName,
      user,
      trialStatus,
      success: 'Settings updated successfully!',
      error: null
    });

  } catch (error) {
    console.error('Error in updateSettings:', error);

    const user = req.user || await User.findByPk(req.session.userId);

    const trialStatus = {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

    res.render('dashboard/settings', {
      title: 'Settings - FilterFive',
      businessName: req.session.businessName,
      user,
      trialStatus,
      success: null,
      error: error.message || 'Failed to update settings. Please try again.'
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

    const trialStatus = req.trialStatus || {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

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
      title: 'My QR Code - FilterFive',
      businessName: req.session.businessName,
      user,
      trialStatus,
      qrCodeImage: qrCodeDataUrl,
      qrUrl: qrUrl
    });

  } catch (error) {
    console.error('Error in showQrCode:', error);
    res.status(500).send('Something went wrong');
  }
};

// POST /dashboard/send-test-sms - Send test SMS to single number
const sendTestSms = async (req, res) => {
  try {
    const userId = req.session.userId;
    const smsService = require('../services/smsService');
    const { v4: uuidv4 } = require('uuid');

    // Load user
    const user = req.user || await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get input
    const { phone, customerName } = req.body;

    // Validate phone (must be E.164 format: +15551234567)
    if (!phone || !/^\+1[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Please enter a valid US phone number.'
      });
    }

    // Check SMS limit
    if (!user.canSendSms()) {
      return res.status(403).json({
        success: false,
        error: 'SMS limit reached. Please upgrade your plan to send more messages.'
      });
    }

    // Generate UUID for feedback request
    const uuid = uuidv4();
    const reviewLink = `${process.env.APP_URL}/review/${uuid}`;

    // Use provided name or default to "Test Customer"
    const name = customerName?.trim() || 'Test Customer';

    // Create FeedbackRequest
    const feedbackRequest = await FeedbackRequest.create({
      uuid: uuid,
      userId: user.id,
      customerName: name,
      customerPhone: phone,
      deliveryMethod: 'sms',
      location: 'dashboard_test', // Mark as dashboard test for analytics
      status: 'pending'
    });

    console.log(`📤 Sending test SMS to ${phone} (${name})`);

    // Validate review URL configured
    if (!user.reviewUrl || user.reviewUrl.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Review platform URL not configured. Please add your review URL in Settings first.'
      });
    }

    // Send SMS
    const smsResult = await smsService.sendReviewRequest(
      phone,
      name,
      user.businessName,
      reviewLink,
      user.smsMessageTone || 'friendly'
    );

    if (smsResult.success) {
      // Update status
      await feedbackRequest.update({ status: 'sent' });

      // Increment SMS usage count
      await user.increment('smsUsageCount');

      console.log(`✅ Test SMS sent successfully - UUID: ${uuid}`);

      return res.json({
        success: true,
        reviewLink: reviewLink,
        uuid: uuid,
        message: 'SMS sent successfully!'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to send SMS. Please try again.'
      });
    }
  } catch (error) {
    console.error('Send test SMS error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while sending SMS.'
    });
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
  sendTestSms
};
