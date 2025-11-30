/**
 * Migration: Create Analytics Snapshots Table
 * Purpose: Store daily pre-calculated metrics for fast dashboard loading
 * Date: 2025-01-29
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('analytics_snapshots', {
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
        comment: 'User (tenant) this snapshot belongs to'
      },
      snapshot_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: 'Date this snapshot represents (UTC)'
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Business location (NULL for aggregated/all locations)'
      },

      // Request metrics
      requests_sent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Total feedback requests sent (SMS + QR visits)'
      },
      requests_sms: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Requests sent via SMS'
      },
      requests_qr: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Requests via QR code visits'
      },
      requests_clicked: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Requests where customer clicked feedback link'
      },
      requests_rated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Requests where customer submitted rating'
      },

      // Review metrics
      reviews_positive: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Reviews with rating >= 4 (sent to Google)'
      },
      reviews_negative: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Reviews with rating < 4 (filtered, private)'
      },
      reviews_1_star: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: '1-star reviews (trigger manager alerts)'
      },
      reviews_2_star: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      reviews_3_star: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      reviews_4_star: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      reviews_5_star: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },

      // Calculated metrics
      average_rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Average star rating for this day (1.00-5.00)'
      },
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

    // Unique constraint: one snapshot per user per date per location
    await queryInterface.addIndex('analytics_snapshots',
      ['user_id', 'snapshot_date', 'location'],
      {
        unique: true,
        name: 'analytics_snapshots_unique_idx'
      }
    );

    // Index for fast date range queries
    await queryInterface.addIndex('analytics_snapshots',
      ['user_id', 'snapshot_date'],
      {
        name: 'analytics_snapshots_date_idx'
      }
    );

    console.log('✓ Migration complete: analytics_snapshots table created');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('analytics_snapshots');
    console.log('✓ Migration rolled back: analytics_snapshots table dropped');
  }
};
