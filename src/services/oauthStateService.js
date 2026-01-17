const crypto = require('crypto');
const logger = require('./logger');

/**
 * OAuth State Management Service
 *
 * Provides secure state token generation and validation for OAuth flows.
 * Implements timing-safe comparison, single-use consumption, and expiry checks
 * to prevent CSRF attacks on OAuth callbacks.
 */
class OAuthStateService {
  static STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Generate and store state token in session
   * @param {object} req - Express request (must have session)
   * @param {string} provider - OAuth provider ('square' or 'shopify')
   * @param {number} userId - User ID to embed in state
   * @param {object} metadata - Additional data (e.g., shopDomain for Shopify)
   * @returns {string} State token for OAuth authorization URL
   */
  generateState(req, provider, userId, metadata = {}) {
    if (!req.session) {
      throw new Error('Session required for OAuth state generation');
    }

    // Generate cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Initialize oauthState namespace if needed
    if (!req.session.oauthState) {
      req.session.oauthState = {};
    }

    // Store state data in session
    req.session.oauthState[provider] = {
      token,
      userId,
      metadata,
      createdAt: Date.now()
    };

    logger.info('OAuth state generated', {
      provider,
      userId,
      tokenLength: token.length
    });

    // Return formatted state string for OAuth URL
    if (provider === 'square') {
      return `${userId}:${token}`;
    } else if (provider === 'shopify') {
      return `${userId}:${metadata.shopDomain}:${token}`;
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  /**
   * Validate state token from callback against session
   *
   * Implements multiple security checks:
   * 1. Session existence check
   * 2. Timing-safe token comparison (prevents timing attacks)
   * 3. Expiry validation (15 minute window)
   * 4. Single-use consumption (prevents replay attacks)
   *
   * @param {object} req - Express request (must have session)
   * @param {string} provider - OAuth provider ('square' or 'shopify')
   * @param {string} receivedState - State parameter from OAuth callback
   * @returns {object} { valid: boolean, userId?: number, metadata?: object, error?: string }
   */
  validateAndConsume(req, provider, receivedState) {
    // 1. Check session exists and has stored state
    if (!req.session || !req.session.oauthState || !req.session.oauthState[provider]) {
      logger.warn('OAuth state validation failed - no session state', {
        provider,
        hasSession: !!req.session,
        hasOAuthState: !!(req.session && req.session.oauthState)
      });
      return { valid: false, error: 'no_session_state' };
    }

    const stored = req.session.oauthState[provider];

    // 2. Parse received state to extract token
    const parts = receivedState.split(':');
    const receivedToken = parts[parts.length - 1]; // Last part is always the token

    // 3. Timing-safe comparison (prevents timing attacks like CSRF middleware)
    let valid;
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(stored.token),
        Buffer.from(receivedToken)
      );
    } catch (error) {
      logger.warn('OAuth state validation failed - token mismatch', {
        provider,
        error: error.message
      });
      return { valid: false, error: 'state_mismatch' };
    }

    if (!valid) {
      logger.warn('OAuth state validation failed - invalid token', {
        provider
      });
      return { valid: false, error: 'state_mismatch' };
    }

    // 4. Check expiry (15 minute window)
    const age = Date.now() - stored.createdAt;
    if (age > OAuthStateService.STATE_TTL_MS) {
      logger.warn('OAuth state validation failed - expired', {
        provider,
        ageMinutes: Math.floor(age / 60000)
      });
      delete req.session.oauthState[provider];
      return { valid: false, error: 'state_expired' };
    }

    // 5. Single-use consumption (prevents replay attacks)
    const result = {
      valid: true,
      userId: stored.userId,
      metadata: stored.metadata || {}
    };

    // Delete state from session immediately after validation
    delete req.session.oauthState[provider];

    logger.info('OAuth state validated successfully', {
      provider,
      userId: result.userId
    });

    return result;
  }
}

module.exports = new OAuthStateService();
