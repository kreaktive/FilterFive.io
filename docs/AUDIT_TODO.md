# MoreStars Codebase Audit - TODO List

**Audit Date:** December 12, 2025
**Total Findings:** 29 issues across security, dead code, and technical debt

---

## PHASE 1: CRITICAL SECURITY (0-24 hours)

### 1.1 [CRITICAL] Rotate Exposed Production Credentials
- [ ] **File:** `.env.production` (committed to repo)
- [ ] **Issue:** Production secrets exposed - Twilio, Resend API keys, DB passwords, reCAPTCHA secret
- [ ] **Actions:**
  - [ ] Rotate Twilio API credentials
  - [ ] Rotate Resend API key
  - [ ] Change database passwords
  - [ ] Regenerate reCAPTCHA secret
  - [ ] Rotate SESSION_SECRET
  - [x] Remove `.env.production` from git history (`git filter-branch` or BFG) ✅ Not in git history
  - [x] Add `.env.production` to `.gitignore` ✅ Already present
  - [ ] Consider using secrets manager (Doppler, AWS Secrets Manager)
- [ ] **Effort:** 2-3 hours

### 1.2 [CRITICAL] Add sameSite Cookie Attribute ✅ DONE
- [x] **File:** `app.js` (lines 56-60)
- [x] **Issue:** Session cookies vulnerable to CSRF attacks
- [x] **Fix:** Added `sameSite: 'Lax'` to cookie configuration
- [x] **Effort:** 5 minutes

### 1.3 [HIGH] Fix Undefined Variable in Ingest Controller ✅ DONE
- [x] **File:** `src/controllers/ingestController.js` (lines 59-61)
- [x] **Issue:** Uses `user.businessName` but variable is named `tenant` - causes crashes
- [x] **Fix:** Changed `user.businessName` → `tenant.businessName` and `user.smsMessageTone` → `tenant.smsMessageTone`
- [x] **Effort:** 5 minutes

### 1.4 [HIGH] Fix CAPTCHA Fail-Open Vulnerability ✅ DONE
- [x] **File:** `src/middleware/captcha.js` (lines 102-108)
- [x] **Issue:** On CAPTCHA verification error, requests pass through (fail-open)
- [x] **Fix:** Changed catch block to fail-closed - returns 500 error instead of calling next()
- [x] **Effort:** 10 minutes

---

## PHASE 2: HIGH SECURITY (1-7 days)

### 2.1 [HIGH] Enable Content Security Policy ✅ DONE
- [x] **File:** `app.js` (lines 27-40)
- [x] **Issue:** `contentSecurityPolicy: false` disables XSS protection
- [x] **Fix:** Configured proper CSP directives with reCAPTCHA and Google Fonts support
- [x] **Effort:** 1-2 hours (requires testing)

### 2.2 [HIGH] Add API Secret Validation Check ✅ DONE
- [x] **File:** `app.js` (lines 21-25)
- [x] **Issue:** Need to verify `API_SECRET` env var is never empty
- [x] **Fix:** Added startup validation - app exits if API_SECRET missing or < 32 chars
- [x] **Effort:** 15 minutes

### 2.3 [MEDIUM] Implement CSRF Protection ⏭️ SKIPPED
- [ ] **Files:** All view templates with forms
- [ ] **Issue:** Forms lack CSRF tokens
- [ ] **Note:** Skipped - `csurf` package is deprecated. Consider `csrf-csrf` or similar alternative in future.
- [ ] **Effort:** 2-4 hours

### 2.4 [MEDIUM] Add Rate Limiting to Ingest API ✅ DONE
- [x] **File:** `src/routes/ingest.js` (lines 6-15, 39)
- [x] **Issue:** No rate limiting per API key/tenant
- [x] **Fix:** Added per-API-key rate limiter (100 req/min)
- [x] **Effort:** 30 minutes

