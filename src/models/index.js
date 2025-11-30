const User = require('./User');
const FeedbackRequest = require('./FeedbackRequest');
const Review = require('./Review');
const CsvUpload = require('./CsvUpload');
const AnalyticsSnapshot = require('./AnalyticsSnapshot');
const TimingPerformance = require('./TimingPerformance');
const SmsEvent = require('./SmsEvent');

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

module.exports = {
  User,
  FeedbackRequest,
  Review,
  CsvUpload,
  AnalyticsSnapshot,
  TimingPerformance,
  SmsEvent
};
