# Project Name: FilterFive
# Tech Stack: Node.js, Express, EJS (Templating), Docker, PostgreSQL.
# External Services: Twilio (SMS), Stripe (Checkout), Resend (Email).

## 1. Project Overview
FilterFive is a B2B SaaS reputation management tool. It intercepts customer feedback via SMS.
- High ratings (4-5 stars) -> Redirect to Google Review Link.
- Low ratings (1-3 stars) -> Capture internal feedback form to prevent public bad press.

## 2. User Roles
1. **Super Admin:** Manages tenants, views global stats. Uses a single Master Twilio account.
2. **Tenant (Business Owner):** - Dashboard: Views analytics (Sent/Clicked/Rated).
   - Config: Enters "Google Review Link" and "Facebook Link".
   - Billing: 6 or 12-month Stripe subscription.
3. **End Customer:** - Receives SMS.
   - Interacts with the "Rating Interface" (Mobile web view).

## 3. Core Workflows
### A. The Trigger
- Tenant sends customer data via Zapier Webhook or CSV Upload.
- System creates a "Feedback Request" record in DB with a unique UUID.

### B. The Distribution
- System sends SMS via Twilio: "How did we do? [link]"
- Link format: `app.filterfive.com/review/[UUID]` (Link does not expire).

### C. The Filter Logic (The "EJS" Views)
1. **Landing Page:** Simple 1-5 Star selector.
2. **Logic Branch:**
   - **4-5 Stars:** Redirect to Tenant's Google Link. 
     - *Fallback:* If no Google link, try Facebook. 
     - *Fallback:* If neither, show "Thank You" page.
   - **1-3 Stars:** Show Feedback Form ("Tell us what went wrong").
     - Submit -> Save to DB -> Email Tenant via Resend.

## 4. Technical Constraints
- **Database:** PostgreSQL.
- **Frontend:** EJS (Server-side rendering).
- **Docker:** Must define `app` and `db` services in docker-compose.