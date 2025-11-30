# FilterFive - AI Agent Onboarding Guide

**Version:** 2.0.0 (Milestone 3 In Progress)
**Last Updated:** November 29, 2025
**Status:** Production Live + Analytics Development

---

## Quick Start for AI Agents

**Read this first, then explore specific docs as needed.**

### 1. What is FilterFive?

FilterFive is a B2B SaaS reputation management platform that intelligently intercepts customer feedback BEFORE it goes public:
- **4-5 star reviews** → Directed to Google/Facebook (public)
- **1-3 star reviews** → Captured privately for resolution (internal)

### 2. How It Works

**Two Feedback Collection Methods:**

1. **SMS Flow:** Business → Zapier → FilterFive DB → SMS to Customer → Rating → Smart Filter
2. **QR Code Flow:** Customer Scans QR → Anonymous Rating → Smart Filter (no phone required)

### 3. Current Status

**✅ Live in Production:**
- User authentication & email verification
- 14-day trial (10 SMS free)
- Stripe subscriptions ($77/month or $770/year)
- SMS feedback requests (Twilio)
- QR code generation & scanning
- Smart review filtering
- Email alerts for negative feedback
- Multi-tenant dashboard

**🚧 In Development (Milestone 3 - 70% Complete):**
- Analytics dashboard with ROI calculator
- Performance trend charts
- Location-based analytics
- Timing heatmaps
- SMS event tracking

---

## Tech Stack

### Core Technologies
- **Backend:** Node.js 18, Express.js 4.18
- **Database:** PostgreSQL 15 (Sequelize ORM)
- **Views:** EJS templates (server-side rendering)
- **Containers:** Docker + Docker Compose

### External Services
- **SMS:** Twilio Messaging Service (A2P 10DLC)
- **Email:** Resend API
- **Payments:** Stripe Checkout + Webhooks
- **Automation:** Zapier webhooks

### Infrastructure
- **Hosting:** Hostinger VPS (Ubuntu 22.04)
- **Web Server:** Nginx reverse proxy
- **SSL:** Let's Encrypt (auto-renewal)
- **Backups:** Daily automated (Google Drive)

---

## Database Schema (Key Tables)

### users
```sql
-- Core tenant accounts
id, email, password (bcrypt), business_name, role (tenant|super_admin)

-- Subscription fields
subscription_status (trial|active|past_due|cancelled)
subscription_plan (monthly|annual)
stripe_customer_id, stripe_subscription_id
trial_starts_at, trial_ends_at

-- SMS limits
sms_usage_count (current period)
sms_usage_limit (10 trial, 1000 paid)

-- Settings
google_review_link, facebook_link
analytics_enabled (feature flag)
```

### feedback_requests
```sql
-- Each SMS or QR scan
id, uuid (public link ID), user_id
customer_name, customer_phone (nullable for QR)
delivery_method (sms|qr)
status (pending|sent|clicked|rated)
location (for multi-location businesses)
ip_address (QR rate limiting)
created_at, clicked_at
```

### reviews
```sql
-- Customer ratings
id, feedback_request_id, user_id
rating (1-5)
comment (text)
is_filtered (true if 1-3 stars)
redirected_to (google|facebook|thank_you)
created_at
```

### analytics_snapshots (NEW - Milestone 3)
```sql
-- Pre-calculated daily metrics
user_id, snapshot_date, location
requests_sent, requests_clicked, requests_rated
reviews_positive, reviews_negative
average_rating, click_rate, conversion_rate
```

---

## Project Structure

