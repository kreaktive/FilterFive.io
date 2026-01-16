# MoreStars Holistic Audit Plan

**Date:** December 13, 2025
**Status:** Ready for Implementation

---

## PART 1: BRAND RENAME (MoreStars → MoreStars)

### 1.1 Summary
**521 total references** found across the codebase that need updating.

### 1.2 Configuration Files

| File | Changes Required |
|------|------------------|
| `.env` | `APP_URL`, `API_SECRET`, `DB_NAME`, `DB_PASSWORD` |
| `.env.example` | Comments, `DB_NAME`, `DB_USER` |
| `.env.production` | `DB_NAME`, `DB_USER` |
| `.env.production.example` | Comments, `DB_NAME`, `DB_USER` |
| `package.json` | `"name": "filterfive"` → `"name": "morestars"` |
| `package-lock.json` | Multiple name entries |

### 1.3 Docker Configuration

| File | Changes Required |
|------|------------------|
| `docker-compose.yml` | Container names: `filterfive_app` → `morestars_app`, `filterfive_db` → `morestars_db`, `filterfive_redis` → `morestars_redis`, Network: `filterfive-network` → `morestars-network` |
| `docker-compose.prod.yml` | Same pattern for prod containers |

### 1.4 Source Code

| File | Changes |
|------|---------|
| `public/js/homepage.js` | Console branding, career email |
| `public/css/styles.css` | Comment header |
| `public/css/homepage.css` | Comment header |
| `src/services/shopifyOAuthService.js` | JSDoc comments (userId references) |
| `src/services/squareOAuthService.js` | JSDoc comments |
| `src/services/stripeService.js` | Price ID comment |
| `setup-stripe-live.js` | Product names for Stripe |
| `create-stripe-prices.js` | Console messages |

### 1.5 Domain & Email References

**All instances of:**
- `filterfive.io` → `morestars.io`
- `info@morestars.io` → `info@morestars.io`
- `support@morestars.io` → `support@morestars.io`
- `ops@morestars.io` → `ops@morestars.io`
- `careers@morestars.io` → `careers@morestars.io`

### 1.6 Documentation Files (40+ files)

**Priority files:**
- `README.md` - Main project documentation
- `OPS.md` - Operations manual (150+ references)
- `docs/privacy-policy.md`
- `docs/terms-of-service.md`
- `docs/sms-compliance.md`

### 1.7 API Key Prefix Decision

**Current:** `ff_` prefix for per-tenant API keys
**Decision needed:** Keep `ff_` or change to `ms_`?

**Recommendation:** Keep `ff_` for now (no users yet, but simpler)

---

## PART 2: SECURITY AUDIT FINDINGS

### 2.1 CRITICAL Issues

| # | Issue | File | Line | Fix |
|---|-------|------|------|-----|
| 1 | **Missing CSRF Protection** | app.js | 30-43 | Add `csurf` middleware |
| 2 | **Stripe Webhook Parsing Bug** | subscriptionController.js | 254-281 | Use `express.raw()` for webhook route |
| 3 | **Legacy API Key Vulnerability** | src/routes/ingest.js | 62-72 | REMOVE legacy `API_SECRET` fallback |

### 2.2 HIGH Severity Issues

| # | Issue | File | Line | Fix |
|---|-------|------|------|-----|
| 4 | XSS in Custom SMS Message | User.js | 52-56 | Sanitize template variables |
| 5 | Path Traversal in Upload | uploadController.js | 24-36 | Sanitize filename |
| 6 | Sensitive Data in Logs | stripeService.js | 94-100 | Remove priceId, customerId from logs |
| 7 | Password Reset Token Plain | authController.js | 74-75 | Hash tokens in DB |
| 8 | DB Credentials in Session | app.js | 71-76 | Use DATABASE_URL env var |
| 9 | Webhook Fallback (Square) | squareWebhookService.js | 25-51 | Fail in production if key missing |
| 10 | Webhook Fallback (Shopify) | shopifyWebhookService.js | 23-47 | Fail in production if key missing |
| 11 | Info Disclosure in Errors | subscriptionController.js | 100-104 | Generic error messages |
| 12 | Weak Role Enforcement | superAuth.js | 26-33 | Add granular permissions |

### 2.3 MEDIUM Severity Issues

| # | Issue | File | Fix |
|---|-------|------|-----|
| 13 | Session Cookie Config | app.js:70-86 | Use `sameSite: 'Strict'`, reduce maxAge |
| 14 | Email Validation Weak | validationService.js | Use RFC 5322 regex |
| 15 | Phone Validation Missing | csvValidator.js | Add libphonenumber-js |
| 16 | Missing Timeouts | Multiple | Add axios timeout: 10000 |
| 17 | Overly Permissive CORS | app.js:44 | Whitelist origins |
| 18 | Unsafe CSP Directive | app.js:34 | Remove 'unsafe-inline' |
| 19 | No Audit Logging | Entire app | Add AuditLog model |
| 20 | Auto-login After Verify | authController.js:197 | Require explicit login |

---

