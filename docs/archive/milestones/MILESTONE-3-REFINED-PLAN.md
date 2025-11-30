# Milestone 3: Analytics Dashboard - Refined Implementation Plan

**Status**: 📋 Ready to Build
**Scope**: Simplified & Focused
**Timeline**: 2 weeks (reduced from 3 weeks)
**Start Date**: TBD

---

## 🎯 Refined Scope (Based on User Feedback)

### ✅ What We're Building

**Core Features**:
1. **Enhanced Dashboard Layout**
   - Charts on top
   - Quick actions (Send SMS, Create QR)
   - KPI cards with sparklines
   - Tables at bottom with pagination

2. **Date Range Filters**
   - Calendar month (default)
   - Billing cycle view
   - All other presets accessible
   - Comparison mode (auto same length)

3. **Key Metrics**
   - Total positive reviews generated (primary)
   - Average rating (primary)
   - All other metrics accessible but not emphasized

4. **ROI Calculator** (Killer Feature! 💎)
   - Cost per review = Monthly subscription / Positive reviews
   - Review value = User-configurable in settings
   - Display total value generated

5. **Interactive Sparkline Charts**
   - Hover for details
   - Show trends at a glance
   - Fast loading (< 1 second)

6. **Timing Heatmap**
   - Day of week × Hour of day
   - Interactive visualization
   - Shows best send times

7. **Location Tracking**
   - Track by business location (multi-location support)
   - Filter metrics by location

8. **Email Alerts**
   - New negative review received
   - Milestone reached (100 reviews)
   - SMS credits 80% used
   - Best-ever day/week/month
   - 7 days without sending feedback request

9. **SMS Manager Alert**
   - 1-star review triggers SMS to manager
   - Phone number configurable in settings

10. **Mobile-Optimized View**
    - Separate mobile experience
    - Mobile-first design approach

11. **Performance**
    - Daily snapshots (overnight batch)
    - Immediate updates for new actions
    - < 1 second load time
    - User-selectable pagination (10, 25, 50, 100 rows)

12. **Gradual Rollout**
    - 10% → 50% → 100% rollout
    - In-app banner announcement

### ❌ What We're NOT Building (Deferred)

- ~~SMS vs QR Channel Analysis~~
- ~~PDF Report Exports~~
- ~~CSV Data Exports~~
- ~~AI Insight Engine~~
- ~~Premium Features~~
- ~~API Endpoints~~
- ~~Competitor Benchmarking~~
- ~~Advanced Team Permissions~~ (future)

---

## 📐 Technical Architecture

### Database Schema Changes

```sql
-- Add review value configuration to users
ALTER TABLE users ADD COLUMN review_value_estimate DECIMAL(10,2) DEFAULT 80.00;
ALTER TABLE users ADD COLUMN manager_alert_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN manager_alert_enabled BOOLEAN DEFAULT false;

-- Add location tracking to feedback_requests
ALTER TABLE feedback_requests ADD COLUMN location VARCHAR(255);

-- Create analytics_snapshots table (daily pre-calculated metrics)
CREATE TABLE analytics_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  snapshot_date DATE NOT NULL,
  location VARCHAR(255),

  -- Core metrics
  requests_sent INTEGER DEFAULT 0,
  requests_clicked INTEGER DEFAULT 0,
  requests_rated INTEGER DEFAULT 0,

  -- SMS tracking
  sms_sent INTEGER DEFAULT 0,
  sms_delivered INTEGER DEFAULT 0,
  sms_failed INTEGER DEFAULT 0,
  sms_optouts INTEGER DEFAULT 0,

  -- Ratings breakdown
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,

  -- Filtering
  negative_reviews_filtered INTEGER DEFAULT 0,
  positive_reviews_published INTEGER DEFAULT 0,

  -- Performance metrics
  avg_response_time_hours DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, snapshot_date, location)
);

CREATE INDEX idx_analytics_snapshots_user_date
  ON analytics_snapshots(user_id, snapshot_date);

-- Create timing heatmap data
CREATE TABLE timing_performance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  hour_of_day INTEGER NOT NULL, -- 0-23

  requests_sent INTEGER DEFAULT 0,
  requests_clicked INTEGER DEFAULT 0,
  requests_rated INTEGER DEFAULT 0,

  click_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),

  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, day_of_week, hour_of_day)
);

CREATE INDEX idx_timing_performance_user
  ON timing_performance(user_id);

-- Add SMS tracking events
CREATE TABLE sms_events (
  id SERIAL PRIMARY KEY,
  feedback_request_id INTEGER REFERENCES feedback_requests(id),
  event_type VARCHAR(50) NOT NULL, -- delivered, failed, optout, invalid
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sms_events_request
  ON sms_events(feedback_request_id);
```

