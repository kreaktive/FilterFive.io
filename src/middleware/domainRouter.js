/**
 * Domain Router Middleware
 *
 * Routes requests based on the hostname:
 * - morestars.io / www.morestars.io: Marketing pages (homepage, partners, demo, legal)
 * - app.morestars.io: App pages (login, signup, dashboard)
 *
 * For app.morestars.io, the root path redirects to /login (or /dashboard if logged in)
 */

const MARKETING_DOMAINS = ['morestars.io', 'www.morestars.io'];
const APP_DOMAIN = 'app.morestars.io';

// Routes that should only be accessible on marketing domain
const MARKETING_ONLY_ROUTES = ['/', '/partners', '/demo'];

// Routes that are shared (legal pages, static assets, etc.)
const SHARED_ROUTES = ['/terms', '/privacy', '/sms-compliance', '/css', '/js', '/images', '/favicon'];

/**
 * Check if path starts with any of the given prefixes
 */
const pathStartsWith = (path, prefixes) => {
  return prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
};

/**
 * Check if this is the marketing domain
 */
const isMarketingDomain = (host) => {
  const hostname = host.split(':')[0]; // Remove port if present
  return MARKETING_DOMAINS.includes(hostname);
};

/**
 * Check if this is the app domain
 */
const isAppDomain = (host) => {
  const hostname = host.split(':')[0];
  return hostname === APP_DOMAIN;
};

/**
 * Middleware to handle app.morestars.io root redirect
 * On app subdomain, / should redirect to /login (or /dashboard if authenticated)
 */
const appRootRedirect = (req, res, next) => {
  const host = req.get('host') || '';

  // Only apply to app.morestars.io
  if (!isAppDomain(host)) {
    return next();
  }

  // Only redirect the exact root path
  if (req.path !== '/') {
    return next();
  }

  // If user is authenticated, redirect to dashboard
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }

  // Otherwise redirect to login
  return res.redirect('/login');
};

/**
 * Middleware to block marketing-only pages on app subdomain
 * (except for shared routes like /terms, /privacy)
 */
const blockMarketingOnApp = (req, res, next) => {
  const host = req.get('host') || '';

  // Only apply to app.morestars.io
  if (!isAppDomain(host)) {
    return next();
  }

  // Allow shared routes
  if (pathStartsWith(req.path, SHARED_ROUTES)) {
    return next();
  }

  // Block marketing-only routes on app domain
  if (MARKETING_ONLY_ROUTES.includes(req.path)) {
    // Redirect to marketing domain
    return res.redirect(301, `https://morestars.io${req.path}`);
  }

  next();
};

/**
 * Middleware to redirect auth routes from marketing domain to app domain
 * /signup, /login, /dashboard/* should go to app.morestars.io
 */
const redirectAuthToApp = (req, res, next) => {
  const host = req.get('host') || '';

  // Only apply to marketing domains
  if (!isMarketingDomain(host)) {
    return next();
  }

  // Routes that should redirect to app subdomain
  const appRoutes = ['/signup', '/login', '/dashboard', '/verify', '/forgot-password', '/reset-password'];

  if (pathStartsWith(req.path, appRoutes)) {
    return res.redirect(301, `https://app.morestars.io${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`);
  }

  next();
};

module.exports = {
  appRootRedirect,
  blockMarketingOnApp,
  redirectAuthToApp,
  isMarketingDomain,
  isAppDomain
};
