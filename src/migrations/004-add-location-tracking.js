/**
 * Migration: Add Location Tracking
 * Purpose: Enable multi-location analytics for businesses with multiple sites
 * Date: 2025-01-29
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Add location field to feedback_requests
    await queryInterface.addColumn('feedback_requests', 'location', {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Business location (e.g., "Main Street" or "Downtown") for multi-location tracking'
    });

    // Add index for faster location-based queries
    await queryInterface.addIndex('feedback_requests', ['user_id', 'location'], {
      name: 'feedback_requests_user_location_idx'
    });

    console.log('✓ Migration complete: Location tracking added to feedback_requests table');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index first
    await queryInterface.removeIndex('feedback_requests', 'feedback_requests_user_location_idx');

    // Remove column
    await queryInterface.removeColumn('feedback_requests', 'location');

    console.log('✓ Migration rolled back: Location tracking removed from feedback_requests table');
  }
};
