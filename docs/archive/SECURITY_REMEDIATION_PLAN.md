# Security Remediation Plan - MoreStars

## Overview of Credential Exposure

### How Credentials Are Currently Exposed:

1. **Dropbox Sync** - Your entire project folder syncs to Dropbox cloud
   - Anyone with Dropbox access sees `.env` files
   - Dropbox employees could theoretically access
   - If Dropbox account is compromised, all secrets exposed

2. **File Permissions** - `.env.production` is world-readable (644)
   - Any user on your Mac can read it
   - Any process can read it

3. **Documentation** - `docs/OPS.md` contains hardcoded production DB password
   - 4 occurrences of the actual password in plain text

4. **Git Risk** - If committed, secrets live in git history forever

---

## Phase 1: Create Secure Local Environment (Do First)

### Step 1.1: Create secrets directory outside Dropbox

```bash
# Create secure directory that doesn't sync to Dropbox
mkdir -p ~/.morestars-secrets
chmod 700 ~/.morestars-secrets

# This directory is:
# - Outside Dropbox (doesn't sync)
# - Only readable by your user
# - Hidden (starts with .)
```

### Step 1.2: Move sensitive files

```bash
# Copy current .env files to secure location (as backup before rotation)
cp "/Users/kk/Dropbox/KREAKTIVE LLC/MoreStars.io/Website/MoreStars V01/.env" ~/.morestars-secrets/.env.backup.$(date +%Y%m%d)
cp "/Users/kk/Dropbox/KREAKTIVE LLC/MoreStars.io/Website/MoreStars V01/.env.production" ~/.morestars-secrets/.env.production.backup.$(date +%Y%m%d)

# Set secure permissions
chmod 600 ~/.morestars-secrets/*
```

### Step 1.3: Create symlinks for development

```bash
# Remove old .env files from Dropbox folder
rm "/Users/kk/Dropbox/KREAKTIVE LLC/MoreStars.io/Website/MoreStars V01/.env"
rm "/Users/kk/Dropbox/KREAKTIVE LLC/MoreStars.io/Website/MoreStars V01/.env.production"

# Create new .env in secure location (will populate after credential rotation)
touch ~/.morestars-secrets/.env.development
touch ~/.morestars-secrets/.env.production
chmod 600 ~/.morestars-secrets/.env.*

# Create symlinks from project to secure location
ln -s ~/.morestars-secrets/.env.development "/Users/kk/Dropbox/KREAKTIVE LLC/MoreStars.io/Website/MoreStars V01/.env"
```

---

## Phase 2: Remove Hardcoded Secrets from Documentation

### Step 2.1: Fix docs/OPS.md

Replace all occurrences of:
```bash
PGPASSWORD="NZGzDN/hwXvVpR45Qv10nwd5myixCRbRU1OUlzKAygc="
```

With:
```bash
PGPASSWORD="$DB_PASSWORD"
```

**Lines to fix:** 489, 496, 515, 792

### Step 2.2: Update .gitignore

Ensure these are in `.gitignore`:
```
.env
.env.*
!.env.example
!.env.production.example
*.pem
*.key
```

---

## Phase 3: Rotate ALL Credentials (Critical)

### 3.1: Generate New Secrets Locally

```bash
# Generate new session secret (64 hex chars)
echo "SESSION_SECRET=$(openssl rand -hex 32)"

# Generate new API secret (64 hex chars)
echo "API_SECRET=$(openssl rand -hex 32)"

# Generate new POS token encryption key (32 hex chars)
echo "POS_TOKEN_ENCRYPTION_KEY=$(openssl rand -hex 16)"
```

### 3.2: Rotate Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Click "Roll key" on the Secret key
3. Copy new `sk_live_...` key
4. Update webhook endpoint secret at https://dashboard.stripe.com/webhooks
5. Copy new `whsec_...` webhook secret

### 3.3: Rotate Twilio Credentials

1. Go to https://console.twilio.com/
2. Navigate to Account → API keys and tokens
3. Create new API Key (or regenerate Auth Token)
4. Update credentials

### 3.4: Rotate Resend API Key

1. Go to https://resend.com/api-keys
2. Delete old key, create new one
3. Update credentials

### 3.5: Rotate reCAPTCHA Keys

1. Go to https://www.google.com/recaptcha/admin
2. Select your site
3. Generate new keys (or create new site)
4. Update both SITE_KEY and SECRET_KEY

### 3.6: Rotate Square Credentials