```
filterfive/
├── app.js                          # Express app entry
├── docker-compose.yml              # Dev environment
├── package.json                    # Dependencies
│
├── src/
│   ├── controllers/                # Request handlers
│   │   ├── authController.js       # Signup, login, verification
│   │   ├── dashboardController.js  # Tenant dashboard
│   │   ├── subscriptionController.js  # Stripe integration
│   │   ├── qrController.js         # QR scan handling
│   │   ├── feedbackController.js   # Public review pages
│   │   └── analyticsController.js  # Analytics (Milestone 3)
│   │
│   ├── models/                     # Sequelize models
│   │   ├── User.js
│   │   ├── FeedbackRequest.js
│   │   ├── Review.js
│   │   ├── AnalyticsSnapshot.js    # NEW
│   │   └── index.js                # Model registration
│   │
│   ├── services/                   # Business logic
│   │   ├── stripeService.js        # Stripe API wrapper
│   │   ├── smsService.js           # Twilio SMS
│   │   ├── emailService.js         # Resend emails
│   │   ├── analyticsService.js     # Analytics data
│   │   └── snapshotService.js      # Daily aggregations
│   │
│   ├── routes/                     # Route definitions
│   │   ├── auth.js                 # Authentication
│   │   ├── dashboard.js            # Tenant routes
│   │   ├── subscription.js         # Billing
│   │   ├── webhook.js              # Stripe webhooks
│   │   ├── qr.js                   # QR scanning
│   │   └── analytics.js            # Analytics API
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.js                 # requireAuth
│   │   ├── rateLimiter.js          # Rate limiting
│   │   ├── trialManager.js         # Trial enforcement
│   │   └── qrRateLimiter.js        # QR-specific limits
│   │
│   ├── views/                      # EJS templates
│   │   ├── dashboard/
│   │   │   ├── index.ejs           # Main dashboard
│   │   │   ├── subscription.ejs    # Billing page
│   │   │   ├── qr.ejs              # QR code page
│   │   │   ├── analytics.ejs       # Analytics (NEW)
│   │   │   └── settings.ejs
│   │   ├── auth/
│   │   │   ├── signup.ejs
│   │   │   ├── login.ejs
│   │   │   └── verify-*.ejs
│   │   └── feedback/
│   │       ├── review.ejs          # Public rating page
│   │       └── thankyou.ejs
│   │
│   ├── migrations/                 # Database migrations
│   ├── cron/                       # Scheduled jobs
│   │   └── daily-snapshots.js      # Analytics aggregation
│   └── utils/                      # Helper functions
│       └── roiCalculator.js        # ROI metrics
│
└── docs/                           # Project documentation
    └── PROJECT.md                  # This file
```

---

## Key Workflows

### 1. New User Signup
```
User → /signup form → Create account
  ↓
Stripe customer created automatically
  ↓
Verification email sent (Resend)
  ↓
User clicks email link → Account verified → Auto-login
  ↓
Trial starts (14 days, 10 SMS)
```

### 2. Subscription Purchase
```
User → /dashboard/subscription → Choose plan
  ↓
Stripe Checkout Session created
  ↓
User enters payment → Stripe processes
  ↓
Webhook: checkout.session.completed
  ↓
Subscription activated
SMS limit: 10 → 1,000
  ↓
Success page + confirmation email
```

### 3. SMS Feedback Flow
```
Zapier → POST /api/v1/hooks/feedback-request/:userId
  ↓
FeedbackRequest created (UUID generated)
  ↓
SMS sent via Twilio: "Rate us: filterfive.io/review/{UUID}"
  ↓
Customer clicks → /review/:uuid
  ↓
Selects 1-5 stars
  ↓
IF rating >= 4:
  → Redirect to Google/Facebook
ELSE (1-3 stars):
  → Show feedback form
  → Email alert to tenant
  → Thank you page
```

### 4. QR Code Flow
```
Tenant → /dashboard/qr → Download QR code
  ↓
Print QR at checkout/table
  ↓
Customer scans → /r/:businessId (rate limited by IP)
  ↓
FeedbackRequest created (no phone)
  ↓
Redirect to /review/:uuid
  ↓
Same rating logic as SMS flow
```

---

## Environment Variables (Required)

