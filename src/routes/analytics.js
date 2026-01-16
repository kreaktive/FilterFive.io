/**
 * Analytics Routes
 *
 * Routes for analytics dashboard and API endpoints.
 * All routes require authentication.
 *
 * @module routes/analytics
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply authentication middleware to all routes
router.use(requireAuth);

// Apply rate limiting to API routes
router.use(apiLimiter);

// ==========================================
// Dashboard View Routes
// ==========================================

/**
 * GET /dashboard/analytics
 * Render the analytics dashboard page
 */
router.get('/', analyticsController.getAnalyticsDashboard);

// ==========================================
// API Routes (JSON responses)
// ==========================================

/**
 * GET /api/analytics/metrics
 * Get dashboard metrics for a date range
 * Query params: startDate, endDate, location (optional)
 */
router.get('/metrics', analyticsController.getMetrics);

/**
 * GET /api/analytics/trends
 * Get trend data for sparkline charts (last 30 days)
 * Query params: location (optional)
 */
router.get('/trends', analyticsController.getTrends);

/**
 * GET /api/analytics/timing-heatmap
 * Get timing performance heatmap data
 * Query params: location (optional)
 */
router.get('/timing-heatmap', analyticsController.getTimingHeatmap);

/**
 * GET /api/analytics/compare
 * Get period-over-period comparison
 * Query params: startDate, endDate, location (optional)
 */
router.get('/compare', analyticsController.getComparison);

/**
 * GET /api/analytics/sms-events
 * Get SMS event metrics (failures, opt-outs, etc.)
 * Query params: startDate, endDate
 */
router.get('/sms-events', analyticsController.getSmsEvents);

// ==========================================
// Admin Routes (Super Admin Only)
// ==========================================

/**
 * POST /api/analytics/admin/generate-snapshots
 * Manually trigger snapshot generation
 * Body: { targetDate: '2025-01-29' } (optional)
 */
router.post('/admin/generate-snapshots', analyticsController.adminGenerateSnapshots);

/**
 * POST /api/analytics/admin/backfill
 * Backfill snapshots for a user
 * Body: { userId: 123, daysBack: 90 }
 */
router.post('/admin/backfill', analyticsController.adminBackfillSnapshots);

module.exports = router;
