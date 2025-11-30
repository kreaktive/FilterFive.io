/**
 * Migration: Create Timing Performance Table
 * Purpose: Store aggregated metrics by day-of-week and hour-of-day for heatmap visualization
 * Date: 2025-01-29
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('timing_performance', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'User (tenant) this timing data belongs to'
      },
      day_of_week: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday'
      },
      hour_of_day: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Hour of day: 0-23 (24-hour format, user timezone)'
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Business location (NULL for aggregated/all locations)'
      },

      // Aggregated metrics
      requests_sent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Total requests sent in this time slot'
      },
      requests_clicked: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Requests clicked in this time slot'
      },
      requests_rated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Requests rated in this time slot'
      },
      reviews_positive: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Positive reviews (4-5 stars) in this time slot'
      },

      // Calculated rates
      click_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage: (clicked / sent) * 100'
      },
      conversion_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage: (rated / clicked) * 100'
      },
      positive_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage: (positive / rated) * 100'
      },

      // Performance score (0-100, weighted combination of rates)
      performance_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Composite score: (click_rate * 0.3) + (conversion_rate * 0.3) + (positive_rate * 0.4)'
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Unique constraint: one record per user per day-of-week per hour per location
    await queryInterface.addIndex('timing_performance',
      ['user_id', 'day_of_week', 'hour_of_day', 'location'],
      {
        unique: true,
        name: 'timing_performance_unique_idx'
      }
    );

    // Index for fast user lookups
    await queryInterface.addIndex('timing_performance',
      ['user_id'],
      {
        name: 'timing_performance_user_idx'
      }
    );

    console.log('✓ Migration complete: timing_performance table created');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('timing_performance');
    console.log('✓ Migration rolled back: timing_performance table dropped');
  }
};
