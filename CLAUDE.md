# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
MoreStars is a B2B SaaS reputation management platform helping businesses get more Google reviews through SMS and QR code campaigns. The app intercepts customer feedback via SMS and QR codes, directing 4-5 star reviews to public platforms (Google/Facebook) while privately capturing 1-3 star feedback.

## Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Views**: EJS templates with Tailwind CSS
- **SMS**: Twilio (Messaging Service)
- **Payments**: Stripe (subscriptions)
- **Email**: Resend (transactional email)
- **POS Integrations**: Square, Shopify
- **Queue**: Bull with Redis
- **Cache**: Redis (ioredis)
- **Auth**: Express sessions with PostgreSQL store
- **CMS**: Sanity (blog content)

## Common Commands

```bash
# Development
npm run dev                 # Start with nodemon (hot reload)
npm start                   # Start production server

# Docker (development)
docker compose up -d            # Start all services
docker compose logs -f app      # Follow app logs (Ctrl+C to stop)
docker compose exec app sh      # Shell into container
docker compose restart app      # Restart container (use after CSS/config changes)
docker compose down             # Stop all containers

# Docker (production)
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs --tail=50 app

# Database
npm run db:migrate          # Run all pending migrations
npm run db:sync             # Sync models (dev only)
npm run db:seed             # Seed demo data

# Testing
npm test                    # Run all tests
npm run test:unit           # Run unit tests only
npm run test:integration    # Run integration tests only
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report
npm test -- --testNamePattern="should validate"  # Run tests matching pattern
npm test -- tests/services/validationService.test.js  # Run single file

# Build
npm run build               # Build all (CSS + JS)
npm run build:css           # Compile Tailwind CSS
npm run build:js            # Minify homepage JS

# Admin
npm run set:superadmin      # Promote user ID 1 to super admin
npm run validate:env        # Validate environment variables
```

## Docker Development Workflow

### The ONE Command (Do This Always)

```bash
# AGGRESSIVE REBUILD - Clears cache, rebuilds everything fresh
docker compose down && docker volume prune -f && docker compose build --no-cache app && docker compose up -d app
```

**This is the ONLY command you need to know.** No variations. No shortcuts. Same command every time.

**Why?**
- `docker compose down` - Stops and removes all containers
- `docker volume prune -f` - Clears old data volumes (ensures clean slate)
- `docker compose build --no-cache` - **Forces rebuild** (ignores cached layers)
- `docker compose up -d app` - Starts fresh

**Result:** CSS/JS/config always in sync. Clean state. No guessing. Worth 30 seconds beats debugging stale files for hours.

### What Gets Rebuilt Automatically

Each time you run the aggressive rebuild:

| File Type | Result |
|-----------|--------|
| `.ejs` templates | ✅ Fresh copy |
| `src/config/designTokens.js` | ✅ New values used during build |
| `src/css/*.css` | ✅ Recompiled |
| `public/css/tailwind.css` | ✅ Regenerated from tokens |
| `public/js/*.min.js` | ✅ Minified from fresh source |
| `.js` in `src/` | ✅ Fresh copy |
| Environment variables | ✅ Fresh container |
| Database | ✅ Resets (fresh migrations run) |

### Debugging Tips
```bash
# Watch logs in real-time
docker compose logs -f app

# Check which containers are running
docker compose ps

# Stop everything
docker compose down

# View recent container errors
docker compose logs app | tail -50
```

### Docker Gotcha: restart vs down && up

**CRITICAL:** `docker compose restart` does NOT reload environment variables.

```bash
# ❌ WRONG - Reuses container with cached .env values
docker compose restart app

# ✅ CORRECT - Fully removes container and creates fresh one
docker compose down && docker compose up -d app
```

**Why?**
- `restart` stops and starts the same container instance
- Environment variables are baked into the container when created
- Changing `.env` has no effect until you remove and recreate the container
- This is a common Docker gotcha that wastes debugging time

**Rule:** Anytime you change `.env` values, always use `down` then `up` (or the aggressive rebuild command above).

## Project Architecture

### Request Flow
1. Request enters through `app.js`
2. Security middleware (Helmet, CORS, rate limiting)
3. Session middleware (PostgreSQL-backed sessions)
4. CSRF protection (except webhooks)
5. Route handler → Controller → Service → Model
6. EJS template rendering or JSON response

### Critical Middleware Order in app.js
```
1. Sentry (error tracking) - must be FIRST
2. Request ID (for tracing)
3. CSP nonce generation
4. Helmet (security headers)
5. Compression
6. CORS
7. Morgan (logging)
8. Webhook routes - BEFORE body parser (need raw body)
9. Body parser (JSON, URL-encoded)
10. Session middleware
11. CSRF protection
12. Domain routing
13. Application routes
14. Error handlers - must be LAST
```

### Model Relationships (src/models/index.js)
- User hasMany FeedbackRequest, Review, CsvUpload, AnalyticsSnapshot, SmsEvent
- FeedbackRequest hasOne Review, hasMany SmsEvent
- PosIntegration hasMany PosLocation, PosTransaction

### Key Services
| Service | Purpose |
|---------|---------|
| smsService.js | Twilio SMS with circuit breaker pattern |
| stripeService.js | Subscription management, webhooks |
| analyticsService.js | Dashboard metrics aggregation |
| cacheService.js | Redis caching with fallback |
| emailService.js | Resend transactional email |
| validationService.js | Phone/email validation |

### Route Structure
| Path | Purpose |
|------|---------|
| `/` | Marketing pages |
| `/dashboard/*` | Tenant dashboard (auth required) |
| `/api/v1/hooks/*` | Zapier/webhook ingest |
| `/webhooks/*` | Stripe webhooks |
| `/api/webhooks/*` | POS webhooks (Square, Shopify) |
| `/review/:uuid` | Customer review submission |
| `/qr/:uuid` | QR code feedback |
| `/admin/*` | Super admin (role check) |

