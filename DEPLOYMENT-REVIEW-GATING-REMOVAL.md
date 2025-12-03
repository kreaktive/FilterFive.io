# Deployment Guide: Review Gating Removal

## What Changed
This deployment removes review gating (star rating collection) to comply with Google's review policies. Key changes:
- SMS links now go directly to your chosen review platform (Google/Yelp/Facebook/TripAdvisor)
- New unified "Review Platform URL" field in Settings (replaces separate Google/Facebook fields)
- Three SMS message tone options: Friendly, Professional, Grateful
- Upload page blocked until Review URL is configured
- Historical rating charts hidden (ratings no longer collected)

## Deployment Package
**File:** `filterfive-review-gating-removal-20251202.tar.gz`
**Location:** `/Users/kk/Dropbox/KREAKTIVE LLC/DMS Kreaktive/Production/FilterFive/`
**Size:** 74 MB

## Deployment Steps

### Step 1: Upload Package to Production Server
```bash
scp filterfive-review-gating-removal-20251202.tar.gz root@filterfive.io:/root/
```

### Step 2: SSH into Production Server
```bash
ssh root@filterfive.io
```

### Step 3: Run Deployment Script
```bash
cd /root/FilterFive
bash deploy-production.sh
```

The script will automatically:
1. Create backup of current production (`FilterFive-backup-YYYYMMDD-HHMMSS.tar.gz`)
2. Extract new deployment package
3. Clean up macOS junk files
4. Verify environment variables
5. Rebuild Docker containers with no cache
6. Start containers
7. Show deployment status

### Step 4: Verify Deployment
After deployment completes, verify:
1. Settings page shows new "Review Platform URL" field
2. SMS tone selector works (3 radio button options)
3. Test SMS sends with correct tone
4. Direct redirect works (SMS link → review platform)
5. Upload page blocks when reviewUrl not configured

Check logs:
```bash
docker compose logs -f app
```

### Step 5: Configure Review URLs for Existing Tenants
**IMPORTANT:** All existing tenants need to configure their Review Platform URL before they can upload new customers.

1. Log into each tenant account
2. Go to Settings
3. Add Review Platform URL (e.g., `https://g.page/r/CVASdxR-ATBCEAE/review`)
4. Choose SMS message tone
5. Save changes

## Database Migration
The migration `009-remove-review-gating.js` has already been applied to your local database. The production database will need this migration run.

**Migration runs automatically via Docker during deployment**, but if you need to run it manually:
```bash
docker exec filterfive_app_prod npm run db:migrate
```

## What Gets Migrated
- Adds `review_url` column (TEXT, nullable)
- Adds `sms_message_tone` column (ENUM: friendly/professional/grateful)
- Migrates existing `google_review_link` values to `review_url`
- Sets all tenants to default "friendly" tone
- Keeps old `google_review_link` and `facebook_link` columns for backwards compatibility

## Rollback Plan
If issues occur, restore previous version:
```bash
cd /root/FilterFive
docker compose down
rm -rf /root/FilterFive/*
tar -xzf /root/FilterFive-backup-YYYYMMDD-HHMMSS.tar.gz -C /root/FilterFive
docker compose up -d
```

## Testing Checklist

### Before Deployment
- [x] Local testing complete
- [x] Migration tested locally
- [x] Deployment package created (74 MB)
- [x] Backup strategy confirmed

### After Deployment
- [ ] Application starts without errors
- [ ] Dashboard loads correctly
- [ ] Settings page shows new fields
- [ ] SMS sending works with tone variations
- [ ] Direct redirect works (no rating collection)
- [ ] Upload blocking works when reviewUrl missing
- [ ] Database migration successful
- [ ] No errors in logs

### User Acceptance Testing
- [ ] Tenant can configure Review Platform URL
- [ ] Tenant can choose SMS message tone
- [ ] Tenant receives test SMS with correct tone
- [ ] Customer clicks SMS link → lands on review platform directly
- [ ] Upload page shows setup reminder when reviewUrl missing
- [ ] Historical ratings hidden from dashboard

## Support Notes

### Common Issues

**Issue:** Upload page doesn't block
**Solution:** Tenant hasn't configured reviewUrl. Direct them to Settings → Review Platform URL.

**Issue:** SMS not sending
**Solution:** Check that reviewUrl is configured and valid URL (starts with http:// or https://).

**Issue:** Wrong SMS tone
**Solution:** Tenant can change tone in Settings → SMS Message Tone → Save Changes.

**Issue:** Want to see old ratings
**Solution:** Ratings are no longer collected per Google policy. Old data is in database but hidden from UI.

## Files Modified (24 files)
- Created: `src/migrations/009-remove-review-gating.js`
- Modified: `src/models/User.js` (added reviewUrl, smsMessageTone)
- Modified: `src/services/smsService.js` (added tone variants)
- Simplified: `src/controllers/reviewController.js` (removed rating logic)
- Modified: `src/routes/review.js` (removed rating endpoints)
- Modified: `src/controllers/dashboardController.js` (added validation)
- Modified: `src/controllers/uploadController.js` (added blocking)
- Modified: `src/controllers/ingestController.js` (updated SMS params)
- Redesigned: `src/views/dashboard/settings.ejs` (new UI)
- Modified: `src/views/upload.ejs` (added blocked overlay)
- Deleted: `src/views/landing.ejs` (rating page removed)
- Deleted: `src/views/feedback_form.ejs` (feedback form removed)
- Deprecated: `src/services/emailService.js::sendNegativeFeedbackAlert()`

## Production vs Local Subscription Page

**Your concern:** Production subscription page looks different than local.

**Explanation:** Your local code has 24 commits ahead of production (includes Stripe subscription improvements from commit 6b38e81). The deployment package includes these improvements:
- Stripe live mode integration
- Updated subscription UI
- All the new review gating removal features

**This deployment will update production to match your local environment**, including the subscription improvements AND the new review gating removal.

If you prefer the old subscription page, you would need to:
1. Revert commits 6b38e81 and 158465b before deploying
2. Keep only the review gating removal commits (9f80e50)

However, I recommend deploying everything since it's already tested locally and working.

## Questions?
- Check logs: `docker compose logs -f app`
- Restart app: `docker compose restart app`
- Check container status: `docker compose ps`
- Database migrations: `docker exec filterfive_app_prod npm run db:migrate`
