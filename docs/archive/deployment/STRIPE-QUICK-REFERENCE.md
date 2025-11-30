# Stripe Integration Quick Reference

**Version**: 1.0.0
**For**: Developers & Operations

---

## Quick Links

| Resource | URL |
|----------|-----|
| Stripe Dashboard | https://dashboard.stripe.com |
| Subscriptions | https://dashboard.stripe.com/subscriptions |
| Customers | https://dashboard.stripe.com/customers |
| Webhooks | https://dashboard.stripe.com/webhooks |
| Products | https://dashboard.stripe.com/products |
| API Logs | https://dashboard.stripe.com/logs |
| Test Cards | https://stripe.com/docs/testing |

---

## Environment Variables Quick Check

```bash
# View all Stripe variables
docker-compose exec app sh -c "env | grep STRIPE"

# Or from .env file
grep STRIPE .env
```

**Expected**:
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for dev)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for dev)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
```

---

## Common Commands

### Test Stripe Connection

```bash
docker-compose exec -T app node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
(async () => {
  try {
    const monthly = await stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY);
    const annual = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ANNUAL);
    console.log('✓ Monthly: \$' + (monthly.unit_amount / 100));
    console.log('✓ Annual: \$' + (annual.unit_amount / 100));
    console.log('✓ Connected to Stripe');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
})();
"
```

---

### Check Webhook Status

```bash
# Check if webhook endpoint is accessible
curl -I https://filterfive.io/webhooks/stripe

# Expected: 400 (signature missing - this is correct)
# Bad: 404 (endpoint not found) or 500 (server error)
```

---

### View Recent Webhook Events

```bash
# Check app logs for webhook events
docker-compose logs app --tail=100 | grep webhook

# Look for:
# ✓ Checkout completed for user X
# ✓ Subscription created for user X
# ✓ Payment succeeded for user X
```

---

### Find User by Email

```bash
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod -c "
  SELECT
    id,
    email,
    business_name,
    subscription_status,
    subscription_plan,
    stripe_customer_id,
    sms_usage_count,
    sms_usage_limit
  FROM users
  WHERE email = 'user@example.com';
"
```

---

### Check Active Subscriptions

```bash
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod -c "
  SELECT
    COUNT(*) as total_active,
    SUM(CASE WHEN subscription_plan = 'monthly' THEN 1 ELSE 0 END) as monthly_count,
    SUM(CASE WHEN subscription_plan = 'annual' THEN 1 ELSE 0 END) as annual_count
  FROM users
  WHERE subscription_status = 'active';
"
```

---

### Calculate MRR (Monthly Recurring Revenue)

```bash
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod -c "
  SELECT
    SUM(CASE
      WHEN subscription_plan = 'monthly' THEN 77
      WHEN subscription_plan = 'annual' THEN 770 / 12.0
      ELSE 0
    END) as mrr
  FROM users
  WHERE subscription_status = 'active';
"
```

---

## Test Cards (Stripe Test Mode Only)

| Card Number | Scenario | Expiry | CVC |
|-------------|----------|--------|-----|
| 4242 4242 4242 4242 | Success | Any future | Any 3 |
| 4000 0000 0000 0002 | Card Declined | Any future | Any 3 |
| 4000 0000 0000 9995 | Insufficient Funds | Any future | Any 3 |
| 4000 0027 6000 3184 | Requires 3D Secure | Any future | Any 3 |

**Note**: Test cards do NOT work in live mode.

---

## Subscription Pricing

| Plan | Price | Interval | SMS/Month | Savings |
|------|-------|----------|-----------|---------|
| Trial | Free | 14 days | 10 | - |
| Monthly | $77 | 1 month | 1,000 | - |
| Annual | $770 | 12 months | 1,000 | $154/year (17%) |

---

## Subscription Status Flow

```
┌─────────┐
│  Trial  │ (14 days, 10 SMS)
└────┬────┘
     │
     ▼
┌──────────────┐
│ Grace Period │ (5 days, 10 SMS)
└────┬─────────┘
     │
     ▼