---

## 🏗️ Component Structure

```
src/
├── services/
│   ├── analyticsService.js          # Core analytics calculations
│   ├── snapshotService.js           # Daily snapshot generation
│   └── alertService.js              # Email and SMS alerts
│
├── controllers/
│   ├── analyticsController.js       # Analytics HTTP handlers
│   └── settingsController.js        # Updated for new settings
│
├── routes/
│   ├── analytics.js                 # Analytics endpoints
│   └── settings.js                  # Updated settings routes
│
├── views/
│   ├── dashboard/
│   │   ├── index.ejs                # NEW: Charts-first layout
│   │   ├── index-mobile.ejs         # NEW: Mobile-optimized
│   │   ├── analytics-timing.ejs     # Timing heatmap page
│   │   └── analytics-location.ejs   # Location breakdown
│   └── settings/
│       └── alerts.ejs               # NEW: Alert configuration
│
├── public/
│   ├── js/
│   │   ├── sparkline-charts.js      # Sparkline rendering
│   │   ├── timing-heatmap.js        # Heatmap visualization
│   │   └── dashboard-mobile.js      # Mobile interactions
│   └── css/
│       ├── dashboard-v2.css         # New dashboard styles
│       └── mobile-dashboard.css     # Mobile-specific styles
│
├── cron/
│   ├── daily-snapshots.js           # Run at midnight
│   ├── timing-aggregation.js        # Update timing data
│   └── alert-checker.js             # Check for alert conditions
│
└── utils/
    ├── roiCalculator.js             # ROI calculations
    └── deviceDetector.js            # Mobile vs desktop detection
```

---

## 📅 2-Week Implementation Timeline

### Week 1: Core Dashboard & Metrics

#### Day 1: Database & Backend Setup
- [ ] Create database migrations
- [ ] Build `analyticsService.js`
- [ ] Build `snapshotService.js`
- [ ] Create cron job for daily snapshots
- [ ] Add new settings fields

#### Day 2: ROI Calculator & Settings
- [ ] Add "Estimated Review Value" to settings page
- [ ] Add "Manager Alert Phone" to settings
- [ ] Build ROI calculation logic
- [ ] Create settings update endpoint

#### Day 3: Enhanced Dashboard Layout
- [ ] Redesign dashboard with charts on top
- [ ] Implement quick actions bar
- [ ] Create KPI cards with sparklines
- [ ] Add date range filters (calendar month default)
- [ ] Add billing cycle view

#### Day 4: Interactive Charts
- [ ] Install Chart.js or lightweight alternative
- [ ] Create sparkline components
- [ ] Add hover interactions
- [ ] Implement comparison mode
- [ ] Optimize for < 1 second load

#### Day 5: Tables & Pagination
- [ ] Move tables to bottom
- [ ] Add user-selectable pagination (10, 25, 50, 100)
- [ ] Implement lazy loading
- [ ] Add sorting capabilities

---

### Week 2: Advanced Features & Mobile

#### Day 6: Timing Heatmap
- [ ] Create `timing_performance` aggregation
- [ ] Build heatmap visualization (D3.js or similar)
- [ ] Day of week × Hour of day grid
- [ ] Interactive tooltips
- [ ] "Best time to send" indicator

#### Day 7: Location Tracking
- [ ] Add location field to feedback request creation
- [ ] Location dropdown in send SMS form
- [ ] Location filter on dashboard
- [ ] Per-location analytics view

#### Day 8: Email Alert System
- [ ] Build `alertService.js`
- [ ] Create email templates for each alert type:
  - Negative review received
  - Milestone reached
  - SMS credits 80% used
  - Best-ever performance
  - 7 days inactive
- [ ] Build alert checker cron job
- [ ] Test email delivery

#### Day 9: SMS Manager Alert
- [ ] Twilio integration for 1-star alerts
- [ ] Settings UI for manager phone number
- [ ] Alert enable/disable toggle
- [ ] SMS template: "⚠️ 1-Star Review Received - FilterFive"
- [ ] Test SMS delivery

#### Day 10: Mobile-Optimized View
- [ ] Device detection middleware
- [ ] Create `index-mobile.ejs`
- [ ] Simplified chart views
- [ ] Touch-optimized interactions
- [ ] Mobile-specific CSS
- [ ] Test on iOS and Android

