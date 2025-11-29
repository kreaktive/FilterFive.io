// src/utils/csvValidator.js
const { FeedbackRequest } = require('../models');
const { Op} = require('sequelize');

/**
 * Validate a CSV row
 * @param {Object} row - CSV row with name, phone, email fields
 * @returns {Object} - {isValid: boolean, errors: array}
 */
const validateRow = (row) => {
  const errors = [];

  // Validate name (required, 2-100 chars)
  if (!row.name || row.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (row.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (row.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  // Validate phone (required, E.164 format)
  if (!row.phone || row.phone.trim().length === 0) {
    errors.push('Phone number is required');
  } else if (!row.phone.startsWith('+')) {
    errors.push('Phone must start with + (E.164 format, e.g., +1234567890)');
  } else if (row.phone.length < 10 || row.phone.length > 15) {
    errors.push('Phone number length invalid (must be 10-15 digits including +)');
  } else if (!/^\+[0-9]+$/.test(row.phone)) {
    errors.push('Phone must contain only + and digits');
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
    errors: errors
  };
};

/**
 * Check if phone number is a duplicate for this user
 * Duplicate = same phone sent to within last 30 days
 * @param {number} userId - User ID
 * @param {string} phone - Phone number to check
 * @returns {Promise<boolean>} - True if duplicate exists
 */
const isDuplicatePhone = async (userId, phone) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const existingRequest = await FeedbackRequest.findOne({
    where: {
      user_id: userId,
      customer_phone: phone,
      created_at: {
        [Op.gte]: thirtyDaysAgo
      }
    }
  });

  return existingRequest !== null;
};

module.exports = {
  validateRow,
  isDuplicatePhone
};
