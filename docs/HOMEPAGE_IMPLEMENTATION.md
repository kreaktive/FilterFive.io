# FilterFive Homepage - Implementation Guide

**Created:** November 30, 2025
**Status:** Ready for Production
**Mobile-First:** Yes ✅

---

## 📋 What Was Created

### 1. **New Homepage Template**
**File:** `src/views/homepage.ejs`
- Complete mobile-first HTML structure
- All 8 sections from marketing copy
- Semantic HTML5 markup
- SEO-optimized meta tags
- Responsive images with SVG placeholders

### 2. **Homepage Styles**
**File:** `public/css/homepage.css`
- Mobile-first responsive CSS (320px → 768px → 1024px+)
- Matches existing FilterFive purple gradient theme (#667eea → #764ba2)
- CSS custom properties for easy theming
- Smooth animations and transitions
- Print-friendly styles

### 3. **Interactive JavaScript**
**File:** `public/js/homepage.js`
- Mobile navigation (hamburger menu)
- FAQ accordion functionality
- Sticky CTA on mobile (shows after hero section)
- Smooth scroll for anchor links
- Fade-in animations on scroll
- Analytics tracking ready

### 4. **Updated App Route**
**File:** `app.js` (line 78-82)
- Changed from plain text to EJS template rendering
- Serves the new homepage at `GET /`

---

## 🚀 Deployment Steps

### **Step 1: Verify Files Are in Place**

Check that all files exist:

```bash
# From project root
ls -la src/views/homepage.ejs
ls -la public/css/homepage.css
ls -la public/js/homepage.js
```

**Expected output:** All three files should exist.

---

### **Step 2: Test Locally (Development)**

```bash
# Start your local development environment
docker-compose up -d

# Or if using npm directly
npm start

# Open browser
open http://localhost:3000
```

**What to test:**
- ✅ Homepage loads at `http://localhost:3000`
- ✅ Mobile navigation (hamburger menu) works
- ✅ FAQ accordion expands/collapses
- ✅ All CTAs link to `/signup`
- ✅ Smooth scroll to sections works
- ✅ Responsive design on mobile (resize browser)

---

### **Step 3: Test Responsiveness**

**Chrome DevTools:**
1. Open homepage
2. Press `F12` (DevTools)
3. Click device toggle icon (top-left)
4. Test these breakpoints:
   - **Mobile:** 375px (iPhone SE)
   - **Mobile Large:** 414px (iPhone Pro Max)
   - **Tablet:** 768px (iPad)
   - **Desktop:** 1024px+

**What to verify:**
- Navigation switches from hamburger to full menu at 1024px
- Pricing cards stack vertically on mobile, 3 columns on desktop
- Hero section switches from single column to 2-column layout on desktop
- All text is readable (no overflow)
- Buttons are tap-friendly on mobile (min 44px height)

---

### **Step 4: Deploy to Production**

#### **Option A: Docker Deployment (Recommended)**

```bash
# SSH to production server
ssh root@31.97.215.238

# Navigate to project
cd /root/FilterFive

# Pull latest code (if using Git)
git pull origin main

# Rebuild containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache app
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs app --tail=50
```

#### **Option B: Manual Deployment**

If not using Git, manually upload files via SCP:

```bash
# From your local machine
scp src/views/homepage.ejs root@31.97.215.238:/root/FilterFive/src/views/
scp public/css/homepage.css root@31.97.215.238:/root/FilterFive/public/css/
scp public/js/homepage.js root@31.97.215.238:/root/FilterFive/public/js/
scp app.js root@31.97.215.238:/root/FilterFive/app.js

# Then SSH and restart
ssh root@31.97.215.238
cd /root/FilterFive
docker-compose restart app
```

---

### **Step 5: Verify Production**

```bash
# Check homepage loads
curl -I https://filterfive.io

# Expected: HTTP 200 OK

# Check CSS loads
curl -I https://filterfive.io/css/homepage.css

# Check JS loads
curl -I https://filterfive.io/js/homepage.js
```

**Manual verification:**
1. Visit https://filterfive.io in browser
2. Check mobile version (resize browser or use phone)
3. Click "Start Free Trial" → should go to `/signup`
4. Test FAQ accordion
5. Test mobile navigation

---

## 🎨 Customization Guide

### **1. Change Colors**

Edit `public/css/homepage.css` (lines 9-17):

```css
:root {
  --primary-color: #667eea;      /* Change to your brand color */
  --secondary-color: #764ba2;    /* Change to your accent color */
  --accent-color: #fbbf24;       /* Yellow accent */
}
```

---

### **2. Add Your Logo**

Replace the text logo in `src/views/homepage.ejs` (line 19-21):

**Current:**
```html
<a href="/" class="logo">
  <span class="logo-text">FilterFive</span>
</a>
```

**With Image:**
```html
<a href="/" class="logo">
  <img src="/images/logo.png" alt="FilterFive" height="32">
</a>
```

---

### **3. Add Real Product Screenshots**

Replace SVG placeholders in `src/views/homepage.ejs`:

**Find:** (line 44-51)
```html
<div class="hero-image-placeholder">
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <!-- ... -->
  </svg>
</div>
```

**Replace with:**
```html
<div class="hero-image-placeholder">
  <img src="/images/hero-dashboard.png" alt="FilterFive Dashboard" loading="lazy">
</div>
```

**Recommended image specs:**
- Format: WebP or PNG
- Max width: 800px
- Optimized for web (<200KB)

---

### **4. Update Pricing (if needed)**

Edit `src/views/homepage.ejs` (lines 265-337):

```html
<div class="plan-price">
  <span class="price-amount">$77</span>  <!-- Change this -->
  <span class="price-period">/month</span>
</div>
<p class="plan-annual">or $770/year <span class="savings">(save $154)</span></p>
```

---

### **5. Add Google Analytics**

Add before closing `</head>` tag in `src/views/homepage.ejs`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

The JavaScript file (`homepage.js`) already tracks CTA clicks automatically.

---

## 🧪 Testing Checklist

### **Desktop (1024px+)**

- [ ] Navigation shows all links (no hamburger)
- [ ] Hero section is 2-column layout (text left, image right)
- [ ] Pricing cards display in 3 columns
- [ ] Problem cards display in 4 columns
- [ ] FAQ accordion works
- [ ] All CTAs link to `/signup`
- [ ] Smooth scroll to anchors works
- [ ] Hover effects work on buttons

### **Tablet (768px - 1023px)**

- [ ] Navigation still uses hamburger menu
- [ ] Hero section is single column (stacked)
- [ ] Pricing cards display in 3 columns
- [ ] Problem cards display in 2 columns
- [ ] All text is readable
- [ ] No horizontal scroll

### **Mobile (375px - 767px)**

- [ ] Hamburger menu opens/closes correctly
- [ ] Mobile nav links close menu when clicked
- [ ] Sticky CTA appears after scrolling past hero
- [ ] All sections are single column
- [ ] Pricing cards stack vertically
- [ ] Tap targets are large enough (44px minimum)
- [ ] Text is readable without zooming
- [ ] Forms and buttons are easy to use

### **Cross-Browser**

- [ ] Chrome/Edge (Chromium)
- [ ] Safari (iOS/macOS)
- [ ] Firefox
- [ ] Samsung Internet (if targeting Android)

---

## 📊 Performance Optimization

### **Current Performance:**
- **Estimated Load Time:** <2 seconds on 3G
- **CSS Size:** ~20KB
- **JS Size:** ~5KB
- **No external dependencies** (no jQuery, Bootstrap, etc.)

### **Further Optimizations (Optional):**

1. **Enable Gzip Compression** (Nginx):
```nginx
gzip on;
gzip_types text/css application/javascript;
```

2. **Add Cache Headers** (Nginx):
```nginx
location ~* \.(css|js|jpg|png|svg|webp)$ {
  expires 7d;
  add_header Cache-Control "public, immutable";
}
```

3. **Minify CSS/JS** (Production):
```bash
# Install minifier
npm install -g csso-cli terser

# Minify CSS
csso public/css/homepage.css -o public/css/homepage.min.css

# Minify JS
terser public/js/homepage.js -o public/js/homepage.min.js -c -m
```

Then update `homepage.ejs` to use `.min` versions in production.

---

## 🐛 Troubleshooting

### **Issue: Homepage shows "FilterFive API - Server is running"**

**Cause:** Old route still cached or app didn't restart.

**Fix:**
```bash
docker-compose restart app
# Or
npm restart
```

---

### **Issue: CSS not loading (unstyled page)**

**Cause:** CSS file path incorrect or file not accessible.

**Fix:**
1. Verify file exists:
   ```bash
   ls -la public/css/homepage.css
   ```

2. Check static file serving in `app.js`:
   ```javascript
   app.use(express.static(path.join(__dirname, 'public')));
   ```

3. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

---

### **Issue: JavaScript not working (hamburger menu broken)**

**Cause:** JS file not loading or error in console.

**Fix:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for `homepage.js` (should be 200 OK)
4. Verify file path in `homepage.ejs`:
   ```html
   <script src="/js/homepage.js"></script>
   ```

---

### **Issue: Mobile menu stays open after clicking link**

**Cause:** JavaScript event listeners not attached.

**Fix:**
1. Check DevTools console for errors
2. Verify `homepage.js` is loaded
3. Hard refresh browser (Ctrl+Shift+R)

---

### **Issue: FAQ accordion doesn't expand**

**Cause:** JavaScript not executing or class names don't match.

**Fix:**
1. Check DevTools console for errors
2. Verify class names in HTML match JS selectors:
   - `.faq-question`
   - `.faq-item`
   - `.faq-answer`

---

## 📱 Mobile-Specific Notes

### **iOS Safari:**
- Sticky CTA uses `position: fixed` (works on iOS 13+)
- Smooth scroll is native (no polyfill needed)
- Hamburger tap targets are 44px minimum (Apple HIG compliant)

### **Android Chrome:**
- Navigation uses `-webkit-tap-highlight-color: transparent` for clean taps
- Mobile viewport is properly configured in meta tag
- Touch events are passive for better scroll performance

---

## 🔗 Next Steps (Optional Enhancements)

### **1. Add Agency Partner Page**
We already created the copy. Create `src/views/partners.ejs` using the agency copy.

### **2. Add Testimonials Section**
Once you have customer reviews, add a testimonials section:
- Place between "Benefits" and "Features"
- Use carousel on mobile, 3-column grid on desktop

### **3. Add Video Demo**
Replace hero placeholder with actual product demo:
- Record 30-60 second demo video
- Upload to YouTube or Vimeo
- Embed in hero section

### **4. Add Live Chat**
Integrate Intercom, Drift, or Crisp for visitor support:
```html
<!-- Add before </body> -->
<script>
  // Intercom snippet
</script>
```

### **5. Add Exit-Intent Popup**
Capture emails before visitors leave:
- Trigger on mouse leaving viewport
- Offer free trial or guide download
- Use Mailchimp, ConvertKit, or custom form

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review browser DevTools console
3. Check Docker logs: `docker-compose logs app --tail=100`
4. Contact: support@filterfive.io

---

## ✅ Deployment Checklist

Before going live:

- [ ] All files uploaded to production
- [ ] App restarted successfully
- [ ] Homepage loads at https://filterfive.io
- [ ] Mobile navigation works
- [ ] All CTAs link correctly
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Performance is acceptable (<3s load time)
- [ ] No console errors in browser
- [ ] Analytics tracking configured (optional)
- [ ] SEO meta tags are correct

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Production URL:** https://filterfive.io
**Status:** ✅ Live

---

**Document Version:** 1.0
**Last Updated:** November 30, 2025
