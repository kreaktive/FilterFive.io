/**
 * Migration: Create Stripe Webhook Events Table
 * Purpose: Track processed Stripe webhook events for idempotency
 * Date: 2025-01-XX
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Create stripe_webhook_events table
    await queryInterface.createTable('stripe_webhook_events', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      event_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Stripe event ID (evt_xxx)'
      },
      event_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Event type (checkout.session.completed, invoice.paid, etc)'
      },
      stripe_customer_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Stripe customer ID for debugging'
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Associated user (if known)'
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the event was processed'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('stripe_webhook_events', ['event_id'], {
      unique: true,
      name: 'stripe_webhook_events_event_id_unique'
    });

    await queryInterface.addIndex('stripe_webhook_events', ['event_type'], {
      name: 'stripe_webhook_events_event_type_idx'
    });

    await queryInterface.addIndex('stripe_webhook_events', ['created_at'], {
      name: 'stripe_webhook_events_created_at_idx',
      comment: 'For cleanup queries'
    });

    await queryInterface.addIndex('stripe_webhook_events', ['user_id'], {
      name: 'stripe_webhook_events_user_id_idx'
    });

    console.log('Created stripe_webhook_events table with indexes');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('stripe_webhook_events');
    console.log('Dropped stripe_webhook_events table');
  }
};
