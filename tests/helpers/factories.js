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

/**
 * Square Webhook Event Factory
 */
const squareEventFactory = {
  /**
   * Build base Square event
   */
  build(overrides = {}) {
    return {
      event_id: `evt_${faker.string.alphanumeric(24)}`,
      merchant_id: `MERCH_${faker.string.alphanumeric(8).toUpperCase()}`,
      type: overrides.type || 'payment.created',
      created_at: new Date().toISOString(),
      data: {
        type: (overrides.type || 'payment.created').split('.')[0],
        id: faker.string.alphanumeric(12),
        object: overrides.data || {}
      },
      ...overrides
    };
  },

  /**
   * Build payment.created event
   */
  buildPaymentCreated(overrides = {}) {
    const merchantId = overrides.merchantId || `MERCH_${faker.string.alphanumeric(8).toUpperCase()}`;
    return this.build({
      type: 'payment.created',
      merchant_id: merchantId,
      data: {
        object: {
          payment: {
            id: `pay_${faker.string.alphanumeric(16)}`,
            status: 'COMPLETED',
            location_id: overrides.locationId || `loc_${faker.string.alphanumeric(12)}`,
            customer_id: overrides.customerId || `cust_${faker.string.alphanumeric(12)}`,
            total_money: {
              amount: overrides.amount || 5000,
              currency: 'USD'
            },
            created_at: new Date().toISOString(),
            ...overrides.payment
          }
        }
      },
      ...overrides
    });
  },

  /**
   * Build order.created event
   */
  buildOrderCreated(overrides = {}) {
    const merchantId = overrides.merchantId || `MERCH_${faker.string.alphanumeric(8).toUpperCase()}`;
    return this.build({
      type: 'order.created',
      merchant_id: merchantId,
      data: {
        object: {
          order: {
            id: `ord_${faker.string.alphanumeric(16)}`,
            state: 'COMPLETED',
            location_id: overrides.locationId || `loc_${faker.string.alphanumeric(12)}`,
            customer_id: overrides.customerId || `cust_${faker.string.alphanumeric(12)}`,
            total_money: {
              amount: overrides.amount || 5000,
              currency: 'USD'
            },
            created_at: new Date().toISOString(),
            ...overrides.order
          }
        }
      },
      ...overrides
    });
  },

  /**
   * Build oauth.authorization.revoked event
   */
  buildOAuthRevoked(merchantId, overrides = {}) {
    return this.build({
      type: 'oauth.authorization.revoked',
      merchant_id: merchantId || `MERCH_${faker.string.alphanumeric(8).toUpperCase()}`,
      data: {},
      ...overrides
    });
  },

  /**
   * Build refund.created event
   */
  buildRefundCreated(overrides = {}) {
    return this.build({
      type: 'refund.created',
      data: {
        object: {
          refund: {
            id: `refund_${faker.string.alphanumeric(16)}`,
            status: 'COMPLETED',
            payment_id: overrides.paymentId || `pay_${faker.string.alphanumeric(16)}`,
            amount_money: {
              amount: overrides.amount || 5000,
              currency: 'USD'
            },
            ...overrides.refund
          }
        }
      },
      ...overrides
    });
  }
};

/**
 * Shopify Webhook Event Factory
 */
