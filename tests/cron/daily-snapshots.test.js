/**
 * Daily Snapshots Cron Job Tests
 *
 * Tests for the daily snapshot generation cron job:
 * - executeDailySnapshots - Main execution function
 * - Error handling and admin alerts
 * - initDailySnapshotsCron - Scheduling
 * - manualTrigger - Manual execution
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock dependencies BEFORE requiring the module
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../../src/services/snapshotService', () => ({
  generateDailySnapshots: jest.fn(),
  generateTimingPerformance: jest.fn(),
}));

jest.mock('../../src/services/emailService', () => ({
  sendAdminAlert: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  cron: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const cron = require('node-cron');
const snapshotService = require('../../src/services/snapshotService');
const { sendAdminAlert } = require('../../src/services/emailService');
const logger = require('../../src/services/logger');

const {
  initDailySnapshotsCron,
  executeDailySnapshots,
  manualTrigger,
} = require('../../src/cron/daily-snapshots');

describe('Daily Snapshots Cron Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    // Set up default successful responses
    snapshotService.generateDailySnapshots.mockResolvedValue({
      usersProcessed: 10,
      snapshotsCreated: 10,
    });
    snapshotService.generateTimingPerformance.mockResolvedValue({
      processed: 5,
    });
    sendAdminAlert.mockResolvedValue(true);
  });

  // ===========================================
  // executeDailySnapshots Tests
  // ===========================================
  describe('executeDailySnapshots', () => {
    test('should call snapshotService.generateDailySnapshots', async () => {
      await executeDailySnapshots();

      expect(snapshotService.generateDailySnapshots).toHaveBeenCalled();
    });

    test('should call snapshotService.generateTimingPerformance', async () => {
      await executeDailySnapshots();

      expect(snapshotService.generateTimingPerformance).toHaveBeenCalled();
    });

    test('should log start and completion', async () => {
      await executeDailySnapshots();

      expect(logger.cron).toHaveBeenCalledWith('daily-snapshots', 'started');
      expect(logger.cron).toHaveBeenCalledWith('daily-snapshots', 'completed');
    });

    test('should log snapshot result', async () => {
      const mockResult = { usersProcessed: 10, snapshotsCreated: 10 };
      snapshotService.generateDailySnapshots.mockResolvedValue(mockResult);

      await executeDailySnapshots();

      expect(logger.cron).toHaveBeenCalledWith(
        'daily-snapshots',
        'snapshots-completed',
        { result: mockResult }
      );
    });

    test('should log timing result', async () => {
      const mockResult = { processed: 5 };
      snapshotService.generateTimingPerformance.mockResolvedValue(mockResult);

      await executeDailySnapshots();

      expect(logger.cron).toHaveBeenCalledWith(
        'daily-snapshots',
        'timing-completed',
        { result: mockResult }
      );
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    test('should log error when generateDailySnapshots fails', async () => {
      const error = new Error('Database connection failed');
      snapshotService.generateDailySnapshots.mockRejectedValue(error);

      await executeDailySnapshots();

      expect(logger.error).toHaveBeenCalledWith(
        'Cron job failed: daily-snapshots',
        expect.objectContaining({
          error: 'Database connection failed',
          job: 'daily-snapshots',
        })
      );
    });

    test('should send admin alert on failure', async () => {
      const error = new Error('Snapshot generation failed');
      snapshotService.generateDailySnapshots.mockRejectedValue(error);

      await executeDailySnapshots();

      expect(sendAdminAlert).toHaveBeenCalledWith(
        'Cron Job Failed: Daily Snapshots',
        'Snapshot generation failed',
        expect.any(String),
        expect.objectContaining({ cronJob: 'daily-snapshots' })
      );
    });

    test('should log error when generateTimingPerformance fails', async () => {
      const error = new Error('Timing aggregation failed');
      snapshotService.generateTimingPerformance.mockRejectedValue(error);

      await executeDailySnapshots();

      expect(logger.error).toHaveBeenCalledWith(
        'Cron job failed: daily-snapshots',
        expect.objectContaining({
          error: 'Timing aggregation failed',
        })
      );
    });
  });

  // ===========================================
  // initDailySnapshotsCron Tests
  // ===========================================
  describe('initDailySnapshotsCron', () => {
    test('should schedule cron job at 2:00 AM', () => {
      initDailySnapshotsCron();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'America/Los_Angeles',
        })
      );
    });

    test('should log scheduling info', () => {
      initDailySnapshotsCron();

      expect(logger.info).toHaveBeenCalledWith(
        'Scheduling daily snapshots cron job',
        expect.objectContaining({ schedule: '0 2 * * *' })
      );
    });

    test('should log scheduled status', () => {
      initDailySnapshotsCron();

      expect(logger.cron).toHaveBeenCalledWith('daily-snapshots', 'scheduled');
    });
  });

  // ===========================================
  // manualTrigger Tests
  // ===========================================
  describe('manualTrigger', () => {
    test('should execute daily snapshots', async () => {
      await manualTrigger();

      expect(snapshotService.generateDailySnapshots).toHaveBeenCalled();
    });

    test('should log manual trigger start', async () => {
      await manualTrigger();

      expect(logger.info).toHaveBeenCalledWith(
        'Manual snapshot generation triggered',
        expect.any(Object)
      );
    });

    test('should log manual trigger completion', async () => {
      await manualTrigger();

      expect(logger.info).toHaveBeenCalledWith(
        'Manual snapshot generation completed'
      );
    });

    test('should accept optional target date', async () => {
      const targetDate = new Date('2024-01-15');
      await manualTrigger(targetDate);

      expect(logger.info).toHaveBeenCalledWith(
        'Manual snapshot generation triggered',
        { targetDate }
      );
    });
  });
});