---

### Week 2.5: Polish & Rollout

#### Day 11: Performance Optimization
- [ ] Implement Redis caching
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Load testing (simulate 100 users)
- [ ] Verify < 1 second target

#### Day 12: Gradual Rollout System
- [ ] Feature flag in database (`analytics_enabled BOOLEAN`)
- [ ] Admin interface to enable per-user
- [ ] Rollout plan: 10% → 50% → 100%
- [ ] In-app banner component
- [ ] A/B testing setup

#### Day 13: Testing & Bug Fixes
- [ ] Manual testing on desktop
- [ ] Manual testing on mobile
- [ ] Browser compatibility (Chrome, Safari, Firefox)
- [ ] Edge cases (no data, 1000+ requests, etc.)
- [ ] Fix critical bugs

#### Day 14: Documentation & Launch
- [ ] Update user documentation
- [ ] Create in-app tutorial
- [ ] Prepare announcement email
- [ ] Enable for 10 beta users
- [ ] Monitor for issues

---

## 🎨 UI/UX Design Specs

### Desktop Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  FilterFive Dashboard                    [Date Filter ▼]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📊 Reviews Over Time                                │  │
│  │                                                       │  │
│  │      ▁▃▅▇█ Interactive Line Chart                   │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🕐 Best Times to Send (Heatmap)                     │  │
│  │      Mon Tue Wed Thu Fri Sat Sun                     │  │
│  │  9am  ██  ███ ███ ██  █   ░   ░                     │  │
│  │  12pm ███ ███ ███ ███ ██  █   ░                     │  │
│  │  3pm  ███ ████████ ███ ██  █   █                     │  │
│  │  6pm  ██  ██  ██  ██  ██  ██  █                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Quick Actions                                      │    │
│  │  [Send SMS] [Create QR Code] [View Timing Report] │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 💎 ROI      │ │ ⭐ Avg Rating│ │ 📊 Total    │          │
│  │   436%      │ │    4.3      │ │    147      │          │
│  │   ▃▅▇█      │ │   ▁▃▅█      │ │   ▁▃▇█      │          │
│  │ Value: $11K │ │ ↑ +0.2      │ │ ↑ +23       │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 🚫 Filtered │ │ 💬 Click    │ │ 📱 SMS Left │          │
│  │    12       │ │    42%      │ │    653      │          │
│  │   ▅▃▁▂      │ │   ▃▅▇█      │ │   ████░░░   │          │
│  │ ↓ -8        │ │ ↑ +3%       │ │ 65% left    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                               │
│  Recent Feedback Requests     [Rows: 25 ▼] [Location: All ▼]│
│  ┌──────────┬──────────┬────────┬────────┬──────────────┐  │
│  │ Date     │ Customer │ Status │ Rating │ Location     │  │
│  ├──────────┼──────────┼────────┼────────┼──────────────┤  │
│  │ Jan 29   │ John D.  │ Rated  │ ⭐⭐⭐⭐⭐│ Main St    │  │
│  │ Jan 29   │ Sarah M. │ Clicked│   -    │ Downtown     │  │
│  │ Jan 28   │ Mike R.  │ Sent   │   -    │ Main St      │  │
│  └──────────┴──────────┴────────┴────────┴──────────────┘  │
│  [< Previous]  Page 1 of 10  [Next >]                       │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Dashboard Layout

```
┌──────────────────────┐
│  FilterFive          │
│  [Date: This Month ▼]│
├──────────────────────┤
│                      │
│  💎 ROI              │
│     436%             │
│  Value Generated:    │
│  $11,760             │
│                      │
│  ▃▅▇█ Trending Up    │
│                      │
├──────────────────────┤
│                      │
│  ⭐ Average Rating   │
│     4.3 / 5.0        │
│  ▁▃▅█ ↑ +0.2         │
│                      │
├──────────────────────┤
│                      │
│  📊 Positive Reviews │
│     147 reviews      │
│  ▁▃▇█ ↑ +23          │
│                      │
├──────────────────────┤
│  [Send SMS Now]      │
│  [View Full Report]  │
├──────────────────────┤
│  Recent Activity     │
│                      │
│  • Jan 29: John D.   │
│    ⭐⭐⭐⭐⭐ (Main St) │
│                      │
│  • Jan 29: Sarah M.  │
│    Clicked (Downtown)│
│                      │
│  • Jan 28: Mike R.   │
│    Sent (Main St)    │
│                      │
│  [Load More...]      │
└──────────────────────┘
```

