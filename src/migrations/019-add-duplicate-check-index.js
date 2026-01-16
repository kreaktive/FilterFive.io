/**
 * Migration: Add Duplicate Phone Check Index
 * Optimizes the CSV duplicate checking query which filters by:
 * - user_id
 * - customer_phone
 * - created_at (date range)
 * - status (sent, clicked, rated)
 *
 * This composite index supports the isDuplicatePhone query in csvValidator.js
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add composite index for duplicate phone checking
    // This supports the query: WHERE user_id = ? AND customer_phone = ? AND created_at >= ? AND status IN (...)
    try {
      await queryInterface.addIndex('feedback_requests', ['user_id', 'customer_phone', 'status', 'created_at'], {
        name: 'idx_feedback_requests_duplicate_check'
      });
      console.log('✓ Added composite index for duplicate phone checking');
    } catch (e) {
      console.log('Index idx_feedback_requests_duplicate_check may already exist:', e.message);
    }

    console.log('✓ Migration complete: Duplicate check index added');
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('feedback_requests', 'idx_feedback_requests_duplicate_check');
      console.log('✓ Removed duplicate check index');
    } catch (e) {
      console.log('Index may not exist:', e.message);
    }

    console.log('✓ Migration rolled back');
  }
};
