'use strict';

/**
 * Migration: Create contact_submissions table
 *
 * Creates table for storing website contact form submissions with:
 * - Form field data (name, email, phone, business, topic, message)
 * - Tracking info (IP, user agent)
 * - Status management (new, in_progress, resolved, spam)
 * - Staff notes and response tracking
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create contact_submissions table
    await queryInterface.createTable('contact_submissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Contact person name'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Contact person email'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Contact person phone number'
      },
      business_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Business name'
      },
      topic: {
        type: Sequelize.ENUM('sales', 'support', 'billing', 'partnership', 'general'),
        allowNull: false,
        defaultValue: 'general',
        comment: 'Contact topic category'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Contact message/inquiry'
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IPv4 or IPv6 address'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Browser user agent string'
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'resolved', 'spam'),
        allowNull: false,
        defaultValue: 'new',
        comment: 'Submission status'
      },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When support team responded'
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When issue was resolved'
      },
      internal_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Staff notes'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Add indexes for common queries
    await queryInterface.addIndex('contact_submissions', ['status', 'created_at'], {
      name: 'contact_submissions_status_created_idx'
    });

    await queryInterface.addIndex('contact_submissions', ['email'], {
      name: 'contact_submissions_email_idx'
    });

    await queryInterface.addIndex('contact_submissions', ['created_at'], {
      name: 'contact_submissions_created_idx',
      order: [['created_at', 'DESC']]
    });
  },

  async down(queryInterface) {
    // Remove indexes
    await queryInterface.removeIndex('contact_submissions', 'contact_submissions_status_created_idx');
    await queryInterface.removeIndex('contact_submissions', 'contact_submissions_email_idx');
    await queryInterface.removeIndex('contact_submissions', 'contact_submissions_created_idx');

    // Drop table
    await queryInterface.dropTable('contact_submissions');
  }
};
