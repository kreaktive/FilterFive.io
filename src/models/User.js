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
    type: DataTypes.ENUM('active', 'inactive', 'trial', 'cancelled'),
    defaultValue: 'trial',
    field: 'subscription_status'
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('6-month', '12-month'),
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

module.exports = User;
