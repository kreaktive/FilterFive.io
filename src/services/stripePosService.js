/**
 * Stripe POS Service
 * Handles Stripe Checkout and Terminal payment webhooks for SMS review requests
 *
 * Listens for:
 * - checkout.session.completed (online payments)
 * - payment_intent.succeeded (can include Terminal)
 * - charge.succeeded (fallback for payment events)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PosIntegration = require('../models/PosIntegration');
const PosWebhookEvent = require('../models/PosWebhookEvent');
const posSmsService = require('./posSmsService');
const User = require('../models/User');
const logger = require('./logger');

class StripePosService {
  /**
   * Process a Stripe webhook event for POS integration
   * @param {object} event - Stripe webhook event
   * @returns {object} Processing result
   */
  async processEvent(event) {
    const eventId = event.id;
    const eventType = event.type;

    logger.info('Processing Stripe POS webhook', { eventType, eventId });

    // Check idempotency
    const alreadyProcessed = await PosWebhookEvent.isProcessed('stripe_pos', eventId);
    if (alreadyProcessed) {
      logger.info('Skipping duplicate Stripe POS event', { eventId });
      return { skipped: true, reason: 'duplicate' };
    }

    // Route to appropriate handler
    let result;
    switch (eventType) {
      case 'checkout.session.completed':
        result = await this.handleCheckoutCompleted(event);
        break;

      case 'payment_intent.succeeded':
        result = await this.handlePaymentIntentSucceeded(event);
        break;

      case 'charge.succeeded':
        result = await this.handleChargeSucceeded(event);
        break;

      default:
        result = { skipped: true, reason: 'unhandled_event_type' };
    }

    // Mark as processed
    await PosWebhookEvent.markProcessed('stripe_pos', eventId, eventType);

    return result;
  }

  /**
   * Handle checkout.session.completed event
   * This is for Stripe Checkout (online payments)
   */
  async handleCheckoutCompleted(event) {
    const session = event.data.object;

    // Skip subscription checkouts (handled by main Stripe service)
    if (session.mode === 'subscription') {
      return { skipped: true, reason: 'subscription_checkout' };
    }

    // Only process payment mode checkouts
    if (session.mode !== 'payment') {
      return { skipped: true, reason: 'not_payment_mode' };
    }

    // Get customer details
    const customerId = session.customer;
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerPhone = session.customer_details?.phone;
    const customerName = session.customer_details?.name;
    const amount = session.amount_total ? session.amount_total / 100 : null;

    // Try to find integration by customer's metadata or linked user
    const integration = await this.findIntegrationForCheckout(session);

    if (!integration) {
      logger.info('No Stripe POS integration found for checkout');
      return { skipped: true, reason: 'no_integration' };
    }

    // Check if checkout trigger is enabled
    if (!integration.triggerOnCheckout) {
      return { skipped: true, reason: 'checkout_trigger_disabled' };
    }

    // If no phone number in session, try to fetch from Stripe customer
    let phone = customerPhone;
    if (!phone && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        phone = customer.phone;
      } catch (error) {
        logger.warn('Could not fetch Stripe customer phone', { error: error.message });
      }
    }

    if (!phone) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: session.id,
        customerName,
        customerPhone: null,
        purchaseAmount: amount,
        locationName: 'Stripe Checkout',
        smsStatus: 'skipped_no_phone',
        skipReason: 'No phone number in checkout'
      });
      return { skipped: true, reason: 'no_phone_number' };
    }

    // Process the transaction
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: session.id,
      customerName: customerName || 'Customer',
      customerPhone: phone,
      purchaseAmount: amount,
      locationName: 'Stripe Checkout'
    });

    return result;
  }

  /**
   * Handle payment_intent.succeeded event
   * This can include Terminal payments
   */
  async handlePaymentIntentSucceeded(event) {
    const paymentIntent = event.data.object;

    // Check if this is a Terminal payment
    const isTerminal = paymentIntent.payment_method_types?.includes('card_present') ||
                       paymentIntent.charges?.data?.[0]?.payment_method_details?.type === 'card_present';

    // Get payment details
    const customerId = paymentIntent.customer;
    const amount = paymentIntent.amount ? paymentIntent.amount / 100 : null;
    const metadata = paymentIntent.metadata || {};

    // Try to find integration
    const integration = await this.findIntegrationForPayment(paymentIntent);

    if (!integration) {
      logger.info('No Stripe POS integration found for payment');
      return { skipped: true, reason: 'no_integration' };
    }

    // Check trigger settings
    if (isTerminal && !integration.triggerOnTerminal) {
      return { skipped: true, reason: 'terminal_trigger_disabled' };
    }

    if (!isTerminal && !integration.triggerOnCheckout) {
      return { skipped: true, reason: 'checkout_trigger_disabled' };
    }

    // Try to get customer phone
    let phone = metadata.customer_phone || metadata.phone;
    let customerName = metadata.customer_name || metadata.name;

    if (!phone && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        phone = customer.phone;
        customerName = customerName || customer.name;
      } catch (error) {
        logger.warn('Could not fetch Stripe customer', { error: error.message });
      }
    }

    if (!phone) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: paymentIntent.id,
        customerName,
        customerPhone: null,
        purchaseAmount: amount,
        locationName: isTerminal ? 'Stripe Terminal' : 'Stripe Payment',
        smsStatus: 'skipped_no_phone',
        skipReason: 'No phone number available'
      });
      return { skipped: true, reason: 'no_phone_number' };
    }

    // Process the transaction
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: paymentIntent.id,
      customerName: customerName || 'Customer',
      customerPhone: phone,
      purchaseAmount: amount,
      locationName: isTerminal ? 'Stripe Terminal' : 'Stripe Payment'
    });

    return result;
  }

  /**
   * Handle charge.succeeded event (fallback)
   */
  async handleChargeSucceeded(event) {
    const charge = event.data.object;

    // Skip if already processed via payment_intent
    if (charge.payment_intent) {
      const piProcessed = await PosWebhookEvent.isProcessed('stripe_pos', charge.payment_intent);
      if (piProcessed) {
        return { skipped: true, reason: 'already_processed_via_pi' };
      }
    }

    const customerId = charge.customer;
    const amount = charge.amount ? charge.amount / 100 : null;
    const isTerminal = charge.payment_method_details?.type === 'card_present';
    const metadata = charge.metadata || {};

    // Try to find integration
    const integration = await this.findIntegrationForCharge(charge);

    if (!integration) {
      return { skipped: true, reason: 'no_integration' };
    }

    // Check trigger settings
    if (isTerminal && !integration.triggerOnTerminal) {
      return { skipped: true, reason: 'terminal_trigger_disabled' };
    }

    // Get customer phone
    let phone = metadata.customer_phone || metadata.phone;
    let customerName = metadata.customer_name || metadata.name || charge.billing_details?.name;

    if (!phone && charge.billing_details?.phone) {
      phone = charge.billing_details.phone;
    }

    if (!phone && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        phone = customer.phone;
        customerName = customerName || customer.name;
      } catch (error) {
        logger.warn('Could not fetch Stripe customer', { error: error.message });
      }
    }

    if (!phone) {
      await posSmsService.logTransaction({
        userId: integration.userId,
        posIntegrationId: integration.id,
        externalTransactionId: charge.id,
        customerName,
        customerPhone: null,
        purchaseAmount: amount,
        locationName: isTerminal ? 'Stripe Terminal' : 'Stripe Charge',
        smsStatus: 'skipped_no_phone',
        skipReason: 'No phone number available'
      });
      return { skipped: true, reason: 'no_phone_number' };
    }

    // Process the transaction
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: charge.id,
      customerName: customerName || 'Customer',
      customerPhone: phone,
      purchaseAmount: amount,
      locationName: isTerminal ? 'Stripe Terminal' : 'Stripe Charge'
    });

    return result;
  }

  /**
   * Find integration for a checkout session
   * Looks up by:
   * 1. Metadata user_id
   * 2. Customer's linked MoreStars user
   */
  async findIntegrationForCheckout(session) {
    // Check metadata for user ID
    if (session.metadata?.morestars_user_id) {
      const userId = parseInt(session.metadata.morestars_user_id);
      return await PosIntegration.findOne({
        where: { userId, provider: 'stripe_pos', isActive: true }
      });
    }

    // Try to find by Stripe customer ID
    if (session.customer) {
      const user = await User.findOne({
        where: { stripeCustomerId: session.customer }
      });

      if (user) {
        return await PosIntegration.findOne({
          where: { userId: user.id, provider: 'stripe_pos', isActive: true }
        });
      }
    }

    // Fallback: look for any active Stripe POS integration
    // This is useful for merchants with a single account
    return await this.findSingleStripeIntegration();
  }

  /**
   * Find integration for a payment intent
   */
  async findIntegrationForPayment(paymentIntent) {
    // Check metadata
    if (paymentIntent.metadata?.morestars_user_id) {
      const userId = parseInt(paymentIntent.metadata.morestars_user_id);
      return await PosIntegration.findOne({
        where: { userId, provider: 'stripe_pos', isActive: true }
      });
    }

    // Try to find by customer
    if (paymentIntent.customer) {
      const user = await User.findOne({
        where: { stripeCustomerId: paymentIntent.customer }
      });

      if (user) {
        return await PosIntegration.findOne({
          where: { userId: user.id, provider: 'stripe_pos', isActive: true }
        });
      }
    }

    return await this.findSingleStripeIntegration();
  }

  /**
   * Find integration for a charge
   */
  async findIntegrationForCharge(charge) {
    if (charge.metadata?.morestars_user_id) {
      const userId = parseInt(charge.metadata.morestars_user_id);
      return await PosIntegration.findOne({
        where: { userId, provider: 'stripe_pos', isActive: true }
      });
    }

    if (charge.customer) {
      const user = await User.findOne({
        where: { stripeCustomerId: charge.customer }
      });

      if (user) {
        return await PosIntegration.findOne({
          where: { userId: user.id, provider: 'stripe_pos', isActive: true }
        });
      }
    }

    return await this.findSingleStripeIntegration();
  }

  /**
   * Find the single active Stripe integration if only one exists
   * Useful for single-tenant setups
   */
  async findSingleStripeIntegration() {
    const integrations = await PosIntegration.findAll({
      where: { provider: 'stripe_pos', isActive: true },
      limit: 2
    });

    // Only return if exactly one integration exists
    if (integrations.length === 1) {
      return integrations[0];
    }

    return null;
  }
}

module.exports = new StripePosService();
