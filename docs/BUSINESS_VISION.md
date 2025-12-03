# FilterFive - Business Vision & Strategic Overview

**Document Created:** November 29, 2025
**Owner:** Kristian Pascual
**Status:** Pre-Launch / Validation Phase

---

## Executive Summary

FilterFive is a B2B SaaS reputation management platform designed to help local businesses automatically generate positive Google reviews while capturing negative feedback privately. The platform intelligently filters customer feedback based on ratings (4-5 stars go public, 1-3 stars stay private) to protect and enhance online reputation.

**Current State:**
- ✅ Fully functional MVP in production
- ✅ Technical infrastructure stable (Docker, PostgreSQL, Stripe integrated)
- ❌ Zero paying customers
- ❌ No validation with real users yet

**Target State (90 days):**
- 20 paying customers
- $1,500-3,000 MRR
- Validated product-market fit
- 1 agency partnership established

---

## The Product: What FilterFive Does

### Core Value Proposition

**For small businesses:**
"Turn every customer into a 5-star Google review - automatically"

**For digital marketing agencies:**
"Add a $150-300/month recurring revenue stream to every SEO client without doing extra work"

### How It Works

#### Two Feedback Collection Methods:

**1. SMS Flow:**
```
Business uploads customer list (or sends via Zapier)
↓
Customer receives SMS: "Rate your experience at [Business]"
↓
Customer clicks link → Rates 1-5 stars
↓
IF 4-5 stars: Redirect to Google/Facebook to post publicly
IF 1-3 stars: Capture feedback privately, email business owner
```

**2. QR Code Flow:**
```
Business displays QR code at checkout/table
↓
Customer scans → Anonymous rating page
↓
Rates 1-5 stars → Same smart filtering logic
↓
Happy customers go public, unhappy stay private
```

### Key Features

**Currently Live:**
- User authentication & email verification
- 14-day free trial (configurable to 30 days)
- Stripe subscription integration ($77/month, $770/year)
- SMS feedback requests via Twilio
- QR code generation & scanning
- Smart review filtering (4-5 stars public, 1-3 stars private)
- Email alerts for negative feedback
- Multi-tenant dashboard
- Analytics dashboard with ROI calculator
- CSV bulk upload for customer lists
- Multi-location support

**Not Yet Built (intentionally):**
- Zapier integration (will do manually for beta customers)
- Advanced scheduling features
- AI-powered review responses
- Mobile app
- Advanced reporting/exports

---

## The Business Model: How FilterFive Makes Money

### Revenue Streams

#### 1. Direct to Business (B2C/SMB)
**Target:** Local retail, restaurants, salons, service businesses

**Pricing:**
- **Starter:** $77/month (200 SMS included)
- **Growth:** $147/month (500 SMS included)
- **Professional:** $247/month (1,000 SMS included)

**Unit Economics:**
- SMS cost: $0.008 per message
- Average usage: 100 SMS/month per customer
- Cost per customer: ~$6.80/month (SMS + server + support)
- Profit at $77/month: $70.20 (91% margin)

**Customer Acquisition:**
- Direct sales (in-person visits)
- Word of mouth / referrals
- Local business Facebook groups
- Partnership with web designers/marketers

---

#### 2. Agency Add-On (Upsell to Existing Clients)
**Target:** Your 3 current SEO clients

**Pricing:**
- Bundled free into existing $1,500/month SEO package (validation phase)
- OR $200-300/month add-on after proving value

**Strategic Value:**
- Increases client retention
- Differentiates your agency offering
- Costs you $0 (you own the software)
- Proves SEO impact (more reviews = better rankings)

**Customer Acquisition:**
- Direct email/call to existing clients
- "We're adding reputation management to your SEO service"

---

#### 3. White-Label for Agencies (B2B SaaS)
**Target:** Digital marketing agencies, SEO firms, reputation management companies

**Pricing:**
- **Wholesale:** $35-40/month per client seat
- **Revenue Share:** 30% commission if you handle billing

**How It Works:**
- Agency pays you $40/month per client
- They resell at $150-300/month
- They keep $110-260 margin per client
- You provide: Tech, updates, tier-2 support
- They provide: Sales, onboarding, tier-1 support

