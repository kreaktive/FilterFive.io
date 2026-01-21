/**
 * Preflight Service
 * Comprehensive health checks for all money-making workflows
 *
 * Checks: Database, Stripe, Twilio, Resend, Redis, Environment
 */

const logger = require('./logger');
const { getCircuitBreaker, getAllStates } = require('./circuitBreakerService');

class PreflightService {
  /**
   * Run all preflight checks
   * @returns {Promise<Object>} Preflight report
   */
  async runAllChecks() {
    const startTime = Date.now();

    // Run all checks in parallel for speed
    const [
      database,
      stripe,
      twilio,
      resend,
      redis,
      env
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkStripe(),
      this.checkTwilio(),
      this.checkResend(),
      this.checkRedis(),
      this.checkEnvironment()
    ]);

    const checks = { database, stripe, twilio, resend, redis, env };

    // Determine overall status
    const statuses = Object.values(checks).map(c => c.status);
    let overallStatus = 'healthy';

    if (statuses.includes('critical')) {
      overallStatus = 'critical';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      totalLatencyMs: Date.now() - startTime,
      checks
    };
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    const start = Date.now();
    try {
      const { sequelize } = require('../config/database');
      await sequelize.authenticate();

      // Quick query to verify actual DB access
      await sequelize.query('SELECT 1 as health');

      return {
        status: 'ok',
        latencyMs: Date.now() - start
      };
    } catch (error) {
      logger.error('Preflight: Database check failed', { error: error.message });
      return {
        status: 'critical',
        error: error.message,
        latencyMs: Date.now() - start
      };
    }
  }

  /**
   * Check Stripe API connectivity
   */
  async checkStripe() {
    const start = Date.now();
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const priceMonthly = process.env.STRIPE_PRICE_MONTHLY;
      const priceAnnual = process.env.STRIPE_PRICE_ANNUAL;

      // Check required env vars
      const missing = [];
      if (!secretKey) missing.push('STRIPE_SECRET_KEY');
      if (!webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET');
      if (!priceMonthly) missing.push('STRIPE_PRICE_MONTHLY');
      if (!priceAnnual) missing.push('STRIPE_PRICE_ANNUAL');

      if (missing.length > 0) {
        return {
          status: 'critical',
          error: 'Missing environment variables',
          missing,
          latencyMs: Date.now() - start
        };
      }

      // Test API connectivity
      const stripe = require('stripe')(secretKey);
      const result = await stripe.customers.list({ limit: 1 });

      // Determine if live or test mode
      const isLiveMode = secretKey.startsWith('sk_live_');

      return {
        status: 'ok',
        mode: isLiveMode ? 'live' : 'test',
        latencyMs: Date.now() - start
      };
    } catch (error) {
      logger.error('Preflight: Stripe check failed', { error: error.message });
      return {
        status: 'critical',
        error: error.message,
        latencyMs: Date.now() - start
      };
    }
  }

  /**
   * Check Twilio/SMS service
   */
  async checkTwilio() {
    const start = Date.now();
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

      // Check required env vars
      const missing = [];
      if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
      if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
      if (!messagingServiceSid) missing.push('TWILIO_MESSAGING_SERVICE_SID');

      if (missing.length > 0) {
        return {
          status: 'critical',
          error: 'Missing environment variables',
          missing,
          latencyMs: Date.now() - start
        };
      }

      // Check circuit breaker state
      const circuitStates = getAllStates();
      const twilioCircuit = circuitStates.twilio;

      if (twilioCircuit?.state === 'OPEN') {
        return {
          status: 'degraded',
          circuit: 'OPEN',
          reason: 'Circuit breaker tripped - SMS temporarily blocked',
          latencyMs: Date.now() - start
        };
      }

      // Verify Twilio credentials with a lightweight API call
      const twilio = require('twilio')(accountSid, authToken);
      await twilio.api.accounts(accountSid).fetch();

      return {
        status: 'ok',
        circuit: twilioCircuit?.state || 'CLOSED',
        latencyMs: Date.now() - start
      };
    } catch (error) {
      logger.error('Preflight: Twilio check failed', { error: error.message });

      // Check if it's an auth error
      const isAuthError = error.code === 20003 || error.message.includes('authenticate');

      return {
        status: 'critical',
        error: isAuthError ? 'Invalid Twilio credentials' : error.message,
        latencyMs: Date.now() - start
      };
    }
  }

  /**
   * Check Resend email service
   */
  async checkResend() {
    const start = Date.now();
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;

      if (!apiKey) {
        return {
          status: 'critical',
          error: 'Missing RESEND_API_KEY',
          latencyMs: Date.now() - start
        };
      }

      if (!fromEmail) {
        return {
          status: 'degraded',
          error: 'Missing RESEND_FROM_EMAIL (using default)',
          latencyMs: Date.now() - start
        };
      }

      // Verify API key with a lightweight call
      const { Resend } = require('resend');
      const resend = new Resend(apiKey);
      await resend.domains.list();

      return {
        status: 'ok',
        from: fromEmail,
        latencyMs: Date.now() - start
      };
    } catch (error) {
      logger.error('Preflight: Resend check failed', { error: error.message });
      return {
        status: 'critical',
        error: error.message,
        latencyMs: Date.now() - start
      };
    }
  }

  /**
   * Check Redis cache connectivity
   */
  async checkRedis() {
    const start = Date.now();
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        return {
          status: 'degraded',
          error: 'REDIS_URL not configured - caching disabled',
          latencyMs: Date.now() - start
        };
      }

      // Try to use existing cache service
      const cacheService = require('./cacheService');

      if (cacheService.isAvailable()) {
        // Test with a ping
        await cacheService.client.ping();
        return {
          status: 'ok',
          latencyMs: Date.now() - start
        };
      }

      // If not connected, try a quick connection test
      const Redis = require('ioredis');
      const testClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        lazyConnect: true
      });

      await testClient.connect();
      await testClient.ping();
      await testClient.quit();

      return {
        status: 'ok',
        note: 'Connection test passed (not using main client)',
        latencyMs: Date.now() - start
      };
    } catch (error) {
      logger.error('Preflight: Redis check failed', { error: error.message });
      return {
        status: 'degraded',
        error: error.message,
        latencyMs: Date.now() - start
      };
    }
  }

  /**
   * Check critical environment variables
   */
  async checkEnvironment() {
    const start = Date.now();

    const criticalVars = [
      'SESSION_SECRET',
      'API_SECRET',
      'APP_URL',
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];

    const recommendedVars = [
      'SENTRY_DSN',
      'BUSINESS_ALERTS_EMAIL'
    ];

    const missingCritical = criticalVars.filter(v => !process.env[v]);
    const missingRecommended = recommendedVars.filter(v => !process.env[v]);

    if (missingCritical.length > 0) {
      return {
        status: 'critical',
        error: 'Missing critical environment variables',
        missingCritical,
        latencyMs: Date.now() - start
      };
    }

    if (missingRecommended.length > 0) {
      return {
        status: 'ok',
        note: 'Some recommended variables missing',
        missingRecommended,
        latencyMs: Date.now() - start
      };
    }

    return {
      status: 'ok',
      latencyMs: Date.now() - start
    };
  }

  /**
   * Get a quick summary suitable for logging
   */
  async getQuickSummary() {
    const report = await this.runAllChecks();
    const failed = Object.entries(report.checks)
      .filter(([_, check]) => check.status !== 'ok')
      .map(([name, check]) => `${name}: ${check.error || check.status}`);

    return {
      status: report.status,
      failed: failed.length > 0 ? failed : null,
      latencyMs: report.totalLatencyMs
    };
  }
}

module.exports = new PreflightService();
