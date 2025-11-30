# FilterFive.io

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![Status](https://img.shields.io/badge/status-production-success.svg)

**FilterFive** is a B2B SaaS platform that helps businesses protect and enhance their online reputation by intelligently filtering customer feedback. It intercepts all customer reviews via SMS and QR codes before they reach public platforms like Google or Facebook, automatically directing 4-5 star reviews to public sites while privately capturing 1-3 star feedback for internal resolution—preventing negative reviews from ever appearing online.

> **Version 2.0.0** - Production Live with Analytics Dashboard (80% Complete)

---

## ✨ Features

### Core Functionality

- **🎯 Smart Feedback Filtering** - 4-5 star reviews go public (Google/Facebook), 1-3 stars stay private
- **📱 SMS Automation** - Twilio-powered SMS delivery with A2P 10DLC compliance
- **📱 QR Code Feedback** - Anonymous in-person feedback via scannable QR codes
- **📤 CSV Bulk Upload** - Import hundreds of customers at once with validation and batch SMS sending
- **💬 Feedback Management** - Comprehensive dashboard to view, respond, and manage all feedback
- **⚡ Activity Feed (Pulse)** - Real-time feed of last 20 customer interactions with status tracking and review details

### Business Features

- **💳 Stripe Integration** - Monthly ($77) and Annual ($770) subscription plans with 14-day trial
- **📊 Analytics Dashboard** - ROI calculator, performance trends, location tracking, and timing heatmaps
- **⚡ Real-Time Email Alerts** - Instant notifications for negative feedback via Resend
- **🔗 Zapier Integration** - Ingest customer contacts from 5,000+ apps via webhook
- **📧 Email Verification** - Secure account activation with verified email addresses

### Technical Features

- **🏢 Multi-Tenant Architecture** - Isolated data per business with role-based access control
- **🔒 Secure by Design** - UUID-based review links, bcrypt password hashing, session management
- **📈 Usage Tracking** - SMS limits enforced (10 trial, 1000 paid), subscription management
- **🐳 Docker Ready** - Fully containerized for easy development and deployment
- **🔄 Automated Backups** - Daily database backups with Google Drive sync

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Database Setup](#-database-setup)
- [Seeding Data](#-seeding-data)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Production Deployment](#-production-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🛠 Tech Stack

### Backend
- **Node.js 18** - JavaScript runtime
- **Express 4.18.2** - Web framework
- **PostgreSQL 15** - Relational database
- **Sequelize 6.35.2** - ORM for database operations
- **EJS 3.1.9** - Server-side templating
- **QRCode 1.5.4** - QR code generation

### Infrastructure
- **Docker + Docker Compose** - Containerization
- **Nginx** - Reverse proxy (production)
- **Let's Encrypt** - SSL/TLS certificates

### External Services
- **Twilio** - SMS delivery (Messaging Service for A2P 10DLC)
- **Resend** - Transactional email delivery
- **Stripe** - Subscription payment processing (Live in production)

### Security & Authentication
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **UUID v4** - Secure, non-guessable review links

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Git** (2.30+)
- **Node.js** (18.x) - Optional, for local development without Docker
- **Twilio Account** - [Sign up here](https://www.twilio.com/try-twilio)
- **Resend Account** - [Sign up here](https://resend.com/signup)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kreaktive/FilterFive.io.git
cd FilterFive.io
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the file with your credentials
nano .env
```

**Required Variables:**
- `SESSION_SECRET` - Generate with: `openssl rand -hex 32`
- `DB_PASSWORD` - Generate with: `openssl rand -base64 32`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - From Twilio Console
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` - From Resend Dashboard

### 3. Start Docker Services

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d
```

### 4. Run Database Migrations

```bash
# Inside the app container
docker-compose exec app npm run db:migrate
```

### 5. Access the Application

- **Application:** http://localhost:3000
- **Database:** localhost:5432
- **Default Login:** See [Seeding Data](#-seeding-data) section

---

## 📁 Project Structure

```
FilterFive.io/
├── app.js                          # Main application entry point
├── package.json                    # Dependencies and npm scripts
├── docker-compose.yml              # Development Docker configuration
├── docker-compose.prod.yml         # Production Docker configuration
├── README.md                       # This file
│
├── docs/                           # Documentation
│   ├── PROJECT.md                  # AI agent onboarding guide (primary reference)
│   ├── README.md                   # Documentation index
│   ├── API-SUBSCRIPTION-ENDPOINTS.md  # Stripe API reference
│   ├── TESTING-COMPLETE.md         # Test results and validation
│   └── archive/                    # Historical documentation
│
├── src/
│   ├── config/
│   │   └── database.js             # Sequelize connection
│   │
│   ├── models/                     # Database models
│   │   ├── index.js                # Model registration
│   │   ├── User.js                 # Tenant accounts (with Stripe fields)
│   │   ├── FeedbackRequest.js      # SMS/QR feedback tracking
│   │   ├── Review.js               # Customer ratings
│   │   ├── AnalyticsSnapshot.js    # Pre-calculated daily metrics
│   │   ├── TimingPerformance.js    # Response time tracking
│   │   └── SmsEvent.js             # SMS delivery events
│   │
│   ├── controllers/                # Request handlers
│   │   ├── authController.js       # Signup, login, email verification
│   │   ├── dashboardController.js  # Main tenant dashboard
│   │   ├── subscriptionController.js  # Stripe checkout & billing
│   │   ├── qrController.js         # QR code generation & scanning
│   │   ├── uploadController.js     # CSV upload handling
│   │   ├── feedbackController.js   # Public review pages
│   │   └── analyticsController.js  # Analytics API endpoints
│   │
│   ├── routes/                     # Route definitions
│   │   ├── auth.js                 # Authentication routes
│   │   ├── dashboard.js            # Tenant dashboard routes
│   │   ├── subscription.js         # Billing routes
│   │   ├── webhook.js              # Stripe webhooks
│   │   ├── uploadRoutes.js         # CSV upload routes
│   │   ├── feedbackRoutes.js       # Public feedback routes
│   │   └── analytics.js            # Analytics API routes
│   │
│   ├── middleware/
│   │   ├── auth.js                 # requireAuth middleware
│   │   ├── rateLimiter.js          # Rate limiting
│   │   ├── trialManager.js         # Trial enforcement
│   │   └── qrRateLimiter.js        # QR-specific rate limits
│   │
│   ├── services/                   # Business logic
│   │   ├── stripeService.js        # Stripe API wrapper
│   │   ├── smsService.js           # Twilio SMS delivery
│   │   ├── emailService.js         # Resend email delivery
│   │   ├── validationService.js    # Phone/email validation
│   │   ├── analyticsService.js     # Analytics data aggregation
│   │   └── snapshotService.js      # Daily snapshot generation
│   │
│   ├── migrations/                 # Database migrations
│   │   ├── 001-initial-schema.js
│   │   ├── 002-add-subscription-fields.js
│   │   ├── 003-add-analytics-fields.js
│   │   └── ...
│   │
│   ├── cron/                       # Scheduled jobs
│   │   └── daily-snapshots.js      # Analytics aggregation cron
│   │
│   ├── views/                      # EJS templates
│   │   ├── dashboard/
│   │   │   ├── index.ejs           # Main dashboard (with Activity Feed)
│   │   │   ├── subscription.ejs    # Billing page
│   │   │   ├── qr.ejs              # QR code download
│   │   │   ├── analytics.ejs       # Analytics dashboard
│   │   │   ├── settings.ejs        # Account settings
│   │   │   ├── upload.ejs          # CSV upload page
│   │   │   └── upload-results.ejs  # Upload results
│   │   ├── auth/
│   │   │   ├── signup.ejs
│   │   │   ├── login.ejs
│   │   │   └── verify-*.ejs        # Email verification pages
│   │   ├── feedback/
│   │   │   ├── review.ejs          # Public rating page
│   │   │   └── thankyou.ejs
│   │   └── partials/
│   │       ├── header.ejs
│   │       ├── footer.ejs
│   │       └── analytics-*.ejs     # Analytics components
│   │
│   └── utils/
│       ├── csvValidator.js         # CSV file validation
│       └── roiCalculator.js        # ROI metrics calculator
│
└── public/                         # Static assets
    ├── css/
    ├── js/
    └── images/
```

---

## 🗄 Database Setup

FilterFive uses **PostgreSQL 15** with **Sequelize ORM**. The database schema includes:

### Core Tables

#### users

- **Purpose:** Tenant accounts with subscription management
- **Key Fields:** email, password (bcrypt), businessName, role
- **Subscription:** subscriptionStatus, subscriptionPlan, stripeCustomerId, stripeSubscriptionId
- **Trial:** trialStartsAt, trialEndsAt (14-day trial period)
- **Usage:** smsUsageCount, smsUsageLimit (10 trial, 1000 paid)
- **Features:** analyticsEnabled, emailVerified

#### feedback_requests

- **Purpose:** Tracks each SMS/QR feedback request
- **Key Fields:** uuid (public link), userId, customerName, customerPhone
- **Delivery:** deliveryMethod (sms|qr), status (pending|sent|clicked|rated)
- **Tracking:** location, ipAddress, clickedAt, createdAt
- **Security:** UUID v4 prevents ID enumeration attacks

#### reviews

- **Purpose:** Customer feedback and ratings
- **Key Fields:** feedbackRequestId, userId, rating (1-5), comment
- **Logic:** isFiltered (true for 1-3 stars), redirectedTo (google|facebook|thank_you)
- **Tracking:** emailSentAt, createdAt

### Analytics Tables (Milestone 3)

#### analytics_snapshots

- **Purpose:** Pre-calculated daily metrics per tenant/location
- **Metrics:** requestsSent, requestsClicked, requestsRated, reviewsPositive, reviewsNegative
- **Calculated:** averageRating, clickRate, conversionRate, responseTime
- **Dimensions:** userId, snapshotDate, location

#### timing_performance

- **Purpose:** Track customer response timing patterns
- **Fields:** userId, hour (0-23), dayOfWeek (0-6), responseCount, avgResponseTime

#### sms_events

- **Purpose:** Detailed SMS delivery tracking
- **Fields:** feedbackRequestId, eventType (queued|sent|delivered|failed), twilioSid, errorCode

### Running Migrations

```bash
# Development (with Docker)
docker-compose exec app npm run db:migrate

# Production (with Docker)
docker exec filterfive_app_prod npm run db:migrate

# Local (without Docker)
npm run db:migrate
```

---

## 🌱 Seeding Data

### Create Demo User

```bash
# Run the seeder script
npm run db:seed

# Or manually via Docker
docker-compose exec app npm run db:seed
```

**Demo Credentials:**
- Email: `demo@business.com`
- Password: `password123`
- Business Name: `Demo Business`

### Set Super Admin

To promote a user to super admin (required for `/admin` access):

```bash
# Set user ID 1 as super admin
npm run set:superadmin

# Or via Docker
docker-compose exec app npm run set:superadmin
```

**What it does:**
- Updates `User.id = 1` to `role = 'super_admin'`
- Grants access to `/admin` routes for tenant management

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Application port | `3000` |
| `APP_URL` | Public URL | `http://localhost:3000` or `https://yourdomain.com` |
| `SESSION_SECRET` | Cookie encryption key | Generate: `openssl rand -hex 32` |
| `API_SECRET` | Zapier webhook auth | `your-random-secret` |
| `DB_HOST` | Database host | `db` (Docker) or `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `filterfive` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | Generate: `openssl rand -base64 32` |
| `POSTGRES_DB` | Docker Postgres init | Same as `DB_NAME` |
| `POSTGRES_USER` | Docker Postgres init | Same as `DB_USER` |
| `POSTGRES_PASSWORD` | Docker Postgres init | Same as `DB_PASSWORD` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | From Twilio Console |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number | `+1XXXXXXXXXX` |
| `TWILIO_MESSAGING_SERVICE_SID` | Messaging Service SID (Production) | `MGxxxxxxxxxxxxxxxxxxxxxxxx` |
| `RESEND_API_KEY` | Resend API Key | `re_xxxxxxxxxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Verified sender email | `info@yourdomain.com` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | `sk_live_xxxxxxxxxxxxxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | `pk_live_xxxxxxxxxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | `whsec_xxxxxxxxxxxxxxxx` |
| `STRIPE_PRICE_MONTHLY` | Monthly plan price ID | `price_xxxxxxxxxxxxxxxx` |
| `STRIPE_PRICE_ANNUAL` | Annual plan price ID | `price_xxxxxxxxxxxxxxxx` |
| `ENABLE_CRON` | Enable analytics snapshots | `true` or `false` |
| `TEST_EMAIL` | Email for testing | `your.email@example.com` |

**Security Best Practices:**
- Generate strong secrets: `openssl rand -hex 32`
- Never commit `.env` to version control (already in `.gitignore`)
- Use different secrets for development and production
- Rotate secrets regularly in production

---

## 🧪 Testing

### Test Email Integration

```bash
# Set TEST_EMAIL in .env first
npm run test:email

# Or via Docker
docker-compose exec app npm run test:email
```

**What it tests:**
- Resend API connection
- Email template rendering
- Negative feedback alert delivery

### Test SMS Integration

```bash
# Currently requires manual testing via dashboard
# Navigate to: http://localhost:3000/dashboard
# Click "Send Test SMS" with a valid phone number
```

### Manual Test Flow

1. **Register a tenant:** http://localhost:3000/register
2. **Log in:** http://localhost:3000/login
3. **Configure settings:** Add Google Review link, set business details
4. **Trigger Zapier webhook:**
   ```bash
   curl -X POST http://localhost:3000/api/zapier/ingest \
     -H "Content-Type: application/json" \
     -H "X-API-Secret: your-api-secret" \
     -d '{
       "customer_name": "John Doe",
       "customer_phone": "+1234567890",
       "customer_email": "john@example.com"
     }'
   ```
5. **Check dashboard:** Verify FeedbackRequest was created
6. **Check SMS:** Customer should receive SMS with review link
7. **Submit review:** Click link, submit 2-star review
8. **Check email:** Tenant should receive negative feedback alert
9. **Verify dashboard:** Review should appear as private

---

## 🌐 Production Deployment

FilterFive is designed for deployment on a VPS (Ubuntu 22.04 recommended) with Docker.

### Quick Deploy

```bash
# On your VPS (as root)
git clone https://github.com/kreaktive/FilterFive.io.git
cd FilterFive.io
cp .env.example .env.production
nano .env.production  # Add production credentials

# Run automated deployment script
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment Steps

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for comprehensive instructions including:
- VPS setup and security hardening
- Docker and Nginx installation
- SSL certificate configuration (Let's Encrypt)
- Database backup automation with Google Drive sync
- Monitoring and log management
- Troubleshooting guide

### Production Checklist

- [ ] All placeholder values in `.env.production` replaced
- [ ] `SESSION_SECRET` is strong (64+ characters)
- [ ] `DB_PASSWORD` is strong (32+ characters)
- [ ] `NODE_ENV=production`
- [ ] `APP_URL` points to production domain (https://...)
- [ ] Twilio Messaging Service configured (not single phone number)
- [ ] Resend domain verified
- [ ] SSL certificate installed and auto-renewal enabled
- [ ] Firewall configured (UFW: allow 22, 80, 443)
- [ ] Database backups scheduled (cron job)
- [ ] Secrets stored in password manager

---

## 📡 API Documentation

### Zapier Webhook Endpoint

**POST** `/api/zapier/ingest`

**Purpose:** Ingest customer contact information from Zapier triggers (e.g., new Stripe payment, new CRM contact, new form submission).

**Authentication:**
```
X-API-Secret: your-api-secret-from-env
```

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_email": "john@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Customer contact processed successfully",
  "feedbackRequestId": 123,
  "smsSent": true
}
```

**Response (Error):**
```json
{
  "error": "Invalid phone number format"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (missing fields, invalid phone)
- `401` - Unauthorized (missing/invalid API secret)
- `500` - Server error

**Zapier Setup:**
1. Create Zap with your trigger (e.g., "New Stripe Payment")
2. Add action: "Webhooks by Zapier" → "POST"
3. Set URL: `https://yourdomain.com/api/zapier/ingest`
4. Add header: `X-API-Secret: your-secret`
5. Map fields: `customer_name`, `customer_phone`, `customer_email`

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit with clear messages:** `git commit -m "Add amazing feature"`
5. **Push to your fork:** `git push origin feature/amazing-feature`
6. **Open a Pull Request** with a detailed description

### Code Style

- Use **ES6+ syntax** (async/await, arrow functions, destructuring)
- Follow **Airbnb JavaScript Style Guide**
- Add **JSDoc comments** for functions
- Write **meaningful commit messages**

### Testing Requirements

- Test all database operations
- Verify SMS and email integration
- Check authentication and authorization flows
- Test Zapier webhook with sample payloads

---

## 📄 License

**MIT License**

Copyright (c) 2025 FilterFive.io

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 💬 Support

Need help? Here are your options:

- **Documentation:** [docs/PROJECT.md](docs/PROJECT.md) - Complete technical guide for developers and AI agents
- **API Reference:** [docs/API-SUBSCRIPTION-ENDPOINTS.md](docs/API-SUBSCRIPTION-ENDPOINTS.md) - Stripe integration guide
- **Test Results:** [docs/TESTING-COMPLETE.md](docs/TESTING-COMPLETE.md) - Validation and testing documentation
- **Deployment:** [docs/archive/deployment/](docs/archive/deployment/) - Production deployment guides
- **Issues:** [GitHub Issues](https://github.com/kreaktive/FilterFive.io/issues) - Report bugs
- **Email:** <support@filterfive.io> - General inquiries

---

## 🗺 Roadmap

### Current Version: v2.0.0

#### ✅ Milestone 1: Authentication & Core Features (COMPLETE)

- Multi-tenant authentication with email verification
- Password reset and account recovery
- 14-day trial period management (10 SMS free)
- Session-based secure authentication
- SMS feedback request delivery (Twilio A2P 10DLC)
- QR code feedback system (anonymous in-person reviews)
- Smart rating filter (4-5 stars → public, 1-3 stars → private)
- Email alerts for negative feedback (Resend)
- Tenant dashboard with real-time statistics
- Zapier webhook integration (5,000+ app connections)
- Docker containerization for deployment

#### ✅ Milestone 2: Stripe Integration (COMPLETE)

- Monthly ($77) and Annual ($770) subscription plans
- Stripe Checkout session integration
- Webhook event handling for subscription lifecycle
- Customer billing portal access
- Automatic subscription status updates
- Trial-to-paid conversion automation
- SMS usage limit enforcement (10 trial → 1000 paid)
- Invoice generation and payment history

#### ✅ Milestone 4: CSV Upload Feature (COMPLETE)

- CSV file upload with drag-and-drop interface
- Phone number validation (E.164 format)
- Duplicate detection (within file and against database)
- Preview interface with row selection/deselection
- Batch SMS sending with rate limiting (5 SMS/sec)
- Upload history tracking with success/failure reporting
- Retry failed sends individually
- SMS usage limit enforcement during upload

#### 🚧 Milestone 3: Analytics Dashboard (80% COMPLETE)

##### Completed

- Database schema (analytics_snapshots, timing_performance, sms_events)
- Backend services (analyticsService, snapshotService, roiCalculator)
- 8 API endpoints for analytics data
- Daily snapshot cron job (aggregates metrics at midnight)
- Analytics dashboard UI with ROI calculator
- KPI cards with sparkline trend charts
- Date range filters (7d, 30d, 90d, All Time)
- Location-based filtering for multi-location businesses
- Timing heatmap visualization (7x24 hour grid)
- Activity Feed (Pulse) with real-time status tracking for last 20 interactions
- Review detail modal with customer info, ratings, and comments

##### In Progress (20% remaining)

- [ ] Period comparison widget (vs previous period)
- [ ] SMS event metrics display (delivery success rates)
- [ ] Custom date range picker (calendar interface)
- [ ] Export to CSV/PDF functionality
- [ ] Real-time alert configuration (threshold-based notifications)

### Future Milestones

#### v2.1.0 - Advanced Analytics

- [ ] Sentiment analysis for feedback comments
- [ ] Customer segmentation by rating patterns
- [ ] Predictive analytics for review trends
- [ ] A/B testing for SMS messaging
- [ ] Multi-location comparison dashboard

#### v2.2.0 - Team Collaboration

- [ ] Multi-user access per tenant
- [ ] Role-based permissions (owner, manager, viewer)
- [ ] Internal notes on feedback
- [ ] Assignment and workflow management
- [ ] Activity audit logs

#### v2.3.0 - Automated Responses

- [ ] AI-powered response suggestions for negative feedback
- [ ] Template library for common issues
- [ ] Automated thank-you messages for positive reviews
- [ ] Follow-up campaign automation
- [ ] Integration with CRM systems

#### v3.0.0 - Mobile App

- [ ] Native iOS and Android apps
- [ ] Push notifications for new feedback
- [ ] Quick response from mobile
- [ ] Photo/video response capability
- [ ] Offline mode with sync

---

## 🙏 Acknowledgments

- **Twilio** - SMS delivery platform
- **Resend** - Email delivery platform
- **Sequelize** - Powerful ORM for Node.js
- **Docker** - Containerization technology
- **Let's Encrypt** - Free SSL certificates
- **Node.js Community** - Amazing ecosystem

---

**Built with ❤️ by the FilterFive Team**

[Website](https://filterfive.io) | [GitHub](https://github.com/kreaktive/FilterFive.io) | [Support](mailto:support@filterfive.io)
