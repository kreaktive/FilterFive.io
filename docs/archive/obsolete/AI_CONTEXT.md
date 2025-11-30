# AI_CONTEXT.md - FilterFive Codebase Documentation

## 1. PROJECT IDENTITY

**Name:** FilterFive
**Core Value Proposition:** Automated Reputation Management SaaS
**Business Model:** B2B Multi-Tenant Platform

**The Problem We Solve:**
Businesses struggle with negative public reviews damaging their reputation. FilterFive intercepts feedback BEFORE it goes public, routing 4-5 star reviews to Google/Facebook while capturing 1-3 star feedback privately for resolution.

**How It Works:**
Two feedback collection methods:
1. **SMS Flow:** Zapier Webhook → Database → SMS to Customer → Customer Rates → Smart Filter
2. **QR Code Flow:** Customer Scans QR → Anonymous Feedback → Smart Filter (No phone required)

---

## 2. TECH STACK

### Backend
- **Runtime:** Node.js 18
- **Framework:** Express.js 4.18.2
- **Template Engine:** EJS 3.1.9
- **Database:** PostgreSQL 15 (Alpine)
- **ORM:** Sequelize 6.35.2
- **Authentication:** express-session + bcryptjs
- **Validation:** express-validator 7.0.1

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **SSL:** Let's Encrypt (Certbot)
- **Process Manager:** Node.js (production), Nodemon (development)

### External Services
- **SMS Delivery:** Twilio (Messaging Service with A2P 10DLC)
- **Email Delivery:** Resend (transactional email API)
- **Payments:** Stripe (planned - integration incomplete)
- **Automation:** Zapier (webhook ingestion endpoint)
- **QR Code Generation:** qrcode 1.5.4 (base64 image generation)

### Security & Middleware
- **Helmet:** Security headers
- **CORS:** Cross-origin resource sharing
- **Morgan:** HTTP request logging
- **cookie-parser:** Cookie parsing
- **body-parser:** Request body parsing

---

## 3. DATABASE SCHEMA

### Table: `users`
**Purpose:** Multi-tenant system - each row is a business customer

```
users
├── id (INTEGER, PK, AUTO_INCREMENT)
├── email (STRING, UNIQUE, NOT NULL)
├── password (STRING, NOT NULL) [bcrypt hashed]
├── business_name (STRING, NOT NULL)
├── google_review_link (TEXT, NULLABLE)
├── facebook_link (TEXT, NULLABLE)
├── subscription_status (ENUM: active|inactive|trial|cancelled, DEFAULT: trial)
├── subscription_plan (ENUM: 6-month|12-month, NULLABLE)
├── stripe_customer_id (STRING, NULLABLE)
├── stripe_subscription_id (STRING, NULLABLE)
├── role (ENUM: super_admin|tenant, DEFAULT: tenant)
├── is_active (BOOLEAN, DEFAULT: true)
├── created_at (TIMESTAMP, DEFAULT: NOW)
└── updated_at (TIMESTAMP, DEFAULT: NOW)

HOOKS:
- beforeCreate: Auto-hash password with bcrypt
- beforeUpdate: Auto-hash password if changed

METHODS:
- comparePassword(candidatePassword): Async bcrypt comparison
```

### Table: `feedback_requests`
**Purpose:** Tracks each feedback request (SMS or QR code scan)

