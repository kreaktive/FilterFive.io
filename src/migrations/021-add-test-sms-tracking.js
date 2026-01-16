/**
 * Migration: Add test SMS tracking columns
 *
 * Adds columns to track daily test SMS usage per user:
 * - test_sms_count: Number of test SMS sent today
 * - test_sms_reset_at: When the counter was last reset
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add test_sms_count column
    await queryInterface.addColumn('users', 'test_sms_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add test_sms_reset_at column
    await queryInterface.addColumn('users', 'test_sms_reset_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    console.log('Added test SMS tracking columns to users table');
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'test_sms_count');
    await queryInterface.removeColumn('users', 'test_sms_reset_at');
    console.log('Removed test SMS tracking columns from users table');
  }
};
