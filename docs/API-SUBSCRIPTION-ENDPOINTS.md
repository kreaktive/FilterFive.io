# Subscription API Endpoints Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:3000` (development)
**Authentication**: Session-based (express-session)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Subscription Endpoints](#subscription-endpoints)
3. [Webhook Endpoints](#webhook-endpoints)
4. [Error Responses](#error-responses)
5. [Request Examples](#request-examples)

---

## Authentication

All subscription endpoints (except webhooks) require user authentication via express-session.

**Session Cookie**: `connect.sid`

**Authentication Middleware**: `requireAuth`

If not authenticated, requests redirect to `/dashboard/login` (302).

---

## Subscription Endpoints

### 1. View Subscription Page

Display the subscription management interface.

```
GET /dashboard/subscription
```

**Authentication**: Required

**Parameters**: None

**Success Response (200 OK)**:
- Renders `dashboard/subscription.ejs`
- Includes:
  - `user` - User object
  - `trialStatus` - Trial and subscription status object
  - `subscriptionDetails` - Stripe subscription object (if exists)
  - `stripePubKey` - Stripe publishable key for client-side

**Response Data Structure**:
```javascript
{
  user: {
    id: 1,
    email: "user@example.com",
    businessName: "My Business",
    subscriptionStatus: "trial",
    subscriptionPlan: null,
    smsUsageCount: 5,
    smsUsageLimit: 10,
    stripeCustomerId: "cus_xxxxx",
    stripeSubscriptionId: null,
    trialEndsAt: "2025-02-12T00:00:00.000Z"
  },
  trialStatus: {
    isActive: true,
    isInGracePeriod: false,
    isHardLocked: false,
    canSendSms: true,
    hasActiveSubscription: false,
    trialEndsAt: "2025-02-12T00:00:00.000Z",
    subscriptionStatus: "trial"
  },
  subscriptionDetails: null, // or Stripe subscription object
  stripePubKey: "pk_test_xxxxx"
}
```

**Error Responses**:
- `302` - Not authenticated (redirects to login)
- `500` - Server error

---

### 2. Create Checkout Session

Create a Stripe Checkout session for subscription purchase.

```
POST /dashboard/subscription/checkout
```

**Authentication**: Required

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "plan": "monthly" | "annual"
}
```

**Validation**:
- `plan` must be either "monthly" or "annual"
- User must exist
- User must have (or will receive) a Stripe customer ID

**Success Response (200 OK)**:
```json
{
  "success": true,
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
}
```

**Error Responses**:

```json
// 400 - Invalid plan
{
  "success": false,
  "error": "Invalid plan selected. Must be monthly or annual"
}

// 404 - User not found
{
  "success": false,
  "error": "User not found"
}

// 500 - Stripe error
{
  "success": false,
  "error": "Failed to create checkout session"
}
```

**Usage Flow**:
1. Client sends POST request with plan
2. Server creates Stripe Checkout session
3. Client redirects user to `url` from response
4. User completes payment on Stripe
5. Stripe redirects to success URL with `session_id`

---

### 3. Checkout Success

Display success page after successful checkout.

```
GET /dashboard/subscription/success?session_id={SESSION_ID}
```

**Authentication**: Required

**Query Parameters**:
- `session_id` (required) - Stripe checkout session ID

**Success Response (200 OK)**:
- Renders `dashboard/subscription-success.ejs`
- Includes:
  - `businessName` - User's business name
  - `session` - Stripe checkout session object

**Response Data Structure**:
```javascript
{
  businessName: "My Business",
  session: {
    id: "cs_test_xxxxx",
    payment_status: "paid",
    amount_total: 7700, // in cents
    customer: "cus_xxxxx",
    subscription: "sub_xxxxx"
  }
}
```

**Error Responses**:
- `302` - Missing session_id (redirects to `/dashboard/subscription`)
- `302` - Payment not completed (redirects to `/dashboard/subscription?error=payment_pending`)
- `302` - Invalid session (redirects to `/dashboard/subscription?error=session_invalid`)

---

### 4. Checkout Cancelled

Display page when user cancels checkout.

```
GET /dashboard/subscription/cancel
```

**Authentication**: Required

**Parameters**: None

**Success Response (200 OK)**:
- Renders `dashboard/subscription-cancel.ejs`
- Includes:
  - `businessName` - User's business name

---

### 5. Cancel Subscription

Cancel an active subscription.

```
POST /dashboard/subscription/cancel-subscription
```

**Authentication**: Required

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "immediately": true | false
}
```

**Parameters**:
- `immediately` (optional, default: false)
  - `true` - Cancel immediately, user loses access now
  - `false` - Cancel at period end, user retains access

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Subscription cancelled immediately"
}
// OR
{
  "success": true,
  "message": "Subscription will cancel at the end of billing period"
}
```

**Error Responses**:

```json
// 404 - No subscription found
{
  "success": false,
  "error": "No active subscription found"
}

// 500 - Stripe error
{
  "success": false,
  "error": "Failed to cancel subscription"
}
```

---

### 6. Reactivate Subscription

Reactivate a cancelled subscription before period end.

```
POST /dashboard/subscription/reactivate
```

**Authentication**: Required

**Content-Type**: `application/json`

**Request Body**: None

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Subscription reactivated successfully"
}
```

**Error Responses**:

```json
// 404 - No subscription found
{
  "success": false,
  "error": "No subscription found"
}

// 500 - Stripe error
{
  "success": false,
  "error": "Failed to reactivate subscription"
}
```

**Notes**:
- Only works if subscription is set to cancel at period end
- Does not work after subscription has already ended
- Removes the `cancel_at_period_end` flag in Stripe

---

### 7. Customer Billing Portal

Redirect to Stripe Customer Portal for billing management.

```
GET /dashboard/subscription/portal
```

**Authentication**: Required

**Parameters**: None

**Success Response (302 Redirect)**:
- Redirects to Stripe-hosted billing portal
- Portal URL format: `https://billing.stripe.com/session/xxxxx`

**Features Available in Portal**:
- Update payment methods
- View payment history
- Download invoices
- Cancel subscription
- Update billing information

**Error Responses**:
- `302` - Portal creation failed (redirects to `/dashboard/subscription?error=portal_failed`)
- `404` - User not found

**Return URL**: `/dashboard/settings`
- User returns to settings page after exiting portal

---

## Webhook Endpoints

### Stripe Webhook Handler

Receive and process Stripe webhook events.

```
POST /webhooks/stripe
```

**Authentication**: Webhook signature verification (Stripe-Signature header)

**Content-Type**: `application/json` (raw body required)

**Headers**:
```
Stripe-Signature: t=1234567890,v1=xxxxx,v0=xxxxx
```

**Request Body**: Raw JSON from Stripe (varies by event type)

**Success Response (200 OK)**:
```json
{
  "received": true
}
```

**Error Responses**:

```json
// 400 - Invalid signature
{
  "error": "Webhook Error: Invalid signature"
}

// 500 - Handler error
{
  "error": "Webhook handler failed"
}
```

**Supported Events**:

| Event Type | Handler | Action |
|------------|---------|--------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Activate subscription, reset SMS count |
| `customer.subscription.created` | `handleSubscriptionCreated` | Set subscription details |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Update subscription status |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Mark as cancelled, revert SMS limit |
| `invoice.payment_succeeded` | `handlePaymentSucceeded` | Reset SMS count for new period |
| `invoice.payment_failed` | `handlePaymentFailed` | Set status to past_due |

**Event Processing Details**:

#### checkout.session.completed
```javascript
// Updates user:
{
  stripeCustomerId: session.customer,
  stripeSubscriptionId: session.subscription,
  subscriptionPlan: "monthly" | "annual",
  subscriptionStatus: "active",
  smsUsageCount: 0,
  smsUsageLimit: 1000,
  marketingStatus: "active"
}
```

#### customer.subscription.updated
```javascript
// Status mapping:
- subscription.status === "past_due" → "past_due"
- subscription.status === "canceled" → "cancelled"
- subscription.status === "unpaid" → "cancelled"
- otherwise → "active"
```

#### invoice.payment_failed
```javascript
// Updates user:
{
  subscriptionStatus: "past_due",
  marketingStatus: "trial_expired"
}
```

**Testing Webhooks Locally**:

Using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Using `curl`:
```bash
# Note: Signature verification will fail without valid signature
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type": "checkout.session.completed", "data": {...}}'
```

---

## Error Responses

### Standard Error Format

All API endpoints return errors in consistent format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 302 | Redirect | Authentication required or post-action redirect |
| 400 | Bad Request | Invalid input parameters |
| 404 | Not Found | Resource not found (user, subscription) |
| 500 | Server Error | Internal server or Stripe API error |

---

## Request Examples

### Example 1: Create Monthly Subscription

**Request**:
```bash
curl -X POST http://localhost:3000/dashboard/subscription/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"plan": "monthly"}'
```

**Response**:
```json
{
  "success": true,
  "sessionId": "cs_test_a1b2c3d4e5f6",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6"
}
```

**Next Step**: Redirect browser to `url`

---

### Example 2: Cancel Subscription at Period End

**Request**:
```bash
curl -X POST http://localhost:3000/dashboard/subscription/cancel-subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"immediately": false}'
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription will cancel at the end of billing period"
}
```

---

### Example 3: Reactivate Cancelled Subscription

**Request**:
```bash
curl -X POST http://localhost:3000/dashboard/subscription/reactivate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription reactivated successfully"
}
```

---

### Example 4: Access Customer Portal

**Request**:
```bash
curl -L http://localhost:3000/dashboard/subscription/portal \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Response**: 302 Redirect to Stripe billing portal

---

## Rate Limiting

**Current Implementation**: None on subscription endpoints

**Recommendation for Production**:
- Checkout creation: 5 requests per hour per user
- Cancellation: 3 requests per hour per user
- Portal access: 10 requests per hour per user

**Implementation Example**:
```javascript
const rateLimit = require('express-rate-limit');

const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many checkout attempts, please try again later'
});

