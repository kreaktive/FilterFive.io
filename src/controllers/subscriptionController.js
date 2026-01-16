/**
 * Subscription Controller
 * Handles subscription management, checkout, and billing
 */

const { User } = require('../models');
const stripeService = require('../services/stripeService');
const { buildTrialStatus } = require('../middleware/trialManager');
const logger = require('../services/logger');

/**
 * GET /dashboard/subscription
 * Show subscription management page
 */
const showSubscription = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = req.user || await User.findByPk(userId);

    if (!user) {
      return res.redirect('/dashboard/login');
    }

    const trialStatus = req.trialStatus || buildTrialStatus(user);

    // Get subscription details if user has one
    let subscriptionDetails = null;
    if (user.stripeSubscriptionId) {
      try {
        subscriptionDetails = await stripeService.getSubscription(user.stripeSubscriptionId);
      } catch (error) {
        logger.error('Error fetching subscription', { error: error.message });
      }
    }

    res.render('dashboard/subscription', {
      title: 'Subscription - MoreStars',
      businessName: req.session.businessName,
      user,
      trialStatus,
      subscriptionDetails,
      stripePubKey: process.env.STRIPE_PUBLISHABLE_KEY,
      cspNonce: res.locals.cspNonce
    });

  } catch (error) {
    logger.error('Error in showSubscription', { error: error.message });
    res.status(500).send('Something went wrong');
  }
};

/**
 * POST /dashboard/subscription/checkout
 * Create Stripe checkout session
 */
const createCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { plan } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate plan
    if (!['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected. Must be monthly or annual'
      });
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(user, plan);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    logger.error('Error creating checkout', {
      error: error.message,
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /dashboard/subscription/success
 * Handle successful checkout
 */
const checkoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.redirect('/dashboard/subscription');
    }

    // Retrieve session to confirm payment
    const session = await stripeService.getCheckoutSession(session_id);

    if (session.payment_status === 'paid') {
      res.render('dashboard/subscription-success', {
        title: 'Subscription Activated - MoreStars',
        businessName: req.session.businessName,
        session
      });
    } else {
      res.redirect('/dashboard/subscription?error=payment_pending');
    }

  } catch (error) {
    logger.error('Error in checkoutSuccess', { error: error.message });
    res.redirect('/dashboard/subscription?error=session_invalid');
  }
};

/**
 * GET /dashboard/subscription/cancel
 * Handle cancelled checkout
 */
const checkoutCancel = (req, res) => {
  res.render('dashboard/subscription-cancel', {
    title: 'Checkout Cancelled - MoreStars',
    businessName: req.session.businessName
  });
};

/**
 * POST /dashboard/subscription/cancel-subscription
 * Cancel active subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { immediately } = req.body;

    const user = await User.findByPk(userId);

    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Cancel subscription
    const cancelImmediately = immediately === 'true' || immediately === true;
    await stripeService.cancelSubscription(user.stripeSubscriptionId, cancelImmediately);

    res.json({
      success: true,
      message: cancelImmediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will cancel at the end of billing period'
    });

  } catch (error) {
    logger.error('Error cancelling subscription', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
};

/**
 * POST /dashboard/subscription/reactivate
 * Reactivate a cancelled subscription (before period end)
 */
const reactivateSubscription = async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await User.findByPk(userId);

    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    // Reactivate subscription
    await stripeService.reactivateSubscription(user.stripeSubscriptionId);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });

  } catch (error) {
    logger.error('Error reactivating subscription', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription'
    });
  }
};

/**
 * GET /dashboard/subscription/portal
 * Redirect to Stripe customer portal
 */
const customerPortal = async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create portal session
    const session = await stripeService.createPortalSession(user);

    res.redirect(session.url);

  } catch (error) {
    logger.error('Error accessing customer portal', { error: error.message });
    res.redirect('/dashboard/subscription?error=portal_failed');
  }
};

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 */
const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature
      event = require('stripe')(process.env.STRIPE_SECRET_KEY)
        .webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err.message });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription-related events
    await stripeService.handleWebhookEvent(event);

    // Also process POS-related events (Checkout and Terminal payments)
    // These events trigger SMS review requests
    const posEventTypes = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'charge.succeeded'
    ];

    if (posEventTypes.includes(event.type)) {
      try {
        const stripePosService = require('../services/stripePosService');
        await stripePosService.processEvent(event);
      } catch (posError) {
        // Log but don't fail the webhook - subscription handling already succeeded
        logger.error('Stripe POS processing error', { error: posError.message });
      }
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Error handling webhook', { error: error.message });
    res.status(500).json({
      error: 'Webhook handler failed'
    });
  }
};

module.exports = {
  showSubscription,
  createCheckout,
  checkoutSuccess,
  checkoutCancel,
  cancelSubscription,
  reactivateSubscription,
  customerPortal,
  handleWebhook
};
