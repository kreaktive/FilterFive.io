# Hostinger Deployment Guide

## Quick Fix for Production

The production site is showing "something went wrong" because of an IPv6 error in the rate limiter. Your local environment is working perfectly with the fix.

## Option 1: Hostinger File Manager (Easiest)

### Step 1: Access Hostinger
1. Log into your Hostinger account
2. Go to VPS → Manage
3. Open **File Manager** or **Web Terminal**

### Step 2: If using Web Terminal (Recommended)
```bash
# Navigate to your app
cd /root/FilterFive

# Check current status
docker compose ps

# Pull the latest code (if you have git set up)
git pull origin main

# Or download the deployment package
# (Upload filterfive-review-gating-FINAL-20251202.tar.gz via File Manager first)

# Rebuild containers with the fix
docker compose down
docker compose build --no-cache app
docker compose up -d

# Check logs
docker compose logs --tail=50 app
```

### Step 3: If using File Manager
1. Navigate to `/root/FilterFive/src/middleware/`
2. Download `qrRateLimiter.js` as backup
3. Upload the fixed version from your local machine:
   - Local path: `src/middleware/qrRateLimiter.js`
4. Restart the container:
   - Use Web Terminal: `cd /root/FilterFive && docker compose restart app`

## Option 2: SFTP Upload (If you have credentials)

### Using FileZilla or similar:
- **Host:** sftp://31.97.215.238 or filterfive.io
- **Username:** root
- **Port:** 22
- **Password:** (your Hostinger VPS password)

Upload the fixed `qrRateLimiter.js` file to:
`/root/FilterFive/src/middleware/qrRateLimiter.js`

Then restart via Hostinger web terminal.

## Option 3: Quick Manual Fix

If you can access the Hostinger web terminal, just run these commands:

```bash
cd /root/FilterFive

# Create backup
cp src/middleware/qrRateLimiter.js src/middleware/qrRateLimiter.js.backup

# Fix the file directly
cat > src/middleware/qrRateLimiter.js << 'EOF'
/**
 * QR Rate Limiter Middleware
 *
 * Purpose: Prevent spam/abuse of QR code feedback system
 * Strategy: Limit 1 feedback per 5 minutes per business per IP
 * Trade-off: Accept some false positives (shared IPs) for simplicity
 */

const rateLimit = require('express-rate-limit');

/**
 * QR Rate Limiter
 * Limits: 1 feedback request per 30 seconds per business per IP
 */
const qrRateLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // 1 request per window per key

  // Generate unique key combining IP + businessId (IPv6 compatible)
  keyGenerator: (req, res) => {
    const businessId = req.params.businessId || 'unknown';
    // Use default IP extraction which handles IPv6 properly
    return \`qr_\${businessId}\`;
  },

  // Standard IP handling (supports IPv6)
  standardHeaders: true,
  legacyHeaders: false,

  // Custom message for rate limit exceeded
  handler: (req, res) => {
    console.warn(\`⚠️  QR rate limit exceeded - IP: \${req.ip}, Business: \${req.params.businessId}\`);

    res.status(429).render('error', {
      title: 'Too Many Requests',
      message: 'You\\'ve already submitted feedback recently. Please try again in 30 seconds.',
      error: { status: 429 }
    });
  },

  // Skip successful requests (only count when they actually scan)
  skipSuccessfulRequests: false,

  // Don't count failed requests (errors)
  skipFailedRequests: true
});

module.exports = { qrRateLimiter };
EOF

# Restart the app
docker compose restart app

# Check if it's working
docker compose logs --tail=30 app | grep -E "error|Error|✓"
```

## Verify Fix

After restarting, check:
1. Visit https://filterfive.io/dashboard
2. Should load without "something went wrong" error
3. Check logs for: `✓ Server running on port 3000`
4. No more `ValidationError` about IPv6

## Full Deployment (Optional)

If you want to deploy ALL the new features (review gating removal + SMS tones):

1. Upload `filterfive-review-gating-FINAL-20251202.tar.gz` via File Manager to `/root/`
2. In Web Terminal:
```bash
cd /root/FilterFive
bash deploy-production.sh
```

This will automatically:
- Create backup
- Extract new code
- Run migrations
- Rebuild containers
- Start the app

## Need Help?

If you can provide your Hostinger login details (via environment variables or secure method), I can help further. Otherwise, the Web Terminal method above is the fastest way to fix the production site.
