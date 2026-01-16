/**
 * Short URL Service
 *
 * Generates short codes for FeedbackRequests and builds short URLs for SMS.
 */

const { generateUniqueShortCode } = require('../utils/shortCode');
const FeedbackRequest = require('../models/FeedbackRequest');
const logger = require('./logger');

/**
 * Generate a unique short code that doesn't exist in the database
 * @returns {Promise<string>} Unique 8-character short code
 */
const generateShortCode = async () => {
  return await generateUniqueShortCode(async (code) => {
    const existing = await FeedbackRequest.findOne({
      where: { shortCode: code },
      attributes: ['id']
    });
    return existing !== null;
  });
};

/**
 * Build a short review URL
 * @param {string} shortCode - The short code
 * @returns {string} Full short URL
 */
const buildShortUrl = (shortCode) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/r/${shortCode}`;
};

/**
 * Build the legacy long review URL (for backwards compatibility)
 * @param {string} uuid - The UUID
 * @returns {string} Full long URL
 */
const buildLongUrl = (uuid) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/review/${uuid}`;
};

/**
 * Create a FeedbackRequest with a short code and return the short URL
 * This is a convenience function for creating requests with short URLs
 *
 * @param {Object} requestData - FeedbackRequest data (userId, customerName, etc.)
 * @param {Object} options - Optional Sequelize options (transaction, etc.)
 * @returns {Promise<{feedbackRequest: FeedbackRequest, reviewLink: string}>}
 */
const createFeedbackRequestWithShortUrl = async (requestData, options = {}) => {
  // Generate unique short code
  const shortCode = await generateShortCode();

  // Create the feedback request with short code
  const feedbackRequest = await FeedbackRequest.create({
    ...requestData,
    shortCode
  }, options);

  // Build the short URL
  const reviewLink = buildShortUrl(shortCode);

  logger.debug('Created FeedbackRequest with short URL', {
    uuid: feedbackRequest.uuid,
    shortCode,
    reviewLink
  });

  return {
    feedbackRequest,
    reviewLink
  };
};

module.exports = {
  generateShortCode,
  buildShortUrl,
  buildLongUrl,
  createFeedbackRequestWithShortUrl
};
