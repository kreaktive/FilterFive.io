const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimingPerformance = sequelize.define('TimingPerformance', {
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
    comment: 'User (tenant) this timing data belongs to'
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'day_of_week',
    comment: 'Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday'
  },
  hourOfDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'hour_of_day',
    comment: 'Hour of day: 0-23 (24-hour format, user timezone)'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'location',
    comment: 'Business location (NULL for aggregated/all locations)'
  },

  // Aggregated metrics
  requestsSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_sent',
    comment: 'Total requests sent in this time slot'
  },
  requestsClicked: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_clicked',
    comment: 'Requests clicked in this time slot'
  },
  requestsRated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'requests_rated',
    comment: 'Requests rated in this time slot'
  },
  reviewsPositive: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'reviews_positive',
    comment: 'Positive reviews (4-5 stars) in this time slot'
  },

  // Calculated rates
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

  // Performance score (0-100, weighted combination of rates)
  performanceScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'performance_score',
    comment: 'Composite score: (click_rate * 0.3) + (conversion_rate * 0.3) + (positive_rate * 0.4)'
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
  tableName: 'timing_performance',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'day_of_week', 'hour_of_day', 'location'],
      name: 'timing_performance_unique_idx'
    },
    {
      fields: ['user_id'],
      name: 'timing_performance_user_idx'
    }
  ]
});

module.exports = TimingPerformance;
