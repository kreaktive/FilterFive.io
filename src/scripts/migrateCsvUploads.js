// src/scripts/migrateCsvUploads.js
require('dotenv').config();
const { sequelize } = require('../config/database');
const { CsvUpload } = require('../models');

const runMigration = async () => {
  try {
    console.log('Starting CsvUploads table migration...');

    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Create CsvUploads table
    await CsvUpload.sync({ force: false });
    console.log('✓ CsvUploads table created/verified');

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
