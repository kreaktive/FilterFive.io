/**
 * PosWebhookEvent Model
 * Tracks processed webhook events for idempotency (prevent duplicate processing)
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const PosWebhookEvent = sequelize.define('PosWebhookEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  provider: {
    type: DataTypes.ENUM('square', 'shopify', 'zapier', 'webhook', 'clover', 'stripe_pos', 'woocommerce'),
    allowNull: false
  },
  eventId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'event_id',
    comment: 'Unique event ID from the webhook payload'
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'event_type',
    comment: 'Type of event (e.g., payment.created, orders/create)'
  },
  processedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'processed_at'
  }
}, {
  tableName: 'pos_webhook_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['provider', 'event_id'],
      name: 'pos_webhook_events_provider_event_unique'
    },
    {
      fields: ['created_at'],
      name: 'pos_webhook_events_created_at'
    }
  ]
});

/**
 * Check if an event has already been processed
 * @param {string} provider - 'square' or 'shopify'
 * @param {string} eventId - Unique event ID from webhook
 * @returns {boolean} True if already processed
 */
PosWebhookEvent.isProcessed = async function(provider, eventId) {
  const existing = await this.findOne({
    where: { provider, eventId }
  });
  return !!existing;
};

/**
 * Mark an event as processed
 * @param {string} provider - 'square' or 'shopify'
 * @param {string} eventId - Unique event ID from webhook
 * @param {string} eventType - Type of event
 * @returns {PosWebhookEvent} Created record
 */
PosWebhookEvent.markProcessed = async function(provider, eventId, eventType = null) {
  try {
    return await this.create({
      provider,
      eventId,
      eventType,
      processedAt: new Date()
    });
  } catch (error) {
    // Unique constraint violation means it was already processed (race condition)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return null;
    }
    throw error;
  }
};

/**
 * Clean up old webhook events (older than specified days)
 * Call this periodically to prevent table bloat
 * @param {number} days - Delete events older than this many days
 * @returns {number} Number of deleted records
 */
PosWebhookEvent.cleanup = async function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const deleted = await this.destroy({
    where: {
      createdAt: {
        [Op.lt]: cutoffDate
      }
    }
  });

  return deleted;
};

module.exports = PosWebhookEvent;
