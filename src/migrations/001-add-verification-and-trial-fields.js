/**
 * Migration: Add Verification and Trial Fields
 * Purpose: Enable self-service signup with email verification and trial management
 * Date: 2025-01-28
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // Add verification fields
    await queryInterface.addColumn('Users', 'isVerified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Email verification status'
    });

    await queryInterface.addColumn('Users', 'verificationToken', {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      comment: 'Token for email verification (32 bytes hex = 64 chars)'
    });

    await queryInterface.addColumn('Users', 'verificationTokenExpires', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expiration timestamp for verification token (24 hours)'
    });

    // Add trial tracking fields
    await queryInterface.addColumn('Users', 'trialStartsAt', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the trial period began'
    });

    await queryInterface.addColumn('Users', 'trialEndsAt', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the trial period ends (14 days from start)'
    });

    // Add password reset fields
    await queryInterface.addColumn('Users', 'resetPasswordToken', {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      comment: 'Token for password reset (32 bytes hex = 64 chars)'
    });

    await queryInterface.addColumn('Users', 'resetPasswordTokenExpires', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expiration timestamp for reset token (1 hour)'
    });

    // Update existing users to be verified (for backwards compatibility)
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET "isVerified" = true
      WHERE "isVerified" IS NULL OR "isVerified" = false;
    `);

    console.log('✓ Migration complete: Verification and trial fields added');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    await queryInterface.removeColumn('Users', 'resetPasswordTokenExpires');
    await queryInterface.removeColumn('Users', 'resetPasswordToken');
    await queryInterface.removeColumn('Users', 'trialEndsAt');
    await queryInterface.removeColumn('Users', 'trialStartsAt');
    await queryInterface.removeColumn('Users', 'verificationTokenExpires');
    await queryInterface.removeColumn('Users', 'verificationToken');
    await queryInterface.removeColumn('Users', 'isVerified');

    console.log('✓ Migration rolled back: Verification and trial fields removed');
  }
};
