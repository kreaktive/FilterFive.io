/**
 * Migration: Create POS Integration Tables
 * Purpose: Enable Square and Shopify POS integrations for automatic review requests
 * Date: 2025-01-XX
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // =========================================================================
    // 1. Create pos_integrations table
    // =========================================================================
    await queryInterface.createTable('pos_integrations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      provider: {
        type: DataTypes.ENUM('square', 'shopify'),
        allowNull: false
      },
      merchant_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'External merchant/shop ID from Square or Shopify'
      },
      shop_domain: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Shopify shop domain (e.g., store.myshopify.com)'
      },
      access_token_encrypted: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted OAuth access token'
      },
      refresh_token_encrypted: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted OAuth refresh token'
      },
      token_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the access token expires'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether the integration is currently active'
      },
      test_mode: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'When true, SMS goes to test_phone_number instead of customer'
      },
      test_phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Phone number to use when test_mode is enabled'
      },
      consent_confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'User confirmed they have SMS consent from customers'
      },
      connected_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the integration was first connected'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Unique index: one integration per provider per user
    await queryInterface.addIndex('pos_integrations', ['user_id', 'provider'], {
      unique: true,
      name: 'pos_integrations_user_provider_unique'
    });

    // Index for quick lookups by merchant_id
    await queryInterface.addIndex('pos_integrations', ['merchant_id'], {
      name: 'pos_integrations_merchant_id'
    });

    console.log('✓ Created pos_integrations table');

    // =========================================================================
    // 2. Create pos_locations table
    // =========================================================================
    await queryInterface.createTable('pos_locations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pos_integration_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pos_integrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      external_location_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Location ID from Square or Shopify'
      },
      location_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Human-readable location name'
      },
      is_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether SMS should be sent for purchases at this location'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Unique index: one location per external_location_id per integration
    await queryInterface.addIndex('pos_locations', ['pos_integration_id', 'external_location_id'], {
      unique: true,
      name: 'pos_locations_integration_external_unique'
    });

    console.log('✓ Created pos_locations table');

    // =========================================================================
    // 3. Create pos_transactions table
    // =========================================================================
    await queryInterface.createTable('pos_transactions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      pos_integration_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pos_integrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      external_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Payment ID (Square) or Order ID (Shopify)'
      },
      customer_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      customer_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Normalized phone number in E.164 format'
      },
      purchase_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Purchase amount in dollars'
      },
      location_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      sms_status: {
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
          'failed'
        ),
        defaultValue: 'pending',
        comment: 'Status of SMS delivery attempt'
      },
      sms_sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the SMS was actually sent'
      },
      skip_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Additional details when SMS was skipped'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Index for user transaction lookups
    await queryInterface.addIndex('pos_transactions', ['user_id'], {
      name: 'pos_transactions_user_id'
    });

    // Index for checking recent contacts (30-day rule)
    await queryInterface.addIndex('pos_transactions', ['user_id', 'customer_phone', 'created_at'], {
      name: 'pos_transactions_recent_contact'
    });

    // Index for dashboard queries
    await queryInterface.addIndex('pos_transactions', ['created_at'], {
      name: 'pos_transactions_created_at'
    });

    console.log('✓ Created pos_transactions table');

    // =========================================================================
    // 4. Create pos_webhook_events table (for idempotency)
    // =========================================================================
    await queryInterface.createTable('pos_webhook_events', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      provider: {
        type: DataTypes.ENUM('square', 'shopify'),
        allowNull: false
      },
      event_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Unique event ID from the webhook payload'
      },
      event_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Type of event (e.g., payment.created, orders/create)'
      },
      processed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'When we processed this event'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Unique index: one event per provider
    await queryInterface.addIndex('pos_webhook_events', ['provider', 'event_id'], {
      unique: true,
      name: 'pos_webhook_events_provider_event_unique'
    });

    // Cleanup index: for deleting old events
    await queryInterface.addIndex('pos_webhook_events', ['created_at'], {
      name: 'pos_webhook_events_created_at'
    });

    console.log('✓ Created pos_webhook_events table');

    console.log('✓ Migration complete: POS integration tables created');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('pos_webhook_events');
    console.log('✓ Dropped pos_webhook_events table');

    await queryInterface.dropTable('pos_transactions');
    console.log('✓ Dropped pos_transactions table');

    await queryInterface.dropTable('pos_locations');
    console.log('✓ Dropped pos_locations table');

    await queryInterface.dropTable('pos_integrations');
    console.log('✓ Dropped pos_integrations table');

    // Clean up ENUM types (PostgreSQL specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pos_integrations_provider";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pos_transactions_sms_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pos_webhook_events_provider";');

    console.log('✓ Migration rolled back: POS integration tables removed');
  }
};
