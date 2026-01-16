/**
 * Sanity CMS Webhook Handler
 *
 * Receives webhooks from Sanity when content is published/unpublished
 * and invalidates the Redis cache accordingly.
 *
 * Configure in Sanity:
 * 1. Go to sanity.io/manage → Your Project → API → Webhooks
 * 2. Create webhook with URL: https://morestars.io/api/webhooks/sanity
 * 3. Set secret to match SANITY_WEBHOOK_SECRET env var
 * 4. Filter: _type in ["post", "category", "author"]
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const logger = require('../services/logger');
const sanityService = require('../services/sanityService');

/**
 * Verify Sanity webhook signature
 * @param {Object} req - Express request
 * @param {string} secret - Webhook secret
 * @returns {boolean} Whether signature is valid
 */
function verifySanitySignature(req, secret) {
  if (!secret) {
    // If no secret configured, skip verification (dev mode)
    return true;
  }

  const signature = req.headers['sanity-webhook-signature'];
  if (!signature) {
    return false;
  }

  try {
    // Sanity uses HMAC SHA-256
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEquals(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Error verifying Sanity webhook signature', { error: error.message });
    return false;
  }
}

/**
 * POST /api/webhooks/sanity
 * Handle Sanity content change webhooks
 */
router.post('/sanity', express.json(), async (req, res) => {
  try {
    // Verify signature in production
    if (process.env.NODE_ENV === 'production') {
      const secret = process.env.SANITY_WEBHOOK_SECRET;
      if (!verifySanitySignature(req, secret)) {
        logger.warn('Invalid Sanity webhook signature', {
          ip: req.ip,
          headers: {
            'content-type': req.headers['content-type'],
            'sanity-webhook-signature': req.headers['sanity-webhook-signature'] ? '[present]' : '[missing]'
          }
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Extract document info from webhook payload
    const { _type, _id, slug, _rev } = req.body;

    logger.info('Sanity webhook received', {
      type: _type,
      id: _id,
      slug: slug?.current || slug,
      rev: _rev
    });

    // Invalidate cache based on document type
    let keysDeleted = 0;

    switch (_type) {
      case 'post':
        // If we have a slug, invalidate just that post
        const postSlug = slug?.current || slug;
        if (postSlug) {
          keysDeleted = await sanityService.invalidatePostCache(postSlug);
        } else {
          // No slug available, invalidate all blog cache
          keysDeleted = await sanityService.invalidateAllBlogCache();
        }
        break;

      case 'category':
      case 'author':
        // Categories and authors affect all posts (displayed in listings)
        keysDeleted = await sanityService.invalidateAllBlogCache();
        break;

      default:
        logger.info('Unhandled document type in webhook', { type: _type });
    }

    res.status(200).json({
      success: true,
      message: 'Cache invalidated',
      keysDeleted
    });

  } catch (error) {
    logger.error('Sanity webhook error', {
      error: error.message,
      stack: error.stack
    });

    // Return 200 anyway to prevent Sanity from retrying
    // (we don't want to spam ourselves with retries on transient errors)
    res.status(200).json({
      success: false,
      message: 'Webhook processed with errors',
      error: error.message
    });
  }
});

/**
 * GET /api/webhooks/sanity
 * Health check endpoint (Sanity may ping this)
 */
router.get('/sanity', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Sanity webhook endpoint ready',
    configured: Boolean(process.env.SANITY_WEBHOOK_SECRET)
  });
});

module.exports = router;
