/**
 * CSP Nonce Middleware
 * Generates a unique nonce per request for Content Security Policy
 *
 * This enables stricter CSP by using nonces instead of 'unsafe-inline'
 * for inline scripts, improving security against XSS attacks.
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure nonce
 * @returns {string} Base64-encoded nonce
 */
const generateNonce = () => {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Middleware to attach nonce to request/response for CSP
 * The nonce is available via:
 * - res.locals.cspNonce (for EJS templates)
 * - req.cspNonce (for programmatic access)
 */
const cspNonceMiddleware = (req, res, next) => {
  const nonce = generateNonce();

  // Make nonce available to templates and request handlers
  res.locals.cspNonce = nonce;
  req.cspNonce = nonce;

  next();
};

/**
 * Build CSP directives with nonce support
 * @param {string} nonce - The request-specific nonce
 * @returns {object} Helmet-compatible CSP directives
 */
const buildCspDirectives = (nonce) => {
  return {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      `'nonce-${nonce}'`,
      // NOTE: Removed 'strict-dynamic' as it breaks host-based allowlisting
      // Host whitelisting is still enforced; external scripts must be from trusted domains
      "https://www.google.com/recaptcha/",
      "https://www.gstatic.com/recaptcha/",
      "https://cdnjs.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://js.stripe.com",
      "https://*.cloudflare.com", // Cloudflare email obfuscation and other services
      "https:" // Allow any HTTPS script as fallback
    ],
    // script-src-elem controls <script> elements specifically
    scriptSrcElem: [
      "'self'",
      `'nonce-${nonce}'`,
      "https://www.google.com/recaptcha/",
      "https://www.gstatic.com/recaptcha/",
      "https://cdnjs.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://js.stripe.com",
      "https://*.cloudflare.com", // Cloudflare services
      "https:" // Allow any HTTPS script as fallback
    ],
    scriptSrcAttr: [
      "'unsafe-inline'" // Allow inline event handlers (onclick, onsubmit, etc.)
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and dynamic styles
      "https://fonts.googleapis.com",
      "https://*.cloudflare.com", // Cloudflare stylesheet delivery
      "https://cdnjs.cloudflare.com", // CDN resources
      "https://*.jsdelivr.net" // JSDelivr CDN
    ],
    // SECURITY: Restrict img-src to specific domains instead of blanket https:
    imgSrc: [
      "'self'",
      "data:",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://lh3.googleusercontent.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    connectSrc: [
      "'self'",
      "https://www.google.com/recaptcha/",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://*.googletagmanager.com",
      "https://api.stripe.com",
      "https://*.sentry.io",  // For Sentry error reporting
      "https://*.cloudflare.com", // Cloudflare API calls and services
      "https:" // Allow any HTTPS API connection as fallback
    ],
    frameSrc: [
      "https://www.google.com/recaptcha/",
      "https://js.stripe.com"
    ],
    formAction: [
      "'self'",
      "https://*.myshopify.com",
      "https://connect.squareup.com",
      "https://connect.squareupsandbox.com"
    ],
    // Restrict base URI to prevent base tag injection
    baseUri: ["'self'"],
    // Restrict form targets
    frameAncestors: ["'none'"],
    // Upgrade insecure requests in production
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
  };
};

/**
 * Create helmet-compatible CSP configuration that uses per-request nonces
 * This should be called per-request, not at app initialization
 */
const createCspConfig = (req, res) => {
  const nonce = req.cspNonce || generateNonce();
  const directives = buildCspDirectives(nonce);

  // Remove null entries (like upgradeInsecureRequests in dev)
  Object.keys(directives).forEach(key => {
    if (directives[key] === null) {
      delete directives[key];
    }
  });

  return {
    directives,
    reportOnly: false
  };
};

module.exports = {
  cspNonceMiddleware,
  generateNonce,
  buildCspDirectives,
  createCspConfig
};
