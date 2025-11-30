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
    type: DataTypes.ENUM('google', 'facebook', 'thank_you', 'pending'),
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
  redirectBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'redirect_blocked',
    comment: 'True if review was captured but redirect was blocked due to lock'
  },
  blockedReason: {
    type: DataTypes.ENUM('trial_expired', 'payment_required', 'grace_period', 'hard_locked'),
    allowNull: true,
    field: 'blocked_reason',
    comment: 'Reason why redirect was blocked'
  },
  feedbackStatus: {
    type: DataTypes.ENUM('new', 'viewed', 'responded', 'resolved'),
    defaultValue: 'new',
    allowNull: false,
    field: 'feedback_status',
    comment: 'Status of tenant response to feedback'
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'viewed_at',
    comment: 'When tenant first viewed this feedback'
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'responded_at',
    comment: 'When tenant responded to customer via SMS'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_at',
    comment: 'When tenant marked this feedback as resolved'
  },
  internalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'internal_notes',
    comment: 'Private notes from tenant about this feedback'
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
