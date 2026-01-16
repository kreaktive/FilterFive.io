/**
 * Environment Variable Validator
 *
 * Validates required and optional environment variables at startup.
 * Can be used standalone for build-time validation or integrated into app startup.
 *
 * Usage:
 *   - At startup: require('./config/envValidator').validate()
 *   - Build/CI: node -e "require('./src/config/envValidator').validate()"
 */

const logger = require('../services/logger');

/**
 * Environment variable definitions
 */
const ENV_DEFINITIONS = {
  // Required variables - app will not start without these
  required: {
    API_SECRET: {
      minLength: 32,
      description: 'Secret key for API authentication'
    },
    SESSION_SECRET: {
      minLength: 32,
      description: 'Secret for session encryption'
    },
    DB_HOST: {
      description: 'PostgreSQL database host'
    },
    DB_NAME: {
      description: 'PostgreSQL database name'
    },
    DB_USER: {
      description: 'PostgreSQL database user'
    },
    DB_PASSWORD: {
      description: 'PostgreSQL database password'
    }
  },

  // Recommended variables - app will run but warn if missing
  recommended: {
    NODE_ENV: {
      enum: ['development', 'staging', 'production', 'test'],
      default: 'development',
      description: 'Application environment'
    },
    APP_URL: {
      pattern: /^https?:\/\/.+/,
      description: 'Public application URL'
    },
    STRIPE_SECRET_KEY: {
      pattern: /^sk_(test|live)_/,
      description: 'Stripe API secret key'
    },
    STRIPE_WEBHOOK_SECRET: {
      pattern: /^whsec_/,
      description: 'Stripe webhook signing secret'
    },
    TWILIO_ACCOUNT_SID: {
      pattern: /^AC[a-f0-9]{32}$/,
      description: 'Twilio Account SID'
    },
    TWILIO_AUTH_TOKEN: {
      minLength: 32,
      description: 'Twilio Auth Token'
    },
    TWILIO_MESSAGING_SERVICE_SID: {
      pattern: /^MG[a-f0-9]{32}$/,
      description: 'Twilio Messaging Service SID'
    },
    RESEND_API_KEY: {
      pattern: /^re_/,
      description: 'Resend API key for email'
    },
    REDIS_URL: {
      pattern: /^redis(s)?:\/\//,
      description: 'Redis connection URL'
    }
  },

  // Optional variables - no warning if missing
  optional: {
    PORT: {
      type: 'number',
      min: 1,
      max: 65535,
      default: '3000',
      description: 'Server port'
    },
    DB_PORT: {
      type: 'number',
      min: 1,
      max: 65535,
      default: '5432',
      description: 'PostgreSQL port'
    },
    RECAPTCHA_SITE_KEY: {
      description: 'Google reCAPTCHA site key'
    },
    RECAPTCHA_SECRET_KEY: {
      description: 'Google reCAPTCHA secret key'
    },
    SQUARE_APPLICATION_ID: {
      description: 'Square OAuth application ID'
    },
    SQUARE_APPLICATION_SECRET: {
      description: 'Square OAuth application secret'
    },
    SHOPIFY_API_KEY: {
      description: 'Shopify API key'
    },
    SHOPIFY_API_SECRET: {
      description: 'Shopify API secret'
    },
    POS_TOKEN_ENCRYPTION_KEY: {
      minLength: 32,
      description: 'Encryption key for POS tokens'
    },
    SENTRY_DSN: {
      pattern: /^https:\/\/.*@.*\.ingest(\.[a-z]{2})?\.sentry\.io/,
      description: 'Sentry DSN for error tracking'
    },
    LOG_LEVEL: {
      enum: ['error', 'warn', 'info', 'debug'],
      default: 'info',
      description: 'Logging level'
    },
    MAINTENANCE_MODE: {
      enum: ['true', 'false'],
      default: 'false',
      description: 'Enable maintenance mode'
    }
  },

  // Environment-specific requirements
  // Variables that become required/recommended in specific environments
  environmentSpecific: {
    production: {
      required: ['SENTRY_DSN', 'STRIPE_SECRET_KEY', 'TWILIO_ACCOUNT_SID', 'REDIS_URL'],
      httpsRequired: true
    },
    staging: {
      required: ['SENTRY_DSN', 'REDIS_URL'],
      httpsRequired: true
    }
  },

  // Security-sensitive variables that should not be placeholders
  secrets: [
    'API_SECRET',
    'SESSION_SECRET',
    'DB_PASSWORD',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'TWILIO_AUTH_TOKEN',
    'RESEND_API_KEY',
    'SQUARE_APPLICATION_SECRET',
    'SHOPIFY_API_SECRET',
    'POS_TOKEN_ENCRYPTION_KEY'
  ]
};

