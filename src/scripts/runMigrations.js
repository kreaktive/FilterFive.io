/**
 * Migration Runner
 * Executes database migrations in order
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // Run in alphabetical order

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      process.exit(0);
    }

    console.log(`Found ${migrationFiles.length} migration(s):\n`);

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`📦 Running: ${file}`);
      const migration = require(path.join(migrationsDir, file));

      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

      console.log(`✓ Completed: ${file}\n`);
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
