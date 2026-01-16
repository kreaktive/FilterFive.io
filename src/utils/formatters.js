/**
 * Formatting Utilities
 * Common formatting functions for display purposes
 */

/**
 * Calculate relative time from a date
 * @param {Date|string} date - The date to calculate from
 * @returns {string} Human-readable relative time (e.g., "5 mins ago")
 */
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

/**
 * Mask a phone number for privacy
 * @param {string} phone - Phone number to mask
 * @returns {string} Masked phone number (e.g., "+1 555-***-1234")
 */
function maskPhone(phone) {
  if (!phone) return 'Unknown';
  // Format: +1 555-***-1234
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const areaCode = cleaned.slice(1, 4);
    const last4 = cleaned.slice(-4);
    return `+1 ${areaCode}-***-${last4}`;
  }
  return phone; // Return as-is if format doesn't match
}

/**
 * S12 FIX: Mask secret/API key for safe logging
 * Shows first 4 and last 4 characters with mask in between
 * @param {string} secret - Secret or API key to mask
 * @param {number} [visibleChars=4] - Number of chars to show at start and end
 * @returns {string} Masked secret (e.g., "sk_t...xYzQ")
 */
function maskSecret(secret, visibleChars = 4) {
  if (!secret || typeof secret !== 'string') return '[empty]';
  if (secret.length <= visibleChars * 2) return '***';

  const start = secret.slice(0, visibleChars);
  const end = secret.slice(-visibleChars);
  return `${start}...${end}`;
}

/**
 * S12 FIX: Sanitize object for logging by masking sensitive fields
 * @param {Object} obj - Object to sanitize
 * @param {string[]} sensitiveFields - Field names to mask
 * @returns {Object} Sanitized copy of object
 */
function sanitizeForLogging(obj, sensitiveFields = ['apiKey', 'token', 'secret', 'password', 'accessToken', 'refreshToken']) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = maskSecret(sanitized[field]);
    }
  }
  return sanitized;
}

module.exports = {
  getTimeAgo,
  maskPhone,
  maskSecret,
  sanitizeForLogging
};