// Placeholder patterns that indicate insecure values
const PLACEHOLDER_PATTERNS = [
  'your-',
  'placeholder',
  'changeme',
  'xxx',
  'test-secret',
  'example',
  'change-me',
  'replace-me',
  'TODO'
];

/**
 * Validate a single environment variable
 * @param {string} name - Variable name
 * @param {string} value - Variable value
 * @param {object} rules - Validation rules
 * @returns {object} Validation result { valid, error }
 */
function validateVariable(name, value, rules) {
  // Check if required and missing
  if (!value) {
    if (rules.default !== undefined) {
      return { valid: true, warning: `Using default value: ${rules.default}` };
    }
    return { valid: false, error: `${name} is required but not set` };
  }

  // Check minimum length
  if (rules.minLength && value.length < rules.minLength) {
    return {
      valid: false,
      error: `${name} must be at least ${rules.minLength} characters (got ${value.length})`
    };
  }

  // Check enum values
  if (rules.enum && !rules.enum.includes(value)) {
    return {
      valid: false,
      error: `${name} must be one of: ${rules.enum.join(', ')} (got: ${value})`
    };
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return {
      valid: false,
      error: `${name} has invalid format`
    };
  }

  // Check numeric type
  if (rules.type === 'number') {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return { valid: false, error: `${name} must be a number` };
    }
    if (rules.min !== undefined && num < rules.min) {
      return { valid: false, error: `${name} must be at least ${rules.min}` };
    }
    if (rules.max !== undefined && num > rules.max) {
      return { valid: false, error: `${name} must be at most ${rules.max}` };
    }
  }

  return { valid: true };
}

/**
 * Check if a value appears to be a placeholder
 * @param {string} value - Value to check
 * @returns {boolean}
 */
function isPlaceholder(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some(pattern => lower.includes(pattern));
}

/**
 * Validate all environment variables
 * @param {object} options - Validation options
 * @param {boolean} options.strict - Exit on first error (default: true in production)
 * @param {boolean} options.silent - Suppress console output
 * @returns {object} Validation results
 */
