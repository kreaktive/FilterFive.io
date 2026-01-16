/**
 * POS SMS Queue
 * Bull queue for delayed SMS sending after POS purchases
 * With retry logic and dead-letter queue for failed jobs
 */

const Queue = require('bull');
const PosTransaction = require('../models/PosTransaction');
const User = require('../models/User');
const logger = require('../services/logger');
const smsLimitService = require('../services/smsLimitService');

// Queue instances (initialized lazily)
let posSmsQueue = null;
let deadLetterQueue = null;

// Default delay in milliseconds (30 seconds)
const DEFAULT_DELAY_MS = 30 * 1000;

/**
 * Get or create the dead-letter queue for permanently failed jobs
 */
const getDeadLetterQueue = () => {
  if (!deadLetterQueue) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    deadLetterQueue = new Queue('pos-sms-dlq', redisUrl, {
      defaultJobOptions: {
        removeOnComplete: false, // Keep for inspection and manual retry
        removeOnFail: false
      }
    });

    deadLetterQueue.on('error', (err) => {
      logger.error('Dead-letter queue error', { error: err.message });
    });
  }
  return deadLetterQueue;
};

/**
 * Get or create the main queue instance
 */
const getQueue = () => {
  if (!posSmsQueue) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    posSmsQueue = new Queue('pos-sms', redisUrl, {
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000 // 2s, 4s, 8s
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: false // Keep failed jobs for DLQ processing
      }
    });

    // Set up event handlers
    posSmsQueue.on('completed', (job, result) => {
      logger.info('POS SMS job completed', {
        jobId: job.id,
        transactionId: job.data.transactionId,
        attempts: job.attemptsMade,
        result: result?.success
      });
    });

    posSmsQueue.on('failed', async (job, err) => {
      const isLastAttempt = job.attemptsMade >= job.opts.attempts;

      if (isLastAttempt) {
        // All retries exhausted - move to dead-letter queue
        logger.error('POS SMS job permanently failed, moving to DLQ', {
          jobId: job.id,
          transactionId: job.data.transactionId,
          attempts: job.attemptsMade,
          error: err.message,
          errorCode: err.code
        });

        try {
          const dlq = getDeadLetterQueue();
          await dlq.add({
            originalJobId: job.id,
            ...job.data,
            failedAt: new Date().toISOString(),
            error: {
              message: err.message,
              code: err.code,
              stack: err.stack
            },
            attemptsMade: job.attemptsMade
          });

          logger.info('Job moved to dead-letter queue', {
            originalJobId: job.id,
            transactionId: job.data.transactionId
          });

          // Remove from main queue after moving to DLQ
          await job.remove();
        } catch (dlqError) {
          logger.error('Failed to move job to DLQ', {
            jobId: job.id,
            error: dlqError.message
          });
        }
      } else {
        // Will be retried
        logger.warn('POS SMS job failed, will retry', {
          jobId: job.id,
          transactionId: job.data.transactionId,
          attempt: job.attemptsMade,
          maxAttempts: job.opts.attempts,
          error: err.message,
          nextRetryDelay: job.opts.backoff?.delay * Math.pow(2, job.attemptsMade - 1)
        });
      }
    });

    posSmsQueue.on('error', (err) => {
      logger.error('POS SMS queue error', { error: err.message });
    });

    posSmsQueue.on('stalled', (job) => {
      logger.warn('POS SMS job stalled', {
        jobId: job.id,
        transactionId: job.data?.transactionId
      });
    });
  }

  return posSmsQueue;
};

/**
 * Add a job to the queue
 * @param {object} data - Job data
 * @param {number} delayMs - Delay in milliseconds (default 30 seconds)
 */
const addJob = async (data, delayMs = DEFAULT_DELAY_MS) => {
  const queue = getQueue();
  const job = await queue.add(data, { delay: delayMs });

  logger.info('POS SMS job added to queue', {
    jobId: job.id,
    transactionId: data.transactionId,
    delayMs
  });

  return job;
};

/**
 * Initialize the queue processor
 * Call this once when the app starts
 */
