# FilterFive.io

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**FilterFive** is a B2B SaaS platform that helps businesses protect and enhance their online reputation by intelligently filtering customer feedback. It intercepts all customer reviews via SMS before they reach public platforms like Google or Facebook, automatically directing 4-5 star reviews to public sites while privately capturing 1-3 star feedback for internal resolution—preventing negative reviews from ever appearing online.

---

## ✨ Features

- **🎯 Smart Feedback Filtering** - 4-5 star reviews go public (Google/Facebook), 1-3 stars stay private
- **📱 SMS Automation** - Twilio-powered SMS delivery with A2P 10DLC compliance
- **📱 QR Code Feedback** - Anonymous in-person feedback via scannable QR codes
- **⚡ Real-Time Email Alerts** - Instant notifications for negative feedback via Resend
- **🏢 Multi-Tenant Architecture** - Isolated data per business with role-based access control
- **🔗 Zapier Integration** - Ingest customer contacts from 5,000+ apps via webhook
- **📊 Tenant Dashboard** - View all feedback requests, reviews, and analytics with QR code access
- **🔒 Secure by Design** - UUID-based review links, password hashing, session management
- **🐳 Docker Ready** - Fully containerized for easy development and deployment

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
- **Stripe** _(Planned)_ - Subscription payment processing

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
├── Dockerfile                      # Development container definition
├── Dockerfile.production           # Optimized production build
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── .dockerignore                   # Docker ignore rules
├── deploy.sh                       # Automated production deployment script
├── DEPLOYMENT.md                   # Comprehensive deployment guide
├── AI_CONTEXT.md                   # Technical documentation for AI/developers
├── README.md                       # This file
│
├── src/
│   ├── config/
│   │   ├── database.js             # Sequelize connection and configuration
│   │   └── migrations.js           # Database schema sync script
│   │
│   ├── models/
│   │   ├── index.js                # Model relationships and associations
│   │   ├── User.js                 # Tenant/Admin model (bcrypt hooks)
│   │   ├── FeedbackRequest.js      # SMS request tracking with UUID
│   │   └── Review.js               # Customer ratings and feedback
│   │
│   ├── controllers/
│   │   ├── authController.js       # Registration, login, logout
│   │   ├── dashboardController.js  # Tenant dashboard with stats
│   │   ├── reviewController.js     # Public review capture interface
│   │   ├── zapierController.js     # Webhook for Zapier integration
│   │   └── adminController.js      # Super admin tenant management
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # /register, /login, /logout
│   │   ├── dashboardRoutes.js      # /dashboard/* (protected)
│   │   ├── reviewRoutes.js         # /review/:uuid (public)
│   │   ├── zapierRoutes.js         # /api/zapier/ingest (webhook)
│   │   └── adminRoutes.js          # /admin/* (super admin only)
│   │
│   ├── middleware/
│   │   ├── auth.js                 # Session authentication check
│   │   └── superAuth.js            # Super admin role verification
│   │
│   ├── services/
│   │   ├── smsService.js           # Twilio SMS sending
│   │   ├── emailService.js         # Resend email notifications
│   │   └── ingestionEngine.js      # Process Zapier/CSV contacts
│   │
│   ├── scripts/
│   │   ├── testEmail.js            # Debug email integration
│   │   ├── setSuperAdmin.js        # Promote user to super_admin
│   │   └── seed.js                 # Create demo user/data
│   │
│   ├── views/                      # EJS templates
│   │   ├── landing_marketing.ejs   # Public homepage
│   │   ├── register.ejs            # Tenant registration
│   │   ├── login.ejs               # Login page
│   │   ├── dashboard.ejs           # Tenant dashboard
│   │   ├── settings.ejs            # Account settings
│   │   ├── review-form.ejs         # Customer review capture
│   │   ├── review-thank-you.ejs    # Post-submission page
│   │   ├── admin/
│   │   │   ├── dashboard.ejs       # Super admin tenant list
│   │   │   └── create.ejs          # Create new tenant form
│   │   └── partials/
│   │       ├── header.ejs          # Navbar component
│   │       ├── footer.ejs          # Footer component
│   │       └── error.ejs           # Error page template
│   │
│   └── utils/
│       └── helpers.js              # Utility functions
│
└── public/                         # Static assets
    ├── css/
    │   └── styles.css              # Global styles
    ├── js/
    │   └── main.js                 # Client-side JavaScript
    └── images/
        └── logo.png                # Brand assets
```

---

## 🗄 Database Setup

FilterFive uses **PostgreSQL 15** with **Sequelize ORM**. The database schema includes three main tables:

### Users Table
- **Purpose:** Stores tenant accounts and super admins
- **Key Fields:** email, password (bcrypt hashed), businessName, role, subscriptionStatus
- **Special Features:**
  - Automatic password hashing via Sequelize `beforeCreate` hook
  - `comparePassword()` instance method for login verification
  - `isActive` flag for soft deletion

### FeedbackRequests Table
- **Purpose:** Tracks each SMS sent to customers
- **Key Fields:** uuid (public link), customerName, phone, status, source
- **Security:** Uses UUID v4 to prevent ID enumeration attacks
- **Status Flow:** pending → sent → clicked → rated → expired

### Reviews Table
- **Purpose:** Stores customer feedback and ratings
- **Key Fields:** rating (1-5), comment, redirectedTo, isPublic, emailSentAt
- **Logic:** 4-5 stars = `isPublic: true`, 1-3 stars = `isPublic: false`

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
| `RESEND_FROM_EMAIL` | Verified sender email | `noreply@yourdomain.com` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key _(Optional)_ | `sk_test_xxxxxxxxxxxxxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key _(Optional)_ | `pk_test_xxxxxxxxxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret _(Optional)_ | `whsec_xxxxxxxxxxxxxxxx` |
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

- **Documentation:** [AI_CONTEXT.md](./AI_CONTEXT.md) - Complete technical guide
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md) - Production setup
- **Issues:** [GitHub Issues](https://github.com/kreaktive/FilterFive.io/issues) - Report bugs
- **Email:** support@filterfive.io - General inquiries

---

## 🗺 Roadmap

### Current Version: v1.1.0

**✅ Completed Features:**
- Multi-tenant authentication system
- SMS feedback request delivery (Twilio)
- QR code feedback system (anonymous in-person reviews)
- Tenant QR code dashboard page with download/print/copy functionality
- Smart rating filter (4-5 stars → public, 1-3 stars → private)
- Email alerts for negative feedback (Resend)
- Tenant dashboard with statistics
- Super admin interface for manual tenant onboarding
- Zapier webhook integration
- Docker containerization
- Production deployment infrastructure

### Planned Features:

**v1.2.0 - Stripe Integration**
- [ ] Subscription payment processing
- [ ] Self-service tenant registration with trial period
- [ ] Automatic subscription status updates
- [ ] Invoice generation and payment history

**v1.3.0 - CSV Upload**
- [ ] Bulk customer import via CSV
- [ ] Validation and duplicate detection
- [ ] Batch SMS sending with rate limiting
- [ ] Import history and error logs

**v1.4.0 - Analytics Dashboard**
- [ ] Response rate metrics
- [ ] Average rating trends
- [ ] Customer feedback sentiment analysis
- [ ] Export reports (PDF/CSV)

**v1.5.0 - AI-Powered Insights**
- [ ] Natural language processing for feedback categorization
- [ ] Automated response suggestions for negative reviews
- [ ] Predictive analytics for customer satisfaction

**v2.0.0 - Mobile App**
- [ ] Native iOS and Android apps
- [ ] Push notifications for new feedback
- [ ] Quick response templates
- [ ] Offline mode

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
