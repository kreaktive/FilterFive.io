/**
 * Setup Stripe Live Mode Products and Prices for FilterFive
 * This creates BOTH products and prices in Stripe live mode
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripe() {
  console.log('🎯 Setting up FilterFive in Stripe LIVE mode...\n');

  // Verify we're using live mode keys
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    console.error('❌ STRIPE_SECRET_KEY not found in .env file');
    process.exit(1);
  }

  if (apiKey.startsWith('sk_test_')) {
    console.error('❌ ERROR: You are using TEST mode keys!');
    console.error('   Switch to LIVE mode keys in your .env file');
    console.error('   STRIPE_SECRET_KEY should start with sk_live_');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk_live_')) {
    console.error('⚠️  WARNING: API key format unexpected');
    console.error(`   Key starts with: ${apiKey.substring(0, 10)}...`);
  }

  console.log('✓ Using LIVE mode API key\n');

  try {
    // Create Monthly Product
    console.log('📦 Creating Monthly Product...');
    const monthlyProduct = await stripe.products.create({
      name: 'FilterFive Monthly Subscription',
      description: '1,000 SMS messages per month, unlimited feedback requests, unlimited QR codes',
      tax_code: 'txcd_10000000', // Software as a Service
    });
    console.log(`✓ Monthly Product Created: ${monthlyProduct.id}`);

    // Create Monthly Price
    console.log('💰 Creating Monthly Price ($77/month)...');
    const monthlyPrice = await stripe.prices.create({
      product: monthlyProduct.id,
      unit_amount: 7700, // $77.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      nickname: 'Monthly - $77/month'
    });
    console.log(`✓ Monthly Price Created: ${monthlyPrice.id}\n`);

    // Create Annual Product
    console.log('📦 Creating Annual Product...');
    const annualProduct = await stripe.products.create({
      name: 'FilterFive Annual Subscription',
      description: '1,000 SMS messages per month, unlimited feedback requests, unlimited QR codes, priority support. Save $154/year!',
      tax_code: 'txcd_10000000', // Software as a Service
    });
    console.log(`✓ Annual Product Created: ${annualProduct.id}`);

    // Create Annual Price
    console.log('💰 Creating Annual Price ($770/year)...');
    const annualPrice = await stripe.prices.create({
      product: annualProduct.id,
      unit_amount: 77000, // $770.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      nickname: 'Annual - $770/year (Save $154)'
    });
    console.log(`✓ Annual Price Created: ${annualPrice.id}\n`);

    console.log('✅ SUCCESS! Products and prices created in Stripe LIVE mode.\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 Copy these values to your .env file:\n');
    console.log(`STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_ANNUAL=${annualPrice.id}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 Product IDs (for reference):');
    console.log(`   Monthly Product: ${monthlyProduct.id}`);
    console.log(`   Annual Product: ${annualProduct.id}\n`);
    console.log('🚀 Next steps:');
    console.log('   1. Update .env with the price IDs above');
    console.log('   2. Create new deployment package');
    console.log('   3. Deploy to production');
    console.log('   4. Restart Docker containers');
    console.log('   5. Test subscription checkout\n');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Authentication failed!');
      console.error('   Check your STRIPE_SECRET_KEY in .env');
    } else if (error.type === 'StripePermissionError') {
      console.error('\n⚠️  Permission denied!');
      console.error('   Make sure your API key has write permissions');
    }

    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
setupStripe();