## PART 3: OPERATIONAL AUDIT FINDINGS

### 3.1 CRITICAL Issues

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | **No Graceful Shutdown** | app.js | Add SIGTERM/SIGINT handlers |
| 2 | **No Health Endpoint** | app.js | Add `/health` route |

### 3.2 HIGH Severity Issues

| # | Issue | File | Fix |
|---|-------|------|-----|
| 3 | N+1 Query Patterns | analyticsService.js | Add eager loading |
| 4 | No Transaction Safety | uploadController.js:485 | Wrap bulk ops in transaction |
| 5 | SSE Stream Memory Leak | uploadController.js:13 | Add timeout cleanup |
| 6 | No Request Timeout | app.js | Add global 30s timeout |
| 7 | Incomplete Env Validation | app.js | Validate all required vars |
| 8 | No Retry Logic | smsService.js | Add async-retry |
| 9 | No Circuit Breaker | All external calls | Add opossum |
| 10 | Limited Error Alerting | cron only | Expand to all critical failures |

### 3.3 MEDIUM Severity Issues

| # | Issue | File | Fix |
|---|-------|------|-----|
| 11 | DB Pool Too Small | database.js:13-18 | max: 5 → max: 20 |
| 12 | No Pool Validation | database.js | Add validate callback |
| 13 | Queue No Retry | posSmsQueue.js | attempts: 1 → 3 |
| 14 | No DLQ for Queue | posSmsQueue.js | Add dead letter handling |
| 15 | Console.log Scattered | uploadController.js | Replace with logger |
| 16 | No Request ID | app.js | Add UUID per request |
| 17 | Cron Not Cancellable | daily-snapshots.js | Return task reference |

---

## PART 4: IMPLEMENTATION PLAN

### Phase 1: Brand Rename (Day 1)
1. Update all configuration files (.env*, package.json)
2. Update docker-compose files
3. Update source code comments and strings
4. Update documentation files
5. **Do NOT change API key prefix** (`ff_` stays)

### Phase 2: Critical Security (Day 1)
1. Remove legacy API_SECRET fallback in `src/routes/ingest.js`
2. Fix Stripe webhook to use raw body
3. Add CSRF protection

### Phase 3: Critical Operations (Day 1)
1. Add graceful shutdown handlers
2. Add `/health` endpoint
3. Validate all environment variables at startup

### Phase 4: High Priority Security (Day 2)
1. Add SESSION_SECRET validation (remove fallback)
2. Fix webhook verification fallbacks (Square, Shopify)
3. Sanitize error messages
4. Fix sensitive data logging

### Phase 5: High Priority Operations (Day 2)
1. Increase DB pool size (5 → 20)
2. Add request timeout (30s global)
3. Fix SSE stream memory leak
4. Add retry logic for SMS/Email

### Phase 6: Medium Priority (Week 1)
1. Input validation hardening
2. CORS configuration
3. Audit logging
4. Queue improvements

### Phase 7: Lower Priority (Ongoing)
1. Add test framework (Jest)
2. Add API documentation
3. Circuit breakers
4. Metrics collection

---

## PART 5: FILES TO MODIFY

### Configuration
- `.env` / `.env.example` / `.env.production`
- `package.json`
- `docker-compose.yml` / `docker-compose.prod.yml`

### Core Application
- `app.js` - Env validation, health endpoint, graceful shutdown, CSRF, timeout
- `src/config/database.js` - Pool size, validation

### Routes
- `src/routes/ingest.js` - Remove legacy API key
- `src/routes/webhook.js` - Raw body middleware

### Controllers
- `src/controllers/subscriptionController.js` - Webhook fix, error sanitization
- `src/controllers/uploadController.js` - Stream cleanup, transactions
- `src/controllers/authController.js` - Token hashing

### Services
- `src/services/smsService.js` - Retry logic
- `src/services/emailService.js` - Retry logic
- `src/services/squareWebhookService.js` - Remove fallback
- `src/services/shopifyWebhookService.js` - Remove fallback
- `src/services/stripeService.js` - Log sanitization

### Middleware
- `src/middleware/superAuth.js` - Permission improvements

### New Files
- `src/services/alertService.js` - Centralized alerting
- `src/models/AuditLog.js` - Audit logging

---

## DECISIONS CONFIRMED

1. **Legacy API:** REMOVE entirely (no Zapier users yet)
2. **SMS Failures:** Return 201 with `smsStatus` field
3. **Testing:** Jest + API integration tests first
4. **Review URL Whitelist:**
   - google.com
   - yelp.com
   - facebook.com
   - tripadvisor.com
   - trustpilot.com
   - bbb.org
   - healthgrades.com
   - webmd.com
   - vitals.com
5. **API Key Prefix:** Keep `ff_` (simpler, no migration needed)

---

## QUICK WINS (30 minutes total)

1. Add `/health` endpoint (5 min)
2. Add graceful shutdown (15 min)
3. Increase DB pool size (2 min)
4. Add request timeout (5 min)
5. Remove legacy API fallback (3 min)

These 5 changes address 60% of critical issues.
