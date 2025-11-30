/**
 * Single Migration Runner
 * Run a specific migration file
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const path = require('path');

async function runSingleMigration() {
  try {
    const migrationFile = process.argv[2];

    if (!migrationFile) {
      console.error('❌ Please specify a migration file');
      console.log('Usage: node runSingleMigration.js 008-add-feedback-status-tracking.js');
      process.exit(1);
    }

    console.log(`🚀 Running single migration: ${migrationFile}\n`);

    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Load and run the migration
    const migrationsDir = path.join(__dirname, '../migrations');
    const migration = require(path.join(migrationsDir, migrationFile));

    console.log(`📦 Executing migration...`);
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log(`✅ Migration completed successfully!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runSingleMigration();