## Coding Conventions

### Models
- camelCase for JavaScript field names
- snake_case for database columns (Sequelize `underscored: true`)
- Foreign keys: `userId`, `feedbackRequestId`, etc.

### Controllers
- Thin controllers - delegate to services
- Return early on validation errors
- Use try/catch with logger.error()

### Services
- Business logic lives in services
- Exported as singletons: `module.exports = new ServiceClass()`
- Never access req/res directly

### Authentication
- Session-based auth in PostgreSQL
- User ID in `req.session.userId`
- `isAuthenticated` middleware for protected routes
- `superAuth` middleware for admin routes

### CSRF Protection
- All forms need `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`
- Token provided via `provideCsrfToken` middleware
- Exempt paths: webhooks, health checks

## Testing

### Test Structure
```
tests/
├── setup.js              # Global setup, mocks
├── services/             # Service unit tests
├── controllers/          # Controller tests
├── middleware/           # Middleware tests
└── integration/          # Full request/response tests
```

### Mocking External Services
```javascript
// In tests/setup.js or individual tests
jest.mock('../src/services/smsService');
jest.mock('../src/services/stripeService');
```

## Environment Variables

### Required (validated at startup via envValidator.js)
- `SESSION_SECRET` - min 32 chars
- `API_SECRET` - min 32 chars
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`

### External Services
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `REDIS_URL` - enables caching and Bull queues

### Feature Flags
- `ENABLE_CRON=true` - enables daily snapshot cron
- `NODE_ENV=production` - production mode

## Database

### Running Migrations
```bash
# Local
npm run db:migrate

# Docker dev
docker compose exec app npm run db:migrate

# Production
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Key Indexes
- FeedbackRequest: userId, deliveryMethod, createdAt
- Review: userId, feedbackRequestId, rating
- SmsEvent: userId, feedbackRequestId
- User: email (unique)

## Deployment

### Remote Deployment (Production Server)

**CRITICAL REQUIREMENTS:**
1. ✅ Always use SSH keys (never attempt password auth first)
2. ✅ **ALWAYS use force-deploy for configuration changes** (restart is not enough)
3. ✅ Verify server-side changes before considering deployment done
4. ✅ Force browser cache clear on client side after deployment

**SSH Key Location:** `~/.ssh/filterfive_ed25519`

**Server Details:**
- Domain: `morestars.io`
- IP: `31.97.215.238`
- User: `root`
- Path: `/root/FilterFive`

**Deploy Configuration Changes (Force-Deploy Required):**

For CSP, middleware, or any config changes that need immediate effect, ALWAYS use hard container restart (not soft restart):

```bash
# 1. Deploy the file
scp -i ~/.ssh/filterfive_ed25519 src/middleware/cspNonce.js root@31.97.215.238:/root/FilterFive/src/middleware/cspNonce.js

# 2. FORCE-DEPLOY: Stop, remove, and restart container (required for config changes)
ssh -i ~/.ssh/filterfive_ed25519 root@31.97.215.238 "
cd /root/FilterFive

# STOP the old container
docker compose -f docker-compose.prod.yml stop app

# REMOVE it completely (don't just restart - this forces fresh start)
docker compose -f docker-compose.prod.yml rm -f app

# START fresh container
docker compose -f docker-compose.prod.yml up -d app

# Wait and verify
sleep 5
docker compose -f docker-compose.prod.yml logs --tail=20 app
"

# 3. Verify the change took effect
ssh -i ~/.ssh/filterfive_ed25519 root@31.97.215.238 "cat /root/FilterFive/src/middleware/cspNonce.js | grep -A10 'connectSrc:'"
```

**Why Force-Deploy is Required:**
- Simple `restart` reuses cached app process state
- Config changes (CSP, headers, env) need fresh Node.js initialization
- Container removal ensures clean state before restart
- Always verify file content AND restart behavior

**Full Build & Deploy (Code Changes):**

⚠️ **`--no-cache` is MANDATORY** — without it, Docker serves stale cached files and your changes won't appear.

```bash
# SSH into server
ssh -i ~/.ssh/filterfive_ed25519 root@31.97.215.238

# Then on server:
cd /root/FilterFive
docker compose -f docker-compose.prod.yml build --no-cache app && docker compose -f docker-compose.prod.yml up -d app
docker compose -f docker-compose.prod.yml logs --tail=50 app
```

The extra ~30-60s build time beats hours debugging "why didn't my change deploy?"

**Post-Deployment Client Actions (Important!):**
After server deployment completes, users must clear their browser cache:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. Clear site data: DevTools → Application → Clear all site data
3. Close and reopen browser tab
4. Verify new headers are served (Network tab, Response headers)

### Local Production Deploy
```bash
# Build and deploy
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app

# Run migrations
docker compose -f docker-compose.prod.yml exec app npm run db:migrate

# Check logs
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

### Health Checks
- `GET /health` - Database connectivity
- `GET /health/sms` - Twilio circuit breaker status

## Common Tasks

### Adding a New Route
1. Create route in `src/routes/`
2. Create controller in `src/controllers/`
3. Add business logic in `src/services/`
4. Register route in `app.js` (mind middleware order!)
5. Add tests in `tests/`

### Adding a New Model
1. Create model in `src/models/`
2. Add to exports in `src/models/index.js`
3. Define associations in `src/models/index.js`
4. Create migration in `src/migrations/`
5. Add indexes for frequently queried columns

### Testing Webhooks Locally
```bash
ngrok http 3000
# Update webhook URLs in Stripe/Square/Shopify dashboards
```
