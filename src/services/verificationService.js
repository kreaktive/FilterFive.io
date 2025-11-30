const crypto = require('crypto');
const { User } = require('../models');
const emailService = require('./emailService');

class VerificationService {
  /**
   * Generate a random verification token
   * @returns {string} 64-character hex token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send verification email to user
   * @param {Object} user - User model instance
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(user) {
    try {
      const token = this.generateToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database
      user.verificationToken = token;
      user.verificationTokenExpires = expires;
      await user.save();

      // Send email via emailService (passes token, not full URL)
      await emailService.sendVerificationEmail(user.email, user.businessName, token);

      console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Verify email token and activate account
   * @param {string} token - Verification token from URL
   * @returns {Promise<Object>} Verified user object
   */
  async verifyEmail(token) {
    try {
      // Find user with valid token
      const user = await User.findOne({
        where: {
          verificationToken: token,
          isVerified: false
        }
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      // Check if token expired
      if (new Date() > new Date(user.verificationTokenExpires)) {
        throw new Error('Verification token has expired');
      }

      // Mark as verified
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      await user.save();

      console.log(`Email verified for user ${user.id}: ${user.email}`);

      return user;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email if original expired
   * @param {string} email - User's email address
   * @returns {Promise<void>}
   */
  async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({
        where: {
          email,
          isVerified: false
        }
      });

      if (!user) {
        throw new Error('User not found or already verified');
      }

      await this.sendVerificationEmail(user);
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  }
}

module.exports = new VerificationService();
