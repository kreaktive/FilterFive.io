// src/utils/csvValidator.js
const { FeedbackRequest } = require('../models');
const { Op} = require('sequelize');

/**
 * Clean phone number - remove all formatting except leading +
 * @param {string} input - Raw phone number from CSV
 * @returns {string} - Cleaned phone number (digits only, possibly with leading +)
 */
const cleanPhoneNumber = (input) => {
  if (!input) return '';

  let cleaned = input.trim().replace(/\s/g, '');

  // If starts with +, keep it and remove all non-digits after
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.substring(1).replace(/\D/g, '');
  }

  // Remove all non-digits
  cleaned = cleaned.replace(/\D/g, '');

  // Handle international prefixes
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  } else if (cleaned.startsWith('011')) {
    return '+' + cleaned.substring(3);
  }

  return cleaned;
};

/**
 * Detect country and format phone number with confidence level
 * @param {string} cleaned - Cleaned phone number (digits only)
 * @param {string} userDefaultCountry - User's default country code (default: 'US')
 * @returns {Object} - {formatted, confidence, detected, warning}
 */
const detectAndFormat = (cleaned, userDefaultCountry = 'US') => {
  // Already E.164 format
  if (cleaned.startsWith('+')) {
    const digitCount = cleaned.substring(1).length;

    // Validate length for E.164
    if (digitCount >= 10 && digitCount <= 15) {
      return {
        formatted: cleaned,
        confidence: 'high',
        detected: 'E.164 format',
        warning: null,
        original: cleaned
      };
    } else {
      return {
        formatted: cleaned,
        confidence: 'low',
        detected: 'E.164 but unusual length',
        warning: 'Phone number length unusual',
        original: cleaned
      };
    }
  }

  const digitCount = cleaned.length;

  // 10 digits = US/Canada
  if (digitCount === 10) {
    return {
      formatted: '+1' + cleaned,
      confidence: 'high',
      detected: 'US/Canada',
      warning: null,
      original: cleaned
    };
  }

  // 11 digits starting with 1 = US/Canada with country code
  if (digitCount === 11 && cleaned.startsWith('1')) {
    return {
      formatted: '+' + cleaned,
      confidence: 'high',
      detected: 'US/Canada (with code)',
      warning: null,
      original: cleaned
    };
  }

  // 11 digits NOT starting with 1 = Could be international
  if (digitCount === 11) {
    return {
      formatted: '+' + cleaned,
      confidence: 'medium',
      detected: 'International (guessed)',
      warning: 'Verify country code is correct',
      original: cleaned
    };
  }

  // 12-15 digits = Likely international with country code
  if (digitCount >= 12 && digitCount <= 15) {
    return {
      formatted: '+' + cleaned,
      confidence: 'medium',
      detected: 'International',
      warning: 'Verify country code is correct',
      original: cleaned
    };
  }

  // Too short or too long
  if (digitCount < 10) {
    return {
      formatted: null,
      confidence: 'invalid',
      detected: 'Too short',
      warning: 'Phone number too short (minimum 10 digits)',
      original: cleaned
    };
  }

  if (digitCount > 15) {
    return {
      formatted: null,
      confidence: 'invalid',
      detected: 'Too long',
      warning: 'Phone number too long (maximum 15 digits)',
      original: cleaned
    };
  }

  // Fallback: Use user's default country
  const countryCodes = { US: '1', UK: '44', CA: '1', AU: '61', MX: '52' };
  const code = countryCodes[userDefaultCountry] || '1';

  return {
    formatted: '+' + code + cleaned,
    confidence: 'low',
    detected: `Assumed ${userDefaultCountry}`,
    warning: `Could not auto-detect - using default country (${userDefaultCountry})`,
    original: cleaned
  };
};

/**
 * Validate a CSV row with smart phone formatting
 * @param {Object} row - CSV row with name, phone, email fields
 * @returns {Object} - {isValid: boolean, errors: array, warnings: array, phoneFormatted: object}
 */
const validateRow = (row) => {
  const errors = [];
  const warnings = [];

  // Validate name (optional, max 100 chars)
  // Name can be empty, single word, or full name
  if (row.name && row.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  // Validate phone with smart formatting
  let phoneFormatted = null;
  if (!row.phone || row.phone.trim().length === 0) {
    errors.push('Phone number is required');
  } else {
    const cleaned = cleanPhoneNumber(row.phone);
    phoneFormatted = detectAndFormat(cleaned);

    // Check confidence level
    if (phoneFormatted.confidence === 'invalid') {
      errors.push(phoneFormatted.warning);
    } else if (phoneFormatted.confidence === 'low' || phoneFormatted.confidence === 'medium') {
      warnings.push(phoneFormatted.warning);
    }
  }

  // Validate email (optional, basic format check)
  if (row.email && row.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push('Invalid email format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    phoneFormatted: phoneFormatted
  };
};

/**
 * Check if phone number is a duplicate for this user
 * Duplicate = same phone sent to within last 30 days AND was successfully sent
 * This allows re-sending to failed SMS recipients
 * @param {number} userId - User ID
 * @param {string} phone - Phone number to check
 * @returns {Promise<Object>} - { isDuplicate: boolean, lastContactedAt: Date|null }
 */
const isDuplicatePhone = async (userId, phone) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Only block if there's a recent request that was actually sent
  // This allows retrying failed sends
  const existingRequest = await FeedbackRequest.findOne({
    where: {
      userId: userId,
      customerPhone: phone,
      createdAt: {
        [Op.gte]: thirtyDaysAgo
      },
      // Only block if SMS was successfully sent, clicked, or rated
      // Allow re-sending if previous attempt was pending or failed
      status: {
        [Op.in]: ['sent', 'clicked', 'rated']
      }
    },
    order: [['createdAt', 'DESC']] // Get most recent
  });

  return {
    isDuplicate: existingRequest !== null,
    lastContactedAt: existingRequest ? existingRequest.createdAt : null
  };
};

/**
 * Batch check for duplicate phone numbers (performance optimization)
 * Uses a single IN query instead of N individual queries
 * @param {number} userId - User ID
 * @param {string[]} phones - Array of phone numbers to check
 * @returns {Promise<Map>} - Map of phone -> { isDuplicate: boolean, lastContactedAt: Date|null }
 */
const batchCheckDuplicatePhones = async (userId, phones) => {
  if (!phones || phones.length === 0) {
    return new Map();
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Single query to find all duplicates
  const existingRequests = await FeedbackRequest.findAll({
    where: {
      userId: userId,
      customerPhone: {
        [Op.in]: phones
      },
      createdAt: {
        [Op.gte]: thirtyDaysAgo
      },
      status: {
        [Op.in]: ['sent', 'clicked', 'rated']
      }
    },
    attributes: ['customerPhone', 'createdAt'],
    order: [['createdAt', 'DESC']],
    raw: true
  });

  // Build a map of phone -> most recent contact date
  const duplicateMap = new Map();
  for (const request of existingRequests) {
    // Only keep the most recent (first occurrence since ordered DESC)
    if (!duplicateMap.has(request.customerPhone)) {
      duplicateMap.set(request.customerPhone, request.createdAt);
    }
  }

  // Return results for all phones
  const results = new Map();
  for (const phone of phones) {
    const lastContactedAt = duplicateMap.get(phone) || null;
    results.set(phone, {
      isDuplicate: lastContactedAt !== null,
      lastContactedAt
    });
  }

  return results;
};

module.exports = {
  validateRow,
  isDuplicatePhone,
  batchCheckDuplicatePhones
};
