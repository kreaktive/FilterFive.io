/**
 * Migration: Expand POS Providers
 * Purpose: Add new POS integration providers (Zapier, Custom Webhook, Clover, Stripe, WooCommerce)
 *          and fields for inbound webhook support
 * Date: 2025-12-15
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // =========================================================================
    // 1. Add new provider values to ENUM
    // =========================================================================
    // PostgreSQL requires ALTER TYPE to add new ENUM values
    try {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_integrations_provider" ADD VALUE IF NOT EXISTS 'zapier';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_integrations_provider" ADD VALUE IF NOT EXISTS 'webhook';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_integrations_provider" ADD VALUE IF NOT EXISTS 'clover';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_integrations_provider" ADD VALUE IF NOT EXISTS 'stripe_pos';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_integrations_provider" ADD VALUE IF NOT EXISTS 'woocommerce';`);
      console.log('✓ Added new provider ENUM values to pos_integrations');
    } catch (error) {
      // ENUM values may already exist if migration was partially run
      console.log('Note: Some ENUM values may already exist, continuing...');
    }

    // Also update pos_webhook_events provider ENUM
    try {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_webhook_events_provider" ADD VALUE IF NOT EXISTS 'zapier';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_webhook_events_provider" ADD VALUE IF NOT EXISTS 'webhook';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_webhook_events_provider" ADD VALUE IF NOT EXISTS 'clover';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_webhook_events_provider" ADD VALUE IF NOT EXISTS 'stripe_pos';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_pos_webhook_events_provider" ADD VALUE IF NOT EXISTS 'woocommerce';`);
      console.log('✓ Added new provider ENUM values to pos_webhook_events');
    } catch (error) {
      console.log('Note: Some webhook ENUM values may already exist, continuing...');
    }

    // =========================================================================
    // 2. Add new columns for inbound webhook support (Zapier/Custom Webhook)
    // =========================================================================

    // webhook_url: Generated unique URL for inbound webhooks
    await queryInterface.addColumn('pos_integrations', 'webhook_url', {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Generated unique webhook URL for Zapier/Custom integrations'
    });
    console.log('✓ Added webhook_url column');

    // api_key_encrypted: Encrypted API key for webhook authentication
    await queryInterface.addColumn('pos_integrations', 'api_key_encrypted', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted API key for webhook authentication'
    });
    console.log('✓ Added api_key_encrypted column');

    // webhook_secret: HMAC secret for signature verification
    await queryInterface.addColumn('pos_integrations', 'webhook_secret', {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'Secret for webhook signature verification'
    });
    console.log('✓ Added webhook_secret column');

    // =========================================================================
    // 3. Add columns for WooCommerce support
    // =========================================================================

    // store_url: WooCommerce store URL
    await queryInterface.addColumn('pos_integrations', 'store_url', {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'WooCommerce store URL'
    });
    console.log('✓ Added store_url column');

    // consumer_key_encrypted: WooCommerce REST API consumer key
    await queryInterface.addColumn('pos_integrations', 'consumer_key_encrypted', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted WooCommerce consumer key'
    });
    console.log('✓ Added consumer_key_encrypted column');

    // consumer_secret_encrypted: WooCommerce REST API consumer secret
    await queryInterface.addColumn('pos_integrations', 'consumer_secret_encrypted', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted WooCommerce consumer secret'
    });
    console.log('✓ Added consumer_secret_encrypted column');

    // =========================================================================
    // 4. Add columns for Stripe POS settings
    // =========================================================================

    // trigger_on_checkout: Whether to send SMS for Stripe Checkout completions
    await queryInterface.addColumn('pos_integrations', 'trigger_on_checkout', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Send SMS for Stripe Checkout completions'
    });
    console.log('✓ Added trigger_on_checkout column');

    // trigger_on_terminal: Whether to send SMS for Stripe Terminal payments
    await queryInterface.addColumn('pos_integrations', 'trigger_on_terminal', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Send SMS for Stripe Terminal payments'
    });
    console.log('✓ Added trigger_on_terminal column');

    // =========================================================================
    // 5. Add index for webhook URL lookups
    // =========================================================================
    await queryInterface.addIndex('pos_integrations', ['webhook_url'], {
      name: 'pos_integrations_webhook_url',
      where: {
        webhook_url: {
          [Sequelize.Op.ne]: null
        }
      }
    });
    console.log('✓ Added webhook_url index');

    // =========================================================================
    // 6. Add index for store URL lookups (WooCommerce)
    // =========================================================================
    await queryInterface.addIndex('pos_integrations', ['store_url'], {
      name: 'pos_integrations_store_url',
      where: {
        store_url: {
          [Sequelize.Op.ne]: null
        }
      }
    });
    console.log('✓ Added store_url index');

    console.log('✓ Migration complete: POS providers expanded');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('pos_integrations', 'pos_integrations_webhook_url');
    await queryInterface.removeIndex('pos_integrations', 'pos_integrations_store_url');
    console.log('✓ Removed indexes');

    // Remove columns in reverse order
    await queryInterface.removeColumn('pos_integrations', 'trigger_on_terminal');
    await queryInterface.removeColumn('pos_integrations', 'trigger_on_checkout');
    await queryInterface.removeColumn('pos_integrations', 'consumer_secret_encrypted');
    await queryInterface.removeColumn('pos_integrations', 'consumer_key_encrypted');
    await queryInterface.removeColumn('pos_integrations', 'store_url');
    await queryInterface.removeColumn('pos_integrations', 'webhook_secret');
    await queryInterface.removeColumn('pos_integrations', 'api_key_encrypted');
    await queryInterface.removeColumn('pos_integrations', 'webhook_url');
    console.log('✓ Removed new columns');

    // Note: PostgreSQL doesn't support removing ENUM values easily
    // The ENUM values will remain but won't cause issues
    console.log('Note: ENUM values cannot be removed in PostgreSQL, they will remain in the type');

    console.log('✓ Migration rolled back');
  }
};