router.post('/checkout', checkoutLimiter, createCheckout);
```

---

## Security Considerations

### 1. Webhook Signature Verification
Always verify Stripe webhook signatures:
```javascript
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 2. Session Validation
Verify user owns the checkout session:
```javascript
const session = await stripe.checkout.sessions.retrieve(sessionId);
if (session.customer !== user.stripeCustomerId) {
  throw new Error('Unauthorized');
}
```

### 3. HTTPS Required
All production endpoints must use HTTPS, especially:
- Checkout redirects
- Webhook endpoints
- Customer portal

### 4. Environment Variables
Never expose in client-side code:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Safe to expose:
- `STRIPE_PUBLISHABLE_KEY`

---

## Testing

### Test Mode Credentials

Use Stripe test mode credentials from `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test Cards

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0027 6000 3184 | Requires authentication (3D Secure) |

**Expiry**: Any future date (e.g., 12/25)
**CVC**: Any 3 digits (e.g., 123)
**ZIP**: Any 5 digits (e.g., 12345)

### Testing Webhooks

**Option 1: Stripe CLI** (Recommended)
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

**Option 2: Stripe Dashboard**
- Go to Developers → Webhooks → Add endpoint
- Enter: `https://yourdomain.com/webhooks/stripe`
- Select events to send
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

**Option 3: Manual Testing**
```bash
# Trigger test webhook event
stripe trigger checkout.session.completed
```

---

## Postman Collection

Import this collection for easy API testing:

```json
{
  "info": {
    "name": "FilterFive Subscription API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Monthly Checkout",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"plan\": \"monthly\"}"
        },
        "url": {
          "raw": "http://localhost:3000/dashboard/subscription/checkout",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["dashboard", "subscription", "checkout"]
        }
      }
    },
    {
      "name": "Cancel Subscription",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"immediately\": false}"
        },
        "url": {
          "raw": "http://localhost:3000/dashboard/subscription/cancel-subscription",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["dashboard", "subscription", "cancel-subscription"]
        }
      }
    }
  ]
}
```

---

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

**Last Updated**: January 29, 2025
**API Version**: 1.0.0
