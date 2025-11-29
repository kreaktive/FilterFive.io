# Quick Deploy to Production - TL;DR

## 🚀 Fast Track Deployment (5 Steps)

### Step 1: Commit & Push to GitHub (Local)

```bash
cd "/Users/kk/Dropbox/KREAKTIVE LLC/DMS Kreaktive/Production/FilterFive/251128 FilterFive.io MVP V2"

# Add all files
git add -A

# Commit
git commit -m "feat: Add self-service signup with email verification

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push
git push origin main
```

---

### Step 2: SSH to Server

```bash
ssh root@31.97.215.238
```

---

### Step 3: Update Code & Environment

```bash
# Navigate to app directory (find it first if needed)
cd /path/to/filterfive

# Pull latest code
git pull origin main

# Add new environment variables
nano .env.production
```

**Add these lines:**
```bash
APP_URL=https://filterfive.io
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

**Get keys from:** https://www.google.com/recaptcha/admin

---

### Step 4: Deploy

```bash
# Stop, rebuild, start
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Update database
docker-compose -f docker-compose.prod.yml run --rm app npm run db:sync

# Mark existing users as verified
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d filterfive -c "UPDATE users SET is_verified = true WHERE is_verified = false;"
```

---

### Step 5: Test

Visit:
- ✅ https://filterfive.io/signup
- ✅ https://filterfive.io/dashboard/login

Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

---

## ⚠️ Important

1. **Get reCAPTCHA keys** before deploying (test keys won't work in production)
2. **Existing users** will still be able to login (they're marked as verified)
3. **Backups** - Database is automatically modified, no backup needed (safe changes)

---

## 🆘 If Something Goes Wrong

```bash
# Restart everything
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

---

**Full guide:** See `DEPLOY_TO_PRODUCTION.md` for detailed instructions
