/**
 * Subscription Controller
 * Handles subscription management, checkout, and billing
 */

const { User } = require('../models');
const stripeService = require('../services/stripeService');

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

    const trialStatus = req.trialStatus || {
      isActive: user.isTrialActive(),
      isInGracePeriod: user.isInGracePeriod(),
      isHardLocked: user.isHardLocked(),
      canSendSms: user.canSendSms(),
      hasActiveSubscription: user.subscriptionStatus === 'active',
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus
    };

    // Get subscription details if user has one
    let subscriptionDetails = null;
    if (user.stripeSubscriptionId) {
      try {
        subscriptionDetails = await stripeService.getSubscription(user.stripeSubscriptionId);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    }

    res.render('dashboard/subscription', {
      title: 'Subscription - FilterFive',
      businessName: req.session.businessName,
      user,
      trialStatus,
      subscriptionDetails,
      stripePubKey: process.env.STRIPE_PUBLISHABLE_KEY
    });

  } catch (error) {
    console.error('Error in showSubscription:', error);
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
    console.error('Error creating checkout:', error);
    console.error('Error details:', {
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
        title: 'Subscription Activated - FilterFive',
        businessName: req.session.businessName,
        session
      });
    } else {
      res.redirect('/dashboard/subscription?error=payment_pending');
    }

  } catch (error) {
    console.error('Error in checkoutSuccess:', error);
    res.redirect('/dashboard/subscription?error=session_invalid');
  }
};

/**
 * GET /dashboard/subscription/cancel
 * Handle cancelled checkout
 */
const checkoutCancel = (req, res) => {
  res.render('dashboard/subscription-cancel', {
    title: 'Checkout Cancelled - FilterFive',
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
    console.error('Error cancelling subscription:', error);
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
    console.error('Error reactivating subscription:', error);
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
    console.error('Error accessing customer portal:', error);
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
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    await stripeService.handleWebhookEvent(event);

    res.json({ received: true });

  } catch (error) {
    console.error('Error handling webhook:', error);
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
