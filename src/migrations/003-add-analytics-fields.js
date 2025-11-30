/**
 * Migration: Add Analytics and ROI Fields
 * Purpose: Enable analytics dashboard with ROI calculator and manager alerts
 * Date: 2025-01-29
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Add ROI calculator field
    await queryInterface.addColumn('users', 'review_value_estimate', {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 80.00,
      allowNull: false,
      comment: 'User-configurable estimated value per review for ROI calculation'
    });

    // Add manager alert fields
    await queryInterface.addColumn('users', 'manager_alert_phone', {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Phone number to receive SMS alerts for 1-star reviews'
    });

    await queryInterface.addColumn('users', 'manager_alert_enabled', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether SMS manager alerts are enabled'
    });

    // Add analytics feature flag for gradual rollout
    await queryInterface.addColumn('users', 'analytics_enabled', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Feature flag for analytics dashboard (gradual rollout)'
    });

    // Add last activity tracking for inactivity alerts
    await queryInterface.addColumn('users', 'last_activity_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time user logged in or performed an action'
    });

    console.log('✓ Migration complete: Analytics and ROI fields added to users table');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    await queryInterface.removeColumn('users', 'last_activity_at');
    await queryInterface.removeColumn('users', 'analytics_enabled');
    await queryInterface.removeColumn('users', 'manager_alert_enabled');
    await queryInterface.removeColumn('users', 'manager_alert_phone');
    await queryInterface.removeColumn('users', 'review_value_estimate');

    console.log('✓ Migration rolled back: Analytics fields removed from users table');
  }
};