┌─────────────┐
│ Hard Locked │ (No access until payment)
└────┬────────┘
     │
     ▼
┌────────────┐
│   Active   │ (1,000 SMS/month)
└────┬───────┘
     │
     ├──→ Past Due (payment failed)
     ├──→ Cancelled (user cancelled)
     └──→ Active (recurring)
```

---

## Database Status Values

### subscription_status

| Value | Meaning | User Access | SMS Limit |
|-------|---------|-------------|-----------|
| `trial` | Free trial active | Full | 10 |
| `active` | Paid subscription | Full | 1,000 |
| `past_due` | Payment failed | Limited | Current |
| `cancelled` | User cancelled | Until period end | Current |
| `inactive` | No subscription | None | 0 |

### subscription_plan

| Value | Price | Interval |
|-------|-------|----------|
| `monthly` | $77 | 1 month |
| `annual` | $770 | 12 months |
| `NULL` | - | Trial or no subscription |

---

## API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/subscription` | View subscription page |
| POST | `/dashboard/subscription/checkout` | Create checkout session |
| GET | `/dashboard/subscription/success` | Post-payment success |
| GET | `/dashboard/subscription/cancel` | Checkout cancelled |
| POST | `/dashboard/subscription/cancel-subscription` | Cancel subscription |
| POST | `/dashboard/subscription/reactivate` | Reactivate subscription |
| GET | `/dashboard/subscription/portal` | Stripe billing portal |
| POST | `/webhooks/stripe` | Stripe webhook handler |

---

## Webhook Events Handled

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Activate subscription |
| `customer.subscription.created` | `handleSubscriptionCreated` | Set subscription details |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Update status |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Mark as cancelled |
| `invoice.payment_succeeded` | `handlePaymentSucceeded` | Reset SMS counter |
| `invoice.payment_failed` | `handlePaymentFailed` | Set to past_due |

---

## Common Issues & Quick Fixes

### Issue: "Webhook signature verification failed"

**Quick Fix**:
```bash
# 1. Check webhook secret
grep STRIPE_WEBHOOK_SECRET .env

# 2. Compare with Stripe Dashboard webhook secret
# 3. Update .env if different
# 4. Restart app
docker-compose restart app
```

---

### Issue: "No such price"

**Quick Fix**:
```bash
# 1. Verify price IDs
docker-compose exec -T app node -e "
console.log('Monthly:', process.env.STRIPE_PRICE_MONTHLY);
console.log('Annual:', process.env.STRIPE_PRICE_ANNUAL);
"

# 2. Check Stripe Dashboard → Products
# 3. Copy correct price IDs
# 4. Update .env
# 5. Restart app
```

---

### Issue: Customer already exists

**Quick Fix**:
```bash
# Find user's Stripe customer ID
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod -c "
  SELECT stripe_customer_id FROM users WHERE email = 'user@example.com';
"

# If customer_id exists, code should skip creation
# Check authController.js signup function
```

---

### Issue: Subscription not activating

**Diagnosis**:
```bash
# 1. Check webhook delivery in Stripe Dashboard
# 2. Check app logs
docker-compose logs app --tail=100 | grep "checkout.session.completed"

# 3. Check user record
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod -c "
  SELECT subscription_status, stripe_subscription_id
  FROM users
  WHERE email = 'user@example.com';
"
```

---

### Issue: Test mode vs Live mode confusion

**Check mode**:
```bash
docker-compose exec -T app node -e "
const key = process.env.STRIPE_SECRET_KEY;
const mode = key.startsWith('sk_test_') ? 'TEST' : 'LIVE';
console.log('Mode:', mode);
console.log('Key prefix:', key.substring(0, 10));
"
```

**Expected in production**: `Mode: LIVE`, `Key prefix: sk_live_51`

---

## Manual Customer Operations

### Create Stripe Customer Manually

```bash
docker-compose exec -T app node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
(async () => {
  const customer = await stripe.customers.create({
    email: 'user@example.com',
    name: 'Business Name',
    metadata: { userId: '123' }
  });
  console.log('Customer ID:', customer.id);
})();
"
```

