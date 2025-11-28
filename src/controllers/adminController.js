const { User } = require('../models');
const { Op } = require('sequelize');

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

module.exports = {
  showAdminDashboard,
  showCreateTenant,
  createTenant
};