### 2.5 [MEDIUM] Validate Date Parameters in Analytics ✅ DONE
- [x] **File:** `src/controllers/analyticsController.js` (lines 79-84, 156-161, 194-199)
- [x] **Issue:** Date parameters not validated before database queries
- [x] **Fix:** Added date validation to getMetrics, getComparison, getSmsEvents
- [x] **Effort:** 30 minutes

### 2.6 [MEDIUM] Reduce Session Cookie Duration ⏭️ REVERTED
- [ ] **File:** `app.js` (line 76)
- [ ] **Issue:** 7-day session cookies increase hijacking window
- [ ] **Note:** Reverted to 7 days per user request for better UX
- [ ] **Effort:** 5 minutes

### 2.7 [MEDIUM] Exclude Sensitive Fields from JSON ✅ DONE
- [x] **File:** `src/models/User.js` (lines 211-220)
- [x] **Issue:** No `toJSON()` override to exclude tokens
- [x] **Fix:** Added toJSON method excluding password and all token fields
- [x] **Effort:** 15 minutes

### 2.8 [MEDIUM] Enhance Password Validation ✅ DONE
- [x] **File:** `src/services/validationService.js` (lines 16-39, 97-99, 129-131)
- [x] **Issue:** Only requires 8 chars + 1 digit
- [x] **Fix:** Now requires: 8+ chars, uppercase, lowercase, number, special char
- [x] **Effort:** 30 minutes (includes updating error messages)

---

## PHASE 3: DEAD CODE CLEANUP (1-2 weeks)

### 3.1 [MEDIUM] Fix CSS File Naming Mismatch ✅ DONE
- [x] **Issue:** Upload views reference `/css/styles.css` but file is `/public/css/style.css`
- [x] **Fix:** Renamed `public/css/style.css` to `public/css/styles.css`
- [x] **Effort:** 15 minutes

### 3.2 [LOW] Delete Unused Service File ✅ DONE
- [x] **File:** `src/services/verificationService.js`
- [x] **Issue:** Never imported anywhere - logic duplicated in authController
- [x] **Action:** Deleted file
- [x] **Effort:** 5 minutes

### 3.3 [LOW] Delete Orphaned View File ✅ DONE
- [x] **File:** `src/views/dashboard/index-old.ejs`
- [x] **Issue:** Never rendered - deprecated backup
- [x] **Action:** Deleted file
- [x] **Effort:** 5 minutes

### 3.4 [LOW] Remove Deprecated Email Function ✅ DONE
- [x] **File:** `src/services/emailService.js`
- [x] **Issue:** `sendNegativeFeedbackAlert()` marked DEPRECATED, unused
- [x] **Action:** Removed function and export
- [x] **Effort:** 15 minutes

### 3.5 [LOW] Remove Unused Database Fields ⏭️ SKIPPED
- [ ] **File:** `src/models/User.js` (lines 151-162)
- [ ] **Fields:** `managerAlertPhone`, `managerAlertEnabled`
- [ ] **Note:** Skipped per user request - feature will be added soon
- [ ] **Effort:** 30 minutes

### 3.6 [LOW] Remove Legacy Form Field Handling ✅ DONE
- [x] **File:** `src/controllers/dashboardController.js` (lines 349, 369-373)
- [x] **Issue:** Still accepting `googleReviewLink`, `facebookLink` despite migration
- [x] **Action:** Removed legacy fields from destructuring and update logic
- [x] **Effort:** 15 minutes

### 3.7 [LOW] Clean macOS Artifact Files ✅ DONE
- [x] **Issue:** `.DS_Store` files throughout repository
- [x] **Action:**
  - [x] Added `._*` to `.gitignore`
  - [x] Removed all `.DS_Store` and `._*` files
- [x] **Effort:** 15 minutes

---

## PHASE 4: TECHNICAL DEBT (2-4 weeks)

