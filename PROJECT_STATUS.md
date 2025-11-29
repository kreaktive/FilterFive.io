# FilterFive Project Status

> **Last Updated:** January 28, 2025
> **Current Phase:** MVP v1.0.0 - Production Deployed ✅
> **Status:** 🟢 Live and Operational

---

## 📊 Project Overview

**FilterFive** is a B2B SaaS reputation management platform that intelligently filters customer feedback via SMS, directing positive reviews (4-5 stars) to public platforms while privately capturing negative feedback (1-3 stars) for internal resolution.

**Live URL:** https://filterfive.io
**Repository:** https://github.com/kreaktive/FilterFive.io
**Production Server:** 31.97.215.238 (Ubuntu 22.04)

---

## ✅ Completed Work

### Phase 1: Core Development (Localhost) ✅

#### Database & Models
- [x] PostgreSQL 15 database with Sequelize ORM
- [x] User model (multi-tenant + super admin roles)
- [x] FeedbackRequest model (UUID-based links)
- [x] Review model (ratings 1-5, public/private flag)
- [x] Model relationships and associations
- [x] Password hashing with bcryptjs hooks
- [x] Database migration scripts

#### Authentication & Authorization
- [x] Registration system for tenants
- [x] Login/logout with express-session
- [x] Session-based authentication middleware
- [x] Super admin role-based access control
- [x] Protected routes (/dashboard/*, /admin/*)

#### Core Features - Ingestion Engine
- [x] Zapier webhook endpoint (`/api/zapier/ingest`)
- [x] API secret authentication (X-API-Secret header)
- [x] Customer contact validation (name, phone, email)
- [x] FeedbackRequest creation with UUID
- [x] Automatic SMS triggering

#### Core Features - SMS Delivery
- [x] Twilio integration (SMS service)
- [x] A2P 10DLC compliance (Messaging Service support)
- [x] Dynamic SMS templates with review link
- [x] SMS status tracking (sent_at, clicked_at, message_sid)
- [x] Phone number validation (E.164 format)

#### Core Features - Review Capture
- [x] Public review form (`/review/:uuid`)
- [x] UUID validation and security
- [x] Star rating interface (1-5 stars)
- [x] Optional comment field
- [x] Smart filtering logic:
  - 4-5 stars → Redirect to Google/Facebook
  - 1-3 stars → Thank you page (private)
- [x] Review persistence to database

#### Core Features - Email Alerts
- [x] Resend integration (transactional email)
- [x] Negative feedback alert template
- [x] Automatic email on 1-3 star reviews
- [x] Email tracking (emailSentAt timestamp)
- [x] Domain verification (filterfive.io)

#### Tenant Dashboard
- [x] Statistics overview (total requests, reviews, response rate)
- [x] Recent feedback requests table
- [x] Recent reviews table
- [x] Settings page (business details, review links)
- [x] EJS templating with partials (header, footer)

#### Super Admin Interface
- [x] Admin dashboard (`/admin`)
- [x] Tenant list view (all users)
- [x] Create new tenant form
- [x] Manual tenant onboarding (pre-Stripe)
- [x] Super admin middleware protection
- [x] Script to promote user to super_admin role

#### Docker & Development Environment
- [x] Docker Compose configuration (development)
- [x] PostgreSQL container with persistent volume
- [x] Node.js 18 application container
- [x] Hot-reload with nodemon
- [x] Environment variable management (.env)
- [x] Restart policies for production

---

### Phase 2: Production Deployment ✅

#### Pre-Deployment Preparation
- [x] Production Dockerfile (`Dockerfile.production`)
- [x] Production Docker Compose (`docker-compose.prod.yml`)
- [x] Health checks for containers
- [x] Log rotation configuration
- [x] `.dockerignore` optimization
- [x] Code sanitization (removed all secrets)
- [x] `.gitignore` verification

#### VPS Setup
- [x] VPS provisioned (Hostinger - Ubuntu 22.04)
- [x] Docker installation on VPS
- [x] Docker Compose installation
- [x] Git installation
- [x] Repository cloning from GitHub
- [x] `.env.production` configuration
- [x] Container deployment
- [x] Database migrations on production

#### Domain & DNS
- [x] Domain purchased: filterfive.io
- [x] DNS A records configured (@ and www)
- [x] DNS propagation verified
- [x] Old WordPress site removal (Hostinger conflict)

#### SSL & Web Server
- [x] Nginx installation and configuration
- [x] Reverse proxy setup (port 3000 → 80/443)
- [x] Let's Encrypt SSL certificate installation
- [x] HTTPS enforcement (HTTP → HTTPS redirect)
- [x] SSL auto-renewal via certbot timer
- [x] Nginx config optimization

#### Backup System
- [x] Automated daily backup script (`/root/backup-filterfive.sh`)
- [x] Cron job scheduled (2 AM UTC daily)
- [x] Local backup storage (7-day retention)
- [x] Google Drive integration (rclone)
- [x] Backup compression (gzip)
- [x] Backup verification and logging

#### Marketing & Public Facing
- [x] Marketing landing page (`landing_marketing.ejs`)
- [x] Professional homepage at root route
- [x] Feature cards (6 key features)
- [x] Responsive design
- [x] Login button in navbar

---

### Phase 3: Documentation & Operations ✅

#### Technical Documentation
- [x] **AI_CONTEXT.md** (597 lines)
  - Project identity and problem statement
  - Complete tech stack breakdown
  - Database schema documentation
  - Data flow diagrams (4 flows)
  - Application architecture
  - Environment configuration guide
  - Project rules and constraints
  - Limitations and roadmap
  - Testing procedures
  - Deployment checklist
  - Backup/restore procedures

- [x] **README.md** (592 lines)
  - Professional GitHub-ready documentation
  - Badge section
  - Feature list with icons
  - Tech stack details
  - Prerequisites and quick start guide
  - Complete project structure tree
  - Database setup instructions
  - Seeding data guide
  - Environment variables table (20 variables)
  - Testing instructions
  - Production deployment guide
  - API documentation (Zapier webhook)
  - Contributing guidelines
  - MIT License
  - Roadmap (v1.0 → v2.0)

- [x] **.env.example** (137 lines)
  - All 17 environment variables documented
  - Descriptions and examples
  - Links to get credentials
  - Security best practices
  - Commands to generate secrets
  - Production deployment checklist

- [x] **DEPLOYMENT.md** (400+ lines)
  - Complete VPS setup guide
  - Docker installation steps
  - Nginx configuration
  - SSL certificate setup
  - Security hardening
  - Firewall configuration
  - Backup system setup
  - Monitoring and logging
  - Troubleshooting guide

- [x] **OPS.md** (600+ lines)
  - Server information reference
  - SSH access commands
  - Deployment procedures (`deploy.sh` usage)
  - Container management commands
  - Log management (live tail, export)
  - Database operations (psql, queries)
  - SSL certificate maintenance
  - Backup and restore procedures
  - Monitoring and health checks
  - Troubleshooting common issues
  - Emergency procedures
  - Quick reference tables

- [x] **deploy.sh** (159 lines)
  - Automated deployment script
  - Environment validation
  - Dependency checks
  - Container orchestration
  - Database migration automation
  - Error handling and rollback
  - Deployment confirmation prompts

#### Testing & Debugging
- [x] Email integration test script (`testEmail.js`)
- [x] Manual test flows documented
- [x] Debug commands in OPS.md
- [x] Troubleshooting guides

---

### Phase 4: Bug Fixes & Optimizations ✅

#### Email Service Issues
- [x] Fixed Resend domain verification (filterfive.com → filterfive.io)
- [x] Fixed email ID extraction (`result.data.id`)
- [x] Added error checking for Resend API responses
- [x] Improved error messages and logging

#### Deployment Issues
- [x] Fixed `package-lock.json` missing in Docker build (`.dockerignore`)
- [x] Fixed database container initialization (`.env` vs `.env.production`)
- [x] Fixed session persistence in production (NODE_ENV)
- [x] Fixed landing page not updating (Docker image rebuild)

#### Git & GitHub Issues
- [x] Fixed GitHub authentication (Personal Access Token)
- [x] Sanitized all credentials before push
- [x] Verified `.gitignore` excludes secrets
- [x] Successfully pushed all code to GitHub

#### SSL & DNS Issues
- [x] Resolved DNS conflict (deleted WordPress site)
- [x] Fixed SSL certificate validation (waited for DNS propagation)
- [x] Configured Nginx correctly for Let's Encrypt

#### Backup System Issues
- [x] Fixed backup script syntax errors (leading spaces)
- [x] Verified rclone Google Drive integration
- [x] Tested manual backup execution
- [x] Confirmed cron job scheduling

---

## 🔄 Current State

### What's Working Right Now

✅ **Application:** Fully deployed and accessible at https://filterfive.io
✅ **Database:** PostgreSQL running with persistent data
✅ **Authentication:** Users can register, login, and manage their accounts
✅ **Super Admin:** Can access `/admin` to manage tenants manually
✅ **Zapier Integration:** Webhook endpoint accepting customer contacts
✅ **SMS Delivery:** Twilio sending review request SMS to customers
✅ **Review Capture:** Customers can submit ratings via unique links
✅ **Smart Filtering:** 4-5 stars → public, 1-3 stars → private (working)
✅ **Email Alerts:** Resend sending negative feedback alerts to tenants
✅ **Dashboard:** Tenants can view feedback requests and reviews
✅ **SSL:** HTTPS working with Let's Encrypt auto-renewal
✅ **Backups:** Daily automated backups to Google Drive
✅ **Documentation:** Complete technical, operational, and user documentation

### Known Limitations (Intentional MVP Scope)

⚠️ **No Stripe Integration** - Payment processing not implemented (v1.1 planned)
⚠️ **No CSV Upload** - Bulk customer import not available (v1.2 planned)
⚠️ **Limited Analytics** - Basic stats only, no advanced reporting (v1.3 planned)
⚠️ **Manual Onboarding** - Super admin must create tenants manually
⚠️ **No Email Templates for Positive Reviews** - Only negative alerts implemented
⚠️ **No SMS Templates Customization** - Fixed SMS message template
⚠️ **No Mobile App** - Web-only interface (v2.0 planned)

---

## 📋 TODO: Next Steps

### Immediate Priority (v1.1 - Stripe Integration)

#### Stripe Account Setup
- [ ] Create Stripe account (production)
- [ ] Verify business details in Stripe dashboard
- [ ] Get production API keys (sk_live_..., pk_live_...)
- [ ] Set up webhook endpoint in Stripe dashboard
- [ ] Configure webhook secret

#### Subscription Products
- [ ] Create product in Stripe: "FilterFive Pro"
- [ ] Create pricing plans:
  - [ ] Monthly: $XX/month
  - [ ] Annual: $XXX/year (discount)
- [ ] Define trial period duration (7, 14, or 30 days)

#### Backend Implementation
- [ ] Install `stripe` npm package
- [ ] Create `src/services/stripeService.js`
  - [ ] `createCustomer(user)` - Create Stripe customer
  - [ ] `createCheckoutSession(user, plan)` - Generate payment link
  - [ ] `cancelSubscription(subscriptionId)` - Cancel subscription
  - [ ] `updateSubscriptionStatus(user, status)` - Sync status
- [ ] Create `src/controllers/stripeController.js`
  - [ ] GET `/billing` - Show subscription status
  - [ ] POST `/billing/subscribe` - Start subscription
  - [ ] POST `/billing/cancel` - Cancel subscription
  - [ ] POST `/api/stripe/webhook` - Handle Stripe events
- [ ] Add Stripe webhook event handlers:
  - [ ] `checkout.session.completed` - Activate subscription
  - [ ] `customer.subscription.updated` - Update status
  - [ ] `customer.subscription.deleted` - Mark as cancelled
  - [ ] `invoice.payment_failed` - Handle failed payment

#### Frontend Implementation
- [ ] Create `src/views/billing.ejs` - Subscription management page
- [ ] Add "Upgrade to Pro" button on dashboard (for trial users)
- [ ] Add "Manage Subscription" link in navbar
- [ ] Show subscription status badge (Trial, Active, Cancelled)
- [ ] Display trial expiration date
- [ ] Add payment method update form
- [ ] Create cancellation confirmation modal

#### User Registration Flow Update
- [ ] Remove super admin manual creation requirement
- [ ] Enable self-service registration at `/register`
- [ ] Automatically create Stripe customer on registration
- [ ] Set `subscriptionStatus = 'trial'` by default
- [ ] Set trial expiration date (e.g., 14 days from registration)
- [ ] Send welcome email with trial details

#### Trial & Expiration Logic
- [ ] Create middleware: `checkSubscriptionStatus()`
- [ ] Block dashboard access for expired trials
- [ ] Show "Trial Expired" page with upgrade CTA
- [ ] Send email reminder 3 days before trial expires
- [ ] Send email on trial expiration
- [ ] Disable SMS sending for expired accounts

#### Testing Stripe Integration
- [ ] Test subscription creation (test mode)
- [ ] Test successful payment flow
- [ ] Test failed payment handling
- [ ] Test subscription cancellation
- [ ] Test webhook events locally (Stripe CLI)
- [ ] Test trial expiration logic
- [ ] Test upgrade from trial to paid

#### Stripe Production Deployment
- [ ] Replace test keys with live keys in `.env.production`
- [ ] Update Stripe webhook URL to production domain
- [ ] Test one real subscription (your own card)
- [ ] Monitor Stripe dashboard for events
- [ ] Set up Stripe email notifications (failed payments)

---

### Medium Priority (v1.2 - CSV Upload)

#### CSV Upload Feature
- [ ] Install `csv-parser` npm package
- [ ] Create `src/controllers/uploadController.js`
  - [ ] GET `/dashboard/upload` - Show upload form
  - [ ] POST `/dashboard/upload` - Process CSV file
- [ ] CSV validation logic:
  - [ ] Required columns: name, phone, email
  - [ ] Phone number format validation
  - [ ] Duplicate detection (same phone in last 30 days)
  - [ ] Max file size: 5MB
  - [ ] Max rows: 500 per upload
- [ ] Batch SMS sending with rate limiting
  - [ ] Twilio rate limit: 1 SMS per second
  - [ ] Queue implementation for large batches
- [ ] Create `src/views/upload.ejs`
  - [ ] File upload form (drag & drop)
  - [ ] CSV format instructions
  - [ ] Download sample CSV template
  - [ ] Upload progress bar
  - [ ] Results table (success, failed, duplicates)
- [ ] CSV upload history:
  - [ ] New table: `CsvUploads` (filename, rows, success, failed, createdAt)
  - [ ] View past uploads on dashboard

---

### Lower Priority (v1.3 - Analytics Dashboard)

#### Advanced Analytics
- [ ] Create `src/controllers/analyticsController.js`
- [ ] Create `src/views/analytics.ejs`
- [ ] Metrics to implement:
  - [ ] Response rate trend (last 30 days)
  - [ ] Average rating trend
  - [ ] Total reviews by rating (chart)
  - [ ] Busiest days/hours for reviews
  - [ ] SMS delivery success rate
  - [ ] Email delivery success rate
  - [ ] Customer sentiment analysis (NLP on comments)
- [ ] Chart library integration (Chart.js or D3.js)
- [ ] Export reports:
  - [ ] PDF report generation
  - [ ] CSV export of reviews
  - [ ] Email report scheduling (weekly/monthly)

---

### Future Enhancements (v1.4+)

#### AI-Powered Features
- [ ] Natural Language Processing for feedback categorization
- [ ] Automated response suggestions for negative reviews
- [ ] Sentiment analysis for customer feedback
- [ ] Predictive analytics for customer satisfaction

#### Mobile App (v2.0)
- [ ] Native iOS app (React Native or Swift)
- [ ] Native Android app (React Native or Kotlin)
- [ ] Push notifications for new feedback
- [ ] Quick response templates
- [ ] Offline mode support

#### Additional Integrations
- [ ] Direct Google My Business integration (post reviews via API)
- [ ] Facebook Reviews API integration
- [ ] Yelp integration
- [ ] Trustpilot integration
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Email marketing integrations (Mailchimp, SendGrid)

#### User Experience Improvements
- [ ] SMS template customization (per tenant)
- [ ] Email template customization
- [ ] Multi-language support (i18n)
- [ ] White-label option for agencies
- [ ] Custom domain for review links
- [ ] Branded SMS sender ID

#### Security & Compliance
- [ ] Two-factor authentication (2FA)
- [ ] Single Sign-On (SSO) support
- [ ] GDPR compliance tools (data export, right to be forgotten)
- [ ] SOC 2 Type II certification
- [ ] HIPAA compliance (for healthcare clients)

---

## 🐛 Known Issues

### No Critical Issues ✅

All major bugs have been resolved during the deployment phase.

### Minor Issues (Non-Blocking)

1. **Session Cookie Warning in Dev Mode**
   - **Issue:** When `NODE_ENV=development` in production, session cookies aren't fully secure
   - **Impact:** Low - works fine, just not ideal
   - **Fix:** Already documented in OPS.md (set `NODE_ENV=production` when testing complete)
   - **Status:** Documented workaround in place

2. **SMS Template is Hardcoded**
   - **Issue:** All tenants use the same SMS message template
   - **Impact:** Low - works for MVP, but lacks personalization
   - **Fix:** Planned for v1.2 (custom SMS templates feature)
   - **Status:** Intentional MVP limitation

3. **No Rate Limiting on API Endpoints**
   - **Issue:** Zapier webhook has no rate limiting
   - **Impact:** Low - protected by API secret, but could be abused
   - **Fix:** Add `express-rate-limit` middleware
   - **Status:** TODO for v1.1

---

## 🔒 Secrets & Credentials Checklist

### Production Credentials (Stored in `.env.production` on VPS)

✅ **Database:**
- `DB_PASSWORD`: Strong random password (32+ chars)
- `POSTGRES_PASSWORD`: Same as DB_PASSWORD

✅ **Application:**
- `SESSION_SECRET`: 64+ character random string
- `API_SECRET`: Random string for Zapier auth

✅ **Twilio (SMS):**
- `TWILIO_ACCOUNT_SID`: ACxxxxxxxxxxxxxxxxxxxxxxxx
- `TWILIO_AUTH_TOKEN`: Live token from console
- `TWILIO_MESSAGING_SERVICE_SID`: MGxxxxxxxxxxxxxxxxxxxxxxxx (A2P 10DLC)

✅ **Resend (Email):**
- `RESEND_API_KEY`: re_xxxxxxxxxxxxxxxxxxxx
- `RESEND_FROM_EMAIL`: info@filterfive.io (verified domain)

⏳ **Stripe (TODO - Not Yet Configured):**
- `STRIPE_SECRET_KEY`: sk_live_xxxxxxxxxxxxxxxxxxxxx (get from Stripe dashboard)
- `STRIPE_PUBLISHABLE_KEY`: pk_live_xxxxxxxxxxxxxxxxxxxxx
- `STRIPE_WEBHOOK_SECRET`: whsec_xxxxxxxxxxxxxxxx

### Backup Credentials

✅ **Google Drive (rclone):**
- Configured on VPS: `/root/.config/rclone/rclone.conf`
- Drive name: `gdrive`
- Folder: `FilterFive-Backups/`

✅ **GitHub:**
- Repository: https://github.com/kreaktive/FilterFive.io
- Access: Personal Access Token (stored locally, not on server)

---

## 📞 Important Contacts & Links

### External Services

| Service | Dashboard URL | Purpose |
|---------|--------------|---------|
| **Twilio** | https://console.twilio.com | SMS delivery, phone numbers |
| **Resend** | https://resend.com/overview | Email delivery, domain verification |
| **Stripe** | https://dashboard.stripe.com | Payment processing (TODO) |
| **Hostinger** | https://hpanel.hostinger.com | VPS hosting, DNS management |
| **GitHub** | https://github.com/kreaktive/FilterFive.io | Code repository |
| **Google Drive** | https://drive.google.com | Backup storage |

### Production Environment

| Resource | Value |
|----------|-------|
| **Live URL** | https://filterfive.io |
| **Admin Panel** | https://filterfive.io/admin |
| **Dashboard** | https://filterfive.io/dashboard |
| **Zapier Webhook** | https://filterfive.io/api/zapier/ingest |
| **SSH Access** | `ssh root@31.97.215.238` |
| **App Directory** | `/root/FilterFive` |

---

## 📝 Session Continuation Guide

### If Starting a New Session

When you (or another developer/AI) continue working on FilterFive, here's what you need:

#### 1. **Read These Files First (in order):**
1. **PROJECT_STATUS.md** (this file) - Current state and TODO list
2. **AI_CONTEXT.md** - Technical architecture and data flows
3. **README.md** - Quick start guide and project structure
4. **OPS.md** - Operational procedures for production

#### 2. **Get Up to Speed:**
```bash
# Clone repository
git clone https://github.com/kreaktive/FilterFive.io.git
cd FilterFive.io

# Read the project status
cat PROJECT_STATUS.md

# Check what's completed vs. what's pending
grep -E "^\- \[( |x)\]" PROJECT_STATUS.md

# Start local development environment
cp .env.example .env
# Edit .env with your credentials
docker-compose up --build
```

#### 3. **Verify Everything Works:**
```bash
# Access application
open http://localhost:3000

# Check database
docker-compose exec app npm run db:migrate

# Run email test
docker-compose exec app npm run test:email

# Check logs
docker-compose logs -f app
```

#### 4. **Start Working on Next Feature:**

Refer to the **TODO: Next Steps** section above for prioritized tasks. Start with **v1.1 - Stripe Integration** as it's the most critical feature for enabling self-service registration and revenue generation.

---

## 🎯 Key Decisions & Context

### Why These Technologies?

- **Node.js + Express:** Fast development, large ecosystem, JavaScript everywhere
- **PostgreSQL:** ACID compliance, relational data, complex queries, production-ready
- **EJS:** Simple templating, minimal learning curve, server-side rendering
- **Docker:** Consistency between dev/prod, easy deployment, isolated environments
- **Twilio:** Industry standard for SMS, reliable delivery, A2P 10DLC compliant
- **Resend:** Modern email API, better deliverability than SendGrid/Mailgun, simple pricing
- **Stripe:** Industry standard for payments, PCI compliant, excellent documentation

### Why These Architectural Choices?

- **UUID for Review Links:** Security - prevents ID enumeration attacks
- **Multi-Tenant Single Database:** Simpler to manage than database-per-tenant at this scale
- **Session-Based Auth:** Simpler than JWT for server-rendered pages, works with CSRF protection
- **Smart Filtering (4-5 vs 1-3):** Core value proposition - captures negative reviews before they go public
- **Zapier Integration:** Enables 5,000+ integrations without building each one individually
- **Manual Admin Onboarding:** MVP simplification - add Stripe later for self-service

### What We Learned During Deployment

1. **DNS propagation takes time** - Wait 30+ minutes after DNS changes
2. **Let's Encrypt needs clean DNS** - Remove conflicting web servers first
3. **Docker Compose looks for `.env` by default** - Not `.env.production`
4. **Session cookies need `secure: false` for HTTP** - Or use `NODE_ENV=development` temporarily
5. **Production Docker bakes in code** - Need to rebuild image after code changes
6. **Resend requires domain verification** - Can't use unverified domains
7. **Backup scripts need proper bash syntax** - Watch out for leading spaces
8. **GitHub needs Personal Access Tokens** - Password authentication deprecated

---

## 📈 Success Metrics (Once Live with Stripe)

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate
- Trial-to-Paid Conversion Rate

### Product Metrics
- Active Tenants
- SMS Sent per Day
- Review Response Rate
- Average Rating (across all tenants)
- Negative Feedback Intercepted (prevented from going public)

### Technical Metrics
- Uptime (target: 99.9%)
- Average Response Time (target: < 500ms)
- Database Size Growth
- Backup Success Rate (target: 100%)
- SSL Certificate Renewal Success

---

## 🏁 Conclusion

**FilterFive MVP v1.0.0 is complete and successfully deployed to production.**

The application is fully functional, documented, and operational at https://filterfive.io. All core features work as intended:
- ✅ Customer contact ingestion (Zapier)
- ✅ SMS delivery (Twilio)
- ✅ Review capture (UUID links)
- ✅ Smart filtering (4-5 public, 1-3 private)
- ✅ Email alerts (negative feedback)
- ✅ Tenant dashboard
- ✅ Super admin interface

**Next critical step:** Implement Stripe integration (v1.1) to enable self-service registration and begin generating revenue.

**Timeline Recommendation:**
- **Week 1-2:** Stripe integration (subscription, checkout, webhooks)
- **Week 3:** Testing and bug fixes
- **Week 4:** Go-to-market (marketing, outreach, first customers)
- **Month 2:** CSV upload feature (v1.2)
- **Month 3:** Analytics dashboard (v1.3)

---

**Document Maintained By:** FilterFive Development Team
**Created:** January 28, 2025
**Version:** 1.0.0

For questions or updates to this document, contact: dev@filterfive.io
