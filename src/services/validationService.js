/**
 * Validation Service
 * Centralized validation logic for user inputs
 */

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
 * Basic: Minimum 12 characters (simple, modern approach)
 */
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;

  return password.length >= 12;
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
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate Signup Input
 */
const validateSignup = (businessName, email, password) => {
  const errors = [];

  if (!isValidBusinessName(businessName)) {
    errors.push('Business name must be between 2 and 100 characters');
  }

  if (!isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!isValidPassword(password)) {
    errors.push('Password must be at least 12 characters long');
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
    errors.push('Password must be at least 12 characters long');
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
  getPasswordStrength,
  isValidBusinessName,
  sanitizeInput,
  validateSignup,
  validatePasswordReset,
  validateNewPassword
};