### 4.1 [MEDIUM] Implement Cron Error Alerting ✅ DONE
- [x] **File:** `src/cron/daily-snapshots.js`
- [x] **Issue:** `// TODO: Send error alert to admin` - errors not reported
- [x] **Fix:**
  - [x] Added `adminAlertEmail` template to `emailTemplates.js`
  - [x] Added `sendAdminAlert()` function to `emailService.js`
  - [x] Updated cron job to send email alerts on failure
- [x] **Effort:** 1 hour

### 4.2 [MEDIUM] Implement Per-Tenant API Keys ✅ DONE
- [x] **File:** `src/routes/ingest.js`, `src/models/User.js`
- [x] **Issue:** Single shared API secret for all tenants
- [x] **Actions:**
  - [x] Added `apiKey` field to User model
  - [x] Created migration `010-add-per-tenant-api-keys.js`
  - [x] Auto-generate unique API keys on user creation (prefix: `ff_`)
  - [x] Updated authentication middleware with backward compatibility
  - [x] Added `regenerateApiKey()` method to User model
  - [x] Added `/dashboard/api-key/regenerate` endpoint
- [x] **Effort:** 4-6 hours

### 4.3 [LOW] Migrate to Structured Logging ✅ DONE
- [x] **Files:** `src/services/logger.js` (new), `app.js`, `src/cron/daily-snapshots.js`
- [x] **Issue:** Production logging via console.log
- [x] **Fix:**
  - [x] Installed Winston logging library
  - [x] Created centralized `logger.js` service with:
    - Console transport (colorized for dev, JSON for prod)
    - File transports for error.log and combined.log (production)
    - Helper methods: `logger.cron()`, `logger.sms()`, `logger.auth()`, `logger.stripe()`
  - [x] Integrated with Morgan for HTTP request logging
  - [x] Updated app.js and cron job to use structured logging
- [x] **Effort:** 3-4 hours

---

## VERIFICATION CHECKLIST

After completing all fixes, verify:

- [ ] All credentials rotated and working
- [ ] Session cookies have sameSite attribute
- [ ] Ingest API works for all tenants (no undefined errors)
- [ ] CAPTCHA fails closed on errors
- [ ] CSP enabled without breaking functionality
- [ ] CSS loads correctly on upload pages
- [ ] All tests pass
- [ ] Production deployment successful

---

## FILES SUMMARY

### Files to DELETE:
| File | Reason |
|------|--------|
| `src/services/verificationService.js` | Never imported |
| `src/views/dashboard/index-old.ejs` | Never rendered |
| 46x `._*` files | macOS artifacts |
| `.DS_Store` files | macOS artifacts |

### Files Requiring IMMEDIATE Fixes:
| File | Lines | Fix Required |
|------|-------|--------------|
| `app.js` | 56-60 | Add sameSite cookie |
| `src/controllers/ingestController.js` | 59-61 | Fix user→tenant variable |
| `src/middleware/captcha.js` | 102-108 | Fail closed not open |

### Files Requiring Security Updates:
| File | Issue |
|------|-------|
| `app.js` | Enable CSP, reduce session duration |
| `src/routes/ingest.js` | Add rate limiting, validate API_SECRET |
| `src/controllers/analyticsController.js` | Validate date parameters |
| `src/models/User.js` | Add toJSON exclusions |
| `src/services/validationService.js` | Strengthen password policy |

---

## ESTIMATED EFFORT

| Phase | Time Estimate |
|-------|---------------|
| Phase 1: Critical Security | 2-4 hours |
| Phase 2: High Security | 4-8 hours |
| Phase 3: Dead Code Cleanup | 2-3 hours |
| Phase 4: Technical Debt | 8-12 hours |
| **Total** | **16-27 hours** |

---

## NOTES

- All line numbers verified against current codebase
- Security issues prioritized by risk level
- Dead code findings are low risk but improve maintainability
- Per-tenant API keys is a larger refactor but important for multi-tenant security
