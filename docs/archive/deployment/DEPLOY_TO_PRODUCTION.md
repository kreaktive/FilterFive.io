# Deploy Signup Feature to Production (filterfive.io)

## 🚀 Step-by-Step Deployment Guide

This guide will walk you through deploying all the signup changes to your Hostinger VPS.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] SSH access to your Hostinger VPS
- [ ] Root or sudo privileges on the server
- [ ] GitHub repository access
- [ ] Production environment variables ready
- [ ] Backup of current production database (just in case)

---

## Step 1: Commit & Push Code to GitHub

### 1.1 Review Changes

```bash
cd "/Users/kk/Dropbox/KREAKTIVE LLC/DMS Kreaktive/Production/FilterFive/251128 FilterFive.io MVP V2"
git status
```

### 1.2 Stage All New Files

```bash
# Add all new files
git add src/controllers/authController.js
git add src/middleware/captcha.js
git add src/middleware/rateLimiter.js
git add src/migrations/
git add src/routes/auth.js
git add src/scripts/runMigrations.js
git add src/services/emailTemplates.js
git add src/services/validationService.js
git add src/views/auth/

# Add modified files
git add .env.example
git add app.js
git add package.json
git add src/controllers/dashboardController.js
git add src/models/User.js
git add src/routes/dashboard.js
git add src/services/emailService.js
git add src/views/dashboard/login.ejs

# Add documentation
git add SIGNUP_IMPLEMENTATION.md
git add DEPLOY_TO_PRODUCTION.md
```

### 1.3 Commit Changes

```bash
git commit -m "$(cat <<'EOF'
feat: Add self-service signup and authentication flow

- Implement email verification for new signups
- Add password reset functionality
- Create trial management system (14-day free trial)
- Add rate limiting protection (signup, login, password reset)
- Integrate Google reCAPTCHA v2 for bot protection
- Create professional email templates (verification, welcome, reset)
- Add input validation and XSS prevention
- Block unverified users from logging in
- Update login page with signup CTA and forgot password link
- Add comprehensive documentation

Security improvements:
- Rate limiting on authentication endpoints
- CAPTCHA protection on signup
- Secure token generation for verification/reset
- Password strength requirements (12+ chars)
- Input sanitization

🤖 Generated with Claude Code
https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 1.4 Push to GitHub

```bash
git push origin main
```

---

## Step 2: SSH into Your Hostinger VPS

```bash
# Replace with your actual server IP from Hostinger
ssh root@31.97.215.238
```

Or use your Hostinger credentials if different.

---

## Step 3: Update Code on Server

### 3.1 Navigate to Application Directory

```bash
cd /path/to/filterfive  # Replace with actual path
# Common locations:
# cd /var/www/filterfive
# cd /opt/filterfive
# cd ~/filterfive
```

**Don't know the path?** Find it:
```bash
find / -name "docker-compose.prod.yml" -o -name "filterfive" -type d 2>/dev/null
```

### 3.2 Pull Latest Changes

```bash
git pull origin main
```

---

## Step 4: Update Environment Variables

### 4.1 Check Current Environment File

```bash
cat .env.production
# Or
cat .env
```

### 4.2 Add New Required Variables

Edit your production environment file:

```bash
nano .env.production
# Or
nano .env
```

**Add these NEW variables:**

```bash
# Application URL (IMPORTANT: Use your actual domain)
APP_URL=https://filterfive.io

# Google reCAPTCHA (Required for production)
# Get keys from: https://www.google.com/recaptcha/admin
RECAPTCHA_SITE_KEY=your_production_site_key_here
RECAPTCHA_SECRET_KEY=your_production_secret_key_here
```

**Save and exit:** `Ctrl + X`, then `Y`, then `Enter`

### 4.3 Get Production reCAPTCHA Keys

1. Go to https://www.google.com/recaptcha/admin
2. Click "Create" or "+" to register a new site
3. Choose **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
4. Add domains:
   - `filterfive.io`
   - `www.filterfive.io`
5. Accept terms and submit
6. Copy the **Site Key** and **Secret Key**
7. Add them to your `.env.production` file

---

## Step 5: Install New Dependencies

```bash
# Stop running containers
docker-compose -f docker-compose.prod.yml down

