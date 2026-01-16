/**
 * Application Constants
 *
 * Centralized configuration values that can be overridden via environment variables.
 * This makes it easy to adjust values per environment without code changes.
 *
 * @module config/constants
 */

module.exports = {
  // Trial configuration
  TRIAL_DURATION_DAYS: parseInt(process.env.TRIAL_DURATION_DAYS, 10) || 14,

  // Subscription pricing (in dollars)
  SUBSCRIPTION_PRICES: {
    monthly: parseFloat(process.env.SUBSCRIPTION_MONTHLY_PRICE) || 77,
    annual: parseFloat(process.env.SUBSCRIPTION_ANNUAL_PRICE) || 770
  },

  // SMS configuration
  SMS_TRIAL_LIMIT: parseInt(process.env.SMS_TRIAL_LIMIT, 10) || 5,
  SMS_MONTHLY_LIMIT: parseInt(process.env.SMS_MONTHLY_LIMIT, 10) || 1000,

  // Rate limiting defaults
  API_RATE_LIMIT_WINDOW_MS: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 60 * 60 * 1000, // 1 hour
  API_RATE_LIMIT_MAX: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100,

  // Pagination defaults
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 25,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100
};