---

### Retrieve Customer Info

```bash
docker-compose exec -T app node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
(async () => {
  const customer = await stripe.customers.retrieve('cus_XXXXXXXXXX');
  console.log(JSON.stringify(customer, null, 2));
})();
"
```

---

### Cancel Subscription Manually

```bash
docker-compose exec -T app node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
(async () => {
  const subscription = await stripe.subscriptions.cancel('sub_XXXXXXXXXX');
  console.log('Cancelled:', subscription.id);
})();
"
```

---

### Issue Refund

```bash
docker-compose exec -T app node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
(async () => {
  const refund = await stripe.refunds.create({
    payment_intent: 'pi_XXXXXXXXXX',
    amount: 7700, // Amount in cents
    reason: 'requested_by_customer'
  });
  console.log('Refund ID:', refund.id);
})();
"
```

---

## Monitoring Queries

### Daily Revenue

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_subscriptions,
  SUM(CASE
    WHEN subscription_plan = 'monthly' THEN 77
    WHEN subscription_plan = 'annual' THEN 770
    ELSE 0
  END) as revenue
FROM users
WHERE
  subscription_status = 'active'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### Trial Conversion Rate

```sql
SELECT
  COUNT(*) FILTER (WHERE subscription_status = 'trial') as trials,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as active,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE subscription_status = 'active') /
    NULLIF(COUNT(*), 0),
    2
  ) as conversion_rate_percent
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

---

### Churn Analysis

```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_signups,
  COUNT(*) FILTER (WHERE subscription_status = 'cancelled') as churned,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE subscription_status = 'cancelled') /
    NULLIF(COUNT(*), 0),
    2
  ) as churn_rate_percent
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

## Useful Stripe CLI Commands

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

---

### Listen to Webhooks Locally

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

---

### Trigger Test Events

```bash
# Trigger checkout completed
stripe trigger checkout.session.completed

# Trigger payment succeeded
stripe trigger invoice.payment_succeeded

# Trigger payment failed
stripe trigger invoice.payment_failed

# Trigger subscription cancelled
stripe trigger customer.subscription.deleted
```

---

### View Recent Events

```bash
stripe events list --limit 10
```

---

### Resend Webhook

```bash
stripe events resend evt_XXXXXXXXXX
```

---

## Performance Benchmarks

**Target Metrics**:
- Checkout page load: < 2 seconds
- Checkout session creation: < 500ms
- Webhook processing: < 200ms
- Database queries: < 100ms

**Monitoring Commands**:

```bash
# Check response times
docker-compose logs app | grep "POST /dashboard/subscription/checkout"

# Check webhook processing times
docker-compose logs app | grep "Webhook event"
```

---

## Security Checklist

**Production**:
- [ ] HTTPS enforced everywhere
- [ ] Webhook signature verification enabled
- [ ] Live mode keys in use
- [ ] `.env` file secured (chmod 600)
- [ ] No keys committed to Git
- [ ] API keys rotated regularly (every 90 days)
- [ ] Webhook endpoint not exposed to public listing

---

## Getting Help

### Stripe Support
- **Dashboard**: https://dashboard.stripe.com/support
- **Docs**: https://stripe.com/docs
- **API Status**: https://status.stripe.com

### Internal Documentation
- [Milestone 2 Overview](./MILESTONE-2-STRIPE-INTEGRATION.md)
- [API Documentation](./API-SUBSCRIPTION-ENDPOINTS.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE-STRIPE.md)

### Code Locations

| Component | File Path |
|-----------|-----------|
| Stripe Service | `src/services/stripeService.js` |
| Subscription Controller | `src/controllers/subscriptionController.js` |
| Subscription Routes | `src/routes/subscription.js` |
| Webhook Routes | `src/routes/webhook.js` |
| Subscription View | `src/views/dashboard/subscription.ejs` |
| Environment Config | `.env` |
| Docker Config | `docker-compose.yml` |

---

**Quick Reference Version**: 1.0.0
**Last Updated**: January 29, 2025
