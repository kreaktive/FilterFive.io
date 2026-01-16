const User = require('./User');
const FeedbackRequest = require('./FeedbackRequest');
const Review = require('./Review');
const CsvUpload = require('./CsvUpload');
const AnalyticsSnapshot = require('./AnalyticsSnapshot');
const TimingPerformance = require('./TimingPerformance');
const SmsEvent = require('./SmsEvent');
const PosIntegration = require('./PosIntegration');
const PosLocation = require('./PosLocation');
const PosTransaction = require('./PosTransaction');
const PosWebhookEvent = require('./PosWebhookEvent');
const StripeWebhookEvent = require('./StripeWebhookEvent');
const ContactSubmission = require('./ContactSubmission');

// Define relationships

// User has many FeedbackRequests
User.hasMany(FeedbackRequest, {
  foreignKey: 'user_id',
  as: 'feedbackRequests'
});

FeedbackRequest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many Reviews
User.hasMany(Review, {
  foreignKey: 'user_id',
  as: 'reviews'
});

Review.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// FeedbackRequest has one Review
FeedbackRequest.hasOne(Review, {
  foreignKey: 'feedback_request_id',
  as: 'review'
});

Review.belongsTo(FeedbackRequest, {
  foreignKey: 'feedback_request_id',
  as: 'feedbackRequest'
});

// User has many CsvUploads
User.hasMany(CsvUpload, {
  foreignKey: 'userId',
  as: 'csvUploads'
});

CsvUpload.belongsTo(User, {
  foreignKey: 'userId',
  as: 'tenant'
});

// User has many AnalyticsSnapshots
User.hasMany(AnalyticsSnapshot, {
  foreignKey: 'user_id',
  as: 'analyticsSnapshots'
});

AnalyticsSnapshot.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many TimingPerformance records
User.hasMany(TimingPerformance, {
  foreignKey: 'user_id',
  as: 'timingPerformance'
});

TimingPerformance.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many SmsEvents
User.hasMany(SmsEvent, {
  foreignKey: 'user_id',
  as: 'smsEvents'
});

SmsEvent.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// FeedbackRequest has many SmsEvents
FeedbackRequest.hasMany(SmsEvent, {
  foreignKey: 'feedback_request_id',
  as: 'smsEvents'
});

SmsEvent.belongsTo(FeedbackRequest, {
  foreignKey: 'feedback_request_id',
  as: 'feedbackRequest'
});

// POS Integration relationships
// User has many PosIntegrations
User.hasMany(PosIntegration, {
  foreignKey: 'user_id',
  as: 'posIntegrations'
});

PosIntegration.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// PosIntegration has many PosLocations
PosIntegration.hasMany(PosLocation, {
  foreignKey: 'pos_integration_id',
  as: 'locations'
});

PosLocation.belongsTo(PosIntegration, {
  foreignKey: 'pos_integration_id',
  as: 'integration'
});

// User has many PosTransactions
User.hasMany(PosTransaction, {
  foreignKey: 'user_id',
  as: 'posTransactions'
});

PosTransaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// PosIntegration has many PosTransactions
PosIntegration.hasMany(PosTransaction, {
  foreignKey: 'pos_integration_id',
  as: 'transactions'
});

PosTransaction.belongsTo(PosIntegration, {
  foreignKey: 'pos_integration_id',
  as: 'integration'
});

module.exports = {
  User,
  FeedbackRequest,
  Review,
  CsvUpload,
  AnalyticsSnapshot,
  TimingPerformance,
  SmsEvent,
  PosIntegration,
  PosLocation,
  PosTransaction,
  PosWebhookEvent,
  StripeWebhookEvent,
  ContactSubmission
};
