# Stripe Integration Deployment Guide

**Version**: 1.0.0
**Last Updated**: January 29, 2025
**Target**: Production Deployment

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Stripe Dashboard Configuration](#stripe-dashboard-configuration)
4. [Environment Variables](#environment-variables)
5. [Database Migration](#database-migration)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring Setup](#monitoring-setup)
9. [Rollback Plan](#rollback-plan)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [x] Stripe account activated
- [x] Stripe account verified (for live mode)
- [x] Domain configured with HTTPS
- [x] Production server access
- [x] Database backup capability

### Required Tools
- Docker & Docker Compose
- Git
- SSH access to production server
- Stripe CLI (optional, for testing)

### Current Status
- ✅ Test mode fully configured and tested
- ✅ All features working in development
- ✅ Database schema updated
- ⏳ Ready for production deployment

---

## Pre-Deployment Checklist

### 1. Stripe Account Verification

**Action**: Verify your Stripe account for live payments

```bash
# Check account status in Stripe Dashboard
1. Go to: https://dashboard.stripe.com/settings/account
2. Verify "Business profile" is complete
3. Verify "Identity verification" is complete
4. Check "Payment methods" are enabled
```

**Requirements**:
- Business details filled
- Tax information submitted
- Banking information added
- Identity verification completed

**Timeline**: Can take 1-3 business days

---

### 2. Test All Features in Development

**Checklist**:
- [ ] User signup creates Stripe customer
- [ ] Monthly subscription checkout works
- [ ] Annual subscription checkout works
- [ ] Subscription activation after payment
- [ ] SMS limit increases to 1,000
- [ ] Webhook events processed correctly
- [ ] Cancellation works
- [ ] Reactivation works
- [ ] Customer portal access works
- [ ] Success page displays correctly
- [ ] Cancel page displays correctly

**Test Commands**:
```bash
# Run automated tests
docker-compose exec -T app node -e "
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  (async () => {
    // Test price retrieval
    const monthly = await stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY);
    const annual = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ANNUAL);
    console.log('Monthly:', monthly.unit_amount / 100);
    console.log('Annual:', annual.unit_amount / 100);
  })();
"
```

---

### 3. Database Backup

**Action**: Create full database backup before deployment

```bash
# On production server
docker-compose exec -T db pg_dump -U filterfive_prod_user filterfive_prod > backup_pre_stripe_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_pre_stripe_*.sql

# Download backup to local machine
scp root@YOUR_SERVER_IP:backup_pre_stripe_*.sql ./backups/
```

---

## Stripe Dashboard Configuration

### 1. Create Live Products

**Navigate to**: Stripe Dashboard → Products → + Add Product

#### Product 1: FilterFive Monthly
```
Name: FilterFive Monthly
Description: Monthly subscription for FilterFive reputation management platform
Pricing: $77.00 USD / month
Recurring: Monthly
```

**Save and copy Price ID**: `price_XXXXXXXXXX` → Use for `STRIPE_PRICE_MONTHLY`

#### Product 2: FilterFive Annual
```
Name: FilterFive Annual
Description: Annual subscription for FilterFive (save 17%)
Pricing: $770.00 USD / year
Recurring: Yearly
```

**Save and copy Price ID**: `price_YYYYYYYYYY` → Use for `STRIPE_PRICE_ANNUAL`

---

### 2. Configure Webhook Endpoint

**Navigate to**: Stripe Dashboard → Developers → Webhooks → + Add endpoint

**Configuration**:
```
Endpoint URL: https://YOUR_DOMAIN.com/webhooks/stripe
Description: FilterFive subscription webhook handler
API Version: Latest (2023-10-16 or newer)
Events to send:
  ✓ checkout.session.completed
  ✓ customer.subscription.created
  ✓ customer.subscription.updated
  ✓ customer.subscription.deleted
  ✓ invoice.payment_succeeded
  ✓ invoice.payment_failed
```

**Click**: Add endpoint

**Copy**: Signing secret → Use for `STRIPE_WEBHOOK_SECRET`
- Format: `whsec_XXXXXXXXXXXXXXXXXXXXXXXXX`

---

### 3. Configure Customer Portal

**Navigate to**: Stripe Dashboard → Settings → Billing → Customer portal

**Configuration**:
```
✓ Enable customer portal

Business information:
  Business name: FilterFive
  Support email: info@filterfive.io
  Support phone: (Optional)
  Privacy policy: https://filterfive.io/privacy
  Terms of service: https://filterfive.io/terms

Features:
  ✓ Invoice history
  ✓ Update payment method
  ✓ Update billing information
  ✓ Cancel subscriptions (with confirmation)
  ✓ Subscription pause (optional)

Default redirect URL: https://YOUR_DOMAIN.com/dashboard/settings
```

**Click**: Save changes

---

### 4. Get Live API Keys

**Navigate to**: Stripe Dashboard → Developers → API keys

**Copy the following**:

1. **Publishable key** (starts with `pk_live_`)
   - Safe to expose in client-side code
   - Used in EJS templates

2. **Secret key** (starts with `sk_live_`)
   - NEVER expose publicly
   - Used in server-side code only
   - Store in `.env` file

**Security Note**: Treat secret keys like passwords. Never commit to Git.

---

## Environment Variables

### 1. Update Production .env File

**Location**: `/root/FilterFive/.env` (on production server)

**Add/Update these variables**:

```bash
# Stripe Live Mode Configuration
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Stripe Price IDs (Live Mode)
STRIPE_PRICE_MONTHLY=price_XXXXXXXXXXXXXXXXX
STRIPE_PRICE_ANNUAL=price_YYYYYYYYYYYYYYYYY

# Application URL (MUST be HTTPS in production)
APP_URL=https://filterfive.io
```

**Important Notes**:
- Remove or comment out test mode keys
- Ensure `APP_URL` uses HTTPS
- Double-check price IDs match live products
- Keep webhook secret secure

---

### 2. Update docker-compose.yml

**Verify** these environment variables are passed to the app container:

```yaml
services:
  app:
    environment:
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - STRIPE_PRICE_MONTHLY=${STRIPE_PRICE_MONTHLY}
      - STRIPE_PRICE_ANNUAL=${STRIPE_PRICE_ANNUAL}
      - APP_URL=${APP_URL}
```

**File location**: `/root/FilterFive/docker-compose.yml`

**No changes needed** if already configured during development.

---

## Database Migration

### Verify Schema is Up-to-Date

**Check users table**:

```bash
# SSH into production server
ssh root@YOUR_SERVER_IP

# Connect to database
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'users'
  AND column_name IN (
    'stripe_customer_id',
    'stripe_subscription_id',
    'subscription_plan',
    'subscription_status',
    'subscription_period_end',
    'sms_usage_count',
    'sms_usage_limit'
  )
  ORDER BY ordinal_position;
"
```

**Expected output**:
```
column_name              | data_type                  | is_nullable
-------------------------+----------------------------+-------------
stripe_customer_id       | character varying(255)     | YES
stripe_subscription_id   | character varying(255)     | YES
subscription_plan        | USER-DEFINED (enum)        | YES
subscription_status      | USER-DEFINED (enum)        | NO
subscription_period_end  | timestamp with time zone   | YES
sms_usage_count          | integer                    | NO
sms_usage_limit          | integer                    | NO
```

**Check ENUM values**:

```sql
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'enum_users_subscription_plan'
ORDER BY enumsortorder;
```

**Expected output**:
```
enumlabel
-----------
monthly
annual
```

**If migration needed**, see [Database Migration Guide](#database-migration-procedure).

---

## Deployment Steps

### Step 1: Pull Latest Code

```bash
# SSH into production server
ssh root@YOUR_SERVER_IP

# Navigate to project directory
cd /root/FilterFive

# Stash any local changes (if any)
git stash

# Pull latest code
git pull origin main

# Or if using a specific branch
git pull origin milestone-2-stripe-integration
```

---

### Step 2: Update Environment Variables

```bash
# Edit .env file
nano .env

# Update Stripe variables with live mode values:
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLISHABLE_KEY
# - STRIPE_WEBHOOK_SECRET
# - STRIPE_PRICE_MONTHLY
# - STRIPE_PRICE_ANNUAL
# - APP_URL

# Save and exit (Ctrl+X, Y, Enter)
```

---

### Step 3: Install Dependencies

```bash
# Rebuild containers with new code
docker-compose build app

# Install any new npm packages
docker-compose exec app npm install
```

**Expected new dependency**: `express-rate-limit` (already installed during testing)

---

### Step 4: Restart Services

```bash
# Stop containers
docker-compose down

# Start containers with new configuration
docker-compose up -d

# Wait for services to start
sleep 10

# Check logs
docker-compose logs app --tail=50
```

**Look for**:
```
✓ Database connection established successfully.
✓ Server running on port 3000
✓ Environment: production
```

---

### Step 5: Verify Database Connection

```bash
# Test database connection
docker-compose exec -T app node -e "
  const { sequelize } = require('./src/models');
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✓ Database connected');
      process.exit(0);
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      process.exit(1);
    }
  })();
"
```

---

### Step 6: Test Stripe Configuration

```bash
# Verify Stripe live mode connection
docker-compose exec -T app node -e "
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  (async () => {
    try {
      // Retrieve monthly price
      const monthly = await stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY);
      console.log('✓ Monthly price: \$' + (monthly.unit_amount / 100));

      // Retrieve annual price
      const annual = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ANNUAL);
      console.log('✓ Annual price: \$' + (annual.unit_amount / 100));

      console.log('✓ Stripe live mode active');
      process.exit(0);
    } catch (error) {
      console.error('✗ Stripe configuration error:', error.message);
      process.exit(1);
    }
  })();
"
```

**Expected output**:
```
✓ Monthly price: $77
✓ Annual price: $770
✓ Stripe live mode active
```

---

## Post-Deployment Verification

### 1. Test Subscription Page Access

```bash
# Test from production server
curl -I https://filterfive.io/dashboard/subscription

# Expected: 302 Redirect to login (if not authenticated)
# Or: 200 OK (if using authenticated session)
```

### 2. Test Webhook Endpoint

```bash
# Test webhook endpoint is reachable
curl -I https://filterfive.io/webhooks/stripe

# Expected: 400 (Bad Request due to missing signature - this is correct)
# Should NOT be: 404 (Not Found) or 500 (Server Error)
```

### 3. Verify in Stripe Dashboard

**Navigate to**: Stripe Dashboard → Developers → Webhooks

**Check**:
- Endpoint URL shows green checkmark
- Recent webhook attempts show 200 responses
- No failed deliveries

**Test webhook**:
1. Click on your webhook endpoint
2. Click "Send test webhook"
3. Select "checkout.session.completed"
4. Click "Send test webhook"
5. Verify 200 response

---

### 4. Create Test User Account

**Manual Testing**:

1. **Visit**: https://filterfive.io/signup
2. **Create account** with real email
3. **Verify email** (check inbox)
4. **Log in** to dashboard
5. **Navigate to**: https://filterfive.io/dashboard/subscription
6. **Verify**:
   - Page loads correctly
   - Shows trial status
   - Displays plan cards
   - Shows correct pricing ($77, $770)

**DO NOT complete a real payment yet** - use test card first.

---

### 5. Test Checkout Flow with Test Card

**Important**: Even in live mode, use test card for first verification.

1. Click "Subscribe Monthly"
2. **Use test card**: 4242 4242 4242 4242
3. **Expiry**: Any future date
4. **CVC**: Any 3 digits
5. Complete checkout

**Expected Result**:
- Payment should be **rejected** (test card not allowed in live mode)
- This confirms live mode is active
- No charge occurs

---

### 6. Test Real Payment (Optional)

**Only if comfortable making a real charge**:

1. Click "Subscribe Monthly"
2. Use **real credit card**
3. Complete checkout
4. Verify subscription activates
5. Check email for receipt
6. **Immediately cancel** subscription
7. Request refund in Stripe Dashboard if needed

**Alternative**: Wait for first real customer to test.

---

## Monitoring Setup

### 1. Stripe Dashboard Alerts

**Navigate to**: Stripe Dashboard → Settings → Notifications

**Enable email alerts for**:
- Failed payments
- Disputed charges
- Webhook delivery failures
- Subscriptions created/cancelled

**Recipients**: info@filterfive.io

---

### 2. Application Logging

**View real-time logs**:
```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Watch app logs
docker-compose logs app -f
```

**Look for**:
- `✓ Stripe customer created`
- `✓ Checkout session created`
- `✓ Subscription created for user`
- `✓ Payment succeeded for user`

**Watch for errors**:
- `Stripe customer creation failed`
- `Error creating checkout session`
- `Webhook signature verification failed`

---

### 3. Database Monitoring

**Check subscription metrics**:

```sql
-- Active subscriptions
SELECT COUNT(*) FROM users
WHERE subscription_status = 'active';

-- Trial users
SELECT COUNT(*) FROM users
WHERE subscription_status = 'trial';

-- Monthly vs Annual
SELECT subscription_plan, COUNT(*)
FROM users
WHERE subscription_status = 'active'
GROUP BY subscription_plan;

-- Recent signups with Stripe customers
SELECT id, email, business_name, stripe_customer_id, created_at
FROM users
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

### 4. Webhook Health Check

**Daily check**:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your endpoint
3. Check "Recent deliveries" tab
4. Verify all recent webhooks show 200 status
5. Investigate any 4xx or 5xx errors

---

## Rollback Plan

### If Critical Issues Occur

**Immediate Rollback Steps**:

```bash
# SSH into server
ssh root@YOUR_SERVER_IP
cd /root/FilterFive

# Stop services
docker-compose down

# Restore previous code version
git reset --hard HEAD~1
# Or checkout previous commit
git checkout PREVIOUS_COMMIT_SHA

# Restore previous .env
cp .env.backup .env

# Restore database if needed
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod < backup_pre_stripe_YYYYMMDD_HHMMSS.sql

# Restart services
docker-compose up -d

# Verify
docker-compose logs app --tail=50
```

---

### Partial Rollback (Disable Stripe Only)

**If Stripe has issues but rest of app is fine**:

1. **Disable subscription page**:
```bash
# Edit routes
nano src/routes/subscription.js

# Comment out all routes
# Restart app
docker-compose restart app
```

2. **Remove navigation link**:
```bash
# Edit dashboard views
# Remove "Subscription" link from navigation
docker-compose restart app
```

3. **Investigate issue** without affecting existing users

---

## Troubleshooting

### Issue: Webhook signature verification fails

**Symptoms**:
- Webhooks show 400 errors in Stripe Dashboard
- App logs show "Webhook signature verification failed"

**Solution**:
```bash
# 1. Verify webhook secret in .env
grep STRIPE_WEBHOOK_SECRET .env

# 2. Verify webhook secret in Stripe Dashboard
# Should match exactly (including whsec_ prefix)

# 3. Verify webhook route is using raw body parser
# Check app.js line 35-37

# 4. Restart app
docker-compose restart app
```

---

### Issue: Prices not found

**Symptoms**:
- "No such price" error
- Checkout fails to create

**Solution**:
```bash
# 1. Verify price IDs in .env
grep STRIPE_PRICE .env

# 2. Check Stripe Dashboard → Products
# Copy correct price IDs

# 3. Update .env
nano .env

# 4. Restart app
docker-compose restart app

# 5. Test price retrieval
docker-compose exec -T app node -e "
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  (async () => {
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY);
    console.log(price);
  })();
"
```

---

### Issue: Test mode still active in production

**Symptoms**:
- Seeing "Test mode" banner in Stripe Checkout
- Test cards work in production

**Solution**:
```bash
# 1. Check which keys are loaded
docker-compose exec -T app node -e "
  console.log('Secret key:', process.env.STRIPE_SECRET_KEY.substring(0, 10));
  console.log('Pub key:', process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 10));
"

# Expected output:
# Secret key: sk_live_51
# Pub key: pk_live_51

# 2. If showing sk_test_ or pk_test_, update .env
nano .env

# 3. Restart
docker-compose down && docker-compose up -d
```

---

### Issue: Customer already exists error

**Symptoms**:
- "A customer with this email already exists" error
- Signup fails

**Solution**:

This shouldn't happen as code checks for existing `stripeCustomerId`, but if it does:

```javascript
// Check src/controllers/authController.js
// Ensure customer creation is wrapped in try-catch
// Existing code already handles this - verify it wasn't modified
```

---

### Issue: Subscription not activating after payment

**Symptoms**:
- Payment succeeds in Stripe
- User still shows as trial in database

**Diagnosis**:
```bash
# 1. Check webhook delivery
# Go to Stripe Dashboard → Webhooks → Recent deliveries

# 2. Check app logs for webhook events
docker-compose logs app | grep "checkout.session.completed"

# 3. Manually check user record
docker-compose exec -T db psql -U filterfive_prod_user -d filterfive_prod -c "
  SELECT id, email, subscription_status, subscription_plan, stripe_subscription_id
  FROM users
  WHERE email = 'user@example.com';
"
```

**Solution**:
- If webhook failed: Check signature verification
- If webhook succeeded but DB not updated: Check webhook handler code
- **Manual fix**: Update user record directly (last resort)

---

## Security Checklist

**Before going live**, verify:

- [ ] All Stripe keys are live mode (sk_live_, pk_live_)
- [ ] Webhook secret is from live webhook endpoint
- [ ] HTTPS is enforced on all routes
- [ ] `.env` file is not committed to Git
- [ ] `.env` file has restricted permissions (chmod 600)
- [ ] APP_URL uses HTTPS
- [ ] Webhook endpoint is publicly accessible
- [ ] No sensitive data logged to console
- [ ] Error messages don't expose system details

---

## Post-Launch Monitoring

### Week 1: Daily Checks

**Day 1-7**, check daily:
- Stripe Dashboard for new customers
- Webhook delivery success rate
- Application error logs
- Customer support emails
- Subscription conversion rate

### Week 2-4: Every 2-3 Days

**After stabilization**, check every 2-3 days:
- MRR growth
- Churn rate
- Failed payment rate
- Customer feedback

### Month 2+: Weekly

**Ongoing**, check weekly:
- Financial metrics
- Customer satisfaction
- Feature requests
- System performance

---

## Support Contacts

**Stripe Support**:
- Dashboard: https://dashboard.stripe.com/support
- Email: support@stripe.com
- Phone: Available in Dashboard

**Technical Issues**:
- Review: [API-SUBSCRIPTION-ENDPOINTS.md](./API-SUBSCRIPTION-ENDPOINTS.md)
- Review: [MILESTONE-2-STRIPE-INTEGRATION.md](./MILESTONE-2-STRIPE-INTEGRATION.md)

---

## Success Criteria

**Deployment is successful when**:

- ✅ All tests pass in production
- ✅ Webhooks deliver successfully
- ✅ First real customer signs up and pays
- ✅ Subscription activates correctly
- ✅ No errors in logs for 24 hours
- ✅ Customer receives confirmation email
- ✅ Revenue appears in Stripe Dashboard

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: January 29, 2025
**Status**: Ready for Production
