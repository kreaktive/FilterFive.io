/**
 * PosIntegration Model
 * Stores OAuth credentials and settings for POS integrations
 * Supports: Square, Shopify, Clover, Stripe, WooCommerce, Zapier, Custom Webhook
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../services/logger');

const PosIntegration = sequelize.define('PosIntegration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  provider: {
    type: DataTypes.ENUM('square', 'shopify', 'zapier', 'webhook', 'clover', 'stripe_pos', 'woocommerce'),
    allowNull: false
  },
  merchantId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'merchant_id',
    comment: 'External merchant/shop ID from Square, Shopify, or Clover'
  },
  shopDomain: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'shop_domain',
    comment: 'Shopify shop domain (e.g., store.myshopify.com)'
  },
  accessTokenEncrypted: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'access_token_encrypted'
  },
  refreshTokenEncrypted: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token_encrypted'
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'token_expires_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  testMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'test_mode'
  },
  testPhoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'test_phone_number'
  },
  consentConfirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'consent_confirmed'
  },
  connectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'connected_at'
  },
  // Zapier/Custom Webhook fields
  webhookUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'webhook_url',
    comment: 'Generated unique webhook URL for Zapier/Custom integrations'
  },
  apiKeyEncrypted: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'api_key_encrypted',
    comment: 'Encrypted API key for webhook authentication'
  },
  webhookSecret: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'webhook_secret',
    comment: 'Secret for webhook signature verification'
  },
  // WooCommerce fields
  storeUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'store_url',
    comment: 'WooCommerce store URL'
  },
  consumerKeyEncrypted: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'consumer_key_encrypted',
    comment: 'Encrypted WooCommerce consumer key'
  },
  consumerSecretEncrypted: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'consumer_secret_encrypted',
    comment: 'Encrypted WooCommerce consumer secret'
  },
  // Stripe POS settings
  triggerOnCheckout: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'trigger_on_checkout',
    comment: 'Send SMS for Stripe Checkout completions'
  },
  triggerOnTerminal: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'trigger_on_terminal',
    comment: 'Send SMS for Stripe Terminal payments'
  }
}, {
  tableName: 'pos_integrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'provider'],
      name: 'pos_integrations_user_provider_unique'
    },
    {
      fields: ['merchant_id'],
      name: 'pos_integrations_merchant_id'
    }
  ]
});

// Virtual getter/setter for decrypted access token
PosIntegration.prototype.getAccessToken = function() {
  if (!this.accessTokenEncrypted) return null;
  try {
    return decrypt(this.accessTokenEncrypted);
  } catch (error) {
    logger.error('Failed to decrypt access token', { error: error.message });
    return null;
  }
};

PosIntegration.prototype.setAccessToken = function(token) {
  if (!token) {
    this.accessTokenEncrypted = null;
  } else {
    this.accessTokenEncrypted = encrypt(token);
  }
};

// Virtual getter/setter for decrypted refresh token
PosIntegration.prototype.getRefreshToken = function() {
  if (!this.refreshTokenEncrypted) return null;
  try {
    return decrypt(this.refreshTokenEncrypted);
  } catch (error) {
    logger.error('Failed to decrypt refresh token', { error: error.message });
    return null;
  }
};

PosIntegration.prototype.setRefreshToken = function(token) {
  if (!token) {
    this.refreshTokenEncrypted = null;
  } else {
    this.refreshTokenEncrypted = encrypt(token);
  }
};

// Check if token is expired or about to expire (within 5 minutes)
PosIntegration.prototype.isTokenExpired = function() {
  if (!this.tokenExpiresAt) return false; // Square tokens don't expire
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return this.tokenExpiresAt <= fiveMinutesFromNow;
};

// Check if integration is ready to process webhooks
PosIntegration.prototype.canProcessWebhooks = function() {
  // For webhook-based integrations (zapier, webhook), check apiKeyEncrypted instead
  if (this.provider === 'zapier' || this.provider === 'webhook') {
    return this.isActive && this.consentConfirmed && this.apiKeyEncrypted;
  }
  // For Stripe POS, no token needed (uses existing Stripe integration)
  if (this.provider === 'stripe_pos') {
    return this.isActive && this.consentConfirmed;
  }
  // For WooCommerce, check consumer key
  if (this.provider === 'woocommerce') {
    return this.isActive && this.consentConfirmed && this.consumerKeyEncrypted;
  }
  // For OAuth-based integrations (Square, Shopify, Clover)
  return this.isActive && this.consentConfirmed && this.accessTokenEncrypted;
};

// Getter/setter for API key (Zapier/Custom Webhook)
PosIntegration.prototype.getApiKey = function() {
  if (!this.apiKeyEncrypted) return null;
  try {
    return decrypt(this.apiKeyEncrypted);
  } catch (error) {
    logger.error('Failed to decrypt API key', { error: error.message });
    return null;
  }
};

PosIntegration.prototype.setApiKey = function(key) {
  if (!key) {
    this.apiKeyEncrypted = null;
  } else {
    this.apiKeyEncrypted = encrypt(key);
  }
};

// Getter/setter for WooCommerce consumer key
PosIntegration.prototype.getConsumerKey = function() {
  if (!this.consumerKeyEncrypted) return null;
  try {
    return decrypt(this.consumerKeyEncrypted);
  } catch (error) {
    logger.error('Failed to decrypt consumer key', { error: error.message });
    return null;
  }
};

PosIntegration.prototype.setConsumerKey = function(key) {
  if (!key) {
    this.consumerKeyEncrypted = null;
  } else {
    this.consumerKeyEncrypted = encrypt(key);
  }
};

// Getter/setter for WooCommerce consumer secret
PosIntegration.prototype.getConsumerSecret = function() {
  if (!this.consumerSecretEncrypted) return null;
  try {
    return decrypt(this.consumerSecretEncrypted);
  } catch (error) {
    logger.error('Failed to decrypt consumer secret', { error: error.message });
    return null;
  }
};

PosIntegration.prototype.setConsumerSecret = function(secret) {
  if (!secret) {
    this.consumerSecretEncrypted = null;
  } else {
    this.consumerSecretEncrypted = encrypt(secret);
  }
};

// Get provider display name
PosIntegration.prototype.getProviderDisplayName = function() {
  const names = {
    square: 'Square',
    shopify: 'Shopify',
    zapier: 'Zapier',
    webhook: 'Custom Webhook',
    clover: 'Clover',
    stripe_pos: 'Stripe',
    woocommerce: 'WooCommerce'
  };
  return names[this.provider] || this.provider;
};

// Get provider category
PosIntegration.getProviderCategory = function(provider) {
  const categories = {
    square: 'pos',
    clover: 'pos',
    shopify: 'ecommerce',
    woocommerce: 'ecommerce',
    stripe_pos: 'ecommerce',
    zapier: 'automation',
    webhook: 'automation'
  };
  return categories[provider] || 'other';
};

// List all available providers
PosIntegration.getAllProviders = function() {
  return [
    { id: 'square', name: 'Square', category: 'pos', requiresOAuth: true },
    { id: 'clover', name: 'Clover', category: 'pos', requiresOAuth: true },
    { id: 'shopify', name: 'Shopify', category: 'ecommerce', requiresOAuth: true },
    { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce', requiresOAuth: false },
    { id: 'stripe_pos', name: 'Stripe', category: 'ecommerce', requiresOAuth: false },
    { id: 'zapier', name: 'Zapier', category: 'automation', requiresOAuth: false },
    { id: 'webhook', name: 'Custom Webhook', category: 'automation', requiresOAuth: false }
  ];
};

module.exports = PosIntegration;
