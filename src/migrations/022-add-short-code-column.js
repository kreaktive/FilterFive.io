'use strict';

/**
 * Migration: Add short_code column to feedback_requests
 *
 * This enables shorter SMS URLs by using an 8-character alphanumeric code
 * instead of the full UUID. Existing UUIDs continue to work.
 *
 * Old URL: /review/59183d17-8b19-4bc6-a1e0-9b1049dcf61d (59 chars)
 * New URL: /r/A7x9Kp2m (35 chars with domain)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add short_code column (nullable for existing records)
    await queryInterface.addColumn('feedback_requests', 'short_code', {
      type: Sequelize.STRING(8),
      allowNull: true,
      unique: true,
      comment: 'Short alphanumeric code for shortened SMS URLs'
    });

    // Add index for fast lookups
    await queryInterface.addIndex('feedback_requests', ['short_code'], {
      name: 'feedback_requests_short_code_idx',
      unique: true,
      where: {
        short_code: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down(queryInterface) {
    // Remove index first
    await queryInterface.removeIndex('feedback_requests', 'feedback_requests_short_code_idx');

    // Remove column
    await queryInterface.removeColumn('feedback_requests', 'short_code');
  }
};
