const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { TRIAL_DURATION_DAYS } = require('../config/constants');
const logger = require('../services/logger');

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
  reviewUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_url',
    comment: 'Universal review platform URL (Google/Yelp/Facebook/TripAdvisor/etc)'
  },
  smsMessageTone: {
    type: DataTypes.ENUM('friendly', 'professional', 'grateful', 'custom'),
    defaultValue: 'friendly',
    allowNull: false,
    field: 'sms_message_tone',
    comment: 'SMS message tone preference'
  },
  customSmsMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'custom_sms_message',
    comment: 'Custom SMS message template with tags like {{CustomerName}}, {{BusinessName}}, {{ReviewLink}}'
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
  testSmsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'test_sms_count',
    comment: 'Number of test SMS sent today (resets daily)'
  },
  testSmsResetAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'test_sms_reset_at',
    comment: 'When test SMS counter was last reset'
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
  apiKey: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
    field: 'api_key',
    comment: 'Unique API key for Zapier/webhook integrations'
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
  // Trial warning email tracking
  trialWarning7DaySentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_warning_7_day_sent_at',
    comment: 'When 7-day trial warning email was sent'
  },
  trialWarning3DaySentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_warning_3_day_sent_at',
    comment: 'When 3-day trial warning email was sent'
  },
  trialWarning1DaySentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_warning_1_day_sent_at',
    comment: 'When 1-day trial warning email was sent'
  },
  trialExpiredEmailSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_expired_email_sent_at',
    comment: 'When trial expired email was sent'
  },
  // Abandoned checkout tracking
  checkoutStartedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'checkout_started_at',
    comment: 'When user initiated checkout but did not complete'
  },
  checkoutSessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'checkout_session_id',
    comment: 'Stripe checkout session ID for abandonment tracking'
  },
  checkoutRecoveryEmailSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'checkout_recovery_email_sent_at',
    comment: 'When abandoned checkout recovery email was sent'
  },
  // Payment failure tracking
  paymentFailedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'payment_failed_at',
    comment: 'When last payment failure occurred'
  },
  paymentFailedEmailSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'payment_failed_email_sent_at',
    comment: 'When payment failed email was sent'
  },
  // Verification reminder tracking
  verificationReminderSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verification_reminder_sent_at',
    comment: 'When 24h verification reminder email was sent'
  },
  // 30-minute checkout recovery tracking
  checkoutRecovery30MinSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'checkout_recovery_30_min_sent_at',
    comment: 'When 30-minute abandoned checkout recovery email was sent'
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
  indexes: [
    // Composite index for admin queries (active subscribers)
    {
      fields: ['subscription_status', 'is_active'],
      name: 'users_subscription_active_idx'
    },
    // Index for trial expiration cron jobs
    {
      fields: ['subscription_status', 'trial_ends_at'],
      name: 'users_subscription_trial_ends_idx'
    },
    // Index for marketing email segmentation
    {
      fields: ['marketing_status', 'is_verified'],
      name: 'users_marketing_verified_idx'
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      // Auto-generate API key for new tenants
      if (user.role === 'tenant' && !user.apiKey) {
        user.apiKey = `ff_${crypto.randomBytes(24).toString('hex')}`;
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

// Exclude sensitive fields from JSON serialization
// SECURITY FIX: Added apiKey to exclusion list (was being leaked in API responses)
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.apiKey; // SECURITY: Never expose API key in JSON responses
  delete values.verificationToken;
  delete values.verificationTokenExpires;
  delete values.resetPasswordToken;
  delete values.resetPasswordTokenExpires;
  return values;
};

// Trial status helpers
User.prototype.isTrialActive = function() {
  if (!this.trialEndsAt) return false;
  // B4 FIX: Cache current time to prevent timing inconsistency
  const now = new Date();
  return now < new Date(this.trialEndsAt);
};

User.prototype.isInGracePeriod = function() {
  if (!this.trialEndsAt) return false;
  // B4 FIX: Cache current time to prevent timing inconsistency
  const now = new Date();
  const trialEnd = new Date(this.trialEndsAt);
  const graceEnd = new Date(this.trialEndsAt);
  graceEnd.setDate(graceEnd.getDate() + 5); // 5-day grace period
  return now > trialEnd && now < graceEnd;
};

User.prototype.isHardLocked = function() {
  if (!this.trialEndsAt) return false;
  // B4 FIX: Cache current time to prevent timing inconsistency
  const now = new Date();
  const graceEnd = new Date(this.trialEndsAt);
  graceEnd.setDate(graceEnd.getDate() + 5);
  return now > graceEnd && this.subscriptionStatus !== 'active';
};

User.prototype.canSendSms = function() {
  // Block SMS when payment has failed
  if (this.subscriptionStatus === 'past_due') return false;
  // Active subscription can send up to limit
  if (this.subscriptionStatus === 'active') {
    return this.smsUsageCount < this.smsUsageLimit;
  }
  // Trial or cancelled: check against limit
  return this.smsUsageCount < this.smsUsageLimit;
};

User.prototype.startTrial = async function() {
  if (this.trialStartsAt) return; // Already started
  const now = new Date();
  this.trialStartsAt = now;
  this.trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  this.marketingStatus = 'trial_active';
  await this.save();
  logger.info('Trial started for user', { userId: this.id });
};

// Generate or regenerate API key
User.prototype.regenerateApiKey = async function() {
  this.apiKey = `ff_${crypto.randomBytes(24).toString('hex')}`;
  await this.save();
  logger.info('API key regenerated for user', { userId: this.id });
  return this.apiKey;
};

module.exports = User;