```bash
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://filterfive.io
SESSION_SECRET=<64-char-random>

# Database
DB_HOST=db
DB_NAME=filterfive_prod
DB_USER=filterfive_prod_user
DB_PASSWORD=<secure-password>

# Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...  # $77/month
STRIPE_PRICE_ANNUAL=price_...   # $770/year

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...  # Required for A2P 10DLC

# Resend (Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=info@filterfive.io  # Verified domain

# Feature Flags
ENABLE_CRON=true  # Analytics daily snapshots
```

---

## Important Rules (DO NOT BREAK)

### Security
1. **Never expose database IDs** in public URLs → Use UUIDs
2. **Always use bcrypt** for password hashing (10+ rounds)
3. **Webhook signature verification** required for Stripe webhooks
4. **Rate limiting** on QR scans (30 sec/IP) and authentication endpoints

### Architecture
5. **UUID for review links** → `/review/:uuid` (NOT `/review/:id`)
6. **Multi-tenant isolation** → All queries filtered by `user_id`
7. **Sequelize only** → No raw SQL except migrations
8. **EJS templates** → Server-side rendering (no React/Vue)

### Business Logic
9. **The 4/5 Rule** → 4-5 stars public, 1-3 stars private
10. **Trial enforcement** → 10 SMS trial, 1000 SMS paid
11. **Stripe webhooks critical** → Subscription updates MUST come from webhooks
12. **SMS limits enforced** → Block sending if limit exceeded

### Deployment
13. **Docker Compose everywhere** → Dev and production
14. **HTTPS required** in production
15. **Daily backups mandatory** → Automated to Google Drive
16. **Migrations before deploy** → `docker exec app npm run db:migrate`

---

## Common Tasks

### Enable Analytics for a User
```sql
UPDATE users SET analytics_enabled = true WHERE id = 1;
```

### Check Subscription Status
```sql
SELECT id, email, subscription_status, subscription_plan, sms_usage_count, sms_usage_limit
FROM users WHERE id = 1;
```

### Manually Generate Daily Snapshots
```bash
curl -X POST http://localhost:3000/api/analytics/admin/generate-snapshots \
  -H "Cookie: connect.sid=<session>" \
  -H "Content-Type: application/json"
```

### View Application Logs
```bash
docker-compose logs app --tail=100 -f
```

### Run Database Migrations
```bash
docker-compose exec app npm run db:migrate
```

### Restart Application
```bash
docker-compose restart app
```

---

## API Endpoints (Key Routes)

### Public Routes
- `GET /` → Landing page
- `GET /signup` → Signup form
- `GET /review/:uuid` → Public feedback page
- `GET /r/:businessId` → QR code entry point
- `POST /webhooks/stripe` → Stripe webhook (raw body)

### Authenticated Routes (requires login)
- `GET /dashboard` → Main tenant dashboard
- `GET /dashboard/subscription` → Billing management
- `GET /dashboard/qr` → QR code download
- `GET /dashboard/analytics` → Analytics dashboard (if enabled)
- `GET /dashboard/settings` → Business settings

### API Routes (JSON responses)
- `POST /api/v1/hooks/feedback-request/:userId` → Zapier webhook
- `GET /api/analytics/metrics` → Dashboard metrics
- `GET /api/analytics/trends` → Sparkline data
- `POST /dashboard/subscription/checkout` → Create Stripe session

---

## Milestone Status

### ✅ Milestone 1: Authentication & Registration (Complete)
- Email verification
- Password reset
- Trial period management (14 days)
- Session-based authentication

### ✅ Milestone 2: Stripe Integration (Complete)
- Monthly ($77) and Annual ($770) plans
- Stripe Checkout integration
- Webhook event handling
- Customer billing portal
- Subscription lifecycle management

### 🚧 Milestone 3: Analytics Dashboard (80% Complete)
**Completed:**
- Database schema (analytics_snapshots, timing_performance, sms_events)
- Backend services (analyticsService, snapshotService, roiCalculator)
- API endpoints (8 endpoints)
- Daily snapshot cron job
- Analytics dashboard view with ROI calculator
- KPI cards with sparkline charts
- Date range filters (7d, 30d, 90d)
- Location-based filtering
- **Timing heatmap visualization (7x24 grid)** ✅ NEW

