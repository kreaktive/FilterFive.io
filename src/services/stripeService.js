/**
 * Stripe Service
 * Handles Stripe customer management, subscriptions, and payments
 * Phase 2: $77/month subscription with 6-month or 12-month plans
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../models');

/**
 * Price IDs for FilterFive subscriptions
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

      console.log(`✓ Stripe customer created: ${customer.id} for user ${user.id}`);
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
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

      console.log(`✓ Checkout session created: ${session.id} for user ${user.id}`);
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      console.error('Stripe error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        statusCode: error.statusCode
      });
      console.error('Request details:', {
        userId: user.id,
        plan: plan,
        priceId: priceId,
        customerId: user.stripeCustomerId,
        appUrl: process.env.APP_URL
      });
      throw error; // Re-throw the original error instead of a generic one
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
      console.error('Error retrieving checkout session:', error);
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
      console.error('Error retrieving subscription:', error);
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
        // Cancel immediately
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        console.log(`✓ Subscription cancelled immediately: ${subscriptionId}`);
        return subscription;
      } else {
        // Cancel at period end
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
        console.log(`✓ Subscription set to cancel at period end: ${subscriptionId}`);
        return subscription;
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
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
      console.log(`✓ Subscription reactivated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Handle subscription webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<void>}
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
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
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
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

    await user.update({
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
      smsUsageCount: 0, // Reset SMS count
      smsUsageLimit: 1000, // Set to active limit
      marketingStatus: 'active'
    });

    console.log(`✓ Checkout completed for user ${userId}: ${plan} plan`);
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
      console.warn(`User not found for Stripe customer: ${subscription.customer}`);
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

    console.log(`✓ Subscription created for user ${user.id}`);
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
      console.warn(`User not found for subscription: ${subscription.id}`);
      return;
    }

    let subscriptionStatus = 'active';
    if (subscription.status === 'past_due') {
      subscriptionStatus = 'past_due';
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      subscriptionStatus = 'cancelled';
    }

    await user.update({
      subscriptionStatus: subscriptionStatus,
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    console.log(`✓ Subscription updated for user ${user.id}: ${subscriptionStatus}`);
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
      console.warn(`User not found for subscription: ${subscription.id}`);
      return;
    }

    await user.update({
      subscriptionStatus: 'cancelled',
      marketingStatus: 'churned',
      smsUsageLimit: 10 // Revert to trial limit
    });

    console.log(`✓ Subscription deleted for user ${user.id}`);
  }

  /**
   * Handle invoice.payment_succeeded event
   * @param {Object} invoice - Invoice object
   */
  async handlePaymentSucceeded(invoice) {
    const user = await User.findOne({
      where: { stripeCustomerId: invoice.customer }
    });

    if (!user) {
      console.warn(`User not found for Stripe customer: ${invoice.customer}`);
      return;
    }

    // Reset SMS usage on successful payment (new billing period)
    await user.update({
      smsUsageCount: 0,
      subscriptionStatus: 'active',
      marketingStatus: 'active'
    });

    console.log(`✓ Payment succeeded for user ${user.id}`);
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
      console.warn(`User not found for Stripe customer: ${invoice.customer}`);
      return;
    }

    await user.update({
      subscriptionStatus: 'past_due',
      marketingStatus: 'trial_expired'
    });

    console.log(`✓ Payment failed for user ${user.id} - Status: past_due`);
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
      console.error('Error creating portal session:', error);
      throw new Error('Failed to create portal session');
    }
  }
}

module.exports = new StripeService();
