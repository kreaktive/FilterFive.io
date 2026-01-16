/**
 * Mock Services for Testing
 *
 * Provides mock implementations of external services:
 * - Twilio (SMS)
 * - Stripe (Payments)
 * - Resend (Email)
 * - Redis (Caching)
 */

/**
 * Mock Twilio Service
 * Simulates SMS sending without making actual API calls
 */
class MockTwilioService {
  constructor() {
    this.sentMessages = [];
    this.shouldFail = false;
    this.failureMessage = 'Simulated Twilio failure';
  }

  /**
   * Simulate sending an SMS
   */
  async sendSMS(to, body, from = null) {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    const message = {
      sid: `SM${this.generateId()}`,
      to,
      body,
      from: from || '+15551234567',
      status: 'queued',
      dateCreated: new Date().toISOString(),
    };

    this.sentMessages.push(message);
    return message;
  }

  /**
   * Get all sent messages (for assertions)
   */
  getSentMessages() {
    return [...this.sentMessages];
  }

  /**
   * Get messages sent to a specific number
   */
  getMessagesSentTo(phoneNumber) {
    return this.sentMessages.filter(m => m.to === phoneNumber);
  }

  /**
   * Clear sent messages
   */
  clear() {
    this.sentMessages = [];
    this.shouldFail = false;
  }

