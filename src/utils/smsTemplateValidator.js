/**
 * SMS Template Validation Utilities
 * Validates custom SMS message templates for correctness and compliance
 */

// Maximum SMS segment lengths
const SMS_MAX_LENGTH = 160; // Single SMS
const SMS_CONCAT_MAX = 1600; // Max concatenated SMS (10 segments)

// Available template tags
const VALID_TAGS = ['{{CustomerName}}', '{{BusinessName}}', '{{ReviewLink}}'];

// Required tags that must be present
const REQUIRED_TAGS = ['{{ReviewLink}}'];

/**
 * Validate a custom SMS template
 * @param {string} template - The SMS template to validate
 * @returns {object} { valid: boolean, errors: string[], warnings: string[], estimatedLength: number }
 */
const validateSmsTemplate = (template) => {
  const errors = [];
  const warnings = [];

  if (!template || typeof template !== 'string') {
    return {
      valid: false,
      errors: ['Template is required'],
      warnings: [],
      estimatedLength: 0
    };
  }

  const trimmed = template.trim();

  // Check minimum length
  if (trimmed.length < 10) {
    errors.push('Template must be at least 10 characters');
  }

  // Check maximum length (with sample values substituted)
  const estimatedLength = estimateMessageLength(trimmed);
  if (estimatedLength > SMS_CONCAT_MAX) {
    errors.push(`Template is too long. Estimated length: ${estimatedLength} characters (max: ${SMS_CONCAT_MAX})`);
  } else if (estimatedLength > SMS_MAX_LENGTH * 3) {
    warnings.push(`Template may result in ${Math.ceil(estimatedLength / 153)} SMS segments (cost consideration)`);
  }

  // Check for required tags
  for (const tag of REQUIRED_TAGS) {
    if (!trimmed.toLowerCase().includes(tag.toLowerCase())) {
      errors.push(`Template must include ${tag}`);
    }
  }

  // Check for invalid/unknown tags
  const tagRegex = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = tagRegex.exec(trimmed)) !== null) {
    const fullTag = match[0];
    const isValid = VALID_TAGS.some(validTag =>
      validTag.toLowerCase() === fullTag.toLowerCase()
    );
    if (!isValid) {
      warnings.push(`Unknown tag "${fullTag}" will not be replaced`);
    }
  }

  // Check for potential compliance issues
  if (/\b(free|winner|prize|won|urgent|act now)\b/i.test(trimmed)) {
    warnings.push('Template contains words that may trigger spam filters');
  }

  // Check for URL patterns (besides ReviewLink tag)
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = trimmed.match(urlPattern) || [];
  if (urls.length > 0) {
    warnings.push('Template contains hardcoded URLs. Consider using {{ReviewLink}} tag instead');
  }

  // Check for opt-out language (recommended for compliance)
  if (!/stop|unsubscribe|opt.?out/i.test(trimmed)) {
    warnings.push('Consider adding opt-out language (e.g., "Reply STOP to unsubscribe")');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedLength
  };
};

/**
 * Estimate the length of a message after tag replacement
 * Uses average values for variable fields
 * @param {string} template - The template to measure
 * @returns {number} Estimated character count
 */
const estimateMessageLength = (template) => {
  if (!template) return 0;

  // Sample values for estimation
  const sampleValues = {
    '{{customername}}': 'John', // ~5 chars
    '{{businessname}}': 'Local Business', // ~15 chars
    '{{reviewlink}}': 'https://morestars.io/r/abc123' // ~30 chars
  };

  let result = template.toLowerCase();
  for (const [tag, value] of Object.entries(sampleValues)) {
    result = result.replace(new RegExp(tag, 'gi'), value);
  }

  return result.length;
};

/**
 * Preview a template with sample data
 * @param {string} template - The template to preview
 * @param {object} sampleData - Optional custom sample data
 * @returns {string} The previewed message
 */
const previewTemplate = (template, sampleData = {}) => {
  if (!template) return '';

  const defaults = {
    customerName: 'John',
    businessName: 'Your Business',
    reviewLink: 'https://morestars.io/r/demo123'
  };

  const data = { ...defaults, ...sampleData };

  return template
    .replace(/\{\{CustomerName\}\}/gi, data.customerName)
    .replace(/\{\{BusinessName\}\}/gi, data.businessName)
    .replace(/\{\{ReviewLink\}\}/gi, data.reviewLink);
};

/**
 * Get available template tags with descriptions
 * @returns {Array} Array of tag objects with name, description, and example
 */
const getAvailableTags = () => [
  {
    tag: '{{CustomerName}}',
    description: 'Customer\'s first name',
    example: 'John',
    fallback: 'there'
  },
  {
    tag: '{{BusinessName}}',
    description: 'Your business name',
    example: 'Joe\'s Barbershop',
    required: false
  },
  {
    tag: '{{ReviewLink}}',
    description: 'Your review page URL',
    example: 'https://morestars.io/r/abc123',
    required: true
  }
];

/**
 * Calculate SMS segment count
 * @param {number} length - Message length
 * @returns {number} Number of SMS segments
 */
const calculateSegments = (length) => {
  if (length <= 160) return 1;
  // Concatenated SMS uses 153 chars per segment (7 chars for UDH header)
  return Math.ceil(length / 153);
};

module.exports = {
  validateSmsTemplate,
  estimateMessageLength,
  previewTemplate,
  getAvailableTags,
  calculateSegments,
  SMS_MAX_LENGTH,
  SMS_CONCAT_MAX,
  VALID_TAGS,
  REQUIRED_TAGS
};
