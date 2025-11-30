const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SmsEvent = sequelize.define('SmsEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id',
    comment: 'User (tenant) who sent the SMS'
  },
  feedbackRequestId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'feedback_requests',
      key: 'id'
    },
    field: 'feedback_request_id',
    comment: 'Related feedback request (NULL if not applicable)'
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'phone_number',
    comment: 'Customer phone number'
  },
  eventType: {
    type: DataTypes.ENUM(
      'sent',          // SMS sent successfully
      'delivered',     // SMS delivered to phone
      'failed',        // SMS failed to send
      'invalid',       // Invalid phone number
      'opt_out',       // Customer opted out (STOP)
      'opt_in',        // Customer opted back in (START)
      'undelivered'    // SMS not delivered
    ),
    allowNull: false,
    field: 'event_type',
    comment: 'Type of SMS event'
  },
  twilioMessageSid: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'twilio_message_sid',
    comment: 'Twilio message SID for tracking'
  },
  errorCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'error_code',
    comment: 'Twilio error code (e.g., 21211 for invalid number)'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Detailed error message from Twilio'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'location',
    comment: 'Business location this event is associated with'
  },
  eventTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'event_timestamp',
    comment: 'When this event occurred'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'sms_events',
  timestamps: false, // Only using createdAt
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'event_timestamp'],
      name: 'sms_events_user_timestamp_idx'
    },
    {
      fields: ['user_id', 'event_type'],
      name: 'sms_events_user_type_idx'
    },
    {
      fields: ['phone_number', 'event_type'],
      name: 'sms_events_phone_type_idx'
    }
  ]
});

module.exports = SmsEvent;