1. Go to https://developer.squareup.com/apps
2. Navigate to your app → OAuth
3. Reset OAuth secret
4. Update webhook signature key

### 3.7: Rotate Shopify Credentials

1. Go to Shopify Partners → Apps
2. Navigate to your app → API credentials
3. Regenerate API secret
4. Update credentials

### 3.8: Change Database Password

```bash
# SSH to production server
ssh root@morestars.io

# Connect to database
docker exec -it morestars_db_prod psql -U postgres

# Change password
ALTER USER morestars_user WITH PASSWORD 'NEW_SECURE_PASSWORD_HERE';
\q

# Update .env on server with new password
```

---

## Phase 4: Create New Secure .env Files

### .env.development (for local development)

```bash
# Create in ~/.morestars-secrets/.env.development
cat > ~/.morestars-secrets/.env.development << 'EOF'
NODE_ENV=development
PORT=3000

# Security (NEWLY GENERATED)
SESSION_SECRET=<paste-new-64-char-hex>
API_SECRET=<paste-new-64-char-hex>

# Database (local Docker)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=morestars_dev
DB_USER=morestars_user
DB_PASSWORD=<new-local-dev-password>

# Twilio (NEWLY ROTATED)
TWILIO_ACCOUNT_SID=<new-sid>
TWILIO_AUTH_TOKEN=<new-token>
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_MESSAGING_SERVICE_SID=<your-sid>

# Stripe (NEWLY ROTATED - use test keys for dev)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...

# Resend (NEWLY ROTATED)
RESEND_API_KEY=<new-key>
RESEND_FROM_EMAIL=noreply@morestars.io

# reCAPTCHA (NEWLY ROTATED)
RECAPTCHA_SITE_KEY=<new-site-key>
RECAPTCHA_SECRET_KEY=<new-secret-key>

# Square (NEWLY ROTATED - sandbox for dev)
SQUARE_APP_ID=sandbox-...
SQUARE_APP_SECRET=sandbox-...
SQUARE_WEBHOOK_SIGNATURE_KEY=<new-key>
SQUARE_ENVIRONMENT=sandbox

# Shopify (NEWLY ROTATED)
SHOPIFY_API_KEY=<new-key>
SHOPIFY_API_SECRET=<new-secret>

# POS Encryption (NEWLY GENERATED)
POS_TOKEN_ENCRYPTION_KEY=<new-32-char-hex>

# App URLs
APP_URL=http://localhost:3000
MARKETING_DOMAIN=localhost:3000
APP_DOMAIN=localhost:3000

# Redis
REDIS_URL=redis://localhost:6379
EOF

chmod 600 ~/.morestars-secrets/.env.development
```

---

## Phase 5: Update Production Server

### Step 5.1: SSH to production and update .env

```bash
ssh root@morestars.io
cd /root/FilterFive  # or wherever your app is

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d)

# Edit .env with new credentials
nano .env
# Paste all new rotated credentials

# Set permissions
chmod 600 .env
```

### Step 5.2: Restart application

```bash
docker compose down
docker compose up -d

# Verify it starts correctly
docker compose logs -f app
```

### Step 5.3: Test critical flows

1. Test user login
2. Test new user signup
3. Test Stripe checkout
4. Test SMS sending
5. Test webhook reception

---

## Phase 6: Fix Code Vulnerabilities

### 6.1: Session Fixation Fix

**File:** `src/controllers/authController.js` (line ~198)
**File:** `src/controllers/dashboardController.js` (line ~87)

```javascript
// BEFORE (vulnerable)
req.session.userId = user.id;
req.session.userEmail = user.email;

// AFTER (secure)
req.session.regenerate((err) => {
  if (err) {
    logger.error('Session regeneration failed', { error: err.message });
    return res.status(500).render('error', { message: 'Authentication error' });
  }
  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.businessName = user.businessName;
  // ... continue with redirect
});
```

### 6.2: Webhook Signature Verification Fix

**File:** `src/services/squareWebhookService.js` (line ~26)

```javascript
// BEFORE (bypass vulnerability)
if (!this.signatureKey) {
  console.warn('SQUARE_WEBHOOK_SIGNATURE_KEY not configured - skipping verification');
  return true;
}

// AFTER (fail-secure)
if (!this.signatureKey) {
  logger.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured - rejecting webhook');
  return false;  // REJECT, don't allow bypass
}
```

**File:** `src/services/shopifyWebhookService.js` (line ~24)
Same fix - change `return true` to `return false`

### 6.3: Auth Middleware Fix

