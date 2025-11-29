/**
 * QR Code Routes
 *
 * Public routes for QR code feedback system
 */

const express = require('express');
const router = express.Router();
const { handleQrScan } = require('../controllers/qrController');
const { qrRateLimiter } = require('../middleware/qrRateLimiter');

/**
 * QR Code Scan Entry Point
 * GET /r/:businessId
 *
 * Example: https://filterfive.io/r/123
 *
 * Flow: Customer scans QR → Rate limit check → Create request → Redirect to rating page
 */
router.get('/r/:businessId', qrRateLimiter, handleQrScan);

module.exports = router;