---

## 🔢 ROI Calculator Logic

### Settings Configuration

```javascript
// src/views/dashboard/settings.ejs

<div class="form-section">
  <h3>Business Valuation</h3>

  <div class="form-group">
    <label for="reviewValueEstimate">
      Estimated Value Per Positive Review
    </label>
    <div class="input-group">
      <span class="prefix">$</span>
      <input
        type="number"
        id="reviewValueEstimate"
        name="reviewValueEstimate"
        value="<%= user.reviewValueEstimate || 80 %>"
        min="0"
        step="0.01"
      >
    </div>
    <div class="help-text">
      Industry average: $80.
      Adjust based on your business type and customer lifetime value.
    </div>
  </div>
</div>

<div class="form-section">
  <h3>Manager Alerts</h3>

  <div class="form-group">
    <label>
      <input
        type="checkbox"
        name="managerAlertEnabled"
        <%= user.managerAlertEnabled ? 'checked' : '' %>
      >
      Send SMS alert for 1-star reviews
    </label>
  </div>

  <div class="form-group" id="managerPhoneGroup">
    <label for="managerAlertPhone">
      Manager/Supervisor Phone Number
    </label>
    <input
      type="tel"
      id="managerAlertPhone"
      name="managerAlertPhone"
      value="<%= user.managerAlertPhone || '' %>"
      placeholder="+1234567890"
    >
    <div class="help-text">
      This number will receive an SMS when a 1-star review is submitted.
    </div>
  </div>
</div>
```

### ROI Calculation

```javascript
// src/utils/roiCalculator.js

class ROICalculator {
  /**
   * Calculate cost per positive review
   * Formula: Monthly Subscription / Number of Positive Reviews
   */
  calculateCostPerReview(subscriptionPrice, positiveReviews) {
    if (positiveReviews === 0) return 0;
    return subscriptionPrice / positiveReviews;
  }

  /**
   * Calculate total value generated
   * Formula: Positive Reviews × Review Value Estimate
   */
  calculateValueGenerated(positiveReviews, reviewValueEstimate) {
    return positiveReviews * reviewValueEstimate;
  }

  /**
   * Calculate ROI percentage
   * Formula: ((Value Generated - Cost) / Cost) × 100
   */
  calculateROI(valueGenerated, subscriptionCost) {
    if (subscriptionCost === 0) return 0;
    return ((valueGenerated - subscriptionCost) / subscriptionCost) * 100;
  }

  /**
   * Get complete ROI metrics for dashboard
   */
  getROIMetrics(user, positiveReviews, dateRange) {
    const subscriptionCost = this.getSubscriptionCost(user, dateRange);
    const reviewValue = user.reviewValueEstimate || 80;

    const costPerReview = this.calculateCostPerReview(
      subscriptionCost,
      positiveReviews
    );

    const valueGenerated = this.calculateValueGenerated(
      positiveReviews,
      reviewValue
    );

    const roi = this.calculateROI(valueGenerated, subscriptionCost);

    return {
      costPerReview: costPerReview.toFixed(2),
      valueGenerated: valueGenerated.toFixed(2),
      roi: roi.toFixed(0),
      subscriptionCost: subscriptionCost.toFixed(2),
      positiveReviews,
      reviewValue: reviewValue.toFixed(2)
    };
  }

  /**
   * Calculate subscription cost for date range
   */
  getSubscriptionCost(user, dateRange) {
    const daysInRange = this.getDaysInRange(dateRange);

    if (user.subscriptionPlan === 'monthly') {
      // $77/month = $2.57/day
      return (77 / 30) * daysInRange;
    } else if (user.subscriptionPlan === 'annual') {
      // $770/year = $2.11/day
      return (770 / 365) * daysInRange;
    } else {
      // Trial: estimate at monthly rate
      return (77 / 30) * daysInRange;
    }
  }

  getDaysInRange(dateRange) {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

module.exports = new ROICalculator();
```

---

## 📧 Email Alert Templates

### 1. Negative Review Received

```html
Subject: ⚠️ New Negative Review - Action Needed

Hi <%= businessName %>,

A customer just submitted negative feedback:

Rating: <%= rating %> stars
Comment: "<%= comment %>"
Date: <%= date %>

✅ Good News: This review was FILTERED and did NOT go public.

Your customer received a private thank you message and their feedback
will help you improve your service.

[View Full Feedback] [Respond to Customer]

- FilterFive Team
```

### 2. Milestone Reached

