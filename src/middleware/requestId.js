/**
 * Request ID Middleware
 *
 * Assigns a unique ID to each request for tracing through logs.
 * The ID is available on req.id and added to response headers.
 */

const crypto = require('crypto');

/**
 * Generate a unique request ID
 * Format: timestamp-randomhex (e.g., 1702656000000-a1b2c3d4)
 */
const generateRequestId = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
};

/**
 * Request ID middleware
 * - Checks for existing X-Request-ID header (from load balancer/proxy)
 * - Generates new ID if not present
 * - Attaches to req.id for logging
 * - Adds X-Request-ID response header for client correlation
 */
const requestId = (req, res, next) => {
  // Use existing request ID from proxy/load balancer or generate new one
  const id = req.headers['x-request-id'] || generateRequestId();

  // Attach to request for use in logging
  req.id = id;

  // Add to response headers for client correlation
  res.setHeader('X-Request-ID', id);

  next();
};

/**
 * Get request ID from current request (for use in services)
 * Falls back to generating a new ID if not in request context
 */
const getRequestId = (req) => {
  return req?.id || generateRequestId();
};

module.exports = {
  requestId,
  getRequestId,
  generateRequestId
};
