/**
 * Migration: Add User Tracking Columns
 * Purpose: Track trial warnings, abandoned checkout, and payment failures for email notifications
 * Date: 2025-01-XX
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Trial warning email tracking
    await queryInterface.addColumn('users', 'trial_warning_7_day_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When 7-day trial warning email was sent'
    });

    await queryInterface.addColumn('users', 'trial_warning_3_day_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When 3-day trial warning email was sent'
    });

    await queryInterface.addColumn('users', 'trial_warning_1_day_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When 1-day trial warning email was sent'
    });

    await queryInterface.addColumn('users', 'trial_expired_email_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When trial expired email was sent'
    });

    // Abandoned checkout tracking
    await queryInterface.addColumn('users', 'checkout_started_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When user initiated checkout but did not complete'
    });

    await queryInterface.addColumn('users', 'checkout_session_id', {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Stripe checkout session ID for abandonment tracking'
    });

    await queryInterface.addColumn('users', 'checkout_recovery_email_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When abandoned checkout recovery email was sent'
    });

    // Payment failure tracking
    await queryInterface.addColumn('users', 'payment_failed_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When last payment failure occurred'
    });

    await queryInterface.addColumn('users', 'payment_failed_email_sent_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When payment failed email was sent'
    });

    // Add indexes for efficient cron queries
    await queryInterface.addIndex('users', ['trial_ends_at'], {
      name: 'users_trial_ends_at_idx',
      where: { subscription_status: 'trial' }
    });

    await queryInterface.addIndex('users', ['checkout_started_at'], {
      name: 'users_checkout_started_at_idx',
      where: { checkout_started_at: { [Sequelize.Op.ne]: null } }
    });

    console.log('Added user tracking columns and indexes');
  },

  down: async (queryInterface) => {
    // Remove indexes first
    await queryInterface.removeIndex('users', 'users_trial_ends_at_idx');
    await queryInterface.removeIndex('users', 'users_checkout_started_at_idx');

    // Remove columns
    await queryInterface.removeColumn('users', 'trial_warning_7_day_sent_at');
    await queryInterface.removeColumn('users', 'trial_warning_3_day_sent_at');
    await queryInterface.removeColumn('users', 'trial_warning_1_day_sent_at');
    await queryInterface.removeColumn('users', 'trial_expired_email_sent_at');
    await queryInterface.removeColumn('users', 'checkout_started_at');
    await queryInterface.removeColumn('users', 'checkout_session_id');
    await queryInterface.removeColumn('users', 'checkout_recovery_email_sent_at');
    await queryInterface.removeColumn('users', 'payment_failed_at');
    await queryInterface.removeColumn('users', 'payment_failed_email_sent_at');

    console.log('Removed user tracking columns and indexes');
  }
};
