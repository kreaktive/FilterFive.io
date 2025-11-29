const { User } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');

// GET /admin - Show list of all tenants
const showAdminDashboard = async (req, res) => {
  try {
    // Get all users (both tenants and super_admins)
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'businessName', 'email', 'role', 'subscriptionStatus', 'isActive', 'createdAt']
    });

    res.render('admin/dashboard', {
      title: 'Super Admin - Tenant Management',
      users,
      currentUser: req.user,
      success: req.query.success || null
    });

  } catch (error) {
    console.error('Error in showAdminDashboard:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Failed to load tenant list.',
      error: { status: 500 }
    });
  }
};

// GET /admin/create - Show create tenant form
const showCreateTenant = (req, res) => {
  res.render('admin/create', {
    title: 'Super Admin - Create New Tenant',
    currentUser: req.user,
    error: null
  });
};

// POST /admin/create - Create new tenant
const createTenant = async (req, res) => {
  try {
    const { businessName, email, phone, password } = req.body;

    // Validation
    if (!businessName || !email || !password) {
      return res.render('admin/create', {
        title: 'Super Admin - Create New Tenant',
        currentUser: req.user,
        error: 'Business Name, Email, and Password are required.'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.render('admin/create', {
        title: 'Super Admin - Create New Tenant',
        currentUser: req.user,
        error: 'A user with this email already exists.'
      });
    }

    // Create new tenant
    const newTenant = await User.create({
      businessName,
      email,
      password, // Will be hashed by beforeCreate hook
      role: 'tenant',
      subscriptionStatus: 'trial',
      isActive: true
    });

    console.log(`✓ New tenant created by super admin: ${email} (ID: ${newTenant.id})`);

    // Redirect to admin dashboard with success message
    res.redirect('/admin?success=Tenant created successfully');

  } catch (error) {
    console.error('Error in createTenant:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.render('admin/create', {
        title: 'Super Admin - Create New Tenant',
        currentUser: req.user,
        error: 'Invalid email format.'
      });
    }

    res.render('admin/create', {
      title: 'Super Admin - Create New Tenant',
      currentUser: req.user,
      error: 'Failed to create tenant. Please try again.'
    });
  }
};

/**
 * Generate QR Code for Business
 * GET /admin/qr/:userId
 *
 * Returns QR code as base64 data URL for display
 */
const generateQrCode = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get business info
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Generate QR code URL
    const qrUrl = `${process.env.APP_URL}/r/${user.id}`;

    // Generate QR code image as base64 data URL
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

    console.log(`✓ QR code generated for: ${user.businessName} (ID: ${user.id})`);

    // Return QR code data
    res.json({
      success: true,
      qrUrl: qrUrl,
      qrCodeImage: qrCodeDataUrl,
      businessName: user.businessName,
      businessId: user.id
    });

  } catch (error) {
    console.error('❌ QR generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
};

module.exports = {
  showAdminDashboard,
  showCreateTenant,
  createTenant,
  generateQrCode
};
