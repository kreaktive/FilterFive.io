/**
 * Migration: Create SMS Events Table
 * Purpose: Track SMS delivery events (failures, opt-outs, invalid numbers) for analytics
 * Date: 2025-01-29
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('sms_events', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'User (tenant) who sent the SMS'
      },
      feedback_request_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'feedback_requests',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'Related feedback request (NULL if not applicable)'
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Customer phone number'
      },
      event_type: {
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
        comment: 'Type of SMS event'
      },
      twilio_message_sid: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Twilio message SID for tracking'
      },
      error_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Twilio error code (e.g., 21211 for invalid number)'
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed error message from Twilio'
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Business location this event is associated with'
      },
      event_timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When this event occurred'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Index for user queries
    await queryInterface.addIndex('sms_events',
      ['user_id', 'event_timestamp'],
      {
        name: 'sms_events_user_timestamp_idx'
      }
    );

    // Index for event type filtering
    await queryInterface.addIndex('sms_events',
      ['user_id', 'event_type'],
      {
        name: 'sms_events_user_type_idx'
      }
    );

    // Index for phone number lookups (opt-out checking)
    await queryInterface.addIndex('sms_events',
      ['phone_number', 'event_type'],
      {
        name: 'sms_events_phone_type_idx'
      }
    );

    console.log('✓ Migration complete: sms_events table created');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sms_events');
    console.log('✓ Migration rolled back: sms_events table dropped');
  }
};
