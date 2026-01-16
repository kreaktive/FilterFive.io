/**
 * Route Registration
 * Centralizes all route setup for the application
 */

const logger = require('../services/logger');
const sanityService = require('../services/sanityService');
const { renderPortableText, renderFAQs, generateAllSchemas } = require('../utils/portableText');
const industries = require('../data/industries');

/**
 * Register webhook routes (must be before body parser)
 */
function registerWebhookRoutes(app) {
  const webhookRoutes = require('../routes/webhook');
  const posWebhookRoutes = require('../routes/posWebhook');
  const sanityWebhookRoutes = require('../routes/sanityWebhook');

  app.use('/webhooks', webhookRoutes);
  app.use('/api/webhooks', posWebhookRoutes);
  app.use('/api/webhooks', sanityWebhookRoutes);
}

/**
 * Register marketing/public routes
 */
function registerMarketingRoutes(app) {
  // Sitemap (must be early for priority)
  const sitemapRoutes = require('../routes/sitemap');
  app.use('/', sitemapRoutes);

  // Homepage
  app.get('/', (req, res) => {
    res.render('homepage', {
      title: 'MoreStars - Turn Every Customer Into a 5-Star Google Review',
      description: 'Get more Google reviews with SMS and QR code campaigns. Customers tap once to leave a review. 14-day free trial. No credit card required.',
      isHomepage: true
    });
  });

  // Static marketing pages with SEO metadata
  const staticPages = [
    {
      path: '/partners',
      view: 'partners',
      title: 'Agency Partners - MoreStars',
      description: 'Partner with MoreStars to offer your clients a powerful review management solution. White-label options and revenue sharing available.'
    },
    {
      path: '/terms',
      view: 'terms-of-service',
      title: 'Terms of Service - MoreStars',
      noindex: true // Legal page - no SEO value
    },
    {
      path: '/privacy',
      view: 'privacy-policy',
      title: 'Privacy Policy - MoreStars',
      noindex: true // Legal page - no SEO value
    },
    {
      path: '/sms-compliance',
      view: 'sms-compliance',
      title: 'SMS Compliance & Consent Information - MoreStars',
      noindex: true // Legal page - no SEO value
    },
    {
      path: '/demo',
      view: 'demo',
      title: 'SMS Consent Collection Demo - MoreStars',
      description: 'See how MoreStars collects customer consent for SMS review requests. Try our interactive demo.'
    },
    {
      path: '/pricing',
      view: 'pricing',
      title: 'Pricing - $77/month | MoreStars Review Software',
      description: 'Simple, transparent pricing at $77/month. Unlimited SMS review requests, QR codes, and analytics. 14-day free trial, no credit card required.'
    },
    {
      path: '/features',
      view: 'features',
      title: 'Features - SMS Reviews, QR Codes & Analytics | MoreStars',
      description: 'Send SMS review requests, generate QR codes, track analytics, and manage your online reputation. Everything you need to get more 5-star Google reviews.'
    },
    {
      path: '/how-it-works',
      view: 'how-it-works',
      title: 'How It Works - Get More Google Reviews | MoreStars',
      description: 'Upload customers, send one-tap SMS review requests, and watch your Google reviews grow. Simple 3-step process to boost your online reputation.'
    },
    {
      path: '/faq',
      view: 'faq',
      title: 'FAQ - Frequently Asked Questions | MoreStars',
      description: 'Common questions about MoreStars review software. Learn about SMS campaigns, pricing, integrations, and how to get more Google reviews.'
    }
  ];

  staticPages.forEach(({ path, view, title, description, noindex }) => {
    app.get(path, (req, res) => {
      res.render(view, { title, description, noindex });
    });
  });

  // Contact routes
  const contactController = require('../controllers/contactController');
  const rateLimit = require('express-rate-limit');

  // Rate limiter for contact form (5 submissions per hour per IP)
  const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many contact form submissions. Please try again in an hour.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development' // Skip in development
  });

  app.get('/contact', contactController.showContact);
  app.post('/contact', contactLimiter, contactController.submitContact);

  // Blog routes
  registerBlogRoutes(app);

  // Industry routes
  registerIndustryRoutes(app);

  // Login redirect
  app.get('/login', (req, res) => {
    res.redirect(301, '/dashboard/login');
  });
}

/**
 * Register blog routes (Sanity CMS)
 */
