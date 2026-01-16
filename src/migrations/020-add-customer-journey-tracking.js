/**
 * Migration: Add Customer Journey Tracking Columns
 * Purpose: Track verification reminders and 30-minute checkout recovery emails
 * Date: 2025-12-15
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Verification reminder tracking
    await queryInterface.addColumn('users', 'verification_reminder_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When 24h verification reminder email was sent'
    });

    // 30-minute checkout recovery tracking
    await queryInterface.addColumn('users', 'checkout_recovery_30_min_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When 30-minute abandoned checkout recovery email was sent'
    });

    // Add index for efficient verification reminder queries
    await queryInterface.addIndex('users', ['created_at', 'is_verified'], {
      name: 'users_unverified_created_at_idx',
      where: { is_verified: false }
    });

    console.log('Added customer journey tracking columns and indexes');
  },

  down: async (queryInterface) => {
    // Remove index first
    await queryInterface.removeIndex('users', 'users_unverified_created_at_idx');

    // Remove columns
    await queryInterface.removeColumn('users', 'verification_reminder_sent_at');
    await queryInterface.removeColumn('users', 'checkout_recovery_30_min_sent_at');

    console.log('Removed customer journey tracking columns and indexes');
  }
};
