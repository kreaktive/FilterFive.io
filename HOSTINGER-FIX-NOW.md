# Fix Production NOW - Hostinger Web Terminal Commands

## The Problem
The code inside your Docker container is OLD. Restarting doesn't help because it restarts the old code.

You need to either:
1. **Update the code file directly** (fastest)
2. **Rebuild the container with new code** (proper way)

---

## Option 1: Quick Fix (2 minutes)

Copy and paste these commands in Hostinger Web Terminal:

```bash
cd /root/FilterFive

# Backup the broken file
cp src/middleware/qrRateLimiter.js src/middleware/qrRateLimiter.js.backup

# Fix the file directly (copy this ENTIRE block)
cat > src/middleware/qrRateLimiter.js << 'ENDOFFILE'
/**
 * QR Rate Limiter Middleware
 */
const rateLimit = require('express-rate-limit');

const qrRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1,

  keyGenerator: (req, res) => {
    const businessId = req.params.businessId || 'unknown';
    return `qr_${businessId}`;
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    console.warn(`⚠️  QR rate limit exceeded - IP: ${req.ip}, Business: ${req.params.businessId}`);
    res.status(429).render('error', {
      title: 'Too Many Requests',
      message: 'You have already submitted feedback recently. Please try again in 30 seconds.',
      error: { status: 429 }
    });
  },

  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

module.exports = { qrRateLimiter };
ENDOFFILE

# Restart the container
docker compose restart app

# Wait 5 seconds
sleep 5

# Check if it worked
docker compose logs --tail=30 app | grep -E "error|Error|✓|Server running"
```

**Expected output:**
```
✓ Database connection established successfully.
✓ Server running on port 3000
```

**Test it:**
Visit https://filterfive.io/dashboard

---

## Option 2: Proper Deployment (10 minutes)

If you have git set up on the server:

```bash
cd /root/FilterFive

# Pull latest code
git pull origin main

# Rebuild container
docker compose down
docker compose build --no-cache app
docker compose up -d

# Check logs
docker compose logs --tail=50 app
```

---

## Option 3: Full Package Deployment

This requires uploading the tar.gz file first via Hostinger File Manager:

1. **Upload via Hostinger File Manager:**
   - Go to File Manager in Hostinger panel
   - Navigate to `/root/`
   - Upload: `filterfive-review-gating-FINAL-20251202.tar.gz`

2. **Then run in Web Terminal:**
```bash
cd /root/FilterFive
bash deploy-production.sh
```

This will:
- Create backup
- Extract new code
- Rebuild containers
- Run migrations
- Start app

---

## Verification

After any option, check:

```bash
# Check container is running
docker compose ps

# Check logs for errors
docker compose logs --tail=50 app

# Test the app
curl -I http://localhost:3000
```

**Expected:**
- Container status: Up
- Logs show: ✓ Server running on port 3000
- No ValidationError about IPv6

---

## Still Not Working?

If still broken after Option 1, try this nuclear option:

```bash
cd /root/FilterFive

# Stop everything
docker compose down

# Remove old containers
docker container prune -f

# Rebuild from scratch
docker compose build --no-cache

# Start
docker compose up -d

# Check
docker compose logs --tail=50 app
```

---

## What Went Wrong Before

❌ **What you did:** `docker compose restart app`
- This just restarts the existing container
- The old broken code is still inside

✅ **What you need:** Update the code file OR rebuild the container
- Option 1 updates the file directly
- Option 2/3 rebuild with new code

The key difference:
- **Restart** = turn it off and on (same code)
- **Rebuild** = create new container with updated code

---

## Emergency Contact

If all else fails, the absolute fastest fix is Option 1 (the cat command).
Just copy-paste the entire block starting from `cd /root/FilterFive` through the grep command.

It takes 10 seconds to run and should immediately fix the production site.
