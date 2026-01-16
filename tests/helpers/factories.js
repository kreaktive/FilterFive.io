/**
 * Test Data Factories
 *
 * Uses @faker-js/faker to generate realistic test data.
 * Each factory returns a plain object that can be used to create database records.
 */

const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

/**
 * Generate a valid test password
 */
function generatePassword() {
  return 'Test123!@#'; // Standard test password that meets requirements
}

/**
 * Hash a password for storage
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * User Factory
 * Creates realistic user data for testing
 */
const userFactory = {
  /**
   * Build user attributes (not saved to DB)
   */
  build(overrides = {}) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const businessName = `${lastName}'s ${faker.company.buzzNoun()}`;

    return {
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: generatePassword(),
      businessName,
      reviewUrl: `https://g.page/r/${faker.string.alphanumeric(12)}/review`,
      customSmsMessage: null,
      smsUsageCount: 0,
      smsUsageLimit: 10,
      subscriptionStatus: 'trial',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      isVerified: true,
      isActive: true,
      trialStartsAt: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      verificationToken: null,
      verificationExpires: null,
      resetToken: null,
      resetExpires: null,
      ...overrides,
    };
  },

  /**
   * Build with hashed password
   */
  async buildWithHashedPassword(overrides = {}) {
    const attrs = this.build(overrides);
    attrs.password = await hashPassword(attrs.password);
    return attrs;
  },

  /**
   * Build an unverified user
   */
  buildUnverified(overrides = {}) {
    return this.build({
      isVerified: false,
      verificationToken: faker.string.alphanumeric(32),
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ...overrides,
    });
  },

  /**
   * Build a trial user
   */
  buildTrial(overrides = {}) {
    const now = new Date();
    return this.build({
      subscriptionStatus: 'trial',
      smsUsageLimit: 10,
      trialStartsAt: now,
      trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      ...overrides,
    });
  },

  /**
   * Build an expired trial user
   */
  buildExpiredTrial(overrides = {}) {
    const now = new Date();
    const trialStart = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
    return this.build({
      subscriptionStatus: 'trial',
      smsUsageLimit: 10,
      trialStartsAt: trialStart,
      trialEndsAt: new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000), // Expired 6 days ago
      ...overrides,
    });
  },

  /**
   * Build a paid subscriber
   */
  buildPaidSubscriber(overrides = {}) {
    return this.build({
      subscriptionStatus: 'active',
      smsUsageLimit: 1000,
      stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
      stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
      ...overrides,
    });
  },

  /**
   * Build user who has reached SMS limit
   */
  buildAtSmsLimit(overrides = {}) {
    return this.build({
      smsUsageCount: 10,
      smsUsageLimit: 10,
      ...overrides,
    });
  },
};

/**
 * Feedback Request Factory
 */
const feedbackRequestFactory = {
  build(overrides = {}) {
    return {
      userId: overrides.userId || 1,
      uuid: faker.string.uuid(),
      customerName: faker.person.fullName(),
      customerPhone: `+1${faker.string.numeric(10)}`,
      customerEmail: faker.internet.email().toLowerCase(),
      status: 'pending',
      deliveryMethod: 'sms',
      location: faker.location.city(),
      source: 'manual',
      ...overrides,
    };
  },

  /**
   * Build SMS request
   */
  buildSms(overrides = {}) {
    return this.build({
      deliveryMethod: 'sms',
      ...overrides,
    });
  },

  /**
   * Build QR request (no phone)
   */
  buildQr(overrides = {}) {
    return this.build({
      deliveryMethod: 'qr',
      customerPhone: null,
      source: 'qr_scan',
      ...overrides,
    });
  },

  /**
   * Build clicked request
   */
  buildClicked(overrides = {}) {
    return this.build({
      status: 'clicked',
      ...overrides,
    });
  },

  /**
   * Build rated request
   */
  buildRated(overrides = {}) {
    return this.build({
      status: 'rated',
      ...overrides,
    });
  },

  /**
   * Build from POS system
   */
  buildFromPos(provider, overrides = {}) {
    return this.build({
      source: `pos_${provider}`,
      ...overrides,
    });
  },
};

/**
 * Review Factory
 */
const reviewFactory = {
  build(overrides = {}) {
    return {
      userId: overrides.userId || 1,
      feedbackRequestId: overrides.feedbackRequestId || null,
      rating: faker.number.int({ min: 1, max: 5 }),
      feedbackText: faker.lorem.sentences(2),
      feedbackStatus: 'pending',
      ...overrides,
    };
  },

  /**
   * Build positive review (4-5 stars)
   */
  buildPositive(overrides = {}) {
    return this.build({
      rating: faker.number.int({ min: 4, max: 5 }),
      feedbackText: faker.lorem.sentences(2) + ' Great service!',
      ...overrides,
    });
  },

  /**
   * Build negative review (1-3 stars)
   */
  buildNegative(overrides = {}) {
    return this.build({
      rating: faker.number.int({ min: 1, max: 3 }),
      feedbackText: faker.lorem.sentences(2) + ' Needs improvement.',
      ...overrides,
    });
  },

  /**
   * Build resolved review
   */
  buildResolved(overrides = {}) {
    return this.build({
      feedbackStatus: 'resolved',
      ...overrides,
    });
  },
};

