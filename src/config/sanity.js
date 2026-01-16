/**
 * Sanity Client Configuration
 *
 * Creates and exports Sanity clients for content fetching.
 * - Production client: Uses CDN for fast reads
 * - Preview client: Direct API access for draft content
 */

const { createClient } = require('@sanity/client');
const logger = require('../services/logger');

// Check if Sanity is configured
const isConfigured = Boolean(process.env.SANITY_PROJECT_ID);

if (!isConfigured) {
  logger.warn('Sanity CMS not configured - SANITY_PROJECT_ID is missing');
}

/**
 * Production client - uses CDN for fast cached reads
 */
const client = isConfigured
  ? createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: process.env.NODE_ENV === 'production',
      // Token optional for public content
      token: process.env.SANITY_API_TOKEN || undefined
    })
  : null;

/**
 * Preview client - bypasses CDN, requires token for drafts
 */
const previewClient = isConfigured
  ? createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: false, // Never use CDN for previews
      token: process.env.SANITY_API_TOKEN
    })
  : null;

/**
 * Get the appropriate client based on preview mode
 * @param {boolean} preview - Whether to use preview client
 * @returns {object|null} Sanity client or null if not configured
 */
function getClient(preview = false) {
  if (!isConfigured) return null;
  return preview ? previewClient : client;
}

module.exports = {
  client,
  previewClient,
  getClient,
  isConfigured
};
