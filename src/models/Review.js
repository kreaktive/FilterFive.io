const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  feedbackRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'feedback_requests',
      key: 'id'
    },
    field: 'feedback_request_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedbackText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'feedback_text'
  },
  redirectedTo: {
    type: DataTypes.ENUM('google', 'facebook', 'thank_you'),
    allowNull: true,
    field: 'redirected_to'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_public',
    comment: 'True if rating was 4-5 and customer was redirected to public review'
  },
  emailSentToTenant: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_sent_to_tenant',
    comment: 'True if low rating email was sent to tenant'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true
});

module.exports = Review;
