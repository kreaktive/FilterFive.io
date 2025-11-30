const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  businessName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'business_name'
  },
  googleReviewLink: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'google_review_link'
  },
  facebookLink: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'facebook_link'
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'trial', 'cancelled', 'past_due'),
    defaultValue: 'trial',
    field: 'subscription_status'
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('monthly', 'annual'),
    allowNull: true,
    field: 'subscription_plan'
  },
  stripeCustomerId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'stripe_customer_id'
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'stripe_subscription_id'
  },
  subscriptionPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'subscription_period_end',
    comment: 'End date of current billing period'
  },
  smsUsageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'sms_usage_count',
    comment: 'Number of SMS sent (resets on subscription activation)'
  },
  smsUsageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    allowNull: false,
    field: 'sms_usage_limit',
    comment: 'SMS limit (10 for trial, 1000 for active)'
  },
  marketingStatus: {
    type: DataTypes.ENUM('active', 'trial_active', 'trial_expired', 'churned'),
    defaultValue: 'active',
    field: 'marketing_status',
    comment: 'For email segmentation and campaigns'
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'tenant'),
    defaultValue: 'tenant'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_verified'
  },
  verificationToken: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
    field: 'verification_token'
  },
  verificationTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verification_token_expires'
  },
  trialStartsAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_starts_at'
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_ends_at'
  },
  resetPasswordToken: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
    field: 'reset_password_token'
  },
  resetPasswordTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_password_token_expires'
  },
  reviewValueEstimate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 80.00,
    allowNull: false,
    field: 'review_value_estimate',
    comment: 'User-configurable estimated value per review for ROI calculation'
  },
  managerAlertPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'manager_alert_phone',
    comment: 'Phone number to receive SMS alerts for 1-star reviews'
  },
  managerAlertEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'manager_alert_enabled',
    comment: 'Whether SMS manager alerts are enabled'
  },
  analyticsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'analytics_enabled',
    comment: 'Feature flag for analytics dashboard (gradual rollout)'
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_activity_at',
    comment: 'Last time user logged in or performed an action'
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Trial status helpers
User.prototype.isTrialActive = function() {
  if (!this.trialEndsAt) return false;
  return new Date() < new Date(this.trialEndsAt);
};

User.prototype.isInGracePeriod = function() {
  if (!this.trialEndsAt) return false;
  const graceEnd = new Date(this.trialEndsAt);
  graceEnd.setDate(graceEnd.getDate() + 5); // 5-day grace period
  return new Date() > new Date(this.trialEndsAt) && new Date() < graceEnd;
};

User.prototype.isHardLocked = function() {
  if (!this.trialEndsAt) return false;
  const graceEnd = new Date(this.trialEndsAt);
  graceEnd.setDate(graceEnd.getDate() + 5);
  return new Date() > graceEnd && this.subscriptionStatus !== 'active';
};

User.prototype.canSendSms = function() {
  if (this.subscriptionStatus === 'active') return true;
  return this.smsUsageCount < this.smsUsageLimit;
};

User.prototype.startTrial = async function() {
  if (this.trialStartsAt) return; // Already started
  const now = new Date();
  this.trialStartsAt = now;
  this.trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
  this.marketingStatus = 'trial_active';
  await this.save();
  console.log(`Trial started for user ${this.id}: ${this.email}`);
};

module.exports = User;
