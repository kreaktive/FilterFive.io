/**
 * Phone number utilities
 * Centralized phone normalization and validation
 */

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX for US)
 * @param {string} phone - Raw phone number
 * @returns {string|null} Normalized phone or null if invalid
 */
function normalizePhone(phone) {
  if (!phone) return null;

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Handle different formats
  if (digits.length === 10) {
    // US number without country code
    digits = '1' + digits;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code - already correct
  } else {
    // Invalid length for US
    return null;
  }

  return '+' + digits;
}

/**
 * Check if phone number is a valid US number
 * @param {string} phone - Normalized phone number (E.164 format)
 * @returns {boolean}
 */
function isUSNumber(phone) {
  if (!phone) return false;
  // Must be +1 followed by 10 digits, area code can't start with 0 or 1
  return /^\+1[2-9]\d{9}$/.test(phone);
}

/**
 * Format phone for display (xxx) xxx-xxxx
 * @param {string} phone - Phone number (normalized or raw)
 * @returns {string} Formatted phone for display
 */
function formatPhoneDisplay(phone) {
  if (!phone) return '';

  const digits = phone.replace(/\D/g, '');

  // Handle 11-digit (with country code) or 10-digit numbers
  const last10 = digits.slice(-10);

  if (last10.length !== 10) {
    return phone; // Return original if not valid
  }

  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}

/**
 * Validate and normalize phone, returning both result and error info
 * @param {string} phone - Raw phone number
 * @returns {{valid: boolean, normalized: string|null, error: string|null}}
 */
function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return { valid: false, normalized: null, error: 'Phone number is required' };
  }

  const normalized = normalizePhone(phone);

  if (!normalized) {
    return { valid: false, normalized: null, error: 'Invalid phone number format' };
  }

  if (!isUSNumber(normalized)) {
    return { valid: false, normalized: null, error: 'Only US phone numbers are supported' };
  }

  return { valid: true, normalized, error: null };
}

module.exports = {
  normalizePhone,
  isUSNumber,
  formatPhoneDisplay,
  validatePhone
};
