/**
 * StripeWebhookEvent Model
 * Tracks processed Stripe webhook events for idempotency
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const StripeWebhookEvent = sequelize.define('StripeWebhookEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'event_id',
    comment: 'Stripe event ID (evt_xxx)'
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'event_type',
    comment: 'Event type (checkout.session.completed, etc)'
  },
  stripeCustomerId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'stripe_customer_id',
    comment: 'Stripe customer ID for debugging'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'processed_at'
  }
}, {
  tableName: 'stripe_webhook_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // No updated_at for this table
});

/**
 * Check if an event has already been processed
 * @param {string} eventId - Stripe event ID
 * @returns {Promise<boolean>} True if already processed
 */
StripeWebhookEvent.isProcessed = async function(eventId) {
  const existing = await this.findOne({
    where: { eventId },
    attributes: ['id']
  });
  return !!existing;
};

/**
 * Mark an event as processed
 * @param {string} eventId - Stripe event ID
 * @param {string} eventType - Event type
 * @param {string} stripeCustomerId - Optional Stripe customer ID
 * @param {number} userId - Optional user ID
 * @returns {Promise<StripeWebhookEvent>} Created record
 */
StripeWebhookEvent.markProcessed = async function(eventId, eventType, stripeCustomerId = null, userId = null) {
  return await this.create({
    eventId,
    eventType,
    stripeCustomerId,
    userId,
    processedAt: new Date()
  });
};

/**
 * Clean up old webhook events
 * @param {number} days - Delete events older than this many days (default: 7)
 * @returns {Promise<number>} Number of deleted records
 */
StripeWebhookEvent.cleanup = async function(days = 7) {
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

/**
 * Get recent events for a user (for debugging)
 * @param {number} userId - User ID
 * @param {number} limit - Max records to return
 * @returns {Promise<StripeWebhookEvent[]>} Recent events
 */
StripeWebhookEvent.getRecentForUser = async function(userId, limit = 10) {
  return await this.findAll({
    where: { userId },
    order: [['processedAt', 'DESC']],
    limit
  });
};

module.exports = StripeWebhookEvent;
