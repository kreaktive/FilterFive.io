const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AnalyticsSnapshot = sequelize.define('AnalyticsSnapshot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id',
    comment: 'User (tenant) this snapshot belongs to'
  },
  snapshotDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'snapshot_date',
    comment: 'Date this snapshot represents (UTC)'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'location',
    comment: 'Business location (NULL for aggregated/all locations)'
  },

  // Request metrics
  requestsSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_sent',
    comment: 'Total feedback requests sent (SMS + QR visits)'
  },
  requestsSms: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_sms',
    comment: 'Requests sent via SMS'
  },
  requestsQr: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_qr',
    comment: 'Requests via QR code visits'
  },
  requestsClicked: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_clicked',
    comment: 'Requests where customer clicked feedback link'
  },
  requestsRated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_rated',
    comment: 'Requests where customer submitted rating'
  },

  // Review metrics
  reviewsPositive: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_positive',
    comment: 'Reviews with rating >= 4 (sent to Google)'
  },
  reviewsNegative: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_negative',
    comment: 'Reviews with rating < 4 (filtered, private)'
  },
  reviews1Star: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_1_star',
    comment: '1-star reviews (trigger manager alerts)'
  },
  reviews2Star: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_2_star'
  },
  reviews3Star: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_3_star'
  },
  reviews4Star: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_4_star'
  },
  reviews5Star: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_5_star'
  },

  // Calculated metrics
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    field: 'average_rating',
    comment: 'Average star rating for this day (1.00-5.00)'
  },
  clickRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'click_rate',
    comment: 'Percentage: (clicked / sent) * 100'
  },
  conversionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'conversion_rate',
    comment: 'Percentage: (rated / clicked) * 100'
  },
  positiveRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'positive_rate',
    comment: 'Percentage: (positive / rated) * 100'
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
  tableName: 'analytics_snapshots',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'snapshot_date', 'location'],
      name: 'analytics_snapshots_unique_idx'
    },
    {
      fields: ['user_id', 'snapshot_date'],
      name: 'analytics_snapshots_date_idx'
    }
  ]
});

module.exports = AnalyticsSnapshot;