**Strategic Value:**
- Scalable distribution (agencies have 10-100+ clients each)
- Predictable wholesale revenue
- Less customer support burden (agency handles it)
- Path to 100+ customers without doing sales yourself

**Target Partners:**
- Your friend's agency (first partner)
- Local SEO agencies
- Web design agencies who want to add services
- Marketing consultants

---

## Target Customers: Who Needs This

### Primary Segment: Local Service Businesses

**Ideal Customer Profile:**
- 1-3 physical locations
- 50-500 customers per month
- Relies on Google Maps for customer acquisition
- Currently has <50 Google reviews
- Cares about online reputation

**Specific Verticals:**
- Restaurants & cafes
- Retail stores (souvenirs, natural products, boutiques)
- Salons & barber shops
- Auto repair shops
- Dentists & chiropractors
- Home services (plumbers, electricians, HVAC)
- Hotels & vacation rentals

**Why They Need This:**
- More reviews = higher Google Maps ranking
- Positive reviews = more customers trust them
- Asking for reviews is awkward / easy to forget
- Don't have time to manually request reviews
- Afraid of getting public negative reviews

---

### Secondary Segment: Digital Marketing Agencies

**Ideal Customer Profile:**
- 10-50 clients (mostly local businesses)
- Offers SEO, local SEO, or reputation management
- Wants to increase revenue per client
- Technical enough to white-label software
- Already understands value of reviews for rankings

**Why They Need This:**
- Easy upsell to existing clients ($150-300/month)
- High margin recurring revenue (70-85%)
- Helps their SEO services work better
- Differentiates them from competitors
- Clients stay longer (higher LTV)

---

## Competitive Landscape: How FilterFive Fits

### Direct Competitors

**Podium:**
- Price: $289-500/month
- Features: Reviews + messaging + payments
- Weakness: Expensive for small businesses, feature bloat
- FilterFive advantage: 50-70% cheaper, simpler, personal service

**Birdeye:**
- Price: $299-600/month
- Features: Reviews + listings + social + surveys
- Weakness: Enterprise focus, complex onboarding
- FilterFive advantage: SMB focus, easier setup, lower price

**Grade.us / GatherUp:**
- Price: $99-249/month
- Features: Review generation + monitoring
- Weakness: Outdated UI, limited SMS
- FilterFive advantage: Modern interface, QR codes, better filtering

**Rater8:**
- Price: $50-150/month
- Features: Review requests via SMS/email
- Weakness: Basic features, no smart filtering
- FilterFive advantage: Smart filtering (4/5 stars only go public)

### Indirect Competitors

**Manual alternatives:**
- Printed review cards at checkout
- Staff verbally asking for reviews
- Email campaigns (low response rate)
- FilterFive advantage: Automated, higher conversion, no staff training

**DIY solutions:**
- Google Forms + QR codes
- Zapier workflows
- FilterFive advantage: Professional, analytics, smart filtering

---

## Market Opportunity: Why Now?

### Market Size

**Total Addressable Market (TAM):**
- 33.2M small businesses in the US
- ~60% are service/retail (19.9M)
- ~30% care about online reviews (6M potential customers)

**Serviceable Addressable Market (SAM):**
- English-speaking countries (US, Canada, UK, Australia)
- Businesses with <50 locations
- Revenue >$100k/year (can afford $77/month)
- Estimated: 2-3M businesses

**Serviceable Obtainable Market (SOM - Year 1):**
- Local businesses in your city/region
- Agency clients you can reach
- Estimated: 500-1,000 businesses

### Market Trends

1. **Google Maps dominance:** 86% of consumers look up local businesses on Google
2. **Review importance growing:** 93% say reviews influence purchase decisions
3. **Review recency matters:** Fresh reviews rank higher than old ones
4. **Mobile-first:** QR codes widely adopted post-COVID
5. **Automation demand:** Small businesses want "set it and forget it" tools

### Why FilterFive Will Win

**Advantages over competitors:**
1. **Price:** 50-70% cheaper than Podium/Birdeye
2. **Simplicity:** One job, done well (not feature bloat)
3. **Smart filtering:** Competitors don't prevent negative reviews from going public
4. **QR codes + SMS:** Most tools only do one or the other
5. **Agency channel:** White-label model unlocks scalable distribution
6. **Personal service:** You answer the phone, big competitors have offshore support
7. **Founder expertise:** You understand SEO/local business (not just a dev building random SaaS)

