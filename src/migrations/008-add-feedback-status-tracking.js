/**
 * Migration: Add Feedback Status Tracking
 * Purpose: Enable tenants to track and manage customer feedback responses
 * Date: 2025-01-29
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Add feedbackStatus field
    await queryInterface.addColumn('reviews', 'feedback_status', {
      type: DataTypes.ENUM('new', 'viewed', 'responded', 'resolved'),
      defaultValue: 'new',
      allowNull: false,
      comment: 'Status of tenant response to feedback'
    });

    // Add timestamp fields
    await queryInterface.addColumn('reviews', 'viewed_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When tenant first viewed this feedback'
    });

    await queryInterface.addColumn('reviews', 'responded_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When tenant responded to customer via SMS'
    });

    await queryInterface.addColumn('reviews', 'resolved_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When tenant marked this feedback as resolved'
    });

    // Add internal notes field
    await queryInterface.addColumn('reviews', 'internal_notes', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Private notes from tenant about this feedback'
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('reviews', ['user_id', 'feedback_status'], {
      name: 'reviews_user_status_idx'
    });

    await queryInterface.addIndex('reviews', ['user_id', 'rating'], {
      name: 'reviews_user_rating_idx'
    });

    // Set existing reviews to 'viewed' if they have been around for a while
    await queryInterface.sequelize.query(`
      UPDATE reviews
      SET feedback_status = 'viewed',
          viewed_at = created_at
      WHERE created_at < NOW() - INTERVAL '7 days'
    `);

    console.log('✓ Migration complete: Feedback status tracking added to reviews table');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('reviews', 'reviews_user_status_idx');
    await queryInterface.removeIndex('reviews', 'reviews_user_rating_idx');

    // Remove columns
    await queryInterface.removeColumn('reviews', 'internal_notes');
    await queryInterface.removeColumn('reviews', 'resolved_at');
    await queryInterface.removeColumn('reviews', 'responded_at');
    await queryInterface.removeColumn('reviews', 'viewed_at');
    await queryInterface.removeColumn('reviews', 'feedback_status');

    console.log('✓ Migration rolled back: Feedback status tracking removed from reviews table');
  }
};
