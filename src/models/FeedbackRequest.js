const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const FeedbackRequest = sequelize.define('FeedbackRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id'
  },
  customerName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'customer_name'
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,  // Nullable for QR visitors
    field: 'customer_phone'
  },
  customerEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'customer_email'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'clicked', 'rated', 'expired'),
    defaultValue: 'pending'
  },
  smsSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sms_sent_at'
  },
  linkClickedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'link_clicked_at'
  },
  twilioMessageSid: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'twilio_message_sid'
  },
  source: {
    type: DataTypes.ENUM('zapier', 'csv_upload', 'manual'),
    defaultValue: 'manual'
  },
  deliveryMethod: {
    type: DataTypes.ENUM('sms', 'qr'),
    defaultValue: 'sms',
    allowNull: false,
    field: 'delivery_method',
    comment: 'How feedback request was delivered: SMS link or QR code'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
    comment: 'Customer IP for rate limiting (QR visitors only)'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'feedback_requests',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (feedbackRequest) => {
      if (!feedbackRequest.uuid) {
        feedbackRequest.uuid = uuidv4();
      }
    }
  }
});

module.exports = FeedbackRequest;
