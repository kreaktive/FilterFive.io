/**
 * POS SMS Service
 * Handles SMS sending logic for POS transactions
 */

const PosTransaction = require('../models/PosTransaction');
const User = require('../models/User');
const { normalizePhone, isUSNumber } = require('../utils/phone');
const logger = require('./logger');

class PosSmsService {
  constructor() {
    this.smsDelayMs = 30 * 1000; // 30 seconds default delay
  }

  // Use shared phone utilities
  normalizePhone(phone) {
    return normalizePhone(phone);
  }

  isUSNumber(phone) {
    return isUSNumber(phone);
  }

  /**
   * Check if customer was contacted recently (within days)
   * @param {number} userId - User ID
   * @param {string} phone - Normalized phone number
   * @param {number} days - Number of days to look back
   * @returns {boolean}
   */
  async wasContactedRecently(userId, phone, days = 30) {
    return await PosTransaction.wasContactedRecently(userId, phone, days);
  }

  /**
   * Log a transaction (without sending SMS)
   * @param {object} data - Transaction data
   * @returns {PosTransaction}
   */
  async logTransaction(data) {
    return await PosTransaction.create({
      userId: data.userId,
      posIntegrationId: data.posIntegrationId,
      externalTransactionId: data.externalTransactionId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      purchaseAmount: data.purchaseAmount,
      locationName: data.locationName,
      smsStatus: data.smsStatus,
      skipReason: data.skipReason,
      smsSentAt: data.smsSentAt || null
    });
  }

  /**
   * Process a transaction and queue SMS if eligible
   * @param {object} data - Transaction data
   * @returns {object} Processing result
   */
  async processTransaction(data) {
    const { integration, externalTransactionId, customerName, customerPhone, purchaseAmount, locationName } = data;
    const userId = integration.userId;

    // Normalize phone number
    const normalizedPhone = this.normalizePhone(customerPhone);

    // Validate US number
    if (!normalizedPhone || !this.isUSNumber(normalizedPhone)) {
      await this.logTransaction({
        userId,
        posIntegrationId: integration.id,
        externalTransactionId,
        customerName,
        customerPhone: normalizedPhone,
        purchaseAmount,
        locationName,
        smsStatus: 'skipped_no_phone',
        skipReason: 'Invalid or non-US phone number'
      });
      return { skipped: true, reason: 'invalid_phone' };
    }

    // Check consent confirmation
    if (!integration.consentConfirmed) {
      await this.logTransaction({
        userId,
        posIntegrationId: integration.id,
        externalTransactionId,
        customerName,
        customerPhone: normalizedPhone,
        purchaseAmount,
        locationName,
        smsStatus: 'skipped_no_consent',
        skipReason: 'SMS consent not confirmed'
      });
      return { skipped: true, reason: 'no_consent' };
    }

    // Fetch user for settings
    const user = await User.findByPk(userId);
    if (!user) {
      return { skipped: true, reason: 'user_not_found' };
    }

    // B5 FIX: Start trial on first POS SMS (if not already started)
    if (!user.trialStartsAt && user.subscriptionStatus === 'trial') {
      await user.startTrial();
    }

    // Check if user has review link configured
    if (!user.reviewUrl) {
      await this.logTransaction({
        userId,
        posIntegrationId: integration.id,
        externalTransactionId,
        customerName,
        customerPhone: normalizedPhone,
        purchaseAmount,
        locationName,
        smsStatus: 'skipped_no_review_link',
        skipReason: 'No review URL configured'
      });
      return { skipped: true, reason: 'no_review_link' };
    }

    // Check SMS limit
    if (user.smsUsageCount >= user.smsUsageLimit) {
      await this.logTransaction({
        userId,
        posIntegrationId: integration.id,
        externalTransactionId,
        customerName,
        customerPhone: normalizedPhone,
        purchaseAmount,
        locationName,
        smsStatus: 'skipped_limit_reached',
        skipReason: `SMS limit reached (${user.smsUsageCount}/${user.smsUsageLimit})`
      });
      return { skipped: true, reason: 'sms_limit_reached' };
    }

    // Check 30-day rule
    const recentlyContacted = await this.wasContactedRecently(userId, normalizedPhone, 30);
    if (recentlyContacted) {
      await this.logTransaction({
        userId,
        posIntegrationId: integration.id,
        externalTransactionId,
        customerName,
        customerPhone: normalizedPhone,
        purchaseAmount,
        locationName,
        smsStatus: 'skipped_recent',
        skipReason: 'Contacted within last 30 days'
      });
      return { skipped: true, reason: 'recently_contacted' };
    }

    // Determine phone number to use (test mode vs live)
    let targetPhone = normalizedPhone;
    let isTestMode = false;

    if (integration.testMode) {
      if (!integration.testPhoneNumber) {
        await this.logTransaction({
          userId,
          posIntegrationId: integration.id,
          externalTransactionId,
          customerName,
          customerPhone: normalizedPhone,
          purchaseAmount,
          locationName,
          smsStatus: 'skipped_test_mode',
          skipReason: 'Test mode enabled but no test phone number configured'
        });
        return { skipped: true, reason: 'test_mode_no_phone' };
      }
      targetPhone = this.normalizePhone(integration.testPhoneNumber);
      isTestMode = true;
    }

    // Create pending transaction record
    const transaction = await this.logTransaction({
      userId,
      posIntegrationId: integration.id,
      externalTransactionId,
      customerName,
      customerPhone: normalizedPhone,
      purchaseAmount,
      locationName,
      smsStatus: 'pending'
    });

    // Queue the SMS job
    try {
      const posSmsQueue = require('../queues/posSmsQueue');
      await posSmsQueue.addJob({
        transactionId: transaction.id,
        userId,
        targetPhone,
        customerName,
        businessName: user.businessName,
        reviewLink: user.reviewUrl,
        tone: user.smsMessageTone || 'friendly',
        customMessage: user.smsMessageTone === 'custom' ? user.customSmsMessage : null,
        isTestMode
      });

      logger.info('Queued POS SMS', { transactionId: transaction.id, mode: isTestMode ? 'TEST' : 'LIVE' });
      return { queued: true, transactionId: transaction.id, isTestMode };
    } catch (error) {
      logger.error('Error queueing SMS', { error: error.message });
      transaction.smsStatus = 'failed';
      transaction.skipReason = error.message;
      await transaction.save();
      return { error: true, reason: error.message };
    }
  }
}

module.exports = new PosSmsService();
