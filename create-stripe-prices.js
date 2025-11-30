/**
 * Create Stripe Live Mode Prices for FilterFive
 * Run this script to create the subscription prices in Stripe live mode
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPrices() {
  console.log('🎯 Creating FilterFive subscription prices in Stripe LIVE mode...\n');

  try {
    // Product IDs from Stripe (already exist)
    const PRODUCT_ID_MONTHLY = 'prod_TW3SgC3k4DG7I8';
    const PRODUCT_ID_ANNUAL = 'prod_TW3Tf5nlCYOkyO';

    console.log('📦 Creating Monthly Price ($77/month)...');
    const monthlyPrice = await stripe.prices.create({
      product: PRODUCT_ID_MONTHLY,
      unit_amount: 7700, // $77.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      nickname: 'Monthly Subscription - $77/month',
      tax_behavior: 'unspecified'
    });
    console.log(`✓ Monthly Price Created: ${monthlyPrice.id}`);
    console.log(`  Product: ${PRODUCT_ID_MONTHLY}`);
    console.log(`  Amount: $${monthlyPrice.unit_amount / 100}/month\n`);

    console.log('📦 Creating Annual Price ($770/year)...');
    const annualPrice = await stripe.prices.create({
      product: PRODUCT_ID_ANNUAL,
      unit_amount: 77000, // $770.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      nickname: 'Annual Subscription - $770/year (Save $154)',
      tax_behavior: 'unspecified'
    });
    console.log(`✓ Annual Price Created: ${annualPrice.id}`);
    console.log(`  Product: ${PRODUCT_ID_ANNUAL}`);
    console.log(`  Amount: $${annualPrice.unit_amount / 100}/year\n`);

    console.log('✅ SUCCESS! Prices created in Stripe LIVE mode.\n');
    console.log('📝 Update your .env file with these values:\n');
    console.log(`STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_ANNUAL=${annualPrice.id}`);
    console.log('\n🚀 After updating .env, redeploy to production and restart Docker containers.');

  } catch (error) {
    console.error('❌ Error creating prices:', error.message);

    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Authentication failed. Make sure you are using LIVE mode API keys!');
      console.error('   Check your .env file: STRIPE_SECRET_KEY should start with sk_live_');
    } else if (error.code === 'resource_missing') {
      console.error('\n⚠️  Product not found. Make sure the product IDs exist in your Stripe account:');
      console.error(`   Monthly: ${PRODUCT_ID_MONTHLY}`);
      console.error(`   Annual: ${PRODUCT_ID_ANNUAL}`);
    }

    process.exit(1);
  }
}

// Run the script
createPrices();