---

## Business Strategy: Path to $50,000 MRR

### Phase 1: Validation (Days 1-90)
**Goal:** 20 paying customers, $1,500-3,000 MRR

**Strategy:**
- Sell to warm network first (3 agency clients, 3-4 retail owners)
- Manual onboarding, no automation
- Learn what works, fix what breaks
- Get testimonials and case studies
- Establish 1 agency partnership

**Success Metrics:**
- 25% trial-to-paid conversion rate
- <10% monthly churn
- 15+ reviews generated per customer per month
- Can onboard new customer in <1 hour

---

### Phase 2: Product-Market Fit (Months 4-6)
**Goal:** 50 customers, $5,000-8,000 MRR

**Strategy:**
- Double down on what's working (agency vs retail vs partners)
- Automate onboarding process
- Add 2-3 agency partners
- Build referral program
- Improve product based on customer feedback

**Success Metrics:**
- <5% monthly churn
- 30%+ trial-to-paid conversion
- 50% of customers renewing at 6 months
- Net Promoter Score >40

---

### Phase 3: Growth (Months 7-12)
**Goal:** 150-200 customers, $15,000-25,000 MRR

**Strategy:**
- Launch agency partner program (recruit 5-10 agencies)
- Add self-service onboarding
- Invest in content marketing (SEO blog, case studies)
- Raise prices for new customers ($97 → $127)
- Add "Professional" tier for multi-location businesses

**Channels:**
- Agency partnerships (70% of new customers)
- Direct sales (20%)
- Referrals (10%)

---

### Phase 4: Scale (Year 2)
**Goal:** 500-750 customers, $50,000-75,000 MRR

**Strategy:**
- Build affiliate program for marketing consultants
- Expand to Canada, UK, Australia
- Add integrations (Shopify, Square, Toast POS)
- Hire 1-2 people (customer success, sales)
- Consider raising small funding round OR stay bootstrapped

**Potential Exit Paths:**
- Acquisition by Podium/Birdeye ($5-15M)
- Acquisition by review platform (Trustpilot, G2)
- Acquisition by agency holding company
- Continue bootstrapped to $100k+ MRR

---

## Your Unfair Advantages

### 1. Built-in Distribution
- You own a digital marketing agency
- 3 existing clients you can upsell immediately
- Agency friend with 10+ clients
- Warm network of 3-4 local business owners

**Most SaaS founders start with zero customers and cold outreach. You start with warm leads.**

---

### 2. Domain Expertise
- You run an SEO agency - you understand local rankings
- You know why reviews matter for SEO
- You can speak the language of business owners
- You've seen the problem firsthand with your clients

**Most SaaS founders build solutions for problems they don't understand. You've lived this problem.**

---

### 3. Technical Capability
- You can build and ship features fast
- No dependency on dev agencies or freelancers
- Can iterate based on customer feedback immediately
- Product is already 80% done

**Most founders wait months for MVPs. You're ready to sell today.**

---

### 4. Time & Commitment
- 50-60 hours/week available
- Flexible schedule (can visit customers in person)
- Can provide white-glove onboarding
- Can offer same-day support

**Most founders work nights/weekends on side projects. You can go full-time on this.**

---

### 5. Agency Partnership Model
- Most SaaS companies do direct sales only (slow)
- You have a scalable channel from day 1 (agencies)
- One agency partner = 10-50 customers
- 5-10 agency partners = 100-300 customers

**This is your secret weapon for getting to $50k MRR fast.**

---

## Revenue Model Breakdown

### Three Paths to $50,000 MRR

#### Path A: Direct Sales Heavy
```
400 direct customers × $127/month = $50,800 MRR

Pros: Higher margin, you own customer relationship
Cons: Slow acquisition, high support burden
Timeline: 24-36 months
```

#### Path B: Agency Partnership Heavy (RECOMMENDED)
```
10 agency partners × 30 clients each × $40 wholesale = $12,000 MRR
100 direct customers × $127/month = $12,700 MRR
5 your own agency clients × $200/month = $1,000 MRR

Total: $25,700 MRR by Month 12
Path to $50k: 20 agency partners or 200 direct + 15 partners

Pros: Scalable, agencies do the selling, predictable wholesale revenue
Cons: Lower margin on wholesale, dependency on partners
Timeline: 12-18 months
```

