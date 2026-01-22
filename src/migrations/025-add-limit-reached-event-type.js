/**
 * Migration: Add 'limit_reached' and 'limit_warning' event types to sms_events
 *
 * These event types track when users hit their SMS limit (for monitoring/alerting)
 */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new enum values to the existing enum type
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_sms_events_event_type ADD VALUE IF NOT EXISTS 'limit_reached';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE enum_sms_events_event_type ADD VALUE IF NOT EXISTS 'limit_warning';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For now, we'll leave the values in place (they won't cause issues)
    console.log('Note: enum values cannot be removed in PostgreSQL without recreating the type');
  }
};
