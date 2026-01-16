/**
 * Inbound Webhook Service
 * Handles webhooks from Zapier and Custom Webhook integrations
 *
 * These integrations receive transaction data from external sources
 * and trigger SMS review requests.
 */

const crypto = require('crypto');
const PosIntegration = require('../models/PosIntegration');
const PosWebhookEvent = require('../models/PosWebhookEvent');
const posSmsService = require('./posSmsService');
const logger = require('./logger');

class InboundWebhookService {
  constructor() {
    // Rate limit: max requests per minute per integration
    this.rateLimitPerMinute = 60;
    this.requestCounts = new Map();
  }

  /**
   * Verify API key authentication
   * @param {string} providedKey - API key from header or body
   * @param {PosIntegration} integration - Integration record
   * @returns {boolean} Valid key
   */
  verifyApiKey(providedKey, integration) {
    if (!providedKey || !integration) {
      return false;
    }

    const storedKey = integration.getApiKey();
    if (!storedKey) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(providedKey),
        Buffer.from(storedKey)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify webhook signature
   * S11 FIX: If webhookSecret is configured, signature is REQUIRED
   * @param {string} rawBody - Raw request body
   * @param {string} signature - X-Webhook-Signature header
   * @param {PosIntegration} integration - Integration record
   * @returns {boolean} Valid signature
   */
  verifySignature(rawBody, signature, integration) {
    // S11 FIX: If secret is configured, signature is mandatory
    if (integration.webhookSecret) {
      if (!signature) {
        // Webhook secret configured but no signature provided - reject
        return false;
      }
    } else {
      // No secret configured - signature verification not possible
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', integration.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Support both 'sha256=' prefixed and raw signatures
    const cleanSignature = signature.replace(/^sha256=/, '');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature.toLowerCase()),
        Buffer.from(expectedSignature.toLowerCase())
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check rate limit for integration
   * @param {number} integrationId - Integration ID
   * @returns {boolean} Within rate limit
   */
  checkRateLimit(integrationId) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${integrationId}:${minute}`;

    const count = this.requestCounts.get(key) || 0;
    if (count >= this.rateLimitPerMinute) {
      return false;
    }

    this.requestCounts.set(key, count + 1);

    // Cleanup old entries every 100 requests
    if (Math.random() < 0.01) {
      this.cleanupRateLimits(minute);
    }

    return true;
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimits(currentMinute) {
    for (const [key] of this.requestCounts) {
      const minute = parseInt(key.split(':')[1], 10);
      if (minute < currentMinute - 5) {
        this.requestCounts.delete(key);
      }
    }
  }

  /**
   * Find integration by webhook URL path
   * @param {string} urlPath - URL path identifier
   * @param {string} provider - 'zapier' or 'webhook'
   * @returns {PosIntegration|null}
   */
  async findIntegrationByUrlPath(urlPath, provider = null) {
    // S2 fix: Use exact match instead of LIKE to prevent SQL injection
    // The webhookUrl is a 16-char hex string, so exact match is correct
    const where = {
      webhookUrl: urlPath, // Exact match, no Op.like needed
      isActive: true
    };

    if (provider) {
      where.provider = provider;
    } else {
      where.provider = { [require('sequelize').Op.in]: ['zapier', 'webhook'] };
    }

    return await PosIntegration.findOne({ where });
  }

  /**
   * Process incoming webhook payload
   * @param {object} options - Processing options
   * @param {PosIntegration} options.integration - Integration record
   * @param {object} options.payload - Webhook payload
   * @param {string} options.rawBody - Raw request body for signature verification
   * @param {string} options.signature - Optional webhook signature
   * @param {string} options.apiKey - API key from header
   * @returns {object} Processing result
   */
  async processWebhook({ integration, payload, rawBody, signature, apiKey }) {
    const provider = integration.provider;

    // Verify API key
    if (!this.verifyApiKey(apiKey, integration)) {
      logger.warn('Invalid API key', { provider, integrationId: integration.id });
      return { error: true, code: 'INVALID_API_KEY', message: 'Invalid API key' };
    }

    // Verify signature if provided
    if (signature && !this.verifySignature(rawBody, signature, integration)) {
      logger.warn('Invalid signature', { provider, integrationId: integration.id });
      return { error: true, code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' };
    }

    // Check rate limit
    if (!this.checkRateLimit(integration.id)) {
      logger.warn('Rate limit exceeded', { provider, integrationId: integration.id });
      return { error: true, code: 'RATE_LIMIT', message: 'Rate limit exceeded. Max 60 requests per minute.' };
    }

    // Generate event ID for idempotency
    const eventId = payload.transaction_id ||
                    payload.order_id ||
                    `${integration.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // B11 FIX: Atomic idempotency check using findOrCreate instead of check-then-mark
    // This prevents race conditions when duplicate webhooks arrive simultaneously
    const [webhookEvent, created] = await PosWebhookEvent.findOrCreate({
      where: { provider, eventId },
      defaults: {
        eventType: 'transaction.created',
        processedAt: new Date()
      }
    });

    if (!created) {
      logger.info('Skipping duplicate event', { provider, eventId });
      return { skipped: true, reason: 'duplicate', eventId };
    }

    // Validate required fields
    const validation = this.validatePayload(payload);
    if (!validation.valid) {
      return { error: true, code: 'INVALID_PAYLOAD', message: validation.message };
    }

    // Extract transaction data from payload
    const transactionData = this.extractTransactionData(payload);

    // Process the transaction
    const result = await posSmsService.processTransaction({
      integration,
      externalTransactionId: eventId,
      customerName: transactionData.customerName,
      customerPhone: transactionData.customerPhone,
      purchaseAmount: transactionData.purchaseAmount,
      locationName: transactionData.locationName || `${provider === 'zapier' ? 'Zapier' : 'Webhook'} Integration`
    });

    return {
      success: true,
      eventId,
      ...result
    };
  }

  /**
   * Validate webhook payload has required fields
   * @param {object} payload - Webhook payload
   * @returns {object} Validation result
   */
  validatePayload(payload) {
    // Phone is required
    if (!payload.customer_phone && !payload.phone) {
      return { valid: false, message: 'Missing required field: customer_phone or phone' };
    }

    return { valid: true };
  }

  /**
   * Extract transaction data from flexible payload format
   * Supports multiple field naming conventions
   * @param {object} payload - Webhook payload
   * @returns {object} Normalized transaction data
   */
  extractTransactionData(payload) {
    // Support multiple field naming conventions
    const customerPhone = payload.customer_phone ||
                         payload.phone ||
                         payload.customerPhone ||
                         payload.mobile ||
                         payload.cell;

    const customerName = payload.customer_name ||
                        payload.name ||
                        payload.customerName ||
                        payload.customer ||
                        payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : null;

    const purchaseAmount = payload.amount ||
                          payload.purchase_amount ||
                          payload.total ||
                          payload.order_total ||
                          payload.sale_amount;

    const locationName = payload.location ||
                        payload.location_name ||
                        payload.store ||
                        payload.store_name;

    return {
      customerPhone,
      customerName,
      purchaseAmount: purchaseAmount ? parseFloat(purchaseAmount) : null,
      locationName
    };
  }

  /**
   * Generate webhook credentials for a new integration
   * @returns {object} { apiKey, webhookSecret, webhookUrlPath }
   */
  generateWebhookCredentials() {
    return {
      apiKey: crypto.randomBytes(16).toString('hex'), // 32 char hex string
      webhookSecret: crypto.randomBytes(32).toString('hex'), // 64 char hex string
      webhookUrlPath: crypto.randomBytes(8).toString('hex') // 16 char hex string
    };
  }

  /**
   * Get full webhook URL for an integration
   * @param {PosIntegration} integration - Integration record
   * @returns {string} Full webhook URL
   */
  getWebhookUrl(integration) {
    const baseUrl = process.env.APP_URL || 'https://app.morestars.io';
    return `${baseUrl}/api/webhooks/inbound/${integration.webhookUrl}`;
  }

  /**
   * Get setup instructions for provider
   * @param {string} provider - 'zapier' or 'webhook'
   * @param {PosIntegration} integration - Integration record
   * @returns {object} Setup instructions and example
   */
  getSetupInstructions(provider, integration) {
    const webhookUrl = this.getWebhookUrl(integration);
    const apiKey = integration.getApiKey();

    if (provider === 'zapier') {
      return {
        title: 'Zapier Setup Instructions',
        steps: [
          '1. Go to zapier.com and create a new Zap',
          '2. Choose your POS system as the trigger (e.g., Square, Clover, Toast)',
          '3. Set the trigger event (e.g., "New Payment" or "New Order")',
          '4. Add "Webhooks by Zapier" as the action',
          '5. Choose "POST" as the action event',
          '6. Configure the webhook with the URL and headers below',
          '7. Map your POS fields to the JSON body format shown',
          '8. Test the Zap and turn it on!'
        ],
        webhookUrl,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        examplePayload: {
          customer_phone: '{{Customer Phone}}',
          customer_name: '{{Customer Name}}',
          amount: '{{Total Amount}}',
          transaction_id: '{{Payment ID}}'
        }
      };
    }

    // Custom webhook
    return {
      title: 'Custom Webhook Setup',
      description: 'Send a POST request to the URL below with transaction data.',
      webhookUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      requiredFields: ['customer_phone'],
      optionalFields: ['customer_name', 'amount', 'transaction_id', 'location'],
      examplePayload: {
        customer_phone: '+15551234567',
        customer_name: 'John Doe',
        amount: 49.99,
        transaction_id: 'order-12345',
        location: 'Main Store'
      },
      curlExample: `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"customer_phone": "+15551234567", "customer_name": "John Doe", "amount": 49.99}'`
    };
  }
}

module.exports = new InboundWebhookService();