#### Path C: Hybrid Model
```
15 agency partners × 20 clients × $40 = $12,000 MRR
200 direct customers × $127 = $25,400 MRR
10 your agency clients × $200 = $2,000 MRR

Total: $39,400 MRR
Path to $50k: Add 5 more partners or 100 more direct

Pros: Diversified revenue, not dependent on one channel
Cons: More complex to manage
Timeline: 18-24 months
```

**Recommendation: Start with Path B (agency partnerships), evolve to Path C (hybrid)**

---

## Success Metrics & KPIs

### Customer Acquisition Metrics
- **Leads generated per week:** 10-20
- **Demos scheduled:** 30-40% of leads
- **Trials started:** 50% of demos
- **Trial-to-paid conversion:** 25-30%
- **CAC (Customer Acquisition Cost):** <$100
- **Payback period:** 1-2 months

### Product Usage Metrics
- **SMS sent per customer per month:** 50-200
- **QR scans per customer per month:** 20-100
- **SMS click rate:** 30-40%
- **Review completion rate:** 40-50% of clicks
- **Overall conversion (SMS/QR → Review):** 15-25%
- **Positive review rate (4-5 stars):** 70-80%

### Financial Metrics
- **MRR:** Track monthly
- **MRR growth rate:** Target 15-20% per month (first 6 months)
- **Gross margin:** Target 85-90%
- **Monthly churn:** Target <5%
- **Net revenue retention:** Target >100%
- **LTV:CAC ratio:** Target >3:1

### Customer Success Metrics
- **Average reviews generated per customer:** 15-30/month
- **Customer satisfaction (NPS):** Target >40
- **Support tickets per customer:** Target <1/month
- **Time to first value:** <7 days from signup
- **Active usage rate:** Target >80% (customers who used it in last 30 days)

---

## Strategic Risks & Mitigation

### Risk 1: No One Wants It
**Scenario:** You pitch 30 businesses, get 0 customers

**Likelihood:** Medium (20-30%)

**Mitigation:**
- Start with warm network (higher success rate)
- Offer generous free trial (30 days, no credit card)
- Prove value with data (show reviews generated)
- Pivot positioning if needed (SEO tool vs reputation management)

**Decision point:** If 0 customers by Day 30, pause and reassess

---

### Risk 2: Customers Won't Pay After Trial
**Scenario:** Everyone loves free trial, no one converts to paid

**Likelihood:** Medium-High (30-40%)

**Mitigation:**
- Show ROI clearly: "You got 23 reviews = $230 value for $97 cost"
- Offer discount for first 3 months (50% off)
- Ask WHY they won't pay (price too high? value unclear? product broken?)
- Consider usage-based pricing instead of flat fee

**Decision point:** If <20% conversion rate by Day 60, pricing is wrong

---

### Risk 3: High Churn
**Scenario:** Customers sign up, use for 2 months, then cancel

**Likelihood:** Medium (25-35% will churn in first 6 months)

**Mitigation:**
- Weekly check-ins with new customers
- Proactive outreach if usage drops
- Build onboarding sequence to drive adoption
- Add features they request
- Lock in annual contracts (pay 10 months, get 12)

**Decision point:** If >10% churn per month, product isn't sticky

---

### Risk 4: Can't Scale Without Team
**Scenario:** You hit 20 customers but onboarding takes 3 hours each

**Likelihood:** High (60-70%)

**Mitigation:**
- Document everything (onboarding checklist, FAQ, video tutorials)
- Build self-service onboarding flow
- Hire VA for customer support at $1k/month
- Focus on agency partners (they do onboarding)
- Automate repetitive tasks (CSV upload, QR generation)

**Decision point:** If you can't onboard new customers by Month 4, hire help

---

### Risk 5: Google Changes Policies
**Scenario:** Google bans filtered review requests

**Likelihood:** Low (5-10%)

**Mitigation:**
- Google currently allows review requests (just not incentivized)
- Filtering happens AFTER rating (not before asking)
- Pivot to "customer feedback tool" if needed
- Negative feedback still has value (private alerts)

