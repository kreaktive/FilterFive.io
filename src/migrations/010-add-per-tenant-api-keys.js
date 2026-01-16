/**
 * Migration: Add Per-Tenant API Keys
 * Purpose: Enable unique API keys for each tenant instead of shared API_SECRET
 * Date: 2025-12-12
 *
 * Changes:
 * - Add api_key field to users table
 * - Generate unique API keys for existing tenants
 */

const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    console.log('📋 Starting migration: Add per-tenant API keys...');

    // 1. Add api_key column
    await queryInterface.addColumn('users', 'api_key', {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      comment: 'Unique API key for Zapier/webhook integrations'
    });
    console.log('✓ Added api_key column');

    // 2. Generate unique API keys for all existing tenants
    const tenants = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'tenant'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    let updatedCount = 0;
    for (const tenant of tenants) {
      const apiKey = `ff_${crypto.randomBytes(24).toString('hex')}`;
      await queryInterface.sequelize.query(
        `UPDATE users SET api_key = ? WHERE id = ?`,
        { replacements: [apiKey, tenant.id] }
      );
      updatedCount++;
    }
    console.log(`✓ Generated API keys for ${updatedCount} existing tenants`);

    // 3. Create index for faster API key lookups
    await queryInterface.addIndex('users', ['api_key'], {
      name: 'users_api_key_idx',
      unique: true
    });
    console.log('✓ Created unique index on api_key');

    console.log('\n✅ Migration complete: Per-tenant API keys added!\n');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('⏮️  Rolling back migration: Remove per-tenant API keys...');

    // Remove index
    await queryInterface.removeIndex('users', 'users_api_key_idx');
    console.log('✓ Removed api_key index');

    // Remove column
    await queryInterface.removeColumn('users', 'api_key');
    console.log('✓ Removed api_key column');

    console.log('✅ Migration rolled back successfully\n');
  }
};
