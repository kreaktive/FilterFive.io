/**
 * Stripe Service
 * Handles Stripe customer management, subscriptions, and payments
 * With idempotency for webhook handling
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, StripeWebhookEvent } = require('../models');
const logger = require('./logger');
const { sendBusinessEventAlert, sendSubscriptionConfirmationEmail } = require('./emailService');

/**
 * Price IDs for MoreStars subscriptions
 * - Monthly: $77/month
 * - Annual: $770/year
 */
const PRICE_IDS = {
  'monthly': process.env.STRIPE_PRICE_MONTHLY,
  'annual': process.env.STRIPE_PRICE_ANNUAL
};

class StripeService {
  /**
   * Create a Stripe customer
   * @param {Object} user - User model instance
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.businessName,
        metadata: {
          userId: user.id.toString(),
          businessName: user.businessName
        }
      });

      logger.info('Stripe customer created', { customerId: customer.id, userId: user.id });
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer', { userId: user.id, error: error.message });
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Create a checkout session for subscription
   * @param {Object} user - User model instance
   * @param {string} plan - 'monthly' or 'annual'
   * @returns {Promise<Object>} Stripe checkout session
   */
  async createCheckoutSession(user, plan) {
    try {
      if (!['monthly', 'annual'].includes(plan)) {
        throw new Error('Invalid plan. Must be monthly or annual');
      }

      // Ensure user has Stripe customer ID
      if (!user.stripeCustomerId) {
        const customer = await this.createCustomer(user);
        await user.update({ stripeCustomerId: customer.id });
      }

      const priceId = PRICE_IDS[plan];

      const session = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.APP_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/dashboard/subscription/cancel`,
        metadata: {
          userId: user.id.toString(),
          plan: plan
        }
      });

      logger.info('Checkout session created', { sessionId: session.id, userId: user.id, plan });
      return session;
    } catch (error) {
      logger.error('Error creating checkout session', {
        userId: user.id,
        plan,
        error: error.message,
        errorCode: error.code
      });
      throw error;
    }
  }

  /**
   * Retrieve a checkout session
   * @param {string} sessionId - Checkout session ID
   * @returns {Promise<Object>} Stripe checkout session
   */
  async getCheckoutSession(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      logger.error('Error retrieving checkout session', { sessionId, error: error.message });
      throw new Error('Failed to retrieve checkout session');
    }
  }

  /**
   * Get subscription details
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Stripe subscription object
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Error retrieving subscription', { subscriptionId, error: error.message });
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {boolean} immediately - Cancel immediately or at period end
   * @returns {Promise<Object>} Updated subscription object
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    try {
      if (immediately) {
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        logger.info('Subscription cancelled immediately', { subscriptionId });
        return subscription;
      } else {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
        logger.info('Subscription set to cancel at period end', { subscriptionId });
        return subscription;
      }
    } catch (error) {
      logger.error('Error cancelling subscription', { subscriptionId, error: error.message });
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate a cancelled subscription (before period end)
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Updated subscription object
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });
      logger.info('Subscription reactivated', { subscriptionId });
      return subscription;
    } catch (error) {
      logger.error('Error reactivating subscription', { subscriptionId, error: error.message });
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Handle subscription webhook events with idempotency
   * D4 FIX: Uses atomic findOrCreate to prevent race conditions
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>} Result of handling
   */
  async handleWebhookEvent(event) {
    // Extract customer ID for logging
    const customerId = event.data.object.customer || event.data.object.id;
    let userId = null;

    // Try to get userId from metadata or lookup
    if (event.data.object.metadata?.userId) {
      userId = parseInt(event.data.object.metadata.userId);
    }

    // D4 FIX: Atomic idempotency check using findOrCreate
    // This prevents race conditions where two concurrent webhooks
    // could both pass the "isProcessed" check before either marks it as processed
    const [webhookEvent, created] = await StripeWebhookEvent.findOrCreate({
      where: { eventId: event.id },
      defaults: {
        eventType: event.type,
        stripeCustomerId: customerId,
        userId: userId,
        processedAt: new Date()
      }
    });

    if (!created) {
      logger.info('Stripe webhook already processed, skipping', {
        eventId: event.id,
        eventType: event.type
      });
      return { skipped: true, reason: 'already_processed' };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          userId = parseInt(event.data.object.metadata?.userId);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          logger.debug('Unhandled webhook event type', { eventType: event.type });
      }

      // Update userId if we got it from the handler
      if (userId && !webhookEvent.userId) {
        await webhookEvent.update({ userId });
      }

      logger.info('Stripe webhook processed', {
        eventId: event.id,
        eventType: event.type,
        userId
      });

      return { success: true };
    } catch (error) {
      logger.error('Error handling webhook event', {
        eventId: event.id,
        eventType: event.type,
        error: error.message
      });
      // Note: We don't delete the webhook event record on error
      // This prevents retries from reprocessing. Stripe will retry the webhook.
      throw error;
    }
  }

  /**
   * Handle checkout.session.completed event
   * @param {Object} session - Checkout session object
   */
  async handleCheckoutCompleted(session) {
    const userId = parseInt(session.metadata.userId);
    const plan = session.metadata.plan;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Check if this is a trial conversion (user was previously on trial)
    const wasOnTrial = user.subscriptionStatus === 'trial';

    await user.update({
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
      smsUsageCount: 0, // Reset SMS count
      smsUsageLimit: 1000, // Set to active limit
      marketingStatus: 'active',
      // Clear abandoned checkout tracking
      checkoutStartedAt: null,
      checkoutSessionId: null,
      checkoutRecoveryEmailSentAt: null
    });

    logger.info('Checkout completed', { userId, plan });

    // Send subscription confirmation email to customer (non-blocking)
    sendSubscriptionConfirmationEmail(user.email, user.businessName, plan)
      .catch(err => logger.error('Subscription confirmation email failed', { userId, error: err.message }));

    // Send business event alert (non-blocking)
    sendBusinessEventAlert(wasOnTrial ? 'trial_converted' : 'subscription_created', {
      businessName: user.businessName,
      email: user.email,
      userId: user.id,
      plan: plan === 'annual' ? 'Annual ($770/yr)' : 'Monthly ($77/mo)',
      previousStatus: wasOnTrial ? 'Trial' : 'None'
    }).catch(err => logger.error('Business alert failed', { error: err.message }));
  }

  /**
   * Handle customer.subscription.created event
   * @param {Object} subscription - Subscription object
   */
  async handleSubscriptionCreated(subscription) {
    const user = await User.findOne({
      where: { stripeCustomerId: subscription.customer }
    });

    if (!user) {
      logger.warn('User not found for subscription created', { customerId: subscription.customer });
      return;
    }

    await user.update({
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'active',
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
      smsUsageCount: 0,
      smsUsageLimit: 1000,
      marketingStatus: 'active'
    });

    logger.info('Subscription created', { userId: user.id, subscriptionId: subscription.id });
  }

  /**
   * Handle customer.subscription.updated event
   * @param {Object} subscription - Subscription object
   */
  async handleSubscriptionUpdated(subscription) {
    const user = await User.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (!user) {
      logger.warn('User not found for subscription update', { subscriptionId: subscription.id });
      return;
    }

    let subscriptionStatus = 'active';
    let smsUsageLimit = user.smsUsageLimit;

    if (subscription.status === 'past_due') {
      subscriptionStatus = 'past_due';
      smsUsageLimit = 0; // Block SMS when past due
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      subscriptionStatus = 'cancelled';
      smsUsageLimit = 10; // Revert to trial limit
    } else if (subscription.status === 'active') {
      smsUsageLimit = 1000; // Restore full limit
    }

    await user.update({
      subscriptionStatus,
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
      smsUsageLimit
    });

    logger.info('Subscription updated', { userId: user.id, status: subscriptionStatus });
  }

  /**
   * Handle customer.subscription.deleted event
   * @param {Object} subscription - Subscription object
   */
  async handleSubscriptionDeleted(subscription) {
    const user = await User.findOne({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (!user) {
      logger.warn('User not found for subscription deleted', { subscriptionId: subscription.id });
      return;
    }

    await user.update({
      subscriptionStatus: 'cancelled',
      marketingStatus: 'churned',
      smsUsageLimit: 10 // Revert to trial limit
    });

    logger.info('Subscription deleted', { userId: user.id });

    // Send business event alert (non-blocking)
    sendBusinessEventAlert('subscription_cancelled', {
      businessName: user.businessName,
      email: user.email,
      userId: user.id,
      plan: user.subscriptionPlan === 'annual' ? 'Annual' : 'Monthly'
    }).catch(err => logger.error('Business alert failed', { error: err.message }));
  }

  /**
   * Handle invoice.payment_succeeded event
   * B6 FIX: Only reset SMS count for subscription billing invoices
   * @param {Object} invoice - Invoice object
   */
  async handlePaymentSucceeded(invoice) {
    const user = await User.findOne({
      where: { stripeCustomerId: invoice.customer }
    });

    if (!user) {
      logger.warn('User not found for payment succeeded', { customerId: invoice.customer });
      return;
    }

    // B6 FIX: Only reset SMS usage for subscription invoices (not one-time charges)
    // billing_reason can be: subscription_create, subscription_cycle, subscription_update,
    // subscription_threshold, manual, upcoming, or null (for one-time invoices)
    const isSubscriptionBilling = invoice.billing_reason &&
      ['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason);

    const updateData = {
      subscriptionStatus: 'active',
      marketingStatus: 'active',
      // Clear payment failure tracking
      paymentFailedAt: null,
      paymentFailedEmailSentAt: null
    };

    // Only reset SMS count for new billing cycles or new subscriptions
    if (isSubscriptionBilling) {
      updateData.smsUsageCount = 0;
      updateData.smsUsageLimit = 1000;
      logger.info('SMS usage reset for billing cycle', {
        userId: user.id,
        billingReason: invoice.billing_reason
      });
    }

    await user.update(updateData);

    logger.info('Payment succeeded', {
      userId: user.id,
      billingReason: invoice.billing_reason,
      smsReset: isSubscriptionBilling
    });
  }

  /**
   * Handle invoice.payment_failed event
   * @param {Object} invoice - Invoice object
   */
  async handlePaymentFailed(invoice) {
    const user = await User.findOne({
      where: { stripeCustomerId: invoice.customer }
    });

    if (!user) {
      logger.warn('User not found for payment failed', { customerId: invoice.customer });
      return;
    }

    await user.update({
      subscriptionStatus: 'past_due',
      marketingStatus: 'trial_expired',
      smsUsageLimit: 0, // Block SMS sending when payment fails
      paymentFailedAt: new Date()
    });

    logger.info('Payment failed - SMS blocked', { userId: user.id });

    // Send payment failed email (if not sent in last 3 hours)
    // Reduced from 24h to 3h for more aggressive recovery prompts
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    if (!user.paymentFailedEmailSentAt ||
        (new Date() - user.paymentFailedEmailSentAt) > THREE_HOURS_MS) {
      try {
        const { sendPaymentFailedEmail } = require('./emailService');
        const portalUrl = `${process.env.APP_URL}/dashboard/subscription/portal`;
        await sendPaymentFailedEmail(user.email, user.businessName, portalUrl);
        await user.update({ paymentFailedEmailSentAt: new Date() });
        logger.info('Payment failed email sent', { userId: user.id });
      } catch (emailError) {
        logger.error('Failed to send payment failed email', {
          userId: user.id,
          error: emailError.message
        });
      }
    }
  }

  /**
   * Create customer portal session
   * @param {Object} user - User model instance
   * @returns {Promise<Object>} Portal session with url
   */
  async createPortalSession(user) {
    try {
      if (!user.stripeCustomerId) {
        throw new Error('User does not have a Stripe customer ID');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.APP_URL}/dashboard/settings`
      });

      return session;
    } catch (error) {
      logger.error('Error creating portal session', { userId: user.id, error: error.message });
      throw new Error('Failed to create portal session');
    }
  }
}

module.exports = new StripeService();
