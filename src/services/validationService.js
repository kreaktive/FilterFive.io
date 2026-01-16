/**
 * Validation Service
 * Centralized validation logic for user inputs
 */

const validator = require('validator');

/**
 * Validate Email Format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate Password Strength
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;

  // Check minimum length
  if (password.length < 8) return false;

  // Check for at least one number
  if (!/\d/.test(password)) return false;

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  return true;
};

/**
 * Get specific password validation errors for better UX
 */
const getPasswordErrors = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return ['Password is required'];
  }

  if (password.length < 8) {
    errors.push(`Password needs ${8 - password.length} more character${8 - password.length === 1 ? '' : 's'}`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Add an uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Add a lowercase letter (a-z)');
  }

  if (!/\d/.test(password)) {
    errors.push('Add a number (0-9)');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Add a special character (!@#$%^&*)');
  }

  return errors;
};

/**
 * Get Password Strength Score (0-4)
 */
const getPasswordStrength = (password) => {
  if (!password) return 0;

  let strength = 0;

  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return Math.min(strength, 4);
};

/**
 * Validate Business Name
 */
const isValidBusinessName = (name) => {
  if (!name || typeof name !== 'string') return false;

  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

/**
 * Sanitize String Input (Remove XSS attempts)
 * S7 FIX: Use validator.js escape function for proper sanitization
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';

  // Use validator.js escape for proper HTML entity encoding
  // This handles: &, <, >, ", ', ` characters
  return validator.escape(input.trim());
};

/**
 * Strip all HTML tags from input
 */
const stripHtml = (input) => {
  if (!input || typeof input !== 'string') return '';
  return validator.stripLow(validator.escape(input.trim()));
};

/**
 * Validate and sanitize URL
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Only allow http/https URLs
  if (validator.isURL(trimmed, { protocols: ['http', 'https'], require_protocol: true })) {
    return trimmed;
  }
  return '';
};

/**
 * Validate Signup Input
 */
const validateSignup = (businessName, email, password) => {
  const errors = [];

  // Business name validation with specific feedback
  if (!businessName || typeof businessName !== 'string') {
    errors.push('Business name is required');
  } else {
    const trimmed = businessName.trim();
    if (trimmed.length < 2) {
      errors.push('Business name is too short (minimum 2 characters)');
    } else if (trimmed.length > 100) {
      errors.push('Business name is too long (maximum 100 characters)');
    }
  }

  // Email validation with specific feedback
  if (!email || typeof email !== 'string') {
    errors.push('Email address is required');
  } else if (!isValidEmail(email)) {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      errors.push('Email address must include @ symbol');
    } else if (!trimmed.includes('.')) {
      errors.push('Email address must include a domain (e.g., .com)');
    } else {
      errors.push('Please enter a valid email address');
    }
  }

  // Password validation with specific feedback
  if (!isValidPassword(password)) {
    const passwordErrors = getPasswordErrors(password);
    errors.push(...passwordErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate Password Reset Input
 */
const validatePasswordReset = (email) => {
  const errors = [];

  if (!isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate New Password Input
 */
const validateNewPassword = (password, confirmPassword) => {
  const errors = [];

  if (!isValidPassword(password)) {
    errors.push('Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  getPasswordErrors,
  getPasswordStrength,
  isValidBusinessName,
  sanitizeInput,
  stripHtml,
  sanitizeUrl,
  validateSignup,
  validatePasswordReset,
  validateNewPassword
};
