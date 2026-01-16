const { User, FeedbackRequest, Review } = require('../models');
const { Op } = require('sequelize');
const smsService = require('../services/smsService');
const { v4: uuidv4 } = require('uuid');
const analyticsService = require('../services/analyticsService');
const logger = require('../services/logger');

/**
 * Build WHERE clauses for feedback filtering
 * Shared logic between list view and export
 * @param {object} options - Filter options
 * @returns {{ requestWhere: object, reviewWhere: object }}
 */
const buildFeedbackFilters = (options) => {
  const { userId, rating, status, dateRange, search } = options;

  // Build WHERE clause for FeedbackRequest
  const requestWhere = { userId };

  // Date range filter
  if (dateRange) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - dateRange);
    requestWhere.createdAt = { [Op.gte]: dateFrom };
  }

  // Build WHERE clause for Review
  const reviewWhere = {};

  if (rating && rating !== 'all') {
    reviewWhere.rating = parseInt(rating);
  }

  if (status && status !== 'all') {
    reviewWhere.feedbackStatus = status;
  }

  if (search && search.trim() !== '') {
    reviewWhere.feedbackText = { [Op.iLike]: `%${search}%` };
  }

  return { requestWhere, reviewWhere };
};

// GET /dashboard/feedback - Show paginated feedback list with filters
const showFeedbackList = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { User } = require('../models');
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    // Parse query parameters with bounds validation (DoS protection)
    const page = Math.max(1, Math.min(parseInt(req.query.page) || 1, 1000));
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 25, 100));
    const rating = req.query.rating;
    const status = req.query.status;
    const hasFeedback = req.query.hasFeedback;
    const dateRange = Math.max(1, Math.min(parseInt(req.query.dateRange) || 30, 365));
    const search = (req.query.search || '').slice(0, 200); // Limit search length

    const offset = (page - 1) * limit;

    // Build filters using shared function
    const { requestWhere, reviewWhere } = buildFeedbackFilters({
      userId: user.id,
      rating,
      status,
      dateRange,
      search
    });

    // Has feedback filter
    // D6 FIX: Specify explicit attributes to prevent over-fetching
    const includeOptions = {
      model: Review,
      as: 'review',
      required: hasFeedback === 'true',
      where: Object.keys(reviewWhere).length > 0 ? reviewWhere : undefined,
      attributes: ['id', 'rating', 'feedbackText', 'feedbackStatus', 'redirectedTo', 'createdAt']
    };

    // Fetch feedback requests with reviews
    // D6 FIX: Specify explicit attributes and use subQuery:false for accurate count
    const { count, rows: feedbackList } = await FeedbackRequest.findAndCountAll({
      where: requestWhere,
      include: [includeOptions],
      attributes: ['id', 'uuid', 'customerName', 'customerPhone', 'deliveryMethod', 'status', 'smsSentAt', 'linkClickedAt', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      distinct: true,
      subQuery: false
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);

    res.render('dashboard/feedback', {
      title: 'Feedback Management - MoreStars',
      user: user,
      feedbackList: feedbackList,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count,
        limit: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        rating: rating || 'all',
        status: status || 'all',
        hasFeedback: hasFeedback || 'all',
        dateRange: dateRange,
        search: search
      }
    });

  } catch (error) {
    logger.error('Error in showFeedbackList', { error: error.message });
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load feedback list',
      error: { status: 500 }
    });
  }
};

