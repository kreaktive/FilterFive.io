/**
 * Migration: Add QR Code Feedback Support
 *
 * Changes:
 * 1. Add delivery_method field (sms vs qr)
 * 2. Make customer_phone nullable (QR visitors don't have phones)
 * 3. Add ip_address for rate limiting QR visitors
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add delivery_method field (track if from SMS or QR)
    await queryInterface.addColumn('feedback_requests', 'delivery_method', {
      type: Sequelize.ENUM('sms', 'qr'),
      defaultValue: 'sms',
      allowNull: false,
      comment: 'How feedback request was delivered to customer'
    });

    // Make customer_phone nullable (QR visitors don't have phones)
    await queryInterface.changeColumn('feedback_requests', 'customer_phone', {
      type: Sequelize.STRING(20),
      allowNull: true,  // Changed from false
      field: 'customer_phone'
    });

    // Add IP address for rate limiting QR visitors
    await queryInterface.addColumn('feedback_requests', 'ip_address', {
      type: Sequelize.STRING(45),  // IPv6 support (max 45 chars)
      allowNull: true,
      comment: 'Customer IP address for rate limiting (QR only)'
    });

    // Update existing records to delivery_method='sms' (backwards compatibility)
    await queryInterface.sequelize.query(
      "UPDATE feedback_requests SET delivery_method = 'sms' WHERE delivery_method IS NULL OR delivery_method = ''"
    );

    console.log('✓ Migration 002: QR feedback support added successfully');
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('feedback_requests', 'delivery_method');
    await queryInterface.removeColumn('feedback_requests', 'ip_address');

    // Restore customer_phone to non-nullable (risky if QR records exist!)
    await queryInterface.changeColumn('feedback_requests', 'customer_phone', {
      type: Sequelize.STRING(20),
      allowNull: false,
      field: 'customer_phone'
    });

    console.log('✓ Migration 002: Rolled back successfully');
  }
};