```
feedback_requests
├── id (INTEGER, PK, AUTO_INCREMENT)
├── uuid (UUID, UNIQUE, NOT NULL, DEFAULT: UUIDv4) [PUBLIC LINK IDENTIFIER]
├── user_id (INTEGER, FK → users.id, NOT NULL)
├── customer_name (STRING, NULLABLE)
├── customer_phone (STRING(20), NULLABLE) [NULL for QR visitors]
├── customer_email (STRING, NULLABLE)
├── status (ENUM: pending|sent|clicked|rated|expired, DEFAULT: pending)
├── sms_sent_at (TIMESTAMP, NULLABLE)
├── link_clicked_at (TIMESTAMP, NULLABLE)
├── twilio_message_sid (STRING, NULLABLE) [Twilio tracking ID]
├── source (ENUM: zapier|csv_upload|manual, DEFAULT: manual)
├── delivery_method (ENUM: sms|qr, DEFAULT: sms) [How feedback was requested]
├── ip_address (STRING(45), NULLABLE) [Customer IP for QR rate limiting]
├── created_at (TIMESTAMP, DEFAULT: NOW)
└── updated_at (TIMESTAMP, DEFAULT: NOW)

HOOKS:
- beforeCreate: Auto-generate UUID if not provided

RELATIONSHIPS:
- BelongsTo: users (via user_id)
- HasOne: reviews (via feedback_request_id)
```

### Table: `reviews`
**Purpose:** Stores actual customer ratings and feedback

```
reviews
├── id (INTEGER, PK, AUTO_INCREMENT)
├── feedback_request_id (INTEGER, FK → feedback_requests.id, NOT NULL)
├── user_id (INTEGER, FK → users.id, NOT NULL)
├── rating (INTEGER, NOT NULL, MIN: 1, MAX: 5)
├── feedback_text (TEXT, NULLABLE) [Only captured for ratings 1-3]
├── redirected_to (ENUM: google|facebook|thank_you, NULLABLE)
├── is_public (BOOLEAN, DEFAULT: false) [TRUE if rating 4-5]
├── email_sent_to_tenant (BOOLEAN, DEFAULT: false) [TRUE if alert sent]
├── created_at (TIMESTAMP, DEFAULT: NOW)
└── updated_at (TIMESTAMP, DEFAULT: NOW)

RELATIONSHIPS:
- BelongsTo: feedback_requests (via feedback_request_id)
- BelongsTo: users (via user_id)
```

### Relationships Summary
```
users (1) ──< feedback_requests (M)
users (1) ──< reviews (M)
feedback_requests (1) ──< reviews (1)
```

---

## 4. DATA FLOW DOCUMENTATION

### A. INGESTION FLOW (Zapier → Database)
**Endpoint:** `POST /api/v1/hooks/feedback-request/:userId`

**Steps:**
1. Zapier sends webhook with customer data: `{ customerName, customerPhone, customerEmail }`
2. Middleware validates `userId` parameter (must be active tenant)
3. Controller (`ingestController.js`) creates `FeedbackRequest` record:
   - Generates UUID automatically (via Sequelize hook)
   - Sets `status: 'pending'`
   - Sets `source: 'zapier'`
4. Returns `201 Created` with UUID

**Key Files:**
- `src/routes/ingest.js`
- `src/controllers/ingestController.js`
- `src/models/FeedbackRequest.js`

---

### B. DISTRIBUTION FLOW (Database → Twilio SMS)
**Trigger:** Manual or scheduled job (current: manual via dashboard)

**Steps:**
1. Tenant logs into dashboard
2. Views pending feedback requests
3. Clicks "Send SMS" for a request
4. `smsService.js` constructs message:
   ```
   Hi {customerName}! Thanks for choosing {businessName}.
   Rate your experience: https://filterfive.io/review/{UUID}
   ```
5. Twilio Messaging Service sends SMS (A2P 10DLC compliant)
6. Update `FeedbackRequest`:
   - `status: 'sent'`
   - `sms_sent_at: NOW()`
   - `twilio_message_sid: <SID>`

**Key Files:**
- `src/services/smsService.js`
- `src/controllers/dashboardController.js`

**Critical:** UUID is PUBLIC. Never expose database IDs in URLs.

---

### C. QR CODE FLOW (In-Person → Anonymous Feedback)
**Route:** `GET /r/:businessId`