**File:** `src/middleware/auth.js`

```javascript
// BEFORE (doesn't verify user exists)
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/dashboard/login');
};

// AFTER (verifies user exists and is active)
const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/dashboard/login');
  }

  try {
    const User = require('../models').User;
    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'isActive', 'isVerified']
    });

    if (!user || !user.isActive || !user.isVerified) {
      req.session.destroy();
      return res.redirect('/dashboard/login');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    res.redirect('/dashboard/login');
  }
};
```

### 6.4: Remove API Key from JSON Response

**File:** `src/models/User.js` (line ~230)

```javascript
// BEFORE
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.verificationToken;
  delete values.verificationTokenExpires;
  delete values.resetPasswordToken;
  delete values.resetPasswordTokenExpires;
  return values;
};

// AFTER (also remove apiKey)
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.apiKey;  // ADD THIS LINE
  delete values.verificationToken;
  delete values.verificationTokenExpires;
  delete values.resetPasswordToken;
  delete values.resetPasswordTokenExpires;
  return values;
};
```

### 6.5: Open Redirect Fix

**File:** `src/controllers/reviewController.js` (line ~79)

```javascript
// BEFORE (allows any URL)
return res.redirect(feedbackRequest.user.reviewUrl);

// AFTER (validates URL)
const validateReviewUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const allowedDomains = [
      'google.com', 'g.page', 'goo.gl',
      'facebook.com', 'fb.com',
      'yelp.com', 'yelp.ca',
      'tripadvisor.com',
      'trustpilot.com'
    ];
    const hostname = parsed.hostname.toLowerCase();
    const isAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
    return isAllowed && ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// In the controller
if (!validateReviewUrl(feedbackRequest.user.reviewUrl)) {
  logger.warn('Invalid review URL attempted', {
    userId: feedbackRequest.user.id,
    url: feedbackRequest.user.reviewUrl
  });
  return res.render('error', {
    message: 'Review platform not configured correctly. Please contact the business.'
  });
}
return res.redirect(feedbackRequest.user.reviewUrl);
```

### 6.6: Add Startup Validation for Required Secrets

**File:** `app.js` (add after line ~44)

```javascript
// Validate webhook secrets are not placeholders
const webhookSecrets = {
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  SQUARE_WEBHOOK_SIGNATURE_KEY: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
};

for (const [name, value] of Object.entries(webhookSecrets)) {
  if (!value || value.includes('your-') || value.includes('placeholder')) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(`FATAL: ${name} is not configured properly`);
      process.exit(1);
    } else {
      logger.warn(`WARNING: ${name} not configured - webhooks will be rejected`);
    }
  }
}
```

---

## Phase 7: Verification Checklist

After completing all phases, verify:

- [ ] `.env` files no longer in Dropbox folder (or are symlinks)
- [ ] `~/.morestars-secrets/` exists with 700 permissions
- [ ] All `.env` files have 600 permissions
- [ ] `docs/OPS.md` has no hardcoded passwords
- [ ] All credentials have been rotated:
  - [ ] Stripe (API key + webhook secret)
  - [ ] Twilio
  - [ ] Resend
  - [ ] reCAPTCHA
  - [ ] Square
  - [ ] Shopify
  - [ ] Database password
  - [ ] Session secret
  - [ ] API secret
  - [ ] POS encryption key
- [ ] Production server updated with new credentials
- [ ] Application restarts successfully
- [ ] Login works
- [ ] Signup works
- [ ] Stripe checkout works
- [ ] SMS sending works
- [ ] Webhooks are received (check Stripe dashboard)

---

## Long-term Recommendations

1. **Use a secrets manager** - Consider AWS Secrets Manager, HashiCorp Vault, or 1Password CLI
2. **Move project out of Dropbox** - Use Git for syncing code, not Dropbox
3. **Enable Stripe's restricted keys** - Create API keys with only needed permissions
4. **Set up monitoring** - Alert on failed auth attempts, webhook failures
5. **Regular rotation** - Rotate credentials every 90 days
6. **Security audit** - Run this audit quarterly

---

## Emergency: If Credentials Were Already Compromised

If you suspect credentials have been used maliciously:

1. **Stripe** - Check https://dashboard.stripe.com/payments for unknown charges
2. **Twilio** - Check https://console.twilio.com/usage for unexpected SMS
3. **Database** - Check for unknown users: `SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'`
4. **Server** - Check access logs: `docker compose logs app | grep -i "login\|auth"`

Report any suspicious activity to the respective service providers immediately.