  /**
   * Configure to fail on next call
   */
  setFailure(shouldFail, message = 'Simulated Twilio failure') {
    this.shouldFail = shouldFail;
    this.failureMessage = message;
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Mock Stripe Service
 * Simulates Stripe API interactions
 */
class MockStripeService {
  constructor() {
    this.customers = new Map();
    this.subscriptions = new Map();
    this.checkoutSessions = new Map();
    this.webhookEvents = [];
    this.shouldFail = false;
  }

  /**
   * Create a mock customer
   */
  async createCustomer({ email, name, metadata = {} }) {
    if (this.shouldFail) {
      throw new Error('Simulated Stripe failure');
    }

    const customer = {
      id: `cus_${this.generateId()}`,
      email,
      name,
      metadata,
      created: Math.floor(Date.now() / 1000),
    };

    this.customers.set(customer.id, customer);
    return customer;
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId) {
    return this.customers.get(customerId) || null;
  }

  /**
   * Create a mock checkout session
   */
  async createCheckoutSession({ customer, priceId, successUrl, cancelUrl, metadata = {} }) {
    if (this.shouldFail) {
      throw new Error('Simulated Stripe failure');
    }

    const session = {
      id: `cs_${this.generateId()}`,
      customer,
      mode: 'subscription',
      status: 'open',
      url: `https://checkout.stripe.com/pay/${this.generateId()}`,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      created: Math.floor(Date.now() / 1000),
    };

    this.checkoutSessions.set(session.id, session);
    return session;
  }

  /**
   * Create a mock subscription
   */
  async createSubscription({ customerId, priceId, status = 'active' }) {
    const subscription = {
      id: `sub_${this.generateId()}`,
      customer: customerId,
      status,
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [{ price: { id: priceId } }]
      },
      created: Math.floor(Date.now() / 1000),
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId) {
    return this.subscriptions.get(subscriptionId) || null;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.status = 'canceled';
      subscription.canceled_at = Math.floor(Date.now() / 1000);
    }
    return subscription;
  }

  /**
   * Generate a mock webhook event
   */
  generateWebhookEvent(type, data) {
    const event = {
      id: `evt_${this.generateId()}`,
      type,
      data: { object: data },
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    };

    this.webhookEvents.push(event);
    return event;
  }

  /**
   * Verify webhook signature (always returns true in mock)
   */
  verifyWebhookSignature(payload, signature, secret) {
    return true;
  }

  /**
   * Clear all mock data
   */
  clear() {
    this.customers.clear();
    this.subscriptions.clear();
    this.checkoutSessions.clear();
    this.webhookEvents = [];
    this.shouldFail = false;
  }

  /**
   * Configure to fail on next call
   */
  setFailure(shouldFail) {
    this.shouldFail = shouldFail;
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Mock Resend (Email) Service
 */
class MockResendService {
  constructor() {
    this.sentEmails = [];
    this.shouldFail = false;
  }

  /**
   * Send an email
   */
  async send({ from, to, subject, html, text }) {
    if (this.shouldFail) {
      throw new Error('Simulated Resend failure');
    }

    const email = {
      id: this.generateId(),
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      sentAt: new Date().toISOString(),
    };

    this.sentEmails.push(email);
    return { id: email.id };
  }

  /**
   * Get all sent emails
   */
  getSentEmails() {
    return [...this.sentEmails];
  }

  /**
   * Get emails sent to a specific address
   */
  getEmailsSentTo(emailAddress) {
    return this.sentEmails.filter(e => e.to.includes(emailAddress));
  }

  /**
   * Clear sent emails
   */
  clear() {
    this.sentEmails = [];
    this.shouldFail = false;
  }

  /**
   * Configure to fail
   */
  setFailure(shouldFail) {
    this.shouldFail = shouldFail;
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Mock Redis/Cache Service
 */
class MockCacheService {
  constructor() {
    this.store = new Map();
    this.isConnected = true;
  }

  async connect() {
    this.isConnected = true;
    return true;
  }

  isAvailable() {
    return this.isConnected;
  }

  async get(key) {
    if (!this.isConnected) return null;
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttl = 300) {
    if (!this.isConnected) return false;
    this.store.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });
    return true;
  }

  async del(key) {
    if (!this.isConnected) return false;
    this.store.delete(key);
    return true;
  }

  async delPattern(pattern) {
    if (!this.isConnected) return 0;
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async getOrSet(key, fetchFn, ttl = 300) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  clear() {
    this.store.clear();
  }

  async disconnect() {
    this.isConnected = false;
    this.store.clear();
  }
}

/**
 * Mock Logger
 * Captures log messages for assertions
 */
class MockLogger {
  constructor() {
    this.logs = {
      error: [],
      warn: [],
      info: [],
      debug: [],
      http: [],
    };
  }

  error(message, meta = {}) {
    this.logs.error.push({ message, meta, timestamp: new Date() });
  }

  warn(message, meta = {}) {
    this.logs.warn.push({ message, meta, timestamp: new Date() });
  }

  info(message, meta = {}) {
    this.logs.info.push({ message, meta, timestamp: new Date() });
  }

  debug(message, meta = {}) {
    this.logs.debug.push({ message, meta, timestamp: new Date() });
  }

  http(message, meta = {}) {
    this.logs.http.push({ message, meta, timestamp: new Date() });
  }

  // Custom methods from real logger
  sms(message, meta = {}) {
    this.info(`[SMS] ${message}`, meta);
  }

  auth(message, meta = {}) {
    this.info(`[AUTH] ${message}`, meta);
  }

  cron(message, meta = {}) {
    this.info(`[CRON] ${message}`, meta);
  }

  getLogs(level = null) {
    if (level) return [...this.logs[level]];
    return { ...this.logs };
  }

  hasLogContaining(level, substring) {
    return this.logs[level].some(log =>
      log.message.includes(substring) ||
      JSON.stringify(log.meta).includes(substring)
    );
  }

  clear() {
    Object.keys(this.logs).forEach(key => {
      this.logs[key] = [];
    });
  }
}

// Create singleton instances
const mockTwilio = new MockTwilioService();
const mockStripe = new MockStripeService();
const mockResend = new MockResendService();
const mockCache = new MockCacheService();
const mockLogger = new MockLogger();

module.exports = {
  // Classes for creating new instances
  MockTwilioService,
  MockStripeService,
  MockResendService,
  MockCacheService,
  MockLogger,

  // Singleton instances for convenience
  mockTwilio,
  mockStripe,
  mockResend,
  mockCache,
  mockLogger,

  /**
   * Reset all mocks
   */
  resetAllMocks() {
    mockTwilio.clear();
    mockStripe.clear();
    mockResend.clear();
    mockCache.clear();
    mockLogger.clear();
  }
};