```html
Subject: 🎉 Congratulations! You've Reached <%= milestone %> Reviews

Hi <%= businessName %>,

Amazing work! You just hit <%= milestone %> positive reviews!

Your Stats:
• Total Reviews: <%= totalReviews %>
• Average Rating: <%= avgRating %> ⭐
• Value Generated: $<%= valueGenerated %>
• ROI: <%= roi %>%

Keep up the great work!

[View Dashboard] [Share Your Success]

- FilterFive Team
```

### 3. SMS Credits 80% Used

```html
Subject: 📱 SMS Credits Running Low

Hi <%= businessName %>,

You've used <%= usedCredits %> of your <%= totalCredits %> SMS credits this billing cycle.

You have <%= remainingCredits %> SMS credits remaining (<%= percentRemaining %>%).

Tips to maximize your remaining credits:
• Use QR codes (unlimited, free)
• Focus on your best-performing times
• Target high-value customers

Your billing cycle renews on <%= renewalDate %>.

[View Usage Dashboard]

- FilterFive Team
```

### 4. Best Performance Ever

```html
Subject: 🏆 New Record! Best <%= metricName %> Ever

Hi <%= businessName %>,

Congratulations! You just had your best <%= period %> ever!

New Record:
• <%= metricName %>: <%= metricValue %>
• Previous Best: <%= previousBest %>
• Improvement: +<%= improvement %>%

What you're doing is working - keep it up!

[View Full Report] [See What Changed]

- FilterFive Team
```

### 5. 7 Days Inactive

```html
Subject: 😢 We Miss You! It's Been 7 Days

Hi <%= businessName %>,

We noticed you haven't sent any feedback requests in the past 7 days.

Your stats before the pause:
• Average Rating: <%= avgRating %> ⭐
• Total Reviews: <%= totalReviews %>
• ROI: <%= roi %>%

Getting back on track is easy:
• Send a quick SMS campaign
• Print new QR codes
• Check your analytics for insights

[Send SMS Now] [View Dashboard]

Need help? Reply to this email and we'll assist.

- FilterFive Team
```

---

## 📱 SMS Manager Alert

### 1-Star Review Alert

```
⚠️ FILTERFIVE ALERT

1-STAR REVIEW RECEIVED

Customer: <%= customerName || 'Anonymous' %>
Date: <%= date %>
Time: <%= time %>

This review was FILTERED and did NOT go public.

View feedback: <%= dashboardUrl %>

- FilterFive
```

**Implementation**:
```javascript
// src/services/alertService.js

async sendManagerAlert(user, review) {
  if (!user.managerAlertEnabled || !user.managerAlertPhone) {
    return;
  }

  const message = `⚠️ FILTERFIVE ALERT

1-STAR REVIEW RECEIVED

Customer: ${review.customerName || 'Anonymous'}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

This review was FILTERED and did NOT go public.

View feedback: ${process.env.APP_URL}/dashboard

- FilterFive`;

  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: user.managerAlertPhone
  });

  console.log(`✓ Manager alert sent to ${user.managerAlertPhone}`);
}
```

---

## 🎯 Performance Targets

### Load Time Targets

| Metric | Target | Measured At |
|--------|--------|-------------|
| Initial Page Load | < 2 seconds | First Contentful Paint |
| Dashboard With Data | < 1 second | Full render |
| Chart Render | < 500ms | Interactive |
| Table Pagination | < 200ms | Click to render |
| Date Filter Change | < 300ms | Apply new filter |

### Optimization Strategies

1. **Daily Snapshots**
   - Pre-calculate metrics overnight
   - Query snapshots instead of raw data
   - 10x faster than real-time calculations

2. **Database Indexes**
   ```sql
   CREATE INDEX idx_feedback_user_date ON feedback_requests(user_id, created_at);
   CREATE INDEX idx_reviews_rating ON reviews(feedback_request_id, rating);
   CREATE INDEX idx_snapshots_user ON analytics_snapshots(user_id, snapshot_date);
   ```