// POST /dashboard/feedback/:id/view - Mark feedback as viewed
const markAsViewed = async (req, res) => {
  try {
    const userId = req.session.userId;
    const reviewId = req.params.id;

    const review = await Review.findOne({
      where: { id: reviewId, userId: userId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Only update if not already viewed
    if (review.feedbackStatus === 'new') {
      await review.update({
        feedbackStatus: 'viewed',
        viewedAt: new Date()
      });
    }

    res.json({ success: true, status: review.feedbackStatus });
  } catch (error) {
    logger.error('Error marking review as viewed', { error: error.message });
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// POST /dashboard/feedback/:id/respond - Send SMS response to customer
const respondToFeedback = async (req, res) => {
  try {
    const userId = req.session.userId;
    const reviewId = req.params.id;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch review with feedback request
    const review = await Review.findOne({
      where: { id: reviewId, userId: userId },
      include: [{
        model: FeedbackRequest,
        as: 'feedbackRequest',
        required: true
      }]
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (!review.feedbackRequest.customerPhone) {
      return res.status(400).json({ error: 'No phone number available for this customer' });
    }

    // Send SMS via Twilio
    const result = await smsService.sendSMS(
      review.feedbackRequest.customerPhone,
      message
    );

    // Update review status
    await review.update({
      feedbackStatus: 'responded',
      respondedAt: new Date(),
      viewedAt: review.viewedAt || new Date() // Set viewedAt if not already set
    });

    // Invalidate analytics cache
    await analyticsService.invalidateCache(userId);

    logger.info('Responded to feedback via SMS', { userId, reviewId });

    res.json({
      success: true,
      message: 'Response sent successfully',
      twilioSid: result.messageSid
    });

  } catch (error) {
    logger.error('Error responding to feedback', { error: error.message });
    res.status(500).json({
      error: 'Failed to send response',
      message: error.message
    });
  }
};

// POST /dashboard/feedback/:id/note - Add internal note
const addInternalNote = async (req, res) => {
  try {
    const userId = req.session.userId;
    const reviewId = req.params.id;
    const { note } = req.body;

    if (!note || note.trim() === '') {
      return res.status(400).json({ error: 'Note is required' });
    }

    const review = await Review.findOne({
      where: { id: reviewId, userId: userId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Append note with timestamp
    const timestamp = new Date().toISOString();
    const noteEntry = `[${timestamp}] ${note}`;
    const updatedNotes = review.internalNotes
      ? `${review.internalNotes}\n\n${noteEntry}`
      : noteEntry;

    await review.update({
      internalNotes: updatedNotes
    });

    res.json({
      success: true,
      message: 'Note added successfully',
      internalNotes: updatedNotes
    });

  } catch (error) {
    logger.error('Error adding internal note', { error: error.message });
    res.status(500).json({ error: 'Failed to add note' });
  }
};

// POST /dashboard/feedback/:id/status - Update feedback status
const updateStatus = async (req, res) => {
  try {
    const userId = req.session.userId;
    const reviewId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['new', 'viewed', 'responded', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const review = await Review.findOne({
      where: { id: reviewId, userId: userId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updateData = { feedbackStatus: status };

    // Set appropriate timestamp based on status
    if (status === 'viewed' && !review.viewedAt) {
      updateData.viewedAt = new Date();
    } else if (status === 'resolved' && !review.resolvedAt) {
      updateData.resolvedAt = new Date();
      // Also set viewedAt if not set
      if (!review.viewedAt) {
        updateData.viewedAt = new Date();
      }
    }

    await review.update(updateData);

    // Invalidate analytics cache
    await analyticsService.invalidateCache(userId);

    res.json({
      success: true,
      status: status,
      message: `Status updated to ${status}`
    });

  } catch (error) {
    logger.error('Error updating status', { error: error.message });
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// POST /dashboard/feedback/bulk-update - Bulk update feedback status
const bulkUpdateStatus = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { reviewIds, status } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ error: 'Review IDs array is required' });
    }

    const validStatuses = ['new', 'viewed', 'responded', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { feedbackStatus: status };

    // Set timestamps
    if (status === 'viewed') {
      updateData.viewedAt = new Date();
    } else if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    // Update all reviews
    const [updatedCount] = await Review.update(updateData, {
      where: {
        id: { [Op.in]: reviewIds },
        userId: userId
      }
    });

    // Invalidate analytics cache
    await analyticsService.invalidateCache(userId);

    logger.info('Bulk updated reviews', { userId, updatedCount, status });

    res.json({
      success: true,
      updatedCount: updatedCount,
      message: `${updatedCount} feedback items updated to ${status}`
    });

  } catch (error) {
    logger.error('Error in bulk update', { error: error.message });
    res.status(500).json({ error: 'Failed to bulk update' });
  }
};

// GET /dashboard/feedback/export - Export feedback to CSV
const exportFeedback = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Use same filters as list view with bounds validation
    const rating = req.query.rating;
    const status = req.query.status;
    const dateRange = Math.max(1, Math.min(parseInt(req.query.dateRange) || 30, 365));
    const search = (req.query.search || '').slice(0, 200);

    // Build filters using shared function
    const { requestWhere, reviewWhere } = buildFeedbackFilters({
      userId,
      rating,
      status,
      dateRange,
      search
    });

    // Fetch all matching feedback
    const feedbackList = await FeedbackRequest.findAll({
      where: requestWhere,
      include: [{
        model: Review,
        as: 'review',
        required: true, // Only include requests with reviews
        where: Object.keys(reviewWhere).length > 0 ? reviewWhere : undefined
      }],
      order: [['createdAt', 'DESC']]
    });

    // Generate CSV
    const csvRows = [];
    csvRows.push('Customer Name,Phone,Rating,Feedback,Status,Date,Internal Notes');

    feedbackList.forEach(request => {
      if (request.review) {
        const row = [
          request.customerName || 'Anonymous',
          request.customerPhone || '',
          request.review.rating,
          (request.review.feedbackText || '').replace(/"/g, '""'), // Escape quotes
          request.review.feedbackStatus,
          new Date(request.createdAt).toISOString(),
          (request.review.internalNotes || '').replace(/"/g, '""')
        ];
        csvRows.push(`"${row.join('","')}"`);
      }
    });

    const csv = csvRows.join('\n');

    // Send as downloadable file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-export-${Date.now()}.csv"`);
    res.send(csv);

  } catch (error) {
    logger.error('Error exporting feedback', { error: error.message });
    res.status(500).json({ error: 'Failed to export feedback' });
  }
};

// GET /dashboard/feedback/word-cloud - Generate word cloud data
const generateWordCloud = async (req, res) => {
  try {
    const userId = req.session.userId;
    const dateRange = Math.max(1, Math.min(parseInt(req.query.dateRange) || 30, 365));

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - dateRange);

    // Fetch all feedback text
    const reviews = await Review.findAll({
      where: {
        userId: userId,
        feedbackText: { [Op.ne]: null },
        createdAt: { [Op.gte]: dateFrom }
      },
      attributes: ['feedbackText']
    });

    // Extract and count words
    const wordCounts = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

    reviews.forEach(review => {
      if (!review.feedbackText) return;

      const words = review.feedbackText
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    // Convert to array and sort by frequency
    const wordArray = Object.entries(wordCounts)
      .map(([word, count]) => ({ text: word, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50); // Top 50 words

    res.json({
      success: true,
      words: wordArray,
      totalReviews: reviews.length
    });

  } catch (error) {
    logger.error('Error generating word cloud', { error: error.message });
    res.status(500).json({ error: 'Failed to generate word cloud' });
  }
};

module.exports = {
  showFeedbackList,
  markAsViewed,
  respondToFeedback,
  addInternalNote,
  updateStatus,
  bulkUpdateStatus,
  exportFeedback,
  generateWordCloud
};
