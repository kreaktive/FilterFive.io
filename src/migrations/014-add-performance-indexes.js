/**
 * Migration: Add Performance Indexes
 * Adds indexes on frequently queried columns for improved query performance
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // FeedbackRequest indexes
    await queryInterface.addIndex('feedback_requests', ['user_id'], {
      name: 'idx_feedback_requests_user_id'
    });
    await queryInterface.addIndex('feedback_requests', ['delivery_method'], {
      name: 'idx_feedback_requests_delivery_method'
    });
    await queryInterface.addIndex('feedback_requests', ['created_at'], {
      name: 'idx_feedback_requests_created_at'
    });
    await queryInterface.addIndex('feedback_requests', ['user_id', 'created_at'], {
      name: 'idx_feedback_requests_user_created'
    });
    await queryInterface.addIndex('feedback_requests', ['customer_phone'], {
      name: 'idx_feedback_requests_customer_phone'
    });

    // Review indexes
    await queryInterface.addIndex('reviews', ['user_id'], {
      name: 'idx_reviews_user_id'
    });
    await queryInterface.addIndex('reviews', ['feedback_status'], {
      name: 'idx_reviews_feedback_status'
    });
    await queryInterface.addIndex('reviews', ['rating'], {
      name: 'idx_reviews_rating'
    });
    await queryInterface.addIndex('reviews', ['user_id', 'rating'], {
      name: 'idx_reviews_user_rating'
    });
    await queryInterface.addIndex('reviews', ['created_at'], {
      name: 'idx_reviews_created_at'
    });

    // User indexes (email already has unique constraint)
    await queryInterface.addIndex('users', ['subscription_status'], {
      name: 'idx_users_subscription_status'
    });
    await queryInterface.addIndex('users', ['stripe_customer_id'], {
      name: 'idx_users_stripe_customer_id'
    });

    // AnalyticsSnapshot indexes
    await queryInterface.addIndex('analytics_snapshots', ['user_id', 'snapshot_date'], {
      name: 'idx_analytics_snapshots_user_date'
    });

    // PosTransaction indexes (if table exists)
    try {
      await queryInterface.addIndex('pos_transactions', ['user_id'], {
        name: 'idx_pos_transactions_user_id'
      });
      await queryInterface.addIndex('pos_transactions', ['customer_phone'], {
        name: 'idx_pos_transactions_customer_phone'
      });
      await queryInterface.addIndex('pos_transactions', ['created_at'], {
        name: 'idx_pos_transactions_created_at'
      });
    } catch (e) {
      console.log('POS tables may not exist, skipping POS indexes');
    }

    console.log('Performance indexes added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // FeedbackRequest indexes
    await queryInterface.removeIndex('feedback_requests', 'idx_feedback_requests_user_id');
    await queryInterface.removeIndex('feedback_requests', 'idx_feedback_requests_delivery_method');
    await queryInterface.removeIndex('feedback_requests', 'idx_feedback_requests_created_at');
    await queryInterface.removeIndex('feedback_requests', 'idx_feedback_requests_user_created');
    await queryInterface.removeIndex('feedback_requests', 'idx_feedback_requests_customer_phone');

    // Review indexes
    await queryInterface.removeIndex('reviews', 'idx_reviews_user_id');
    await queryInterface.removeIndex('reviews', 'idx_reviews_feedback_status');
    await queryInterface.removeIndex('reviews', 'idx_reviews_rating');
    await queryInterface.removeIndex('reviews', 'idx_reviews_user_rating');
    await queryInterface.removeIndex('reviews', 'idx_reviews_created_at');

    // User indexes
    await queryInterface.removeIndex('users', 'idx_users_subscription_status');
    await queryInterface.removeIndex('users', 'idx_users_stripe_customer_id');

    // AnalyticsSnapshot indexes
    await queryInterface.removeIndex('analytics_snapshots', 'idx_analytics_snapshots_user_date');

    // PosTransaction indexes
    try {
      await queryInterface.removeIndex('pos_transactions', 'idx_pos_transactions_user_id');
      await queryInterface.removeIndex('pos_transactions', 'idx_pos_transactions_customer_phone');
      await queryInterface.removeIndex('pos_transactions', 'idx_pos_transactions_created_at');
    } catch (e) {
      console.log('POS tables may not exist, skipping POS index removal');
    }

    console.log('Performance indexes removed successfully');
  }
};