const initProcessor = () => {
  const queue = getQueue();

  queue.process(async (job) => {
    const { transactionId, userId, targetPhone, customerName, businessName, reviewLink, tone, customMessage, isTestMode } = job.data;

    logger.info('Processing POS SMS job', {
      jobId: job.id,
      transactionId,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts
    });

    // D1 FIX: Use atomic SMS limit check with row locking
    const reservation = await smsLimitService.reserveSmsSlot(userId, 1);

    if (!reservation.canSend) {
      logger.warn('POS SMS job skipped - limit reached', {
        jobId: job.id,
        transactionId,
        userId,
        error: reservation.error,
        remainingSlots: reservation.remainingSlots
      });

      // Update transaction as skipped
      const transaction = await PosTransaction.findByPk(transactionId);
      if (transaction) {
        transaction.smsStatus = 'skipped_limit_reached';
        transaction.skipReason = reservation.error;
        await transaction.save();
      }

      return {
        success: false,
        transactionId,
        skipped: true,
        reason: reservation.error
      };
    }

    try {
      // Load SMS service here to avoid circular dependency
      const smsService = require('../services/smsService');

      // Get POS-specific message (supports custom messages)
      const message = getPosMessage(customerName, businessName, reviewLink, tone, customMessage);

      // Send SMS (now includes retry logic and circuit breaker)
      const result = await smsService.sendSMS(targetPhone, message);

      // Update transaction record
      const transaction = await PosTransaction.findByPk(transactionId);
      if (transaction) {
        if (result.success) {
          transaction.smsStatus = 'sent';
          transaction.smsSentAt = new Date();
        } else {
          transaction.smsStatus = 'failed';
          transaction.skipReason = result.error || 'SMS send failed';
        }
        await transaction.save();
      }

      // D1 FIX: Release reservation - increment only if SMS was successful
      await reservation.release(result.success, result.success ? 1 : 0);

      return {
        success: result.success,
        transactionId,
        targetPhone: targetPhone.slice(0, 6) + '****', // Mask phone in logs
        isTestMode,
        messageSid: result.messageSid
      };
    } catch (error) {
      // D1 FIX: Release reservation without incrementing on error
      try {
        await reservation.release(false, 0);
      } catch (releaseError) {
        logger.error('Error releasing SMS reservation', {
          jobId: job.id,
          transactionId,
          error: releaseError.message
        });
      }
      logger.error('Error in POS SMS job', {
        jobId: job.id,
        transactionId,
        attempt: job.attemptsMade + 1,
        error: error.message,
        errorCode: error.code
      });

      // Update transaction as failed (only on last attempt)
      if (job.attemptsMade >= job.opts.attempts - 1) {
        try {
          const transaction = await PosTransaction.findByPk(transactionId);
          if (transaction) {
            transaction.smsStatus = 'failed';
            transaction.skipReason = error.message;
            await transaction.save();
          }
        } catch (updateError) {
          logger.error('Error updating transaction status', {
            transactionId,
            error: updateError.message
          });
        }
      }

      throw error; // Re-throw to mark job as failed and trigger retry
    }
  });

  logger.info('POS SMS queue processor initialized');
};

/**
 * Retry a job from the dead-letter queue
 * @param {string} dlqJobId - Job ID in the DLQ
 * @returns {Promise<object>} New job added to main queue
 */
const retryFromDLQ = async (dlqJobId) => {
  const dlq = getDeadLetterQueue();
  const dlqJob = await dlq.getJob(dlqJobId);

  if (!dlqJob) {
    throw new Error(`DLQ job ${dlqJobId} not found`);
  }

  // Extract original job data (remove DLQ metadata)
  const { originalJobId, failedAt, error, attemptsMade, ...originalData } = dlqJob.data;

  // Add back to main queue
  const newJob = await addJob(originalData, 0); // No delay for manual retry

  // Remove from DLQ
  await dlqJob.remove();

  logger.info('Job retried from DLQ', {
    originalJobId,
    newJobId: newJob.id,
    transactionId: originalData.transactionId
  });

  return newJob;
};

/**
 * Get queue statistics
 * @returns {Promise<object>} Queue stats
 */
const getStats = async () => {
  const queue = getQueue();
  const dlq = getDeadLetterQueue();

  const [mainCounts, dlqCounts] = await Promise.all([
    queue.getJobCounts(),
    dlq.getJobCounts()
  ]);

  return {
    mainQueue: {
      name: 'pos-sms',
      ...mainCounts
    },
    deadLetterQueue: {
      name: 'pos-sms-dlq',
      ...dlqCounts
    }
  };
};

/**
 * Get POS-specific SMS message
 * @param {string} customerName - Customer's name
 * @param {string} businessName - Business name
 * @param {string} reviewLink - Review URL
 * @param {string} tone - Message tone (friendly, professional, grateful, custom)
 * @param {string} customMessage - Custom message template (when tone is 'custom')
 * @returns {string} SMS message
 */
const getPosMessage = (customerName, businessName, reviewLink, tone = 'friendly', customMessage = null) => {
  // Use first name only
  const firstName = customerName?.split(' ')[0] || 'there';

  // Handle custom message
  if (tone === 'custom' && customMessage) {
    const processedMessage = customMessage
      .replace(/\{\{CustomerName\}\}/gi, firstName)
      .replace(/\{\{BusinessName\}\}/gi, businessName)
      .replace(/\{\{ReviewLink\}\}/gi, reviewLink);

    // Ensure review link is included
    if (!processedMessage.includes(reviewLink) && !customMessage.toLowerCase().includes('{{reviewlink}}')) {
      return `${processedMessage} ${reviewLink}`;
    }
    return processedMessage;
  }

  // If custom was selected but no message, fall back to friendly
  if (tone === 'custom' && !customMessage) {
    tone = 'friendly';
  }

  const toneMessages = {
    friendly: `Hi ${firstName}! Thanks for shopping at ${businessName}! We'd love to hear about your experience: ${reviewLink}`,
    professional: `Thank you for your purchase at ${businessName}. We value your feedback: ${reviewLink}`,
    grateful: `Thank you so much for supporting ${businessName}! Your review would mean the world to us: ${reviewLink}`
  };

  return toneMessages[tone] || toneMessages.friendly;
};

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  if (posSmsQueue) {
    await posSmsQueue.close();
    logger.info('POS SMS queue closed');
  }
  if (deadLetterQueue) {
    await deadLetterQueue.close();
    logger.info('Dead-letter queue closed');
  }
};

module.exports = {
  getQueue,
  getDeadLetterQueue,
  addJob,
  initProcessor,
  shutdown,
  getPosMessage,
  retryFromDLQ,
  getStats
};
