/**
 * List Stripe Prices
 * Quick script to find price IDs
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    console.log('🔍 Fetching Stripe prices...\n');

    const prices = await stripe.prices.list({
      limit: 20,
      expand: ['data.product']
    });

    prices.data.forEach(price => {
      const amount = price.unit_amount / 100;
      const interval = price.recurring?.interval || 'one-time';
      const productName = price.product.name;

      console.log(`Price ID: ${price.id}`);
      console.log(`  Product: ${productName}`);
      console.log(`  Amount: $${amount} / ${interval}`);
      console.log(`  Active: ${price.active}`);
      console.log('');
    });

    console.log('✅ Done! Copy the price IDs you need.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
