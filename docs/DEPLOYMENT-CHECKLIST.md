# FilterFive Deployment Checklist

**Version:** 2.0.0
**Last Updated:** November 29, 2025

This guide ensures smooth deployments from local development to production VPS.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Update `.env` file with **production values**:
  ```bash
  APP_URL=https://filterfive.io  # NOT localhost!
  NODE_ENV=production
  ```
- [ ] Verify all required environment variables are set
- [ ] Check database credentials match between `.env` and `docker-compose.yml`

### 2. Code Quality
- [ ] All changes committed to git
- [ ] No uncommitted files (run `git status`)
- [ ] Remove debug console.logs
- [ ] No sensitive data in code

### 3. Dependencies
- [ ] `package.json` includes all new packages
- [ ] `package-lock.json` is up to date
- [ ] Run `npm install` locally to verify no errors

---

## 🚀 Deployment Process

### Step 1: Create Clean Backup

**IMPORTANT:** Exclude Mac/Dropbox metadata files!

```bash
tar -czf filterfive-deploy-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.tar*' \
  --exclude='._*' \
  --exclude='.DS_Store' \
  .
```

**Why exclude these?**
- `._*` = macOS metadata files (cause migration errors)
- `.DS_Store` = Mac folder settings
- `node_modules` = Rebuilt on server
- `.git` = Not needed in production

### Step 2: Upload to VPS

```bash
scp filterfive-deploy-*.tar.gz root@31.97.215.238:/root/
```

**VPS IP:** `31.97.215.238` (filterfive.io)

### Step 3: Extract and Deploy on VPS

```bash
# SSH into VPS
ssh root@31.97.215.238

# Navigate to deployment directory
cd /root

# Backup current production (optional but recommended)
if [ -d FilterFive ]; then
  tar -czf FilterFive-backup-$(date +%Y%m%d-%H%M%S).tar.gz FilterFive
fi

# Extract new code
tar -xzf filterfive-deploy-*.tar.gz -C FilterFive

# Remove any macOS junk files that slipped through
find FilterFive -name "._*" -delete
find FilterFive -name ".DS_Store" -delete

# Navigate to app directory
cd FilterFive
```

### Step 4: Rebuild Docker Containers

**CRITICAL: When to use `restart` vs `down/up`**

**For code-only changes (no .env or package.json changes):**
```bash
docker compose restart app
```

**For .env changes (environment variables):**
```bash
docker compose down  # MUST stop containers to reload .env
docker compose up -d
```
⚠️ **WARNING:** `docker compose restart` does NOT reload environment variables from `.env`!
Docker containers cache env vars at startup. You MUST use `down` then `up` to reload them.

**For package.json changes or major updates:**
```bash
docker compose down
docker builder prune -af  # Clear build cache
docker compose build --no-cache --pull app
docker compose up -d
```

### Step 5: Verify Deployment

```bash
# Check containers are running
docker compose ps

# Watch logs for errors
docker compose logs -f app

# Look for these success indicators:
# ✓ Database connection established successfully.
# ✓ Server running on port 3000
```

---

## 🗄️ Database Management

### Fresh Database Setup (New deployment or after reset)

```bash
# 1. Create database schema
docker compose exec app npm run db:sync

# 2. Run migrations
docker compose exec app npm run db:migrate

# 3. Seed initial data (optional)
docker compose exec app npm run db:seed

# 4. Create session table (if not exists)
docker compose exec app psql -U postgres -d filterfive -c "
CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE \"default\",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
"
```

### Reset Database (DANGER: Deletes all data!)

```bash
# Stop containers
docker compose down

# Remove database volume
docker volume rm filterfive_postgres_data

# Start fresh
docker compose up -d

# Run setup steps above
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module 'X'"
**Cause:** New package added but not installed in Docker
**Solution:** Rebuild container with `--no-cache`
```bash
docker compose build --no-cache app
docker compose up -d app
```

### Issue 2: "relation 'users' does not exist"
**Cause:** Database not initialized
**Solution:** Run database setup sequence
```bash
docker compose exec app npm run db:sync
docker compose exec app npm run db:migrate
```

### Issue 3: Verification emails point to localhost
**Cause:** `.env` has `APP_URL=http://localhost:3000`
**Solution:** Update `.env` before deployment
```bash
# In your local .env file
APP_URL=https://filterfive.io
```
Then recreate tar and redeploy.