**Steps:**
1. Tenant visits `/dashboard/qr` and downloads their QR code
2. QR code printed/displayed at physical location (checkout counter, table, receipt)
3. Customer scans QR code with phone camera
4. Redirect to `https://filterfive.io/r/:businessId`
5. Rate limiter checks IP address (max 1 scan per 30 seconds per business per IP)
6. `qrController.js` creates `FeedbackRequest`:
   ```
   {
     userId: businessId,
     uuid: auto-generated,
     customerPhone: NULL,          // Anonymous!
     customerName: NULL,
     deliveryMethod: 'qr',
     ipAddress: req.ip,
     status: 'clicked',
     linkClickedAt: NOW()
   }
   ```
7. Redirect to `/review/:uuid` (same star rating page as SMS flow)
8. Customer rates experience without providing phone number

**Key Files:**
- `src/routes/qr.js`
- `src/controllers/qrController.js`
- `src/middleware/qrRateLimiter.js`
- `src/views/dashboard/qr.ejs` (tenant QR code page)

**Rate Limiting:**
- 30 second window per IP per business
- Prevents spam/abuse while allowing quick retries
- Key format: `qr_{businessId}_{ipAddress}`

---

### D. THE FILTER FLOW (Customer Response → Smart Routing)
**Endpoint:** `GET /review/:uuid` (Frontend) → `POST /review/:uuid` (Form Submit)

**Frontend Logic (reviewController.js):**

**Step 1: Customer Clicks Link**
```
GET /review/:uuid
├── Find FeedbackRequest by UUID
├── Update: status='clicked', link_clicked_at=NOW()
├── Render: review.ejs (star rating UI)
└── Customer sees: "Rate your experience with {businessName}"
```

**Step 2: Customer Selects Rating (1-5 Stars)**
```
POST /review/:uuid
├── Extract: rating (1-5), feedbackText (optional)
├── Create Review record
├── Update FeedbackRequest: status='rated'
└── DECISION POINT:

    IF rating >= 4:
    ├── Set review.is_public = TRUE
    ├── Set review.redirected_to = 'google' | 'facebook'
    ├── Redirect customer to tenant's Google/Facebook review page
    └── Customer leaves PUBLIC 5-star review

    ELSE (rating 1-3):
    ├── Set review.is_public = FALSE
    ├── Save review.feedback_text to database
    ├── Trigger: Email alert to tenant (via Resend)
    ├── Set review.email_sent_to_tenant = TRUE
    └── Show: "Thank you for your feedback. We'll be in touch."
```

**Key Files:**
- `src/routes/review.js`
- `src/controllers/reviewController.js`
- `src/views/review.ejs` (star rating UI)
- `src/views/thankyou.ejs` (post-submission)

---

### D. ALERT FLOW (Low Rating → Email to Tenant)
**Trigger:** Automatic when rating 1-3 is submitted

**Steps:**
1. `reviewController.submitReview()` detects rating <= 3
2. Calls `emailService.sendNegativeFeedbackAlert()`
3. Resend API sends email to `tenant.email`:
   ```
   Subject: ⚠️ New Feedback Alert - {customerName}
   Body:
   - Customer Name: {customerName}
   - Rating: {rating}/5 stars
   - Feedback: {feedbackText}
   - Phone: {customerPhone}
   ```
4. Tenant receives instant notification
5. Tenant can respond before customer posts public review

**Key Files:**
- `src/services/emailService.js`
- Environment Variable: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

**Critical:** Email must come from verified domain in Resend dashboard.

---

## 5. APPLICATION ARCHITECTURE

