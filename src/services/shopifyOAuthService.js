/**
 * Shopify OAuth Service
 * Handles OAuth flow, token management, and API calls to Shopify
 */

const crypto = require('crypto');
const axios = require('axios');
const PosIntegration = require('../models/PosIntegration');
const PosLocation = require('../models/PosLocation');
const logger = require('./logger');

class ShopifyOAuthService {
  constructor() {
    this.apiKey = process.env.SHOPIFY_API_KEY;
    this.apiSecret = process.env.SHOPIFY_API_SECRET;
    this.scopes = 'read_orders,read_customers,read_locations';
    this.apiVersion = '2024-10'; // Use recent stable API version
  }

  /**
   * Generate OAuth authorization URL
   * @param {number} userId - MoreStars user ID
   * @param {string} shop - Shop domain (e.g., store.myshopify.com)
   * @returns {object} { url, state }
   */
  getAuthorizationUrl(userId, shop) {
    // Normalize shop domain
    const shopDomain = this.normalizeShopDomain(shop);

    // Generate secure state parameter (prevents CSRF)
    const state = crypto.randomBytes(32).toString('hex');

    const params = new URLSearchParams({
      client_id: this.apiKey,
      scope: this.scopes,
      redirect_uri: `${process.env.APP_URL}/api/auth/shopify/callback`,
      state: `${userId}:${shopDomain}:${state}`
    });

    const url = `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;

    return { url, state, shopDomain };
  }

  /**
   * Normalize shop domain to standard format
   * @param {string} shop - Raw shop input
   * @returns {string} Normalized domain (store.myshopify.com)
   */
  normalizeShopDomain(shop) {
    if (!shop) throw new Error('Shop domain is required');

    // Remove protocol if present
    let domain = shop.replace(/^https?:\/\//, '');

    // Remove trailing slash
    domain = domain.replace(/\/$/, '');

    // Add .myshopify.com if not present
    if (!domain.includes('.myshopify.com')) {
      domain = `${domain}.myshopify.com`;
    }

    return domain.toLowerCase();
  }

  /**
   * Validate HMAC signature from callback
   * @param {object} query - Query parameters from callback
   * @returns {boolean} Valid signature
   */
  validateCallback(query) {
    const { hmac, ...params } = query;

    // Sort and encode parameters
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Generate HMAC
    const generatedHmac = crypto
      .createHmac('sha256', this.apiSecret)
      .update(sortedParams)
      .digest('hex');

    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(generatedHmac)
    );
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @param {string} shop - Shop domain
   * @param {string} state - State parameter from callback
   * @returns {object} { userId, shopDomain, tokens }
   */
  async handleCallback(code, shop, state) {
    // Parse state to get userId and shop
    const [userId, shopFromState, originalState] = state.split(':');
    if (!userId || !shopFromState) {
      throw new Error('Invalid state parameter');
    }

    const shopDomain = this.normalizeShopDomain(shop);

    // Exchange code for access token
    const response = await axios.post(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        code
      }
    );

    if (!response.data || !response.data.access_token) {
      throw new Error('Failed to obtain access token from Shopify');
    }

    const tokens = {
      accessToken: response.data.access_token,
      scope: response.data.scope,
      // Shopify access tokens don't expire unless using online tokens
      // For offline tokens, they last until the app is uninstalled
      expiresAt: null
    };

    return {
      userId: parseInt(userId),
      shopDomain,
      tokens
    };
  }

  /**
   * Fetch all locations for a shop (using GraphQL)
   * @param {string} accessToken - Decrypted access token
   * @param {string} shopDomain - Shop domain
   * @returns {Array} List of locations
   */
  async fetchLocations(accessToken, shopDomain) {
    const query = `
      query {
        locations(first: 50) {
          edges {
            node {
              id
              name
              address {
                address1
                city
                province
              }
              isActive
            }
          }
        }
      }
    `;

    try {
      const response = await axios.post(
        `https://${shopDomain}/admin/api/${this.apiVersion}/graphql.json`,
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          }
        }
      );

      if (!response.data.data || !response.data.data.locations) {
        return [];
      }

      return response.data.data.locations.edges.map(edge => {
        const loc = edge.node;
        // Extract numeric ID from GraphQL global ID (gid://shopify/Location/123)
        const idMatch = loc.id.match(/\/(\d+)$/);
        return {
          id: idMatch ? idMatch[1] : loc.id,
          name: loc.name,
          address: loc.address ?
            `${loc.address.address1 || ''}, ${loc.address.city || ''}, ${loc.address.province || ''}`.trim()
            : null,
          isActive: loc.isActive
        };
      });
    } catch (error) {
      logger.error('Error fetching Shopify locations', { error: error.message });
      return [];
    }
  }

  /**
   * Sync locations from Shopify to database
   * @param {PosIntegration} integration - Integration record
   */
  async syncLocations(integration) {
    const accessToken = integration.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const locations = await this.fetchLocations(accessToken, integration.shopDomain);

    for (const loc of locations) {
      await PosLocation.upsert({
        posIntegrationId: integration.id,
        externalLocationId: loc.id,
        locationName: loc.name,
        isEnabled: false // Default to disabled
      }, {
        conflictFields: ['pos_integration_id', 'external_location_id']
      });
    }

    // Remove locations that no longer exist
    const externalIds = locations.map(l => l.id);
    if (externalIds.length > 0) {
      await PosLocation.destroy({
        where: {
          posIntegrationId: integration.id,
          externalLocationId: {
            [require('sequelize').Op.notIn]: externalIds
          }
        }
      });
    }

    return locations;
  }

  /**
   * Revoke access and disconnect integration
   * @param {PosIntegration} integration - Integration record
   */
  async revokeAccess(integration) {
    const accessToken = integration.getAccessToken();

    if (accessToken && integration.shopDomain) {
      try {
        // Shopify doesn't have a revoke endpoint for offline tokens
        // The token becomes invalid when the app is uninstalled
        // We can delete the webhook subscriptions though
        await this.deleteWebhooks(accessToken, integration.shopDomain);
      } catch (error) {
        logger.error('Error cleaning up Shopify integration', { error: error.message });
      }
    }

    // Mark integration as inactive
    integration.isActive = false;
    integration.accessTokenEncrypted = null;
    integration.refreshTokenEncrypted = null;
    await integration.save();
  }

  /**
   * Delete webhook subscriptions for a shop
   */
  async deleteWebhooks(accessToken, shopDomain) {
    // List webhooks
    const listResponse = await axios.get(
      `https://${shopDomain}/admin/api/${this.apiVersion}/webhooks.json`,
      {
        headers: { 'X-Shopify-Access-Token': accessToken }
      }
    );

    const webhooks = listResponse.data.webhooks || [];

    // Delete each webhook
    // Check for both 'morestars' and 'filterfive' to handle legacy webhooks from old deployments
    for (const webhook of webhooks) {
      if (webhook.address.includes('morestars') || webhook.address.includes('filterfive')) {
        await axios.delete(
          `https://${shopDomain}/admin/api/${this.apiVersion}/webhooks/${webhook.id}.json`,
          {
            headers: { 'X-Shopify-Access-Token': accessToken }
          }
        );
      }
    }
  }

  /**
   * Register webhook for orders/create
   * @param {string} accessToken - Access token
   * @param {string} shopDomain - Shop domain
   */
  async registerWebhook(accessToken, shopDomain) {
    try {
      await axios.post(
        `https://${shopDomain}/admin/api/${this.apiVersion}/webhooks.json`,
        {
          webhook: {
            topic: 'orders/create',
            address: `${process.env.APP_URL}/api/webhooks/shopify`,
            format: 'json'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          }
        }
      );
      logger.info('Registered orders/create webhook', { shopDomain });
    } catch (error) {
      // Webhook might already exist
      if (error.response?.status !== 422) {
        throw error;
      }
    }
  }

  /**
   * Create or update a POS integration for a user
   * @param {number} userId - MoreStars user ID
   * @param {string} shopDomain - Shopify shop domain
   * @param {object} tokens - OAuth tokens
   * @returns {PosIntegration} Integration record
   */
  async createOrUpdateIntegration(userId, shopDomain, tokens) {
    let integration = await PosIntegration.findOne({
      where: { userId, provider: 'shopify' }
    });

    if (integration) {
      // Update existing integration
      integration.setAccessToken(tokens.accessToken);
      integration.shopDomain = shopDomain;
      integration.tokenExpiresAt = tokens.expiresAt;
      integration.isActive = true;
      integration.connectedAt = new Date();
      await integration.save();
    } else {
      // Create new integration
      integration = await PosIntegration.create({
        userId,
        provider: 'shopify',
        shopDomain,
        accessTokenEncrypted: null,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
        testMode: true,
        consentConfirmed: false,
        connectedAt: new Date()
      });

      integration.setAccessToken(tokens.accessToken);
      await integration.save();
    }

    // Register webhook
    await this.registerWebhook(tokens.accessToken, shopDomain);

    // Sync locations
    await this.syncLocations(integration);

    return integration;
  }
}

module.exports = new ShopifyOAuthService();