3. **Redis Caching**
   ```javascript
   const cacheKey = `analytics:${userId}:${dateRange}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   const data = await calculateAnalytics(userId, dateRange);
   await redis.setex(cacheKey, 3600, JSON.stringify(data)); // 1 hour TTL
   return data;
   ```

4. **Pagination**
   - Server-side pagination
   - User selects: 10, 25, 50, 100 rows
   - Only load visible data

5. **Lazy Loading**
   ```javascript
   // Load critical metrics first
   loadKeyMetrics(); // Immediate

   // Then load charts
   setTimeout(() => {
     loadCharts(); // After 100ms
   }, 100);

   // Then load tables
   setTimeout(() => {
     loadTables(); // After 300ms
   }, 300);
   ```

---

## 🚀 Gradual Rollout Strategy

### Phase 1: Internal Testing (Day 1-2)
- Enable for admin/test accounts only
- Test all features thoroughly
- Fix critical bugs
- Verify performance targets

### Phase 2: Beta Users (Day 3-5)
- Enable for 10 beta users (10% of active users)
- Selection criteria:
  - Active users (login in last 7 days)
  - Mix of trial and paid
  - Mix of high/low usage
  - Willing to provide feedback
- Monitor usage and errors
- Collect feedback via email survey

### Phase 3: 50% Rollout (Day 6-8)
- Enable for 50% of users (random selection)
- Continue monitoring
- A/B test: Analytics dashboard vs. old dashboard
- Measure engagement metrics

### Phase 4: 100% Rollout (Day 9-10)
- Enable for all users
- Send announcement email
- Show in-app banner
- Monitor for issues

### Feature Flag Implementation

```javascript
// Database
ALTER TABLE users ADD COLUMN analytics_enabled BOOLEAN DEFAULT false;

// Middleware
const checkAnalyticsAccess = (req, res, next) => {
  if (req.user.analyticsEnabled) {
    return next();
  }
  // Show old dashboard
  res.redirect('/dashboard/legacy');
};

// Admin endpoint to enable
POST /admin/analytics/enable/:userId
POST /admin/analytics/enable-batch (enable for percentage)
```

---

## 📊 Success Metrics

### Week 1 Targets
- [ ] 10 beta users testing successfully
- [ ] Zero critical bugs
- [ ] < 1 second average load time
- [ ] 100% feature completion

### Week 2 Targets
- [ ] 50% of users have access
- [ ] 80% of users with access view analytics
- [ ] +30% dashboard sessions
- [ ] 5+ pieces of positive feedback

### Month 1 Targets (Post-Launch)
- [ ] 100% rollout complete
- [ ] 80% of paid users view analytics weekly
- [ ] -20% churn rate
- [ ] +50% WAU (weekly active users)
- [ ] 4.5+ star rating in user feedback

---

## ✅ Definition of Done

Milestone 3 is complete when:

### Functional Requirements
- [ ] Dashboard displays with new layout (charts top, actions, KPI, tables)
- [ ] Date filters work (calendar month, billing cycle, all presets)
- [ ] Comparison mode shows period-over-period changes
- [ ] ROI calculator displays with user-configurable review value
- [ ] Sparkline charts render and are interactive
- [ ] Timing heatmap shows day × hour visualization
- [ ] Location tracking filters metrics correctly
- [ ] Email alerts send for all defined events
- [ ] SMS manager alert sends for 1-star reviews
- [ ] Mobile view renders correctly on iOS and Android
- [ ] Pagination works with user-selectable row counts
- [ ] Gradual rollout system functions properly

### Performance Requirements
- [ ] Dashboard loads in < 1 second (cached)
- [ ] Initial load < 2 seconds (uncached)
- [ ] Charts render in < 500ms
- [ ] Daily snapshot cron runs successfully
- [ ] All database indexes created

### Quality Requirements
- [ ] Zero critical bugs in production
- [ ] Mobile responsive on all screen sizes
- [ ] Cross-browser compatible (Chrome, Safari, Firefox)
- [ ] No console errors
- [ ] Accessible (WCAG AA standards)

### Documentation Requirements
- [ ] User guide created
- [ ] API documentation updated
- [ ] Settings help text clear
- [ ] In-app tooltips added

### Business Requirements
- [ ] 10 beta users tested successfully
- [ ] 80% of beta users view analytics
- [ ] Positive user feedback (4+ stars)
- [ ] No increase in support tickets

---

## 🎬 Next Steps

### Immediate Actions
1. ✅ Review and approve this refined plan
2. ⏳ Create UI mockups for key screens
3. ⏳ Set up development branch
4. ⏳ Begin Day 1 implementation

### Questions Before Starting
- Confirm 2-week timeline is acceptable?
- Need design mockups or build from specs?
- Any additional requirements I missed?
- Ready to start immediately?

---

**Refined Plan Status**: ✅ Complete
**Based on User Feedback**: January 29, 2025
**Estimated Completion**: 2 weeks from start
**Scope**: Simplified & Focused
**Priority**: High