**Remaining:**
- Period comparison widget
- SMS event metrics display
- Custom date range picker
- Export to CSV/PDF
- Real-time alerts configuration

### ✅ Milestone 4: CSV Upload Feature (Complete)
- CSV file upload with validation
- Phone number format validation (E.164)
- Duplicate detection within upload and against existing data
- Preview interface with row selection
- Batch SMS sending with rate limiting (5 SMS/sec)
- Upload history tracking (CsvUpload model)
- Success/failure reporting per row
- Retry failed sends individually
- SMS usage limit enforcement

---

## Testing

### Run Analytics Tests
```bash
docker-compose exec app node test-analytics-api.js
```

### Test Stripe Integration
```bash
# Use test card: 4242 4242 4242 4242
# Visit: http://localhost:3000/dashboard/subscription
```

### Test QR Flow
```bash
# 1. Login as tenant
# 2. Visit: /dashboard/qr
# 3. Copy QR URL
# 4. Open in incognito: /r/<businessId>
# 5. Rate experience
```

---

## Troubleshooting

### Webhook Signature Fails
- Ensure webhook route uses `express.raw()` middleware
- Route MUST be registered BEFORE `express.json()` in app.js

### SMS Not Sending
- Check `TWILIO_MESSAGING_SERVICE_SID` is set
- Verify phone number is E.164 format (+1234567890)
- Check SMS usage hasn't exceeded limit

### Analytics Not Loading
- Verify `analytics_enabled = true` for user
- Run snapshot generation: `POST /api/analytics/admin/generate-snapshots`
- Check if data exists: `SELECT * FROM analytics_snapshots WHERE user_id = 1;`

### Session Not Persisting
- Production needs `NODE_ENV=production` and HTTPS
- Or temporarily use `NODE_ENV=development` for testing

---

## Production Deployment

### Quick Deploy
```bash
# 1. SSH to VPS
ssh root@31.97.215.238

# 2. Pull latest code
cd /root/FilterFive
git pull origin main

# 3. Rebuild containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# 5. Verify
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs app --tail=50
```

---

## External Resources

### Dashboards
- **Stripe:** https://dashboard.stripe.com
- **Twilio:** https://console.twilio.com
- **Resend:** https://resend.com/dashboard
- **GitHub:** https://github.com/kreaktive/FilterFive.io

### Production
- **Live App:** https://filterfive.io
- **Admin Panel:** https://filterfive.io/admin
- **Server IP:** 31.97.215.238

---

## Key Contacts

**Business Owner:** Kristian Pascual
**GitHub Repo:** kreaktive/FilterFive.io
**Production Server:** Hostinger VPS (31.97.215.238)

---

## Next Steps for AI Agents

1. **For New Features:**
   - Read this file first
   - Check relevant controller in `src/controllers/`
   - Review database schema in `src/models/`
   - Follow existing patterns (don't reinvent)

2. **For Bug Fixes:**
   - Check logs: `docker-compose logs app`
   - Review related service in `src/services/`
   - Test locally before production

3. **For Database Changes:**
   - Create migration in `src/migrations/`
   - Update Sequelize model
   - Test migration rollback
   - Document in this file

4. **For API Changes:**
   - Update controller
   - Update routes
   - Test authentication
   - Document endpoints

---

**Last Updated:** November 29, 2025
**Version:** 2.0.0
**Status:** Production Live + Analytics Development (70% Complete)

**For more details, see:**
- Current milestone status: [docs/archive/milestones/](docs/archive/milestones/)
- Deployment guides: [docs/archive/deployment/](docs/archive/deployment/)
- API reference: [docs/API-SUBSCRIPTION-ENDPOINTS.md](docs/API-SUBSCRIPTION-ENDPOINTS.md)
