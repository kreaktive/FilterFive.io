const User = require('./User');
const FeedbackRequest = require('./FeedbackRequest');
const Review = require('./Review');

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

module.exports = {
  User,
  FeedbackRequest,
  Review
};
