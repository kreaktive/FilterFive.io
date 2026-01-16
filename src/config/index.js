/**
 * Centralized Configuration Module
 *
 * Provides environment-specific settings and feature flags.
 * All environment-specific behavior should be controlled through this module.
 *
 * Usage:
 *   const config = require('./config');
 *   if (config.features.enableCron) { ... }
 *   console.log(config.app.url);
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Environment detection helpers
 */
const env = {
  isDevelopment: NODE_ENV === 'development',
  isStaging: NODE_ENV === 'staging',
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  current: NODE_ENV
};

/**
 * Application settings
 */
const app = {
  name: 'MoreStars',
  url: process.env.APP_URL || 'http://localhost:3000',
  port: parseInt(process.env.PORT, 10) || 3000,
  trustProxy: env.isProduction || env.isStaging
};

/**
 * Database configuration
 */
const database = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  name: process.env.DB_NAME || 'morestars',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings vary by environment
  pool: {
    max: env.isProduction ? 20 : (env.isStaging ? 10 : 5),
    min: env.isProduction ? 5 : 0,
    acquire: 30000,
    idle: 10000
  },
  // SSL required in production and staging
  ssl: (env.isProduction || env.isStaging) ? {
    require: true,
    rejectUnauthorized: env.isProduction
  } : false,
  logging: env.isDevelopment || env.isTest
};

/**
 * Redis configuration
 */
const redis = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  enabled: !!process.env.REDIS_URL,
  // Cache TTL settings (in seconds)
  ttl: {
    analytics: env.isProduction ? 3600 : 300, // 1 hour prod, 5 min dev
    session: env.isProduction ? 86400 : 3600,  // 24 hours prod, 1 hour dev
    general: env.isProduction ? 1800 : 60      // 30 min prod, 1 min dev
  }
};

/**
 * Session configuration
 */
const session = {
  secret: process.env.SESSION_SECRET,
  name: 'morestars.sid',
  cookie: {
    secure: env.isProduction || env.isStaging,
    httpOnly: true,
    maxAge: env.isProduction ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days prod, 1 day dev
    sameSite: 'lax'
  },
  resave: false,
  saveUninitialized: false
};

/**
 * Security settings
 */
const security = {
  apiSecret: process.env.API_SECRET,
  // CORS origins vary by environment
  corsOrigins: env.isProduction
    ? ['https://morestars.io', 'https://www.morestars.io']
    : env.isStaging
    ? ['https://staging.morestars.io']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  // Rate limiting (requests per window)
  rateLimit: {
    window: 15 * 60 * 1000, // 15 minutes
    max: env.isProduction ? 100 : 1000, // More lenient in dev
    smsMax: env.isProduction ? 10 : 50  // SMS-specific limit
  },
  // CSRF exempt paths
  csrfExemptPaths: [
    '/webhooks',
    '/api/v1/hooks',
    '/api/webhooks',
    '/health'
  ]
};

/**
 * External service configurations
 */
const services = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceMonthly: process.env.STRIPE_PRICE_MONTHLY,
    priceAnnual: process.env.STRIPE_PRICE_ANNUAL,
    // Use test mode in non-production
    testMode: !env.isProduction
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    // Circuit breaker settings
    circuitBreaker: {
      failureThreshold: env.isProduction ? 5 : 3,
      resetTimeout: env.isProduction ? 60000 : 30000
    }
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@morestars.io'
  },
  recaptcha: {
    siteKey: process.env.RECAPTCHA_SITE_KEY,
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    enabled: !!(process.env.RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY)
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: !!(process.env.SENTRY_DSN && (env.isProduction || env.isStaging)),
    environment: NODE_ENV,
    // Sample rate varies by environment
    tracesSampleRate: env.isProduction ? 0.1 : (env.isStaging ? 0.5 : 1.0)
  },
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: process.env.SANITY_API_VERSION || '2024-01-01'
  }
};

/**
 * POS Integration settings
 */
const pos = {
  square: {
    applicationId: process.env.SQUARE_APPLICATION_ID,
    applicationSecret: process.env.SQUARE_APPLICATION_SECRET,
    environment: env.isProduction ? 'production' : 'sandbox',
    webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  },
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    scopes: 'read_orders,read_customers'
  },
  tokenEncryptionKey: process.env.POS_TOKEN_ENCRYPTION_KEY
};

/**
 * Feature flags
 * Control feature availability per environment
 */
const features = {
  // Cron jobs (daily snapshots)
  enableCron: process.env.ENABLE_CRON === 'true' || env.isProduction,

  // Debug mode (extra logging, error details)
  debugMode: env.isDevelopment || env.isTest,

  // Show detailed errors in responses
  showErrorDetails: env.isDevelopment || env.isTest,

  // Enable API documentation
  enableApiDocs: env.isDevelopment || env.isStaging,

  // POS integrations
  enablePosIntegrations: !!(pos.square.applicationId || pos.shopify.apiKey),

  // Blog/CMS features
  enableBlog: !!services.sanity.projectId,

  // Email verification required
  requireEmailVerification: env.isProduction || env.isStaging,

  // reCAPTCHA on forms
  enableRecaptcha: services.recaptcha.enabled && (env.isProduction || env.isStaging),

  // Analytics tracking
  enableAnalytics: env.isProduction,

  // Maintenance mode
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
};

/**
 * Logging configuration
 */
const logging = {
  level: process.env.LOG_LEVEL || (env.isProduction ? 'info' : 'debug'),
  // Log to file in production
  fileLogging: env.isProduction,
  // Pretty print in development
  prettyPrint: env.isDevelopment,
  // Include request details
  requestLogging: !env.isTest
};

/**
 * Trial and subscription settings
 */
const subscription = {
  trialDays: parseInt(process.env.TRIAL_DAYS, 10) || 14,
  gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS, 10) || 7,
  // Monthly SMS limits by plan
  smsLimits: {
    trial: 50,
    basic: 500,
    pro: 2000,
    enterprise: 10000
  }
};

/**
 * Validate critical configuration
 * Called at startup to catch misconfigurations early
 */
function validateConfig() {
  const errors = [];

  // Critical in production/staging
  if (env.isProduction || env.isStaging) {
    if (!security.apiSecret || security.apiSecret.length < 32) {
      errors.push('API_SECRET must be at least 32 characters');
    }
    if (!session.secret || session.secret.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters');
    }
    if (!app.url.startsWith('https://')) {
      errors.push('APP_URL must use HTTPS in production/staging');
    }
  }

  // Production-specific
  if (env.isProduction) {
    if (!services.sentry.dsn) {
      console.warn('WARNING: SENTRY_DSN not configured for production');
    }
    if (!services.stripe.secretKey) {
      errors.push('STRIPE_SECRET_KEY required in production');
    }
    if (!services.twilio.accountSid) {
      errors.push('TWILIO_ACCOUNT_SID required in production');
    }
  }

  return errors;
}

module.exports = {
  env,
  app,
  database,
  redis,
  session,
  security,
  services,
  pos,
  features,
  logging,
  subscription,
  validateConfig,
  // Re-export NODE_ENV for convenience
  NODE_ENV
};