function registerBlogRoutes(app) {
  app.get('/blog', async (req, res) => {
    try {
      const posts = await sanityService.getAllPosts();
      res.render('blog', {
        title: 'Blog - Advice for Local Businesses | MoreStars',
        description: 'Tips, strategies, and guides to help local businesses manage their reputation and grow online.',
        posts
      });
    } catch (error) {
      logger.error('Error rendering blog page', { error: error.message });
      res.status(500).render('error', { message: 'Unable to load blog' });
    }
  });

  app.get('/blog/:slug', async (req, res) => {
    try {
      const post = await sanityService.getPostBySlug(req.params.slug);

      if (!post) {
        return res.redirect('/blog');
      }

      let relatedPosts = post.relatedPosts || [];
      if (relatedPosts.length === 0 && post.categoryData?._id) {
        relatedPosts = await sanityService.getRelatedPosts(
          post.slug,
          post.categoryData._id,
          3
        );
      }

      res.render('blog-post', {
        title: post.seo?.metaTitle || `${post.title} | MoreStars Blog`,
        description: post.seo?.metaDescription || post.excerpt,
        ogTitle: post.seo?.metaTitle || post.title,
        ogDescription: post.seo?.metaDescription || post.excerpt,
        ogImage: post.seo?.ogImage || post.featuredImage?.url,
        keywords: post.seo?.secondaryKeywords?.join(', '),
        post,
        relatedPosts,
        renderPortableText,
        renderFAQs,
        generateAllSchemas
      });
    } catch (error) {
      logger.error('Error rendering blog post', { slug: req.params.slug, error: error.message });
      res.redirect('/blog');
    }
  });
}

/**
 * Register industry landing page routes
 */
function registerIndustryRoutes(app) {
  // Industries hub
  app.get('/industries', (req, res) => {
    res.render('industries', {
      title: 'Industries We Serve | MoreStars',
      description: 'MoreStars helps local businesses across 20+ industries get more Google reviews. Find your industry and see how we can help.',
      industries: industries
    });
  });

  // Dynamic industry pages
  app.get('/industries/:slug', (req, res) => {
    const industry = industries[req.params.slug];

    if (!industry) {
      return res.status(404).render('404', { title: 'Page Not Found - MoreStars', noindex: true });
    }

    res.render('industry', {
      title: industry.metaTitle,
      description: industry.metaDescription,
      industry: industry
    });
  });
}

/**
 * Register application routes (auth, dashboard, admin)
 */
function registerAppRoutes(app) {
  // Auth routes
  const authRoutes = require('../routes/auth');
  app.use('/', authRoutes);

  // QR code routes
  const qrRoutes = require('../routes/qr');
  app.use('/', qrRoutes);

  // API routes
  const ingestRoutes = require('../routes/ingest');
  app.use('/api/v1/hooks', ingestRoutes);

  // Review routes (customer-facing)
  const reviewRoutes = require('../routes/review');
  app.use('/review', reviewRoutes);

  // Short URL routes
  const shortUrlRoutes = require('../routes/shortUrl');
  app.use('/r', shortUrlRoutes);

  // Dashboard routes
  const dashboardRoutes = require('../routes/dashboard');
  app.use('/dashboard', dashboardRoutes);

  // Subscription routes
  const subscriptionRoutes = require('../routes/subscription');
  app.use('/dashboard/subscription', subscriptionRoutes);

  // Analytics routes
  const analyticsRoutes = require('../routes/analytics');
  app.use('/dashboard/analytics', analyticsRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Upload routes
  const uploadRoutes = require('../routes/upload');
  app.use('/dashboard', uploadRoutes);

  // Feedback routes
  const feedbackRoutes = require('../routes/feedback');
  app.use('/dashboard', feedbackRoutes);

  // Admin routes
  const adminRoutes = require('../routes/admin');
  app.use('/admin', adminRoutes);

  // POS routes
  const posAuthRoutes = require('../routes/posAuth');
  const posSettingsRoutes = require('../routes/posSettings');
  app.use('/api/auth', posAuthRoutes);
  app.use('/dashboard/settings', posSettingsRoutes);
}

/**
 * Register health check routes
 */
function registerHealthRoutes(app, sequelize) {
  app.get('/health', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  app.get('/health/sms', (req, res) => {
    try {
      const { getAllStates } = require('../services/circuitBreakerService');
      const states = getAllStates();
      const twilioCircuit = states.twilio;

      const status = twilioCircuit?.state === 'OPEN' ? 'degraded' : 'healthy';
      const httpStatus = twilioCircuit?.state === 'OPEN' ? 503 : 200;

      res.status(httpStatus).json({
        status,
        timestamp: new Date().toISOString(),
        circuits: {
          twilio: twilioCircuit || { state: 'NOT_INITIALIZED' }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
}

/**
 * Register all routes
 */
function registerAllRoutes(app, sequelize) {
  registerMarketingRoutes(app);
  registerAppRoutes(app);
  registerHealthRoutes(app, sequelize);
}

module.exports = {
  registerWebhookRoutes,
  registerAllRoutes
};
