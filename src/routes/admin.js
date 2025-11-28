const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/superAuth');
const {
  showAdminDashboard,
  showCreateTenant,
  createTenant
} = require('../controllers/adminController');

// All routes require super admin authentication
router.use(requireSuperAdmin);

// GET /admin - Tenant list
router.get('/', showAdminDashboard);

// GET /admin/create - Create tenant form
router.get('/create', showCreateTenant);

// POST /admin/create - Create tenant
router.post('/create', createTenant);

module.exports = router;