### Directory Structure
```
filterfive/
├── app.js                      # Express application entry point
├── package.json                # Dependencies and scripts
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── Dockerfile.production       # Production build
├── .env                        # Environment variables (NOT in git)
├── .env.example                # Environment template
├── AI_CONTEXT.md               # This file - onboarding documentation
├── src/
│   ├── config/
│   │   ├── database.js         # Sequelize connection config
│   │   └── migrations.js       # Table creation script
│   ├── models/
│   │   ├── index.js            # Model associations
│   │   ├── User.js             # Tenant model
│   │   ├── FeedbackRequest.js  # SMS tracking
│   │   └── Review.js           # Customer ratings
│   ├── controllers/
│   │   ├── ingestController.js # Zapier webhook handler
│   │   ├── reviewController.js # Customer-facing review flow
│   │   ├── dashboardController.js # Tenant dashboard + auth + QR page
│   │   ├── adminController.js  # Super admin panel + QR generation
│   │   └── qrController.js     # QR code scan handler
│   ├── routes/
│   │   ├── ingest.js           # POST /api/v1/hooks/*
│   │   ├── review.js           # GET/POST /review/:uuid
│   │   ├── dashboard.js        # Tenant portal routes + /qr
│   │   ├── admin.js            # Super admin routes + /qr/:userId
│   │   └── qr.js               # GET /r/:businessId (public QR scans)
│   ├── middleware/
│   │   ├── auth.js             # requireAuth, redirectIfAuthenticated
│   │   ├── superAuth.js        # requireSuperAdmin
│   │   └── qrRateLimiter.js    # IP-based rate limiting for QR
│   ├── services/
│   │   ├── smsService.js       # Twilio integration
│   │   └── emailService.js     # Resend integration
│   ├── views/
│   │   ├── landing_marketing.ejs # Public homepage
│   │   ├── review.ejs          # Customer rating page
│   │   ├── thankyou.ejs        # Post-submission
│   │   ├── error.ejs           # Error pages (404, 429, 500)
│   │   ├── dashboard/
│   │   │   ├── login.ejs
│   │   │   ├── index.ejs       # Main tenant dashboard
│   │   │   ├── settings.ejs
│   │   │   └── qr.ejs          # QR code download page
│   │   └── admin/
│   │       ├── dashboard.ejs   # Tenant list
│   │       └── create.ejs      # Create new tenant
│   ├── seeders/
│   │   └── init.js             # Dummy data for development
│   └── scripts/
│       ├── testEmail.js        # Email testing script
│       └── setSuperAdmin.js    # Promote user to super admin
└── public/                     # Static assets (CSS, JS, images)
```

### Request Flow Examples

**Example 1: Zapier Sends Feedback Request**
```
Zapier → POST /api/v1/hooks/feedback-request/123
       → ingestController.createFeedbackRequest()
       → FeedbackRequest.create({ uuid: auto, userId: 123, ... })
       → Response: 201 { success: true, uuid: "abc-123" }
```

**Example 2: Customer Submits 2-Star Review**
```
Customer → POST /review/abc-123 { rating: 2, feedbackText: "Late delivery" }
         → reviewController.submitReview()
         → Review.create({ rating: 2, isPublic: false, ... })
         → emailService.sendNegativeFeedbackAlert()
         → Resend API → Tenant receives email
         → Response: Redirect to /review/abc-123/thankyou
```

---

## 6. ENVIRONMENT CONFIGURATION

### Required Environment Variables

**See `.env.example` for comprehensive list with descriptions.**

**Critical Variables:**
```bash
NODE_ENV=production                    # Affects session cookies, logging
PORT=3000                              # Application port
APP_URL=https://filterfive.io          # Used in SMS links

DB_HOST=db                             # Docker service name
DB_NAME=filterfive_prod
DB_USER=filterfive_prod_user
DB_PASSWORD=<strong-random-password>

SESSION_SECRET=<64-char-random-string> # Cookie encryption

TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxx  # Required for production

RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=info@filterfive.io   # Must be verified domain
```

### Docker Compose Commands

**Development:**
```bash
docker-compose up -d          # Start with live reload
docker-compose logs -f app    # View logs
docker-compose down           # Stop containers
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml restart app
docker-compose -f docker-compose.prod.yml down
```

**Database:**
```bash
docker exec filterfive_app_prod npm run db:migrate    # Run migrations
docker exec filterfive_app_prod npm run db:seed       # Seed dummy data
docker exec filterfive_app_prod npm run set:superadmin # Promote user ID 1
```