function validate(options = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isStaging = process.env.NODE_ENV === 'staging';
  const strict = options.strict ?? (isProduction || isStaging);
  const silent = options.silent ?? false;

  const results = {
    valid: true,
    errors: [],
    warnings: [],
    checked: []
  };

  const log = (level, message) => {
    if (!silent) {
      if (level === 'error') {
        logger.error(message);
      } else if (level === 'warn') {
        logger.warn(message);
      } else {
        logger.info(message);
      }
    }
  };

  // Validate required variables
  for (const [name, rules] of Object.entries(ENV_DEFINITIONS.required)) {
    const value = process.env[name];
    const result = validateVariable(name, value, rules);
    results.checked.push(name);

    if (!result.valid) {
      results.valid = false;
      results.errors.push(result.error);
      log('error', `FATAL: ${result.error}`);
      if (strict) {
        process.exit(1);
      }
    }
  }

  // Validate recommended variables
  for (const [name, rules] of Object.entries(ENV_DEFINITIONS.recommended)) {
    const value = process.env[name];
    results.checked.push(name);

    if (!value) {
      results.warnings.push(`${name} not set - ${rules.description}`);
      log('warn', `WARNING: ${name} not set - related features may be disabled`);
      continue;
    }

    const result = validateVariable(name, value, rules);
    if (!result.valid) {
      results.warnings.push(result.error);
      log('warn', `WARNING: ${result.error}`);
    }
  }

  // Validate optional variables (only if set)
  for (const [name, rules] of Object.entries(ENV_DEFINITIONS.optional)) {
    const value = process.env[name];
    if (!value) continue;

    results.checked.push(name);
    const result = validateVariable(name, value, rules);
    if (!result.valid) {
      results.warnings.push(result.error);
      log('warn', `WARNING: ${result.error}`);
    }
  }

  // Check for placeholder secrets
  for (const secretName of ENV_DEFINITIONS.secrets) {
    const value = process.env[secretName];
    if (value && isPlaceholder(value)) {
      if (isProduction || isStaging) {
        results.valid = false;
        results.errors.push(`${secretName} appears to be a placeholder value`);
        log('error', `FATAL: ${secretName} appears to be a placeholder value`);
        if (strict) {
          process.exit(1);
        }
      } else {
        results.warnings.push(`${secretName} appears to be a placeholder - update before production`);
        log('warn', `WARNING: ${secretName} appears to be a placeholder`);
      }
    }
  }

  // Check environment-specific requirements (warnings only, not fatal)
  const envSpecific = ENV_DEFINITIONS.environmentSpecific[process.env.NODE_ENV];
  if (envSpecific) {
    // Check environment-specific recommended variables
    if (envSpecific.required) {
      for (const varName of envSpecific.required) {
        const value = process.env[varName];
        if (!value) {
          // Log as warning, not fatal - allows app to start but alerts operators
          results.warnings.push(`${varName} is strongly recommended in ${process.env.NODE_ENV} environment`);
          log('warn', `WARNING: ${varName} is strongly recommended in ${process.env.NODE_ENV}`);
        }
      }
    }

    // Check HTTPS requirement
    if (envSpecific.httpsRequired && process.env.APP_URL) {
      if (!process.env.APP_URL.startsWith('https://')) {
        if (isProduction) {
          results.valid = false;
          results.errors.push('APP_URL must use HTTPS in production');
          log('error', 'FATAL: APP_URL must use HTTPS in production');
          if (strict) {
            process.exit(1);
          }
        } else {
          results.warnings.push(`APP_URL should use HTTPS in ${process.env.NODE_ENV}`);
          log('warn', `WARNING: APP_URL should use HTTPS in ${process.env.NODE_ENV}`);
        }
      }
    }
  }

  if (!silent && results.valid) {
    log('info', `Environment validation passed (${results.checked.length} variables checked, env: ${process.env.NODE_ENV || 'development'})`);
  }

  return results;
}

/**
 * Generate a sample .env file with all variables
 * @returns {string} Sample .env content
 */
function generateSampleEnv() {
  const lines = [
    '# MoreStars Environment Configuration',
    '# Generated by envValidator.js',
    '',
    '# ==================',
    '# REQUIRED VARIABLES',
    '# ==================',
    ''
  ];

  for (const [name, rules] of Object.entries(ENV_DEFINITIONS.required)) {
    lines.push(`# ${rules.description}`);
    if (rules.minLength) {
      lines.push(`# Minimum length: ${rules.minLength} characters`);
    }
    lines.push(`${name}=`);
    lines.push('');
  }

  lines.push('# =====================');
  lines.push('# RECOMMENDED VARIABLES');
  lines.push('# =====================');
  lines.push('');

  for (const [name, rules] of Object.entries(ENV_DEFINITIONS.recommended)) {
    lines.push(`# ${rules.description}`);
    if (rules.enum) {
      lines.push(`# Allowed values: ${rules.enum.join(', ')}`);
    }
    if (rules.pattern) {
      lines.push(`# Format: ${rules.pattern.toString()}`);
    }
    lines.push(`${name}=${rules.default || ''}`);
    lines.push('');
  }

  lines.push('# ==================');
  lines.push('# OPTIONAL VARIABLES');
  lines.push('# ==================');
  lines.push('');

  for (const [name, rules] of Object.entries(ENV_DEFINITIONS.optional)) {
    lines.push(`# ${rules.description}`);
    lines.push(`${name}=${rules.default || ''}`);
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  validate,
  validateVariable,
  isPlaceholder,
  generateSampleEnv,
  ENV_DEFINITIONS
};

// If run directly, validate environment
if (require.main === module) {
  require('dotenv').config();
  const results = validate({ strict: false, silent: false });

  if (!results.valid) {
    console.error('\n❌ Environment validation FAILED');
    console.error('Errors:', results.errors);
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.warn('\n⚠️  Environment validation passed with warnings');
    console.warn('Warnings:', results.warnings);
  } else {
    console.log('\n✅ Environment validation passed');
  }
}
