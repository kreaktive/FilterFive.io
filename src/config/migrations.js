require('dotenv').config();
const { sequelize } = require('./database');
// Import all models (includes relationships)
require('../models');

const syncDatabase = async () => {
  try {
    console.log('Starting database synchronization...');

    // Sync all models
    await sequelize.sync({ alter: true });

    console.log('✓ All models synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('✗ Database synchronization failed:', error);
    process.exit(1);
  }
};

syncDatabase();