**Decision point:** Monitor Google policy updates quarterly

---

### Risk 6: Competitor Copies You
**Scenario:** Podium adds smart filtering, undercuts your price

**Likelihood:** Low (10-15%)

**Mitigation:**
- Big companies move slow
- Your advantage: personal service, agency partnerships, niche focus
- Build moat: customer relationships, integrations, brand
- Stay 12-18 months ahead on features

**Decision point:** If Podium drops to $77/month, pivot to agency white-label

---

## What Success Looks Like

### Month 3 (Day 90)
- ✅ 20 paying customers
- ✅ $1,500-3,000 MRR
- ✅ <10% churn
- ✅ 1 agency partner signed
- ✅ 2-3 case studies/testimonials
- ✅ Clear data on what works (segment, pitch, pricing)

### Month 6
- ✅ 50 customers
- ✅ $5,000-8,000 MRR
- ✅ 3-5 agency partners
- ✅ Self-service onboarding working
- ✅ <5% churn
- ✅ First $10k MRR month

### Month 12
- ✅ 150-200 customers
- ✅ $20,000-30,000 MRR
- ✅ 10+ agency partners
- ✅ Hired 1 person (support or sales)
- ✅ Profitable (after paying yourself salary)
- ✅ Product-market fit proven

### Year 2
- ✅ 500+ customers
- ✅ $50,000+ MRR
- ✅ Small team (3-5 people)
- ✅ Expanded to Canada/UK/Australia
- ✅ Inbound leads from SEO/content
- ✅ Decision point: Bootstrap to $100k+ or raise funding or sell

---

## Personal Goals & Motivations

### Why You're Building This

**Short-term (0-12 months):**
- Validate you can build a real SaaS business
- Generate $3k-5k/month passive income
- Help local businesses succeed
- Learn B2B sales and marketing

**Medium-term (12-24 months):**
- Replace agency income ($5k/month → $20k/month from FilterFive)
- Build something scalable (not trading time for money)
- Prove concept for larger exit or funding
- Become known in reputation management space

**Long-term (24-36+ months):**
- Build to $50k-100k MRR
- Sell to competitor for $3-10M OR
- Keep bootstrapped, pay yourself $200k+/year OR
- Raise funding, build to $1M+ MRR, bigger exit

### What You DON'T Want

- ❌ Don't want to compete on features with Podium
- ❌ Don't want 100+ employees (stay lean)
- ❌ Don't want VC pressure (prefer bootstrapped)
- ❌ Don't want to do cold outreach forever (need scalable channels)
- ❌ Don't want to be "cheap option" (want to be "smart option for SMBs")

---

## Key Decisions to Make (By Day 30)

### Decision 1: Which Customer Segment?
**Options:**
- A) Focus 100% on direct retail/service businesses
- B) Focus 100% on agency partnerships (white-label)
- C) Hybrid: Your agency clients + agency partnerships

**How to decide:**
- Which segment has best conversion rate?
- Which segment has lowest churn?
- Which segment is most enjoyable to work with?
- Which segment is most scalable?

**Recommendation:** Start with YOUR agency clients (easiest), then pivot to agency partnerships (scalable), keep retail as secondary channel

---

### Decision 2: Pricing Model?
**Options:**
- A) Flat fee ($77/month unlimited)
- B) Tiered ($77 starter, $147 growth, $247 pro)
- C) Usage-based ($67 base + $0.10/SMS)

**How to decide:**
- What do customers expect?
- What's easiest to explain?
- What maximizes revenue without feeling expensive?

**Recommendation:** Start with tiered pricing ($77/$147/$247), most customers will choose $77, upsell heavy users to $147

---

### Decision 3: Free Trial Length?
**Options:**
- A) 14 days (current)
- B) 30 days (standard for B2B SaaS)
- C) 60 days (longer to prove value)

**How to decide:**
- How long to generate 20+ reviews?
- Most businesses will see value in 2-4 weeks

**Recommendation:** 30 days, extendable to 60 if needed for feedback

---

### Decision 4: Geographic Focus?
**Options:**
- A) Local only (your city/region)
- B) US-wide
- C) English-speaking countries

**How to decide:**
- Where are your warm leads?
- Can you provide support remotely?
- Does product work internationally? (Yes, Twilio works globally)

