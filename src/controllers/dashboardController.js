const { User, FeedbackRequest, Review } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');

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

    res.render('dashboard/index', {
      title: 'Dashboard - FilterFive',
      businessName: req.session.businessName,
      analytics: {
        totalSent,
        totalClicked,
        totalRated,
        clickRate,
        rateRate,
        ratingCounts
      },
      recentRequests
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

    const user = await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    res.render('dashboard/settings', {
      title: 'Settings - FilterFive',
      businessName: req.session.businessName,
      user,
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
    const { businessName, googleReviewLink, facebookLink } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Update user settings
    await user.update({
      businessName: businessName || user.businessName,
      googleReviewLink: googleReviewLink || null,
      facebookLink: facebookLink || null
    });

    // Update session
    req.session.businessName = user.businessName;

    res.render('dashboard/settings', {
      title: 'Settings - FilterFive',
      businessName: user.businessName,
      user,
      success: 'Settings updated successfully!',
      error: null
    });

  } catch (error) {
    console.error('Error in updateSettings:', error);

    const user = await User.findByPk(req.session.userId);

    res.render('dashboard/settings', {
      title: 'Settings - FilterFive',
      businessName: req.session.businessName,
      user,
      success: null,
      error: 'Failed to update settings. Please try again.'
    });
  }
};

// GET /dashboard/qr - Show QR code page
const showQrCode = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

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
      qrCodeImage: qrCodeDataUrl,
      qrUrl: qrUrl
    });

  } catch (error) {
    console.error('Error in showQrCode:', error);
    res.status(500).send('Something went wrong');
  }
};

module.exports = {
  showLogin,
  login,
  logout,
  showDashboard,
  showSettings,
  updateSettings,
  showQrCode
};
