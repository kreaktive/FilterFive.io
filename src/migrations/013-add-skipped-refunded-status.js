/**
 * Migration: Add skipped_refunded status to pos_sms_status ENUM
 * Purpose: Track transactions that were skipped due to refund
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // PostgreSQL: Add new enum value
      await queryInterface.sequelize.query(`
        ALTER TYPE "pos_sms_status" ADD VALUE IF NOT EXISTS 'skipped_refunded';
      `);
    } else {
      console.log('Note: ENUM update for non-PostgreSQL databases may require manual intervention');
    }

    console.log('Migration 013: Added skipped_refunded status to pos_sms_status enum');
  },

  down: async (queryInterface, Sequelize) => {
    // Cannot easily remove ENUM values in PostgreSQL
    console.log('Migration 013 rollback: ENUM value cannot be removed easily, leaving in place');
  }
};
