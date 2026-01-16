/**
 * PosTransaction Model
 * Logs all POS purchases and their SMS delivery status
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PosTransaction = sequelize.define('PosTransaction', {
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
  posIntegrationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'pos_integration_id'
  },
  externalTransactionId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'external_transaction_id',
    comment: 'Payment ID (Square) or Order ID (Shopify)'
  },
  customerName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'customer_name'
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'customer_phone',
    comment: 'Normalized phone number in E.164 format'
  },
  purchaseAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'purchase_amount',
    comment: 'Purchase amount in dollars'
  },
  locationName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'location_name'
  },
  smsStatus: {
    type: DataTypes.ENUM(
      'pending',
      'sent',
      'skipped_no_phone',
      'skipped_recent',
      'skipped_no_review_link',
      'skipped_limit_reached',
      'skipped_test_mode',
      'skipped_no_consent',
      'skipped_location_disabled',
      'skipped_refunded',
      'failed'
    ),
    defaultValue: 'pending',
    field: 'sms_status'
  },
  smsSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sms_sent_at'
  },
  skipReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'skip_reason',
    comment: 'Additional details when SMS was skipped'
  }
}, {
  tableName: 'pos_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // No updated_at for transaction logs
  indexes: [
    {
      fields: ['user_id'],
      name: 'pos_transactions_user_id'
    },
    {
      fields: ['user_id', 'customer_phone', 'created_at'],
      name: 'pos_transactions_recent_contact'
    },
    {
      fields: ['created_at'],
      name: 'pos_transactions_created_at'
    }
  ]
});

// Class method to check if customer was contacted recently
PosTransaction.wasContactedRecently = async function(userId, phone, days = 30) {
  if (!phone) return false;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentContact = await this.findOne({
    where: {
      userId,
      customerPhone: phone,
      smsStatus: 'sent',
      createdAt: {
        [require('sequelize').Op.gte]: cutoffDate
      }
    }
  });

  return !!recentContact;
};

// Get masked phone number for display (e.g., +1***-***-1234)
PosTransaction.prototype.getMaskedPhone = function() {
  if (!this.customerPhone) return 'N/A';
  const phone = this.customerPhone;
  if (phone.length < 4) return '****';
  return phone.slice(0, 2) + '***-***-' + phone.slice(-4);
};

// Get human-readable status
PosTransaction.prototype.getStatusLabel = function() {
  const statusLabels = {
    'pending': 'Pending',
    'sent': 'Sent',
    'skipped_no_phone': 'Skipped - No Phone',
    'skipped_recent': 'Skipped - Recent Contact',
    'skipped_no_review_link': 'Skipped - No Review Link',
    'skipped_limit_reached': 'Skipped - SMS Limit',
    'skipped_test_mode': 'Test Mode',
    'skipped_no_consent': 'Skipped - No Consent',
    'skipped_location_disabled': 'Skipped - Location Disabled',
    'skipped_refunded': 'Skipped - Refunded',
    'failed': 'Failed'
  };
  return statusLabels[this.smsStatus] || this.smsStatus;
};

module.exports = PosTransaction;
