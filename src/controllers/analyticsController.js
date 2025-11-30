/**
 * Analytics Controller
 *
 * Handles HTTP requests for analytics dashboard endpoints.
 * Provides data for dashboard metrics, ROI calculator, timing heatmap, and trends.
 *
 * @module controllers/analyticsController
 */

const analyticsService = require('../services/analyticsService');
const snapshotService = require('../services/snapshotService');
const { User } = require('../models');

/**
 * Render analytics dashboard view
 *
 * GET /dashboard/analytics
 */
exports.getAnalyticsDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Check if user has analytics enabled (gradual rollout flag)
    const user = await User.findByPk(userId, {
      attributes: ['analyticsEnabled', 'businessName']
    });

    if (!user) {
      return res.status(404).send('User not found');
    }

    if (!user.analyticsEnabled) {
      return res.render('dashboard/analytics-coming-soon', {
        title: 'Analytics Dashboard - Coming Soon',
        user: req.session.user,
        businessName: user.businessName
      });
    }

    // Get default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get user's locations for filter dropdown
    const locations = await analyticsService.getUserLocations(userId);

    res.render('dashboard/analytics', {
      title: 'Analytics Dashboard',
      user: req.session.user,
      businessName: user.businessName,
      locations,
      defaultStartDate: startDate.toISOString().split('T')[0],
      defaultEndDate: endDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error loading analytics dashboard:', error);
    res.status(500).send('Error loading analytics dashboard');
  }
};

/**
 * Get dashboard metrics API endpoint
 *
 * GET /api/analytics/metrics
 * Query params: startDate, endDate, location (optional)
 */
exports.getMetrics = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { startDate, endDate, location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required'
      });
    }

    const metrics = await analyticsService.getDashboardMetrics(userId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || null
    });

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

/**
 * Get trend data for sparkline charts
 *
 * GET /api/analytics/trends
 * Query params: location (optional)
 */
exports.getTrends = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { location } = req.query;

    const trends = await analyticsService.getTrendData(userId, location || null);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
};

/**
 * Get timing heatmap data
 *
 * GET /api/analytics/timing-heatmap
 * Query params: location (optional)
 */
exports.getTimingHeatmap = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { location } = req.query;

    const heatmap = await analyticsService.getTimingHeatmap(userId, location || null);

    res.json(heatmap);
  } catch (error) {
    console.error('Error fetching timing heatmap:', error);
    res.status(500).json({ error: 'Failed to fetch timing heatmap' });
  }
};

/**
 * Get period comparison data
 *
 * GET /api/analytics/compare
 * Query params: startDate, endDate, location (optional)
 */
exports.getComparison = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { startDate, endDate, location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required'
      });
    }

    const comparison = await analyticsService.comparePeriods(
      userId,
      new Date(startDate),
      new Date(endDate),
      location || null
    );

    res.json(comparison);
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison' });
  }
};

/**
 * Get SMS event metrics
 *
 * GET /api/analytics/sms-events
 * Query params: startDate, endDate
 */
exports.getSmsEvents = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required'
      });
    }

    const events = await analyticsService.getSmsEventMetrics(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(events);
  } catch (error) {
    console.error('Error fetching SMS events:', error);
    res.status(500).json({ error: 'Failed to fetch SMS events' });
  }
};

/**
 * Manually trigger snapshot generation (admin/superadmin only)
 *
 * POST /api/analytics/admin/generate-snapshots
 * Body: { targetDate: '2025-01-29' } (optional)
 */
exports.adminGenerateSnapshots = async (req, res) => {
  try {
    // Check if user is super admin
    const user = await User.findByPk(req.session.userId, {
      attributes: ['role']
    });

    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    const { targetDate } = req.body;
    const date = targetDate ? new Date(targetDate) : null;

    const result = await snapshotService.generateDailySnapshots(date);

    res.json({
      success: true,
      message: 'Snapshots generated successfully',
      result
    });
  } catch (error) {
    console.error('Error generating snapshots:', error);
    res.status(500).json({ error: 'Failed to generate snapshots' });
  }
};

/**
 * Backfill snapshots for a user (admin/superadmin only)
 *
 * POST /api/analytics/admin/backfill
 * Body: { userId: 123, daysBack: 90 }
 */
exports.adminBackfillSnapshots = async (req, res) => {
  try {
    // Check if user is super admin
    const user = await User.findByPk(req.session.userId, {
      attributes: ['role']
    });

    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    const { userId, daysBack } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await snapshotService.backfillSnapshots(
      userId,
      daysBack || 90
    );

    res.json({
      success: true,
      message: 'Backfill completed successfully',
      result
    });
  } catch (error) {
    console.error('Error backfilling snapshots:', error);
    res.status(500).json({ error: 'Failed to backfill snapshots' });
  }
};