/**
 * Stripe Webhook Event Factory
 */
const stripeEventFactory = {
  build(overrides = {}) {
    return {
      eventId: `evt_${faker.string.alphanumeric(24)}`,
      eventType: 'checkout.session.completed',
      processedAt: null,
      rawPayload: {},
      ...overrides,
    };
  },

  /**
   * Build checkout completed event
   */
  buildCheckoutCompleted(customerId, subscriptionId, overrides = {}) {
    return this.build({
      eventType: 'checkout.session.completed',
      rawPayload: {
        id: `evt_${faker.string.alphanumeric(24)}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_${faker.string.alphanumeric(24)}`,
            customer: customerId,
            subscription: subscriptionId,
            mode: 'subscription',
            status: 'complete',
          }
        }
      },
      ...overrides,
    });
  },

  /**
   * Build subscription updated event
   */
  buildSubscriptionUpdated(subscriptionId, status = 'active', overrides = {}) {
    return this.build({
      eventType: 'customer.subscription.updated',
      rawPayload: {
        id: `evt_${faker.string.alphanumeric(24)}`,
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: subscriptionId,
            status,
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          }
        }
      },
      ...overrides,
    });
  },

  /**
   * Build invoice paid event
   */
  buildInvoicePaid(customerId, subscriptionId, overrides = {}) {
    return this.build({
      eventType: 'invoice.paid',
      rawPayload: {
        id: `evt_${faker.string.alphanumeric(24)}`,
        type: 'invoice.paid',
        data: {
          object: {
            id: `in_${faker.string.alphanumeric(24)}`,
            customer: customerId,
            subscription: subscriptionId,
            status: 'paid',
            amount_paid: 2900, // $29.00
          }
        }
      },
      ...overrides,
    });
  },

  /**
   * Build payment failed event
   */
  buildPaymentFailed(customerId, overrides = {}) {
    return this.build({
      eventType: 'invoice.payment_failed',
      rawPayload: {
        id: `evt_${faker.string.alphanumeric(24)}`,
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: `in_${faker.string.alphanumeric(24)}`,
            customer: customerId,
            status: 'open',
            attempt_count: 1,
          }
        }
      },
      ...overrides,
    });
  },
};

/**
 * POS Integration Factory
 */
const posIntegrationFactory = {
  build(overrides = {}) {
    return {
      userId: overrides.userId || 1,
      provider: 'square',
      accessToken: faker.string.alphanumeric(64),
      refreshToken: faker.string.alphanumeric(64),
      merchantId: faker.string.alphanumeric(13),
      isActive: true,
      webhookUrl: null,
      webhookSecret: null,
      settings: {},
      ...overrides,
    };
  },

  buildSquare(overrides = {}) {
    return this.build({
      provider: 'square',
      merchantId: faker.string.alphanumeric(13),
      ...overrides,
    });
  },

  buildShopify(overrides = {}) {
    return this.build({
      provider: 'shopify',
      merchantId: `${faker.string.numeric(10)}.myshopify.com`,
      ...overrides,
    });
  },
};

/**
 * CSV Upload Data Factory
 */
const csvDataFactory = {
  /**
   * Generate valid CSV row
   */
  buildRow(overrides = {}) {
    return {
      name: faker.person.fullName(),
      phone: `${faker.string.numeric(10)}`,
      email: faker.internet.email().toLowerCase(),
      ...overrides,
    };
  },

  /**
   * Generate multiple CSV rows
   */
  buildRows(count, overrides = {}) {
    return Array.from({ length: count }, () => this.buildRow(overrides));
  },

  /**
   * Generate CSV string
   */
  buildCsvString(rows) {
    const headers = 'name,phone,email';
    const dataRows = rows.map(r => `${r.name},${r.phone},${r.email || ''}`);
    return [headers, ...dataRows].join('\n');
  },

  /**
   * Generate invalid row (no phone)
   */
  buildInvalidRow() {
    return {
      name: faker.person.fullName(),
      phone: '',
      email: faker.internet.email(),
    };
  },
};

/**
 * Session/Auth Factory
 */
const sessionFactory = {
  /**
   * Build mock session object
   */
  build(overrides = {}) {
    return {
      userId: null,
      userEmail: null,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
      },
      ...overrides,
    };
  },

  /**
   * Build authenticated session
   */
  buildAuthenticated(userId, email, overrides = {}) {
    return this.build({
      userId,
      userEmail: email,
      ...overrides,
    });
  },
};

module.exports = {
  userFactory,
  feedbackRequestFactory,
  reviewFactory,
  stripeEventFactory,
  posIntegrationFactory,
  csvDataFactory,
  sessionFactory,

  // Helper functions
  generatePassword,
  hashPassword,

  // Re-export faker for custom usage
  faker,
};
