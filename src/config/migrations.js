require('dotenv').config();
const { sequelize } = require('./database');
const User = require('../models/User');
const FeedbackRequest = require('../models/FeedbackRequest');
const Review = require('../models/Review');

const syncDatabase = async () => {
  try {
    console.log('Starting database synchronization...');

    // Sync all models
    await sequelize.sync({ force: false, alter: true });

    console.log('✓ All models synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('✗ Database synchronization failed:', error);
    process.exit(1);
  }
};

syncDatabase();