# Rebuild with new dependencies
docker-compose -f docker-compose.prod.yml build --no-cache
```

This will install:
- `express-rate-limit` (rate limiting)
- `express-recaptcha` (CAPTCHA)

---

## Step 6: Update Database Schema

### 6.1 Start Database Only

```bash
docker-compose -f docker-compose.prod.yml up -d db
```

### 6.2 Run Database Sync (Adds New Columns)

```bash
docker-compose -f docker-compose.prod.yml run --rm app npm run db:sync
```

This will add:
- `is_verified`
- `verification_token`
- `verification_token_expires`
- `trial_starts_at`
- `trial_ends_at`
- `reset_password_token`
- `reset_password_token_expires`

### 6.3 Mark Existing Users as Verified

```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d filterfive -c "UPDATE users SET is_verified = true WHERE is_verified = false;"
```

This ensures existing users can still log in.

---

## Step 7: Start Application

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

**Press `Ctrl + C` to exit logs view**

---

## Step 8: Verify Deployment

### 8.1 Check Services Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

Should show:
```
NAME                   STATUS      PORTS
filterfive_app_prod    Up          0.0.0.0:3000->3000/tcp
filterfive_db_prod     Up          0.0.0.0:5433->5432/tcp
```

### 8.2 Test Signup Page

Visit in browser:
```
https://filterfive.io/signup
```

**Expected:** Beautiful signup form with reCAPTCHA

### 8.3 Test Login Page

```
https://filterfive.io/dashboard/login
```

**Expected:**
- "Create Free Account" button visible
- "Forgot password?" link visible

### 8.4 Test Existing Login

Try logging in with existing credentials.

**Expected:** Should work normally (users marked as verified)

---

## Step 9: Test Email Functionality

### 9.1 Create Test Signup

1. Go to https://filterfive.io/signup
2. Fill out form with a real email address
3. Submit form

**Expected:**
- "Check Your Email" page appears
- Verification email arrives (check spam)

### 9.2 Verify Email

1. Click verification link in email
2. Should auto-login and redirect to dashboard
3. Welcome email should arrive

### 9.3 Test Password Reset

1. Go to https://filterfive.io/dashboard/login
2. Click "Forgot password?"
3. Enter email and submit
4. Check email for reset link
5. Click link and set new password
6. Try logging in with new password

---

## 🔍 Troubleshooting

### Issue: "Module not found" error

**Solution:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Issue: reCAPTCHA not showing

**Check:**
1. Are keys in `.env.production`?
2. Is domain added to reCAPTCHA admin?
3. Check browser console for errors

**View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

### Issue: Emails not sending

**Check Resend:**
1. Is `RESEND_API_KEY` set correctly?
2. Is `RESEND_FROM_EMAIL` verified in Resend dashboard?
3. Check Resend dashboard for delivery logs

**Test email:**
```bash
docker-compose -f docker-compose.prod.yml exec app npm run test:email
```

### Issue: Database columns already exist

**If you get "column already exists" error:**
```bash
# This means db:sync was already run, which is fine
# Just start the app normally
docker-compose -f docker-compose.prod.yml up -d
```

### Issue: Can't login with existing account

**Solution:**
```bash
# Mark all users as verified
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d filterfive -c "UPDATE users SET is_verified = true;"
```

### Issue: Port 3000 already in use

**Check what's running:**
```bash
docker ps -a
lsof -i :3000
```

**Stop old containers:**
```bash
docker stop $(docker ps -a -q)
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Security Notes

### Rate Limiting Is Active

Be aware:
- **Signup:** 5 attempts per IP per hour
- **Login:** 10 attempts per IP per 15 minutes
- **Password reset:** 3 attempts per IP per hour

This protects against abuse but may affect legitimate users on shared IPs.

### CAPTCHA Requirement

Production MUST have real reCAPTCHA keys. Test keys will not work.

### HTTPS Required

Email verification and password reset links use `APP_URL` from env:
```bash
APP_URL=https://filterfive.io  # Must be HTTPS in production
```

---

## 📊 Monitor After Deployment

### Check Application Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

Look for:
- ✓ Server running on port 3000
- ✓ Database connection established
- ⚠️ Any errors or warnings

### Check Database Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f db
```

### Monitor Signups

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d filterfive

# Check recent signups
SELECT id, business_name, email, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

### Quick Rollback

```bash
# Stop current version
docker-compose -f docker-compose.prod.yml down

# Revert to previous commit
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# Rebuild and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Database Rollback

If you need to remove new columns:

```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d filterfive -c "
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS verification_token_expires;
ALTER TABLE users DROP COLUMN IF EXISTS trial_starts_at;
ALTER TABLE users DROP COLUMN IF EXISTS trial_ends_at;
ALTER TABLE users DROP COLUMN IF EXISTS reset_password_token;
ALTER TABLE users DROP COLUMN IF EXISTS reset_password_token_expires;
"
```

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Signup page loads (https://filterfive.io/signup)
- [ ] Login page shows signup CTA and forgot password
- [ ] Can create new account
- [ ] Verification email received
- [ ] Can verify email and auto-login
- [ ] Welcome email received
- [ ] Can reset password
- [ ] Existing users can still login
- [ ] Rate limiting works (try 6 signups)
- [ ] reCAPTCHA shows on signup form
- [ ] Dashboard loads normally
- [ ] No errors in application logs

---

## 📞 Need Help?

If you encounter issues:

1. **Check logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f app
   ```

2. **Check server resources:**
   ```bash
   htop  # Or: top
   df -h  # Disk space
   ```

3. **Restart services:**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

4. **Full restart:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## 🎉 Success!

Once all checks pass, your self-service signup is live on filterfive.io!

Users can now:
- ✅ Sign up for free 14-day trials
- ✅ Verify their email addresses
- ✅ Reset forgotten passwords
- ✅ Start using FilterFive immediately

**Congratulations on launching product-led growth!** 🚀

---

**Deployment completed:** [Date]
**Deployed by:** [Your Name]
**Commit:** [Git commit hash]