### Issue 4: Migration fails with "._001-migration.js"
**Cause:** macOS metadata files included in tar
**Solution:** Delete them and use proper exclude flags
```bash
# On VPS
find src/migrations/ -name "._*" -delete

# On Mac (for next deploy)
tar -czf ... --exclude='._*' .
```

### Issue 5: Database password authentication failed
**Cause:** Database volume has old password
**Solution:** Remove volume and recreate
```bash
docker compose down
docker volume rm filterfive_postgres_data
docker compose up -d
```

### Issue 6: 502 Bad Gateway
**Causes & Solutions:**
1. App crashed on startup → Check logs: `docker compose logs app`
2. Wrong Nginx port → Should be `proxy_pass http://localhost:3000`
3. Environment variables missing → Check `.env` file

### Issue 7: Rate limiter IPv6 error (non-blocking)
**Symptom:** Error appears but app runs fine
**Impact:** Warning only, doesn't affect functionality
**Solution:** Can be ignored or fix with proper IPv6 handling (low priority)

### Issue 8: Stripe checkout fails with "No such price" error
**Symptom:** Subscription buttons return 500 error, logs show "No such price: 'price_xxx'; a similar object exists in test mode, but a live mode key was used"
**Cause:** Using test mode Stripe price IDs with live mode API keys
**Solution:**
1. Verify you're using LIVE mode price IDs (start with `price_` from live Stripe dashboard)
2. If prices don't exist in live mode, create them using the Stripe API or dashboard
3. Update `.env` with correct live mode price IDs
4. **CRITICAL:** Run `docker compose down` then `docker compose up -d` (restart won't work!)

**How to verify Stripe mode:**
```bash
# Check your API key in .env
grep STRIPE_SECRET_KEY .env

# Live mode: sk_live_...
# Test mode: sk_test_...

# Verify price IDs exist in Stripe dashboard under Products > Prices
```

### Issue 9: Environment variables not updating after deployment
**Symptom:** Changed `.env` file, restarted Docker, but app still uses old values
**Cause:** Docker containers cache environment variables at startup
**Solution:**
```bash
# This WON'T reload .env:
docker compose restart app  # ❌ Keeps cached env vars

# This WILL reload .env:
docker compose down         # ✅ Destroys containers
docker compose up -d        # ✅ Creates fresh containers with new env vars
```

**Debugging tip:**
```bash
# Check what env vars the running container has:
docker compose exec app printenv | grep STRIPE_PRICE

# Compare to your .env file:
grep STRIPE_PRICE .env

# If they don't match, you need down/up not restart!
```

---

## 📝 Post-Deployment Verification

### 1. Test Core Functionality
- [ ] Visit https://filterfive.io (should load)
- [ ] Sign up with new account
- [ ] Check email arrives (with correct URL)
- [ ] Click verification link (should work)
- [ ] Log in successfully
- [ ] Access dashboard

### 2. Monitor Logs
```bash
# Watch for errors
docker compose logs -f app

# Check for success messages:
# ✓ Database connection established
# ✓ Server running on port 3000
```

### 3. Check Database
```bash
# Verify tables exist
docker compose exec app psql -U postgres -d filterfive -c "\dt"

# Should see: users, businesses, customers, feedback, session, etc.
```

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ **DO:** Use production URLs in production `.env`
- ❌ **DON'T:** Commit `.env` to git
- ✅ **DO:** Keep separate `.env.local` for development
- ✅ **DO:** Document required env vars in README

### Backup Strategy
- Before each deployment: Backup current production
- Before database changes: Backup database volume
- Keep at least 3 recent backups

### Access Control
- Use SSH keys instead of passwords
- Restrict SSH access by IP if possible
- Keep VPS packages updated

---

## 🚨 Emergency Rollback

If deployment fails:

```bash
# Stop broken deployment
docker compose down

# Restore from backup
cd /root
tar -xzf FilterFive-backup-TIMESTAMP.tar.gz -C FilterFive-restore
mv FilterFive FilterFive-broken
mv FilterFive-restore FilterFive

# Restart
cd FilterFive
docker compose up -d
```

---

## 📊 Deployment Log Template

Document each deployment:

```
Date: YYYY-MM-DD HH:MM
Deployer: [Your Name]
Changes:
  - [List key changes]
  - [New features]
  - [Bug fixes]

Issues Encountered:
  - [Any problems]
  - [How resolved]

Rollback Plan:
  - Backup: FilterFive-backup-TIMESTAMP.tar.gz
  - Database: filterfive_postgres_data volume backed up

Status: ✅ Success / ❌ Failed / ⚠️ Partial
```

---

## 🎯 Quick Reference Commands

### VPS Access
```bash
ssh root@31.97.215.238
```

### Container Management
```bash
docker compose ps                    # List containers
docker compose logs -f app           # Follow logs
docker compose restart app           # Restart app only
docker compose down                  # Stop all
docker compose up -d                 # Start all
```

### Database Commands
```bash
docker compose exec app npm run db:sync      # Create tables
docker compose exec app npm run db:migrate   # Run migrations
docker compose exec app npm run db:seed      # Seed data
```

### Debugging
```bash
docker compose exec app sh           # Enter container
docker compose logs --tail=100 app   # Last 100 log lines
docker volume ls                     # List volumes
docker ps -a                         # All containers
```

---

## 📚 Related Documentation

- [docs/PROJECT.md](PROJECT.md) - Full project documentation
- [docs/TESTING-COMPLETE.md](TESTING-COMPLETE.md) - Test results
- [docs/archive/deployment/QUICK_DEPLOY.md](archive/deployment/QUICK_DEPLOY.md) - Original deploy guide

---

## 💡 Lessons Learned from Nov 29, 2025 Deployment

1. **macOS metadata files break migrations** → Always use `--exclude='._*'`
2. **Environment variables must be production-ready** → Check `.env` before every deploy
3. **Docker caches package.json** → Use `--no-cache` when dependencies change
4. **Database volumes persist across restarts** → Must explicitly remove to reset passwords
5. **Session table must be created** → Not auto-created by Sequelize
6. **Rate limiter warnings are non-blocking** → Don't panic if you see them
7. **Verification emails use APP_URL** → Must be set correctly or users get localhost links

## 🔥 Critical Lessons from Stripe Checkout Debugging (Nov 29, 2025)

### The Problem
Subscription checkout failed with "No such price" error despite multiple deployment attempts.

### Root Causes (Three-Layer Issue)
1. **JavaScript Bug**: Missing `event` parameter in checkout function prevented requests from reaching server
2. **Stripe Test/Live Mode Mismatch**: Using live mode API keys (`sk_live_`) with test mode price IDs
3. **Docker Environment Variable Caching**: `docker compose restart` does NOT reload `.env` changes

### Key Insights

#### 1. Stripe Test vs Live Mode
- Stripe products and prices created in TEST mode don't exist in LIVE mode (separate databases)
- Price IDs from Stripe dashboard CSV export may still be test mode if you're viewing test mode
- **Always verify**: Check that your price IDs exist in the SAME mode as your API keys
- If prices don't exist in live mode, you must CREATE them in live mode (not just copy IDs)

#### 2. Docker Environment Variable Behavior
**The most time-consuming issue:**
- Docker containers load `.env` variables at **creation time**, not restart time
- `docker compose restart app` = Restarts Node.js process with **cached env vars**
- `docker compose down && docker compose up -d` = Creates **fresh containers** with new env vars

**When to use each:**
- Code changes only → `restart` is fine
- `.env` changes → **MUST use** `down` then `up`
- `package.json` changes → `down` + rebuild + `up`

#### 3. Debugging Checklist for Environment Issues
```bash
# 1. Check what the container is actually using
docker compose exec app printenv | grep STRIPE

# 2. Check what the .env file says
grep STRIPE .env

# 3. If they don't match → down/up, not restart!
docker compose down
docker compose up -d
```

#### 4. Stripe Integration Verification Steps
Before deploying Stripe changes:
1. Verify API keys match the mode (test vs live)
2. Verify price IDs exist in the SAME mode as your keys
3. Test locally if possible
4. After deployment, use `down/up` if env vars changed
5. Check logs for Stripe-specific errors (they're usually very clear)

### Time Savers
- **Enhanced error logging** in stripeService.js caught the exact price ID causing issues
- **Direct SSH to production** let us see real-time logs during debugging
- **Creating setup script** (setup-stripe-live.js) to programmatically create products/prices
- **Verification commands** to compare container env vs .env file

### Prevention
- Document which Stripe mode (test/live) you're using in `.env` comments
- Keep a script to create/verify Stripe products in the repo
- Add deployment step to explicitly verify env var changes take effect
- Never assume `restart` will reload everything

---

**Last Successful Deployment:** November 29, 2025
**Status:** ✅ Production Live
**Deployed By:** Claude Code + User
