/**
 * Cache Service Tests
 *
 * Tests for Redis caching functionality:
 * - Connection management
 * - Basic CRUD operations (get, set, del)
 * - Pattern deletion with SCAN
 * - Cache-aside pattern (getOrSet)
 * - Counter operations
 * - Analytics-specific cache methods
 * - Query caching helpers
 */

const { resetAllMocks } = require('../helpers/mockServices');

// Mock Redis client methods
const mockGet = jest.fn();
const mockSetex = jest.fn();
const mockDel = jest.fn();
const mockScan = jest.fn();
const mockIncr = jest.fn();
const mockExpire = jest.fn();
const mockExec = jest.fn();
const mockQuit = jest.fn();
const mockConnect = jest.fn();
const mockOn = jest.fn();

const mockMulti = jest.fn().mockReturnValue({
  incr: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: mockExec,
});

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: mockGet,
    setex: mockSetex,
    del: mockDel,
    scan: mockScan,
    incr: mockIncr,
    expire: mockExpire,
    multi: mockMulti,
    quit: mockQuit,
    connect: mockConnect,
    on: mockOn,
  }));
});

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const logger = require('../../src/services/logger');
const cacheService = require('../../src/services/cacheService');

describe('Cache Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();

    // Reset service state
    cacheService.isConnected = false;
    cacheService.client = null;

    // Default mock implementations
    mockConnect.mockResolvedValue(undefined);
    mockGet.mockResolvedValue(null);
    mockSetex.mockResolvedValue('OK');
    mockDel.mockResolvedValue(1);
    mockScan.mockResolvedValue(['0', []]);
    mockQuit.mockResolvedValue('OK');
    mockExec.mockResolvedValue([[null, 1]]);
  });

  // ===========================================
  // isAvailable Tests
  // ===========================================
  describe('isAvailable', () => {
    it('should return true when connected', () => {
      cacheService.isConnected = true;
      cacheService.client = {};

      expect(cacheService.isAvailable()).toBe(true);
    });

    it('should return false when not connected', () => {
      cacheService.isConnected = false;

      expect(cacheService.isAvailable()).toBe(false);
    });

    it('should return false when client is null', () => {
      cacheService.isConnected = true;
      cacheService.client = null;

      expect(cacheService.isAvailable()).toBe(false);
    });
  });

  // ===========================================
  // get Tests
  // ===========================================
  describe('get', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { get: mockGet };
    });

    it('should return parsed value from cache', async () => {
      mockGet.mockResolvedValue(JSON.stringify({ data: 'test' }));

      const result = await cacheService.get('test-key');

      expect(result).toEqual({ data: 'test' });
      expect(mockGet).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key not found', async () => {
      mockGet.mockResolvedValue(null);

      const result = await cacheService.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when cache unavailable', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.get('any-key');

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should return null and log on error', async () => {
      mockGet.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('error-key');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Cache get error',
        { key: 'error-key', error: 'Redis error' }
      );
    });

    it('should return null on JSON parse errors', async () => {
      mockGet.mockResolvedValue('invalid-json{');

      const result = await cacheService.get('bad-json-key');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ===========================================
  // set Tests
  // ===========================================
  describe('set', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { setex: mockSetex };
    });

    it('should set value with default TTL', async () => {
      const result = await cacheService.set('key1', { value: 'data' });

      expect(result).toBe(true);
      expect(mockSetex).toHaveBeenCalledWith('key1', 300, JSON.stringify({ value: 'data' }));
    });

    it('should set value with custom TTL', async () => {
      const result = await cacheService.set('key2', 'value', 600);

      expect(result).toBe(true);
      expect(mockSetex).toHaveBeenCalledWith('key2', 600, '"value"');
    });

    it('should return false when cache unavailable', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.set('any', 'value');

      expect(result).toBe(false);
      expect(mockSetex).not.toHaveBeenCalled();
    });

    it('should return false and log on error', async () => {
      mockSetex.mockRejectedValue(new Error('Write error'));

      const result = await cacheService.set('error-key', 'value');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Cache set error',
        { key: 'error-key', error: 'Write error' }
      );
    });
  });

  // ===========================================
  // del Tests
  // ===========================================
  describe('del', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { del: mockDel };
    });

    it('should delete key successfully', async () => {
      mockDel.mockResolvedValue(1);

      const result = await cacheService.del('key-to-delete');

      expect(result).toBe(true);
      expect(mockDel).toHaveBeenCalledWith('key-to-delete');
    });

    it('should return false when cache unavailable', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.del('any');

      expect(result).toBe(false);
    });

    it('should return false and log on error', async () => {
      mockDel.mockRejectedValue(new Error('Delete error'));

      const result = await cacheService.del('error-key');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Cache del error',
        { key: 'error-key', error: 'Delete error' }
      );
    });
  });

  // ===========================================
  // delPattern Tests
  // ===========================================
  describe('delPattern', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { scan: mockScan, del: mockDel };
    });

    it('should delete keys matching pattern', async () => {
      mockScan
        .mockResolvedValueOnce(['1', ['key1', 'key2']])
        .mockResolvedValueOnce(['0', ['key3']]);
      mockDel.mockResolvedValue(2);

      const result = await cacheService.delPattern('test:*');

      expect(result).toBe(3);
      expect(mockScan).toHaveBeenCalledWith('0', 'MATCH', 'test:*', 'COUNT', 100);
    });

    it('should return 0 when cache unavailable', async () => {
      cacheService.isConnected = false;

      const result = await cacheService.delPattern('any:*');

      expect(result).toBe(0);
    });

    it('should return 0 when no keys match', async () => {
      mockScan.mockResolvedValue(['0', []]);

      const result = await cacheService.delPattern('nonexistent:*');

      expect(result).toBe(0);
    });

    it('should return 0 and log on error', async () => {
      mockScan.mockRejectedValue(new Error('Scan error'));

      const result = await cacheService.delPattern('error:*');

      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalledWith(
        'Cache delPattern error',
        { pattern: 'error:*', error: 'Scan error' }
      );
    });
  });

  // ===========================================
  // getOrSet Tests
  // ===========================================
  describe('getOrSet', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { get: mockGet, setex: mockSetex };
    });

    it('should return cached value if exists', async () => {
      mockGet.mockResolvedValue(JSON.stringify({ cached: true }));

      const fetchFn = jest.fn();
      const result = await cacheService.getOrSet('key', fetchFn);

      expect(result).toEqual({ cached: true });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache when key not found', async () => {
      mockGet.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue({ fresh: true });

      const result = await cacheService.getOrSet('new-key', fetchFn, 600);

      expect(result).toEqual({ fresh: true });
      expect(fetchFn).toHaveBeenCalled();
    });

    it('should work when cache is unavailable', async () => {
      cacheService.isConnected = false;
      const fetchFn = jest.fn().mockResolvedValue({ data: 'fetched' });

      const result = await cacheService.getOrSet('any', fetchFn);

      expect(result).toEqual({ data: 'fetched' });
      expect(fetchFn).toHaveBeenCalled();
    });
  });

  // ===========================================
  // Analytics Key Methods Tests
  // ===========================================
  describe('Analytics Key Methods', () => {
    it('should generate dashboard key', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const key = cacheService.dashboardKey(123, startDate, endDate);

      expect(key).toBe('analytics:dashboard:123:2025-01-01_2025-01-31');
    });

    it('should generate dashboard key with location', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const key = cacheService.dashboardKey(123, startDate, endDate, 'store-1');

      expect(key).toBe('analytics:dashboard:123:2025-01-01_2025-01-31:loc:store-1');
    });

    it('should generate trend key', () => {
      const key = cacheService.trendKey(456);

      expect(key).toBe('analytics:trend:456');
    });

    it('should generate trend key with location', () => {
      const key = cacheService.trendKey(456, 'branch-a');

      expect(key).toBe('analytics:trend:456:loc:branch-a');
    });

    it('should generate locations key', () => {
      const key = cacheService.locationsKey(789);

      expect(key).toBe('analytics:locations:789');
    });

    it('should generate heatmap key', () => {
      const key = cacheService.heatmapKey(100);

      expect(key).toBe('analytics:heatmap:100');
    });

    it('should generate heatmap key with location', () => {
      const key = cacheService.heatmapKey(100, 'main');

      expect(key).toBe('analytics:heatmap:100:loc:main');
    });
  });

  // ===========================================
  // invalidateUserAnalytics Tests
  // ===========================================
  describe('invalidateUserAnalytics', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { scan: mockScan, del: mockDel };
    });

    it('should delete user analytics cache and log', async () => {
      mockScan.mockResolvedValue(['0', ['analytics:dashboard:123', 'analytics:trend:123']]);
      mockDel.mockResolvedValue(2);

      const result = await cacheService.invalidateUserAnalytics(123);

      expect(result).toBe(2);
      expect(logger.info).toHaveBeenCalledWith(
        'Invalidated analytics cache',
        { userId: 123, keysDeleted: 2 }
      );
    });

    it('should not log when no keys deleted', async () => {
      mockScan.mockResolvedValue(['0', []]);

      const result = await cacheService.invalidateUserAnalytics(999);

      expect(result).toBe(0);
    });
  });

  // ===========================================
  // Query Cache Methods Tests
  // ===========================================
  describe('Query Cache Methods', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { get: mockGet, setex: mockSetex, scan: mockScan, del: mockDel };
    });

    describe('userQueryKey', () => {
      it('should generate user query key', () => {
        const key = cacheService.userQueryKey(123, 'getReviews');

        expect(key).toBe('query:user:123:getReviews');
      });

      it('should include params in key', () => {
        const key = cacheService.userQueryKey(123, 'getReviews', { page: 1, limit: 10 });

        expect(key).toBe('query:user:123:getReviews:page=1:limit=10');
      });
    });

    describe('globalQueryKey', () => {
      it('should generate global query key', () => {
        const key = cacheService.globalQueryKey('getStats');

        expect(key).toBe('query:global:getStats');
      });

      it('should include params in key', () => {
        const key = cacheService.globalQueryKey('getStats', { period: 'month' });

        expect(key).toBe('query:global:getStats:period=month');
      });
    });

    describe('cacheUserQuery', () => {
      it('should cache user query result', async () => {
        mockGet.mockResolvedValue(null);
        const queryFn = jest.fn().mockResolvedValue({ rows: [] });

        const result = await cacheService.cacheUserQuery(123, 'getOrders', queryFn);

        expect(result).toEqual({ rows: [] });
        expect(queryFn).toHaveBeenCalled();
      });

      it('should return cached result', async () => {
        mockGet.mockResolvedValue(JSON.stringify({ rows: ['cached'] }));
        const queryFn = jest.fn();

        const result = await cacheService.cacheUserQuery(123, 'getOrders', queryFn);

        expect(result).toEqual({ rows: ['cached'] });
        expect(queryFn).not.toHaveBeenCalled();
      });
    });

    describe('cacheGlobalQuery', () => {
      it('should cache global query result', async () => {
        mockGet.mockResolvedValue(null);
        const queryFn = jest.fn().mockResolvedValue({ total: 100 });

        const result = await cacheService.cacheGlobalQuery('totalUsers', queryFn);

        expect(result).toEqual({ total: 100 });
      });
    });

    describe('invalidateUserQueries', () => {
      it('should delete user query cache and log', async () => {
        mockScan.mockResolvedValue(['0', ['query:user:123:q1', 'query:user:123:q2']]);
        mockDel.mockResolvedValue(2);

        const result = await cacheService.invalidateUserQueries(123);

        expect(result).toBe(2);
        expect(logger.info).toHaveBeenCalledWith(
          'Invalidated user query cache',
          { userId: 123, keysDeleted: 2 }
        );
      });
    });
  });

  // ===========================================
  // Counter Operations Tests
  // ===========================================
  describe('Counter Operations', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = {
        get: mockGet,
        multi: mockMulti,
      };
    });

    describe('increment', () => {
      it('should increment counter', async () => {
        mockExec.mockResolvedValue([[null, 5]]);

        const result = await cacheService.increment('counter:test');

        expect(result).toBe(5);
        expect(mockMulti).toHaveBeenCalled();
      });

      it('should return null when cache unavailable', async () => {
        cacheService.isConnected = false;

        const result = await cacheService.increment('any');

        expect(result).toBeNull();
      });

      it('should return null on error', async () => {
        mockExec.mockRejectedValue(new Error('Multi error'));

        const result = await cacheService.increment('error-counter');

        expect(result).toBeNull();
        expect(logger.error).toHaveBeenCalledWith(
          'Cache increment error',
          { key: 'error-counter', error: 'Multi error' }
        );
      });
    });

    describe('getCounter', () => {
      it('should get counter value', async () => {
        mockGet.mockResolvedValue('42');

        const result = await cacheService.getCounter('counter:views');

        expect(result).toBe(42);
      });

      it('should return 0 when key not found', async () => {
        mockGet.mockResolvedValue(null);

        const result = await cacheService.getCounter('nonexistent');

        expect(result).toBe(0);
      });

      it('should return 0 when cache unavailable', async () => {
        cacheService.isConnected = false;

        const result = await cacheService.getCounter('any');

        expect(result).toBe(0);
      });

      it('should return 0 on error', async () => {
        mockGet.mockRejectedValue(new Error('Read error'));

        const result = await cacheService.getCounter('error-counter');

        expect(result).toBe(0);
        expect(logger.error).toHaveBeenCalledWith(
          'Cache getCounter error',
          { key: 'error-counter', error: 'Read error' }
        );
      });
    });
  });

  // ===========================================
  // disconnect Tests
  // ===========================================
  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      cacheService.client = { quit: mockQuit };
      cacheService.isConnected = true;

      await cacheService.disconnect();

      expect(mockQuit).toHaveBeenCalled();
      expect(cacheService.client).toBeNull();
      expect(cacheService.isConnected).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('Redis cache disconnected');
    });

    it('should handle when client is null', async () => {
      cacheService.client = null;

      await cacheService.disconnect();

      expect(mockQuit).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // TTL Constants Tests
  // ===========================================
  describe('TTL Constants', () => {
    it('should have correct TTL values', () => {
      const CacheService = cacheService.constructor;

      expect(CacheService.TTL).toBeDefined();
      expect(CacheService.TTL.DASHBOARD).toBe(300);
      expect(CacheService.TTL.TREND).toBe(600);
      expect(CacheService.TTL.HEATMAP).toBe(3600);
      expect(CacheService.TTL.LOCATIONS).toBe(1800);
      expect(CacheService.TTL.SMS_METRICS).toBe(300);
      expect(CacheService.TTL.QUERY).toBe(60);
      expect(CacheService.TTL.USER_DATA).toBe(60);
      expect(CacheService.TTL.STATS).toBe(120);
    });
  });

  // ===========================================
  // Edge Cases
  // ===========================================
  describe('Edge Cases', () => {
    beforeEach(() => {
      cacheService.isConnected = true;
      cacheService.client = { get: mockGet, setex: mockSetex };
    });

    it('should handle empty string values', async () => {
      mockGet.mockResolvedValue('""');

      const result = await cacheService.get('empty-string');

      expect(result).toBe('');
    });

    it('should handle array values', async () => {
      const arr = [1, 2, 3];
      mockGet.mockResolvedValue(JSON.stringify(arr));

      const result = await cacheService.get('array-key');

      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle nested object values', async () => {
      const obj = { a: { b: { c: 'deep' } } };
      mockGet.mockResolvedValue(JSON.stringify(obj));

      const result = await cacheService.get('nested-key');

      expect(result).toEqual({ a: { b: { c: 'deep' } } });
    });
  });
});
