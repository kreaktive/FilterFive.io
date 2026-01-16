/**
 * Test Database Utilities
 *
 * Provides utilities for setting up and tearing down test database state.
 * Uses a separate test database or in-memory mocking depending on configuration.
 */

const { Sequelize, DataTypes } = require('sequelize');

// Determine if we're using a real test database or mocking
const USE_REAL_DB = process.env.TEST_USE_REAL_DB === 'true';

let sequelize = null;
let models = {};

/**
 * Initialize test database connection
 * Creates an in-memory SQLite database for fast testing, or connects to test PostgreSQL
 */
async function initTestDb() {
  if (USE_REAL_DB) {
    // Connect to real test PostgreSQL database
    sequelize = new Sequelize(
      process.env.TEST_DB_NAME || 'morestars_test',
      process.env.TEST_DB_USER || process.env.DB_USER,
      process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
      {
        host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
        port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );
  } else {
    // Use SQLite in-memory for fast unit tests
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });
  }

  await sequelize.authenticate();
  return sequelize;
}

/**
 * Define minimal models for testing
 * These mirror the real models but with simplified definitions
 */
function defineTestModels(sequelize) {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    businessName: { type: DataTypes.STRING },
    reviewUrl: { type: DataTypes.STRING },
    customSmsMessage: { type: DataTypes.TEXT },
    smsUsageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    smsUsageLimit: { type: DataTypes.INTEGER, defaultValue: 10 },
    subscriptionStatus: { type: DataTypes.STRING, defaultValue: 'trial' },
    stripeCustomerId: { type: DataTypes.STRING },
    stripeSubscriptionId: { type: DataTypes.STRING },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    trialStartsAt: { type: DataTypes.DATE },
    trialEndsAt: { type: DataTypes.DATE },
    verificationToken: { type: DataTypes.STRING },
    verificationExpires: { type: DataTypes.DATE },
    resetToken: { type: DataTypes.STRING },
    resetExpires: { type: DataTypes.DATE },
  }, {
    tableName: 'users',
    underscored: true,
  });

  const FeedbackRequest = sequelize.define('FeedbackRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    customerName: { type: DataTypes.STRING },
    customerPhone: { type: DataTypes.STRING },
    customerEmail: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    deliveryMethod: { type: DataTypes.STRING, defaultValue: 'sms' },
    location: { type: DataTypes.STRING },
    source: { type: DataTypes.STRING },
  }, {
    tableName: 'feedback_requests',
    underscored: true,
  });

  const Review = sequelize.define('Review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    feedbackRequestId: { type: DataTypes.INTEGER },
    rating: { type: DataTypes.INTEGER },
    feedbackText: { type: DataTypes.TEXT },
    feedbackStatus: { type: DataTypes.STRING, defaultValue: 'pending' },
  }, {
    tableName: 'reviews',
    underscored: true,
  });

  const StripeWebhookEvent = sequelize.define('StripeWebhookEvent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    eventId: { type: DataTypes.STRING, allowNull: false, unique: true },
    eventType: { type: DataTypes.STRING, allowNull: false },
    processedAt: { type: DataTypes.DATE },
    rawPayload: { type: DataTypes.JSONB },
  }, {
    tableName: 'stripe_webhook_events',
    underscored: true,
  });

  // Define associations
  User.hasMany(FeedbackRequest, { foreignKey: 'userId', as: 'feedbackRequests' });
  FeedbackRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
  Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  FeedbackRequest.hasOne(Review, { foreignKey: 'feedbackRequestId', as: 'review' });
  Review.belongsTo(FeedbackRequest, { foreignKey: 'feedbackRequestId', as: 'feedbackRequest' });

  models = { User, FeedbackRequest, Review, StripeWebhookEvent };
  return models;
}

/**
 * Sync test database (create tables)
 */
async function syncTestDb() {
  await sequelize.sync({ force: true });
}

/**
 * Clear all data from test tables
 */
async function clearTestDb() {
  if (!sequelize) return;

  // Delete in order to respect foreign key constraints
  const modelOrder = ['Review', 'FeedbackRequest', 'StripeWebhookEvent', 'User'];

  for (const modelName of modelOrder) {
    if (models[modelName]) {
      await models[modelName].destroy({ where: {}, force: true });
    }
  }
}

/**
 * Close test database connection
 */
async function closeTestDb() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
    models = {};
  }
}

/**
 * Get test database instance
 */
function getTestDb() {
  return { sequelize, models };
}

/**
 * Transaction wrapper for tests
 * Wraps test in a transaction and rolls back after test completes
 */
async function withTransaction(callback) {
  const transaction = await sequelize.transaction();
  try {
    await callback(transaction);
  } finally {
    await transaction.rollback();
  }
}

module.exports = {
  initTestDb,
  defineTestModels,
  syncTestDb,
  clearTestDb,
  closeTestDb,
  getTestDb,
  withTransaction,
  USE_REAL_DB,
};