**Recommendation:** Start local (in-person demos), expand to US-wide once you hit 20 customers, international at 100+ customers

---

### Decision 5: Build vs Partner?
**Options:**
- A) Build all features yourself (integrations, mobile app, etc.)
- B) Stay focused, partner for everything else
- C) Build core, white-label to agencies who handle sales/support

**How to decide:**
- Where is your competitive advantage? (Product + agency channel)
- What's your capacity? (Solo founder, limited time)
- What's most scalable? (Agencies selling for you)

**Recommendation:** Option C - Build great product, let agencies distribute it

---

## What You Need to Believe

For this to work, you need to believe:

1. **Local businesses will pay $77-147/month for automated review generation**
   - Evidence: Podium has 30k customers at $289/month
   - Evidence: Grade.us sold for 8 figures
   - Validation needed: Get 5 paying customers by Day 30

2. **Digital marketing agencies will white-label this**
   - Evidence: Agencies always want more recurring revenue
   - Evidence: Your friend is interested
   - Validation needed: Get 1 partner signed by Day 90

3. **You can sell without a huge marketing budget**
   - Evidence: You have warm network (6-7 people)
   - Evidence: Agencies have built-in customers
   - Validation needed: Convert 50% of warm leads

4. **The product solves a real problem**
   - Evidence: Every business wants more reviews
   - Evidence: Asking manually is awkward/forgotten
   - Validation needed: Customers get 15+ reviews/month

5. **You can execute this plan**
   - Evidence: You have 50-60 hours/week
   - Evidence: Product is already built
   - Validation needed: Actually send those emails Monday

---

## The Core Belief

**"Local businesses lose hundreds of potential 5-star reviews every year because asking for reviews is awkward, easy to forget, and manual. FilterFive solves this by making it automatic, easy, and smart (only pushing happy customers to review publicly). Digital marketing agencies will pay me $40/month per client to white-label this because it helps their SEO clients rank better and gives them a high-margin upsell."**

**If this belief is true → $50k MRR is achievable in 18-24 months**

**If this belief is false → You'll know by Day 30 and can pivot**

---

## Final Summary: The Vision

### What FilterFive Becomes

**Short-term vision (12 months):**
A simple, affordable reputation management tool for local businesses, distributed primarily through digital marketing agencies. Known for smart review filtering and ease of use. 150-200 customers, $20-30k MRR.

**Medium-term vision (24 months):**
The go-to white-label review generation platform for SMB-focused marketing agencies. 500+ customers, $50k+ MRR, small team, profitable, expanding internationally.

**Long-term vision (36+ months):**
Either:
- **Option A (Exit):** Acquired by Podium, Birdeye, or agency holding company for $5-15M
- **Option B (Bootstrap):** 1,500-2,000 customers, $100k+ MRR, profitable, lifestyle business
- **Option C (Scale):** Raise funding, hire team, build to $1M+ ARR, bigger exit

### What You're Building Toward

You're building:
- ✅ A real business (not a side project)
- ✅ Recurring revenue (not one-time sales)
- ✅ Scalable distribution (agencies sell for you)
- ✅ A valuable asset (can be sold)
- ✅ Financial freedom (replace agency income)
- ✅ Helping small businesses succeed (positive impact)

You're NOT building:
- ❌ A feature factory competing with Podium
- ❌ A "cheap" option (you're the "smart" option)
- ❌ A venture-backed rocketship (unless you want to)
- ❌ A job for yourself (need to be scalable)

---

## The Only Thing Left: Execute

You have:
- ✅ A working product
- ✅ A clear strategy
- ✅ Warm leads to start with
- ✅ Time to dedicate
- ✅ Technical skills to iterate
- ✅ Domain expertise

The only variable: **Will you actually do it?**

**Monday: Send the emails.**
**Tuesday-Thursday: Visit the stores.**
**Friday: Report results.**

Let's build this.

---

**Document Version:** 1.0
**Last Updated:** November 29, 2025
**Next Review:** After Week 1 execution (December 6, 2025)
**Related Documents:**
- [GO_TO_MARKET_STRATEGY.md](GO_TO_MARKET_STRATEGY.md) - 90-day execution plan
- [PROJECT.md](PROJECT.md) - Technical documentation
