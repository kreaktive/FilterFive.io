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
 * GET /r/:businessId (integer only)
 *
 * Example: https://app.morestars.io/r/123
 *
 * Flow: Customer scans QR → Rate limit check → Create request → Redirect to rating page
 *
 * Note: Uses regex to only match numeric IDs, allowing /r/:shortCode (alphanumeric)
 * to be handled by shortUrlRoutes for SMS feedback links
 */
router.get('/r/:businessId(\\d+)', qrRateLimiter, handleQrScan);

module.exports = router;