const shopifyEventFactory = {
  /**
   * Build base Shopify order
   */
  build(overrides = {}) {
    return {
      id: faker.number.int({ min: 1000000000, max: 9999999999 }),
      admin_graphql_api_id: `gid://shopify/Order/${faker.number.int({ min: 1000000000, max: 9999999999 })}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      number: faker.number.int({ min: 1000, max: 9999 }),
      total_price: (faker.number.int({ min: 1000, max: 50000 }) / 100).toFixed(2),
      currency: 'USD',
      financial_status: 'paid',
      fulfillment_status: null,
      ...overrides
    };
  },

  /**
   * Build orders/create event payload
   */
  buildOrderCreated(overrides = {}) {
    const customer = overrides.customer || {
      id: faker.number.int({ min: 1000000000, max: 9999999999 }),
      email: faker.internet.email().toLowerCase(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      phone: overrides.customerPhone || `+1${faker.string.numeric(10)}`
    };

    return this.build({
      customer,
      email: customer.email,
      phone: customer.phone,
      location_id: overrides.locationId || faker.number.int({ min: 10000000, max: 99999999 }),
      shipping_address: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: overrides.shippingPhone || customer.phone,
        address1: faker.location.streetAddress(),
        city: faker.location.city(),
        province: faker.location.state(),
        country: 'United States',
        zip: faker.location.zipCode()
      },
      billing_address: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: overrides.billingPhone || customer.phone,
        address1: faker.location.streetAddress(),
        city: faker.location.city(),
        province: faker.location.state(),
        country: 'United States',
        zip: faker.location.zipCode()
      },
      line_items: overrides.lineItems || [
        {
          id: faker.number.int({ min: 1000000000, max: 9999999999 }),
          title: faker.commerce.productName(),
          quantity: 1,
          price: (faker.number.int({ min: 1000, max: 50000 }) / 100).toFixed(2)
        }
      ],
      ...overrides
    });
  },

  /**
   * Build orders/create event without phone
   */
  buildOrderCreatedNoPhone(overrides = {}) {
    return this.buildOrderCreated({
      customer: {
        id: faker.number.int({ min: 1000000000, max: 9999999999 }),
        email: faker.internet.email().toLowerCase(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        phone: null
      },
      shipping_address: {
        phone: null
      },
      billing_address: {
        phone: null
      },
      ...overrides
    });
  },

  /**
   * Build app/uninstalled event payload
   */
  buildAppUninstalled(shopDomain, overrides = {}) {
    return {
      id: faker.number.int({ min: 1000000000, max: 9999999999 }),
      name: 'Test Store',
      email: faker.internet.email().toLowerCase(),
      domain: shopDomain || 'test-store.myshopify.com',
      created_at: new Date().toISOString(),
      ...overrides
    };
  },

  /**
   * Get Shopify webhook headers
   */
  getHeaders(topic, shopDomain, overrides = {}) {
    return {
      'x-shopify-topic': topic,
      'x-shopify-shop-domain': shopDomain || 'test-store.myshopify.com',
      'x-shopify-api-version': '2024-01',
      'x-shopify-webhook-id': faker.string.uuid(),
      ...overrides
    };
  }
};

/**
 * Extended Stripe Event Factory (additional methods)
 */
const extendedStripeEventFactory = {
  ...stripeEventFactory,

  /**
   * Build full Stripe event structure
   */
  buildFullEvent(eventType, dataObject, overrides = {}) {
    return {
      id: overrides.eventId || `evt_${faker.string.alphanumeric(24)}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: eventType,
      livemode: false,
      pending_webhooks: 0,
      data: {
        object: dataObject
      },
      ...overrides
    };
  },

  /**
   * Build invoice.payment_succeeded with billing_reason
   */
  buildInvoicePaymentSucceeded(customerId, subscriptionId, options = {}) {
    return this.buildFullEvent('invoice.payment_succeeded', {
      id: `in_${faker.string.alphanumeric(24)}`,
      customer: customerId,
      subscription: subscriptionId,
      status: 'paid',
      amount_paid: options.amount || 7700,
      billing_reason: options.billingReason || 'subscription_cycle',
      ...options.invoice
    });
  },

  /**
   * Build checkout.session.completed
   */
  buildCheckoutSessionCompleted(customerId, subscriptionId, userId, plan = 'monthly') {
    return this.buildFullEvent('checkout.session.completed', {
      id: `cs_${faker.string.alphanumeric(24)}`,
      customer: customerId,
      subscription: subscriptionId,
      mode: 'subscription',
      status: 'complete',
      payment_status: 'paid',
      metadata: {
        userId: userId.toString(),
        plan: plan
      }
    });
  },

  /**
   * Build customer.subscription.deleted
   */
  buildSubscriptionDeleted(subscriptionId, customerId) {
    return this.buildFullEvent('customer.subscription.deleted', {
      id: subscriptionId,
      customer: customerId,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000)
    });
  }
};

module.exports = {
  userFactory,
  feedbackRequestFactory,
  reviewFactory,
  stripeEventFactory,
  extendedStripeEventFactory,
  squareEventFactory,
  shopifyEventFactory,
  posIntegrationFactory,
  csvDataFactory,
  sessionFactory,

  // Helper functions
  generatePassword,
  hashPassword,

  // Re-export faker for custom usage
  faker,
};
