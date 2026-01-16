/**
 * Migration: Add Missing Critical Indexes
 * D3 Fix: Add indexes on frequently joined columns
 *
 * Missing indexes identified:
 * - reviews.feedback_request_id (for JOIN with feedback_requests)
 * - timing_performance composite index (for analytics queries)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Review: feedback_request_id index (for efficient joins)
    try {
      await queryInterface.addIndex('reviews', ['feedback_request_id'], {
        name: 'idx_reviews_feedback_request_id'
      });
      console.log('✓ Added index on reviews.feedback_request_id');
    } catch (e) {
      console.log('Index idx_reviews_feedback_request_id may already exist:', e.message);
    }

    // TimingPerformance: composite index for analytics heatmap queries
    // D9 FIX: Index on day_of_week and hour_of_day for heatmap data retrieval
    try {
      await queryInterface.addIndex('timing_performance', ['user_id', 'day_of_week', 'hour_of_day'], {
        name: 'idx_timing_performance_user_day_hour'
      });
      console.log('✓ Added composite index on timing_performance (user_id, day_of_week, hour_of_day)');
    } catch (e) {
      console.log('Index idx_timing_performance_user_day_hour may already exist:', e.message);
    }

    // StripeWebhookEvent: event_id for idempotency lookups (if not already unique)
    try {
      await queryInterface.addIndex('stripe_webhook_events', ['event_id'], {
        name: 'idx_stripe_webhook_events_event_id'
      });
      console.log('✓ Added index on stripe_webhook_events.event_id');
    } catch (e) {
      console.log('Index on stripe_webhook_events.event_id may already exist:', e.message);
    }

    console.log('✓ Migration complete: Missing indexes added');
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('reviews', 'idx_reviews_feedback_request_id');
      console.log('✓ Removed index idx_reviews_feedback_request_id');
    } catch (e) {
      console.log('Index may not exist:', e.message);
    }

    try {
      await queryInterface.removeIndex('timing_performance', 'idx_timing_performance_user_day_hour');
      console.log('✓ Removed index idx_timing_performance_user_day_hour');
    } catch (e) {
      console.log('Index may not exist:', e.message);
    }

    try {
      await queryInterface.removeIndex('stripe_webhook_events', 'idx_stripe_webhook_events_event_id');
      console.log('✓ Removed index idx_stripe_webhook_events_event_id');
    } catch (e) {
      console.log('Index may not exist:', e.message);
    }

    console.log('✓ Migration rolled back');
  }
};
