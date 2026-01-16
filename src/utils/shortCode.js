/**
 * Short Code Generator
 *
 * Generates 8-character alphanumeric codes for shortened SMS URLs.
 * Uses base62 encoding (a-z, A-Z, 0-9) for URL-safe, case-sensitive codes.
 *
 * 62^8 = 218 trillion possible combinations - plenty of headroom.
 */

const crypto = require('crypto');

// Base62 character set (URL-safe, no ambiguous characters)
const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 8;

/**
 * Generate a cryptographically random short code
 * @returns {string} 8-character alphanumeric code
 */
const generateShortCode = () => {
  const randomBytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';

  for (let i = 0; i < CODE_LENGTH; i++) {
    // Use modulo to map byte (0-255) to charset index (0-61)
    code += CHARSET[randomBytes[i] % CHARSET.length];
  }

  return code;
};

/**
 * Generate a unique short code, checking against existing codes
 * @param {Function} existsCheck - Async function that checks if code exists
 * @param {number} maxAttempts - Maximum attempts before giving up
 * @returns {Promise<string>} Unique short code
 */
const generateUniqueShortCode = async (existsCheck, maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();
    const exists = await existsCheck(code);

    if (!exists) {
      return code;
    }
  }

  throw new Error(`Failed to generate unique short code after ${maxAttempts} attempts`);
};

/**
 * Validate a short code format
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
const isValidShortCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }

  if (code.length !== CODE_LENGTH) {
    return false;
  }

  // Check all characters are in charset
  for (const char of code) {
    if (!CHARSET.includes(char)) {
      return false;
    }
  }

  return true;
};

module.exports = {
  generateShortCode,
  generateUniqueShortCode,
  isValidShortCode,
  CODE_LENGTH,
  CHARSET
};