---

## 7. PROJECT RULES ("DO NOT BREAK" LIST)

### Security Rules
1. **NEVER commit `.env` files to version control**
   - Use `.env.example` as template
   - All secrets must be environment variables

2. **ALWAYS use UUIDs for public-facing URLs**
   - Review links: `/review/:uuid` (NOT `/review/:id`)
   - UUIDs prevent enumeration attacks
   - Database IDs are NEVER exposed to customers

3. **ALWAYS hash passwords with bcrypt**
   - Minimum 10 salt rounds
   - Automatic hashing via Sequelize hooks (beforeCreate, beforeUpdate)

4. **ALWAYS validate foreign keys**
   - Check `userId` exists and `isActive: true` before creating records
   - Prevent orphaned records

### Architecture Rules
5. **Docker Compose for ALL environments**
   - Development: `docker-compose.yml` (with nodemon, volume mounts)
   - Production: `docker-compose.prod.yml` (baked-in code, no mounts)

6. **Sequelize for ALL database operations**
   - NO raw SQL queries (except migrations)
   - Use Sequelize models and associations
   - Leverage hooks for automatic behavior (UUID generation, password hashing)

7. **EJS templates for ALL views**
   - NO frontend framework (React/Vue)
   - Server-side rendering only
   - Use partials for reusable components

### Business Logic Rules
8. **The 4/5 Rule: High ratings go public, low ratings stay private**
   - Rating >= 4: `isPublic: true`, redirect to Google/Facebook
   - Rating <= 3: `isPublic: false`, capture feedback, email tenant

9. **ALWAYS send email alerts for low ratings**
   - Must include: customer name, rating, feedback text, phone
   - Set `emailSentToTenant: true` after sending
   - Use transactional email (Resend), NOT marketing tools

10. **SMS must use Twilio Messaging Service (A2P 10DLC)**
    - Single phone number won't work for production
    - Messaging Service handles compliance
    - Store `twilioMessageSid` for tracking

### Deployment Rules
11. **Production requires HTTPS**
    - SSL via Let's Encrypt (Certbot)
    - Nginx as reverse proxy
    - Session cookies require `secure: true` in production

12. **Database backups are MANDATORY**
    - Daily automated backups (cron job)
    - Local storage (7 days) + Google Drive (unlimited)
    - Test restore procedure regularly

13. **Super Admin for tenant onboarding**
    - Multi-tenant system: each `user` is a separate business
    - Super admin creates tenants via `/admin` panel
    - First user (ID 1) promoted via `npm run set:superadmin`

---

## 8. CURRENT LIMITATIONS & ROADMAP

### Known Limitations (MVP)
- No automated SMS sending (manual trigger from dashboard)
- No Stripe billing integration (subscriptionStatus ignored)
- No CSV import for bulk feedback requests
- No analytics dashboard (conversion rates, response times)
- No white-label branding (all emails/SMS say "FilterFive")
- No bulk QR code generation/download for multiple locations

### Planned Features
1. **Automated SMS Triggers**
   - Zapier webhook → instant SMS (no manual step)
   - Scheduled batch sending

2. **Stripe Billing**
   - Subscription plans (6-month, 12-month)
   - Usage-based pricing (per SMS sent)
   - Payment webhooks

3. **Advanced Filtering**
   - Custom rating thresholds (e.g., 3+ goes public)
   - Time-based rules (send SMS 24hr after job completion)

4. **Analytics**
   - Response rate tracking
   - Average rating over time
   - Conversion funnel (sent → clicked → rated)
   - SMS vs QR performance comparison

5. **QR Code Enhancements**
   - Custom QR code colors/branding
   - Bulk QR generation for multi-location businesses
   - QR analytics (scans per location, time of day patterns)
   - Printable templates (table tents, stickers, receipts)

---

## 9. TESTING & DEBUGGING

### Manual Testing Flows

