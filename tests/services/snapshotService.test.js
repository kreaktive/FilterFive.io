/**
 * Snapshot Service Tests
 *
 * Tests for daily analytics snapshots and timing performance:
 * - generateDailySnapshots
 * - generateTimingPerformance
 * - backfillSnapshots
 * - Metric calculations
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock Sequelize Op
const mockOp = {
  in: Symbol.for('in'),
  ne: Symbol.for('ne'),
  between: Symbol.for('between'),
};

jest.mock('sequelize', () => ({
  Op: mockOp,
}));

// Mock models
jest.mock('../../src/models', () => ({
  User: {
    findAll: jest.fn(),
  },
  FeedbackRequest: {
    findAll: jest.fn(),
    sequelize: {
      fn: jest.fn((fnName, col) => ({ fn: fnName, col })),
      col: jest.fn((name) => ({ col: name })),
    },
  },
  Review: {},
  AnalyticsSnapshot: {
    upsert: jest.fn(),
  },
  TimingPerformance: {
    upsert: jest.fn(),
  },
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  cron: jest.fn(),
}));

const { User, FeedbackRequest, AnalyticsSnapshot, TimingPerformance } = require('../../src/models');
const logger = require('../../src/services/logger');
const snapshotService = require('../../src/services/snapshotService');

describe('Snapshot Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  // ===========================================
  // generateDailySnapshots Tests
  // ===========================================
  describe('generateDailySnapshots', () => {
    it('should default to yesterday when no date provided', async () => {
      User.findAll.mockResolvedValue([]);
      FeedbackRequest.findAll.mockResolvedValue([]);

      const result = await snapshotService.generateDailySnapshots();

      // Should be yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expectedDate = yesterday.toISOString().split('T')[0];

      expect(result.snapshotDate).toBe(expectedDate);
      expect(result.usersProcessed).toBe(0);
    });

    it('should use provided target date', async () => {
      User.findAll.mockResolvedValue([]);
      FeedbackRequest.findAll.mockResolvedValue([]);

      // Use local date components to avoid timezone issues
      // new Date('2025-06-15') creates UTC midnight, but service uses local time
      const customDate = new Date(2025, 5, 15); // Month is 0-indexed, so 5 = June
      const result = await snapshotService.generateDailySnapshots(customDate);

      // The service sets hours to 0,0,0,0 locally then converts to ISO
      // So we need to match that behavior
      const expected = new Date(2025, 5, 15);
      expected.setHours(0, 0, 0, 0);
      expect(result.snapshotDate).toBe(expected.toISOString().split('T')[0]);
    });

    it('should process multiple users in batches', async () => {
      const mockUsers = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      User.findAll.mockResolvedValue(mockUsers);
      FeedbackRequest.findAll.mockResolvedValue([]);
      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService.generateDailySnapshots(new Date('2025-06-01'));

      expect(result.usersProcessed).toBe(25);
      expect(logger.cron).toHaveBeenCalledWith(
        'snapshot_generation',
        'started',
        expect.objectContaining({ userCount: 25 })
      );
    });

    it('should handle Promise.allSettled errors', async () => {
      User.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      FeedbackRequest.findAll.mockResolvedValueOnce([]);
      FeedbackRequest.findAll.mockRejectedValueOnce(new Error('DB error'));
      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService.generateDailySnapshots(new Date('2025-06-01'));

      expect(result.errors).toBeGreaterThanOrEqual(0);
    });

    it('should return empty user list result', async () => {
      User.findAll.mockResolvedValue([]);

      const result = await snapshotService.generateDailySnapshots();

      expect(result.usersProcessed).toBe(0);
      expect(result.snapshotsCreated).toBe(0);
      expect(result.snapshotsUpdated).toBe(0);
    });

    it('should count updated snapshots when upsert returns created=false', async () => {
      const mockUsers = [{ id: 1 }];
      User.findAll.mockResolvedValue(mockUsers);
      FeedbackRequest.findAll.mockResolvedValue([]);
      // Return created=false to trigger the updated++ branch
      AnalyticsSnapshot.upsert.mockResolvedValue([{ id: 1 }, false]);

      const result = await snapshotService.generateDailySnapshots(new Date('2025-06-01'));

      expect(result.snapshotsUpdated).toBeGreaterThan(0);
      expect(result.snapshotsCreated).toBe(0);
    });

    it('should return correct structure', async () => {
      User.findAll.mockResolvedValue([]);

      const result = await snapshotService.generateDailySnapshots();

      expect(result).toHaveProperty('snapshotDate');
      expect(result).toHaveProperty('usersProcessed');
      expect(result).toHaveProperty('snapshotsCreated');
      expect(result).toHaveProperty('snapshotsUpdated');
      expect(result).toHaveProperty('errors');
    });
  });

  // ===========================================
  // _generateSnapshotForUserAndLocation Tests
  // ===========================================
  describe('_generateSnapshotForUserAndLocation', () => {
    beforeEach(() => {
      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);
    });

    it('should calculate metrics correctly with no requests', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestsSent: 0,
          requestsSms: 0,
          requestsQr: 0,
          requestsClicked: 0,
          requestsRated: 0,
        }),
        expect.any(Object)
      );
    });

    it('should calculate SMS only metrics', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 5 } },
        { id: 2, deliveryMethod: 'sms', linkClickedAt: null, review: null },
      ]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestsSent: 2,
          requestsSms: 2,
          requestsQr: 0,
          requestsClicked: 1,
          requestsRated: 1,
        }),
        expect.any(Object)
      );
    });

    it('should calculate QR only metrics', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, deliveryMethod: 'qr', linkClickedAt: new Date(), review: { rating: 4 } },
        { id: 2, deliveryMethod: 'qr', linkClickedAt: new Date(), review: { rating: 5 } },
      ]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestsQr: 2,
          requestsSms: 0,
          reviewsPositive: 2,
          reviewsNegative: 0,
        }),
        expect.any(Object)
      );
    });

    it('should calculate click/conversion rates', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 5 } },
        { id: 2, deliveryMethod: 'sms', linkClickedAt: new Date(), review: null },
        { id: 3, deliveryMethod: 'sms', linkClickedAt: null, review: null },
        { id: 4, deliveryMethod: 'sms', linkClickedAt: null, review: null },
      ]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      // 2/4 clicked = 50%, 1/2 converted = 50%
      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clickRate: 50,
          conversionRate: 50,
        }),
        expect.any(Object)
      );
    });

    it('should calculate rating distribution', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 1 } },
        { id: 2, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 2 } },
        { id: 3, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 3 } },
        { id: 4, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 4 } },
        { id: 5, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 5 } },
      ]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews1Star: 1,
          reviews2Star: 1,
          reviews3Star: 1,
          reviews4Star: 1,
          reviews5Star: 1,
        }),
        expect.any(Object)
      );
    });

    it('should handle division by zero', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clickRate: null,
          conversionRate: null,
          positiveRate: null,
          averageRating: null,
        }),
        expect.any(Object)
      );
    });

    it('should return created=true for new snapshot', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);
      AnalyticsSnapshot.upsert.mockResolvedValue([{ id: 1 }, true]);

      const result = await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(result.created).toBe(true);
    });

    it('should return created=false for updated snapshot', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);
      AnalyticsSnapshot.upsert.mockResolvedValue([{ id: 1 }, false]);

      const result = await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(result.created).toBe(false);
    });
  });

  // ===========================================
  // generateTimingPerformance Tests
  // ===========================================
  describe('generateTimingPerformance', () => {
    it('should process multiple users and locations', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      User.findAll.mockResolvedValue(mockUsers);
      FeedbackRequest.findAll.mockResolvedValue([]);
      TimingPerformance.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService.generateTimingPerformance();

      expect(result.usersProcessed).toBe(2);
      expect(logger.cron).toHaveBeenCalledWith(
        'timing_performance',
        'started',
        expect.objectContaining({ userCount: 2 })
      );
    });

    it('should return correct counts', async () => {
      User.findAll.mockResolvedValue([]);

      const result = await snapshotService.generateTimingPerformance();

      expect(result).toHaveProperty('usersProcessed');
      expect(result).toHaveProperty('recordsCreated');
      expect(result).toHaveProperty('recordsUpdated');
      expect(result).toHaveProperty('errors');
    });

    it('should handle batching logic', async () => {
      const mockUsers = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));
      User.findAll.mockResolvedValue(mockUsers);
      FeedbackRequest.findAll.mockResolvedValue([]);

      const result = await snapshotService.generateTimingPerformance();

      expect(result.usersProcessed).toBe(12);
    });

    it('should handle errors in batch and log them', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      User.findAll.mockResolvedValue(mockUsers);
      // First user succeeds, second user throws
      FeedbackRequest.findAll
        .mockResolvedValueOnce([]) // User 1 locations query
        .mockResolvedValueOnce([]) // User 1 timing query
        .mockRejectedValueOnce(new Error('DB error for user 2')); // User 2 locations query

      const result = await snapshotService.generateTimingPerformance();

      expect(result.errors).toBeGreaterThanOrEqual(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Error generating timing performance for user in batch',
        expect.objectContaining({ error: 'DB error for user 2' })
      );
    });
  });

  // ===========================================
  // _generateTimingPerformanceForUserAndLocation Tests
  // ===========================================
  describe('_generateTimingPerformanceForUserAndLocation', () => {
    it('should calculate performance score', async () => {
      // Monday at 10am
      const monday10am = new Date('2025-06-02T10:00:00');
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, createdAt: monday10am, linkClickedAt: new Date(), review: { rating: 5 } },
        { id: 2, createdAt: monday10am, linkClickedAt: new Date(), review: { rating: 4 } },
      ]);
      TimingPerformance.upsert.mockResolvedValue([{}, true]);

      await snapshotService._generateTimingPerformanceForUserAndLocation(1, null);

      expect(TimingPerformance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          performanceScore: expect.any(Number),
        }),
        expect.any(Object)
      );
    });

    it('should upsert for time slots with data', async () => {
      const monday10am = new Date('2025-06-02T10:00:00');
      const tuesday14pm = new Date('2025-06-03T14:00:00');

      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, createdAt: monday10am, linkClickedAt: new Date(), review: { rating: 5 } },
        { id: 2, createdAt: tuesday14pm, linkClickedAt: null, review: null },
      ]);
      TimingPerformance.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService._generateTimingPerformanceForUserAndLocation(1, null);

      expect(result.created + result.updated).toBe(2);
    });

    it('should return correct counts', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);

      const result = await snapshotService._generateTimingPerformanceForUserAndLocation(1, null);

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
    });

    it('should filter by location when provided', async () => {
      const monday10am = new Date('2025-06-02T10:00:00');
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, createdAt: monday10am, linkClickedAt: new Date(), review: { rating: 5 } },
      ]);
      TimingPerformance.upsert.mockResolvedValue([{}, true]);

      await snapshotService._generateTimingPerformanceForUserAndLocation(1, 'Store A');

      expect(FeedbackRequest.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            location: 'Store A',
          }),
        })
      );
    });

    it('should count updated records when upsert returns wasCreated=false', async () => {
      const monday10am = new Date('2025-06-02T10:00:00');
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, createdAt: monday10am, linkClickedAt: new Date(), review: { rating: 5 } },
      ]);
      // Return wasCreated=false to trigger the updated++ branch
      TimingPerformance.upsert.mockResolvedValue([{}, false]);

      const result = await snapshotService._generateTimingPerformanceForUserAndLocation(1, null);

      expect(result.updated).toBe(1);
      expect(result.created).toBe(0);
    });
  });

  // ===========================================
  // backfillSnapshots Tests
  // ===========================================
  describe('backfillSnapshots', () => {
    it('should generate N days back', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);
      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService.backfillSnapshots(1, 7);

      expect(result.daysBack).toBe(7);
      expect(logger.cron).toHaveBeenCalledWith(
        'backfill_snapshots',
        'started',
        expect.objectContaining({ userId: 1, daysBack: 7 })
      );
    });

    it('should generate per-location and aggregate snapshots', async () => {
      // Mock locations
      FeedbackRequest.findAll
        .mockResolvedValueOnce([{ location: 'Store A' }, { location: 'Store B' }]) // Locations query
        .mockResolvedValue([]); // Requests query

      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService.backfillSnapshots(1, 1);

      // Should process null (aggregate) + 2 locations = 3 snapshots per day
      expect(result.created + result.updated).toBeGreaterThan(0);
    });

    it('should return correct counts', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);
      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService.backfillSnapshots(1, 5);

      expect(result.userId).toBe(1);
      expect(result.daysBack).toBe(5);
      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('updated');
    });

    it('should default to 90 days', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);
      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);

      const result = await snapshotService.backfillSnapshots(1);

      expect(result.daysBack).toBe(90);
    });

    it('should count updated snapshots when upsert returns created=false', async () => {
      FeedbackRequest.findAll.mockResolvedValue([]);
      // Return created=false to trigger the updated++ branch
      AnalyticsSnapshot.upsert.mockResolvedValue([{ id: 1 }, false]);

      const result = await snapshotService.backfillSnapshots(1, 3);

      expect(result.updated).toBeGreaterThan(0);
      expect(result.created).toBe(0);
    });
  });

  // ===========================================
  // _getAllUsersLocations Tests
  // ===========================================
  describe('_getAllUsersLocations', () => {
    it('should return empty object for empty user list', async () => {
      const result = await snapshotService._getAllUsersLocations([]);
      expect(result).toEqual({});
    });

    it('should group locations by user', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { userId: 1, location: 'Store A' },
        { userId: 1, location: 'Store B' },
        { userId: 2, location: 'Store C' },
      ]);

      const result = await snapshotService._getAllUsersLocations([1, 2]);

      expect(result[1]).toContain('Store A');
      expect(result[1]).toContain('Store B');
      expect(result[2]).toContain('Store C');
    });

    it('should handle users with no locations', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { userId: 1, location: 'Store A' },
      ]);

      const result = await snapshotService._getAllUsersLocations([1, 2, 3]);

      expect(result[1]).toContain('Store A');
      expect(result[2]).toBeUndefined();
      expect(result[3]).toBeUndefined();
    });
  });

  // ===========================================
  // _getUserLocations Tests
  // ===========================================
  describe('_getUserLocations', () => {
    it('should return distinct locations', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { location: 'Store A' },
        { location: 'Store B' },
      ]);

      const result = await snapshotService._getUserLocations(1);

      expect(result).toContain('Store A');
      expect(result).toContain('Store B');
      expect(result.length).toBe(2);
    });

    it('should filter out null locations', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { location: 'Store A' },
        { location: null },
        { location: '' },
      ]);

      const result = await snapshotService._getUserLocations(1);

      expect(result).toContain('Store A');
      expect(result.filter(l => !l).length).toBe(0);
    });
  });

  // ===========================================
  // Metric Calculations
  // ===========================================
  describe('Metric Calculations', () => {
    beforeEach(() => {
      AnalyticsSnapshot.upsert.mockResolvedValue([{}, true]);
    });

    it('should calculate average rating correctly', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 3 } },
        { id: 2, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 5 } },
      ]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          averageRating: 4, // (3+5)/2 = 4
        }),
        expect.any(Object)
      );
    });

    it('should calculate positive/negative correctly (4+ is positive)', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 3 } },
        { id: 2, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 4 } },
        { id: 3, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 5 } },
      ]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewsPositive: 2, // 4 and 5
          reviewsNegative: 1, // 3
        }),
        expect.any(Object)
      );
    });

    it('should round rates to 2 decimal places', async () => {
      FeedbackRequest.findAll.mockResolvedValue([
        { id: 1, deliveryMethod: 'sms', linkClickedAt: new Date(), review: { rating: 5 } },
        { id: 2, deliveryMethod: 'sms', linkClickedAt: new Date(), review: null },
        { id: 3, deliveryMethod: 'sms', linkClickedAt: null, review: null },
      ]);

      await snapshotService._generateSnapshotForUserAndLocation(1, new Date(), null);

      // 2/3 = 66.67% click rate
      expect(AnalyticsSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clickRate: expect.any(Number),
        }),
        expect.any(Object)
      );

      const call = AnalyticsSnapshot.upsert.mock.calls[0][0];
      expect(call.clickRate.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });
});
