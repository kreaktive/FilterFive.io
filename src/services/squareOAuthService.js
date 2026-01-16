/**
 * Square OAuth Service
 * Handles OAuth flow, token management, and API calls to Square
 */

const { SquareClient, SquareEnvironment } = require('square');
const crypto = require('crypto');
const PosIntegration = require('../models/PosIntegration');
const PosLocation = require('../models/PosLocation');
const logger = require('./logger');
const { maskSecret } = require('../utils/formatters');

class SquareOAuthService {
  constructor() {
    this.clientId = process.env.SQUARE_APP_ID;
    this.clientSecret = process.env.SQUARE_APP_SECRET;
    this.environment = process.env.NODE_ENV === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';
  }

  /**
   * Get Square API client for a specific access token
   */
  getClient(accessToken) {
    return new SquareClient({
      token: accessToken,
      environment: this.environment
    });
  }

  /**
   * Generate OAuth authorization URL
   * @param {number} userId - MoreStars user ID
   * @returns {object} { url, state }
   */
  getAuthorizationUrl(userId) {
    // Generate secure state parameter (prevents CSRF)
    const state = crypto.randomBytes(32).toString('hex');

    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'PAYMENTS_READ CUSTOMERS_READ MERCHANT_PROFILE_READ',
      session: 'false', // Don't use Square's session
      state: `${userId}:${state}`,
      redirect_uri: `${process.env.APP_URL}/api/auth/square/callback`
    });

    const url = `${this.baseUrl}/oauth2/authorize?${params.toString()}`;

    return { url, state };
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @param {string} state - State parameter from callback
   * @returns {object} { userId, tokens }
   */
  async handleCallback(code, state) {
    // Parse state to get userId
    const [userId, originalState] = state.split(':');
    if (!userId) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for tokens
    const client = new SquareClient({ environment: this.environment });

    logger.info('Square OAuth: Exchanging code for token', {
      environment: this.environment,
      clientId: maskSecret(this.clientId),
      redirectUri: `${process.env.APP_URL}/api/auth/square/callback`
    });

    let response;
    try {
      response = await client.oAuth.obtainToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'authorization_code',
        code,
        redirectUri: `${process.env.APP_URL}/api/auth/square/callback`
      });
      logger.debug('Square OAuth: Response received');
    } catch (apiError) {
      logger.error('Square OAuth API Error', { error: apiError.message, details: apiError.errors || apiError });
      throw new Error(`Square API error: ${apiError.message}`);
    }

    // Square SDK may return response directly or wrapped in 'result'
    const tokenData = response.result || response;

    if (!tokenData || !tokenData.accessToken) {
      logger.error('Square OAuth: No access token in response');
      throw new Error('Failed to obtain access token from Square');
    }

    const tokens = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt) : null,
      merchantId: tokenData.merchantId
    };

    return { userId: parseInt(userId), tokens };
  }

  /**
   * Refresh an expired access token
   * @param {PosIntegration} integration - Integration record
   * @returns {boolean} Success
   */
  async refreshToken(integration) {
    const refreshToken = integration.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const client = new SquareClient({ environment: this.environment });

    const response = await client.oAuth.obtainToken({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      grantType: 'refresh_token',
      refreshToken
    });

    // Square SDK may return response directly or wrapped in 'result'
    const tokenData = response.result || response;

    if (!tokenData || !tokenData.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    // Update integration with new tokens
    integration.setAccessToken(tokenData.accessToken);
    if (tokenData.refreshToken) {
      integration.setRefreshToken(tokenData.refreshToken);
    }
    if (tokenData.expiresAt) {
      integration.tokenExpiresAt = new Date(tokenData.expiresAt);
    }
    await integration.save();

    return true;
  }

  /**
   * Revoke access and disconnect integration
   * @param {PosIntegration} integration - Integration record
   */
  async revokeAccess(integration) {
    const accessToken = integration.getAccessToken();

    if (accessToken) {
      try {
        const client = new SquareClient({ environment: this.environment });
        await client.oAuth.revokeToken({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          accessToken
        });
      } catch (error) {
        // Log but don't fail - token might already be invalid
        logger.error('Error revoking Square token', { error: error.message });
      }
    }

    // Mark integration as inactive but keep the record
    integration.isActive = false;
    integration.accessTokenEncrypted = null;
    integration.refreshTokenEncrypted = null;
    await integration.save();
  }

  /**
   * Fetch all locations for a merchant
   * @param {string} accessToken - Decrypted access token
   * @returns {Array} List of locations
   */
  async fetchLocations(accessToken) {
    const client = this.getClient(accessToken);

    const response = await client.locations.list();

    if (!response.locations) {
      return [];
    }

    return response.locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address ?
        `${loc.address.addressLine1 || ''}, ${loc.address.locality || ''}, ${loc.address.administrativeDistrictLevel1 || ''}`.trim()
        : null,
      status: loc.status
    }));
  }

  /**
   * Fetch customer details by ID
   * @param {string} accessToken - Decrypted access token
   * @param {string} customerId - Square customer ID
   * @returns {object|null} Customer details
   */
  async fetchCustomer(accessToken, customerId) {
    if (!customerId) return null;

    const client = this.getClient(accessToken);

    try {
      const response = await client.customers.get({ customerId });

      if (!response.customer) {
        return null;
      }

      const customer = response.customer;
      return {
        id: customer.id,
        givenName: customer.givenName,
        familyName: customer.familyName,
        phoneNumber: customer.phoneNumber,
        emailAddress: customer.emailAddress
      };
    } catch (error) {
      logger.error('Error fetching Square customer', { error: error.message });
      return null;
    }
  }

  /**
   * Sync locations from Square to database
   * @param {PosIntegration} integration - Integration record
   */
  async syncLocations(integration) {
    const accessToken = integration.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const locations = await this.fetchLocations(accessToken);

    for (const loc of locations) {
      await PosLocation.upsert({
        posIntegrationId: integration.id,
        externalLocationId: loc.id,
        locationName: loc.name,
        isEnabled: false // Default to disabled, user must enable
      }, {
        conflictFields: ['pos_integration_id', 'external_location_id']
      });
    }

    // Remove locations that no longer exist in Square
    const externalIds = locations.map(l => l.id);
    await PosLocation.destroy({
      where: {
        posIntegrationId: integration.id,
        externalLocationId: {
          [require('sequelize').Op.notIn]: externalIds
        }
      }
    });

    return locations;
  }

  /**
   * Create or update a POS integration for a user
   * @param {number} userId - MoreStars user ID
   * @param {object} tokens - OAuth tokens
   * @returns {PosIntegration} Integration record
   */
  async createOrUpdateIntegration(userId, tokens) {
    let integration = await PosIntegration.findOne({
      where: { userId, provider: 'square' }
    });

    if (integration) {
      // Update existing integration
      integration.setAccessToken(tokens.accessToken);
      integration.setRefreshToken(tokens.refreshToken);
      integration.tokenExpiresAt = tokens.expiresAt;
      integration.merchantId = tokens.merchantId;
      integration.isActive = true;
      integration.connectedAt = new Date();
      await integration.save();
    } else {
      // Create new integration
      integration = await PosIntegration.create({
        userId,
        provider: 'square',
        merchantId: tokens.merchantId,
        accessTokenEncrypted: null, // Will be set below
        refreshTokenEncrypted: null,
        tokenExpiresAt: tokens.expiresAt,
        isActive: true,
        testMode: true, // Default to test mode
        consentConfirmed: false,
        connectedAt: new Date()
      });

      // Set tokens after creation (uses instance methods)
      integration.setAccessToken(tokens.accessToken);
      integration.setRefreshToken(tokens.refreshToken);
      await integration.save();
    }

    // Sync locations
    await this.syncLocations(integration);

    return integration;
  }
}

module.exports = new SquareOAuthService();
