const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/superAuth');
const {
  showAdminDashboard,
  showCreateTenant,
  createTenant,
  generateQrCode
} = require('../controllers/adminController');

// All routes require super admin authentication
router.use(requireSuperAdmin);

// GET /admin - Tenant list
router.get('/', showAdminDashboard);

// GET /admin/create - Create tenant form
router.get('/create', showCreateTenant);

// POST /admin/create - Create tenant
router.post('/create', createTenant);

// GET /admin/qr/:userId - Generate QR code for business
router.get('/qr/:userId', generateQrCode);

module.exports = router;
