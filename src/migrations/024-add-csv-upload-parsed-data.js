// Migration: Add parsedData column to CsvUploads for persistent preview
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add parsedData JSONB column to store validated CSV rows
    await queryInterface.addColumn('CsvUploads', 'parsed_data', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });

    // Add index for faster lookups by status (for finding resumable uploads)
    await queryInterface.addIndex('CsvUploads', ['user_id', 'status'], {
      name: 'csv_uploads_user_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('CsvUploads', 'csv_uploads_user_status_idx');
    await queryInterface.removeColumn('CsvUploads', 'parsed_data');
  }
};