**Test End-to-End Flow:**
1. Create tenant via `/admin`
2. Send Zapier webhook: `POST /api/v1/hooks/feedback-request/{userId}`
3. Check dashboard: verify pending request appears
4. Send SMS manually
5. Open review link as customer
6. Submit 2-star review with feedback
7. Check tenant email for alert
8. Submit 5-star review
9. Verify redirect to Google

**Test Email Service:**
```bash
docker exec filterfive_app_prod npm run test:email
```

**Check Logs:**
```bash
docker logs filterfive_app_prod --tail 100 -f
```

### Common Issues

**Issue:** "FilterFive API - Server is running" instead of landing page
- **Cause:** Production uses baked-in code, not live files
- **Fix:** `docker-compose -f docker-compose.prod.yml up -d --build`

**Issue:** Session not persisting (can't log in)
- **Cause:** Production requires `secure: true` for cookies (HTTPS only)
- **Fix:** Either enable HTTPS or temporarily set `NODE_ENV=development`

**Issue:** SMS not sending
- **Cause:** Missing `TWILIO_MESSAGING_SERVICE_SID`
- **Fix:** Create Messaging Service in Twilio console, add to `.env`

**Issue:** Email alert not sending
- **Cause:** Domain not verified in Resend
- **Fix:** Verify `RESEND_FROM_EMAIL` domain in Resend dashboard

---

## 10. DEPLOYMENT CHECKLIST

Before going live:
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Environment set to `NODE_ENV=production`
- [ ] All environment variables set in `.env`
- [ ] Database migrations run successfully
- [ ] Super admin user created
- [ ] Twilio Messaging Service configured
- [ ] Resend domain verified
- [ ] Daily backup cron job active
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Test full flow: webhook → SMS → review → email

---

## 11. KEY CONTACT POINTS

### External Services
- **Twilio Console:** https://console.twilio.com
- **Resend Dashboard:** https://resend.com/domains
- **Stripe Dashboard:** https://dashboard.stripe.com (not yet integrated)
- **Let's Encrypt:** Auto-renewal via Certbot

### Internal Endpoints
- **Public Landing:** https://filterfive.io
- **Tenant Login:** https://filterfive.io/dashboard/login
- **Tenant QR Page:** https://filterfive.io/dashboard/qr
- **Super Admin:** https://filterfive.io/admin
- **Admin QR Generation:** https://filterfive.io/admin/qr/:userId
- **Review Page:** https://filterfive.io/review/:uuid
- **QR Scan Entry:** https://filterfive.io/r/:businessId
- **Zapier Webhook:** https://filterfive.io/api/v1/hooks/feedback-request/:userId

---

## 12. BACKUP & RESTORE PROCEDURES

### Automated Backups
**Location:** `/root/backup-filterfive.sh`

**Schedule:** Daily at 2:00 AM UTC (via cron)

**Storage:**
- **Local:** `/root/backups/` (7 days retention)
- **Google Drive:** `FilterFive-Backups/` folder (unlimited retention)

**Manual Backup:**
```bash
/root/backup-filterfive.sh
```

### Restore from Backup
```bash
# List available backups
ls -lh /root/backups/

# Restore from specific backup
gunzip -c /root/backups/filterfive_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker exec -i -e PGPASSWORD="<DB_PASSWORD>" filterfive_db_prod \
psql -U filterfive_prod_user -d filterfive_prod
```

**Verify Restore:**
```bash
docker exec filterfive_db_prod psql -U filterfive_prod_user -d filterfive_prod -c "SELECT COUNT(*) FROM users;"
```

---

**Last Updated:** November 29, 2025
**Version:** 1.1.0 (QR Code Feature Added)
**Status:** ✅ Deployed and operational at https://filterfive.io

**Recent Updates:**
- ✅ QR Code Feedback System (v1.1.0 - Nov 29, 2025)
  - Anonymous feedback collection via QR codes
  - Tenant dashboard QR page with download/print
  - IP-based rate limiting (30s window)
  - Admin QR generation endpoint
