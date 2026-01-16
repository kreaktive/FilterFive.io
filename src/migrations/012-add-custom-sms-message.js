/**
 * Migration: Add Custom SMS Message Support
 * Purpose: Allow users to create custom SMS messages with template tags
 * Date: 2025-01-XX
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // =========================================================================
    // 1. Add custom_sms_message column to Users table
    // =========================================================================
    await queryInterface.addColumn('users', 'custom_sms_message', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Custom SMS message template with tags like {{CustomerName}}, {{BusinessName}}, {{ReviewLink}}'
    });

    // =========================================================================
    // 2. Add 'custom' to sms_message_tone ENUM
    // PostgreSQL requires ALTER TYPE to add new enum values
    // =========================================================================

    // Check if we're using PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // PostgreSQL: Add new enum value
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_sms_message_tone" ADD VALUE IF NOT EXISTS 'custom';
      `);
    } else {
      // SQLite/MySQL: Need to recreate column or handle differently
      // For SQLite (development), we can use a different approach
      console.log('Note: ENUM update for non-PostgreSQL databases may require manual intervention');
    }

    console.log('Migration 012: Added custom_sms_message column and updated sms_message_tone enum');
  },

  down: async (queryInterface, Sequelize) => {
    // =========================================================================
    // Rollback: Remove custom_sms_message column
    // Note: Cannot easily remove ENUM values in PostgreSQL, leaving 'custom' in place
    // =========================================================================
    await queryInterface.removeColumn('users', 'custom_sms_message');

    console.log('Migration 012 rolled back: Removed custom_sms_message column');
  }
};
