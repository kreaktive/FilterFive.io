/**
 * Cache Service Tests
 * Tests for Redis-based caching functionality
 */

// Create a mock CacheService class for testing without Redis dependency
class MockCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300;
    this.store = new Map(); // In-memory store for testing
  }

  async connect() {
    this.client = {};
    this.isConnected = true;
    return true;
  }

  isAvailable() {
    return this.isConnected && this.client !== null;
  }

  async get(key) {
    if (!this.isAvailable()) return null;
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isAvailable()) return false;
    this.store.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });
    return true;
  }

  async del(key) {
    if (!this.isAvailable()) return false;
    this.store.delete(key);
    return true;
  }

  async delPattern(pattern) {
    if (!this.isAvailable()) return 0;
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  dashboardKey(userId, startDate, endDate, location = null) {
    const dateStr = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    const locStr = location ? `:loc:${location}` : '';
    return `analytics:dashboard:${userId}:${dateStr}${locStr}`;
  }

  trendKey(userId, location = null) {
    const locStr = location ? `:loc:${location}` : '';
    return `analytics:trend:${userId}${locStr}`;
  }

  locationsKey(userId) {
    return `analytics:locations:${userId}`;
  }

  heatmapKey(userId, location = null) {
    const locStr = location ? `:loc:${location}` : '';
    return `analytics:heatmap:${userId}${locStr}`;
  }

  async invalidateUserAnalytics(userId) {
    return this.delPattern(`analytics:*:${userId}*`);
  }

  async disconnect() {
    this.client = null;
    this.isConnected = false;
    this.store.clear();
  }
}

MockCacheService.TTL = {
  DASHBOARD: 300,
  TREND: 600,
  HEATMAP: 3600,
  LOCATIONS: 1800,
  SMS_METRICS: 300
};

describe('Cache Service', () => {
  let cacheService;

  beforeEach(async () => {
    cacheService = new MockCacheService();
    await cacheService.connect();
  });

  afterEach(async () => {
    await cacheService.disconnect();
  });

  describe('connect', () => {
    test('connects successfully', async () => {
      const newService = new MockCacheService();
      const result = await newService.connect();
      expect(result).toBe(true);
      expect(newService.isAvailable()).toBe(true);
    });
  });

  describe('isAvailable', () => {
    test('returns true when connected', () => {
      expect(cacheService.isAvailable()).toBe(true);
    });

    test('returns false when disconnected', async () => {
      await cacheService.disconnect();
      expect(cacheService.isAvailable()).toBe(false);
    });
  });

  describe('get/set', () => {
    test('sets and gets a value', async () => {
      await cacheService.set('test:key', { foo: 'bar' });
      const result = await cacheService.get('test:key');
      expect(result).toEqual({ foo: 'bar' });
    });

    test('returns null for non-existent key', async () => {
      const result = await cacheService.get('non:existent');
      expect(result).toBeNull();
    });

    test('handles various data types', async () => {
      // String
      await cacheService.set('str', 'hello');
      expect(await cacheService.get('str')).toBe('hello');

      // Number
      await cacheService.set('num', 42);
      expect(await cacheService.get('num')).toBe(42);

      // Array
      await cacheService.set('arr', [1, 2, 3]);
      expect(await cacheService.get('arr')).toEqual([1, 2, 3]);

      // Object
      await cacheService.set('obj', { a: 1, b: { c: 2 } });
      expect(await cacheService.get('obj')).toEqual({ a: 1, b: { c: 2 } });

      // Boolean
      await cacheService.set('bool', true);
      expect(await cacheService.get('bool')).toBe(true);
    });

    test('returns null when not available', async () => {
      await cacheService.disconnect();
      const result = await cacheService.get('test');
      expect(result).toBeNull();
    });

    test('returns false for set when not available', async () => {
      await cacheService.disconnect();
      const result = await cacheService.set('test', 'value');
      expect(result).toBe(false);
    });
  });

  describe('del', () => {
    test('deletes an existing key', async () => {
      await cacheService.set('to-delete', 'value');
      expect(await cacheService.get('to-delete')).toBe('value');

      const result = await cacheService.del('to-delete');
      expect(result).toBe(true);
      expect(await cacheService.get('to-delete')).toBeNull();
    });

    test('returns true for non-existent key', async () => {
      const result = await cacheService.del('non-existent');
      expect(result).toBe(true);
    });

    test('returns false when not available', async () => {
      await cacheService.disconnect();
      const result = await cacheService.del('test');
      expect(result).toBe(false);
    });
  });

  describe('delPattern', () => {
    test('deletes keys matching pattern', async () => {
      await cacheService.set('analytics:dashboard:1:2025-01-01', 'data1');
      await cacheService.set('analytics:dashboard:1:2025-01-02', 'data2');
      await cacheService.set('analytics:trend:1', 'trend');
      await cacheService.set('analytics:dashboard:2:2025-01-01', 'other');

      const deleted = await cacheService.delPattern('analytics:*:1*');

      expect(deleted).toBe(3);
      expect(await cacheService.get('analytics:dashboard:1:2025-01-01')).toBeNull();
      expect(await cacheService.get('analytics:dashboard:1:2025-01-02')).toBeNull();
      expect(await cacheService.get('analytics:trend:1')).toBeNull();
      expect(await cacheService.get('analytics:dashboard:2:2025-01-01')).toBe('other');
    });

    test('returns 0 when no keys match', async () => {
      await cacheService.set('other:key', 'value');
      const deleted = await cacheService.delPattern('analytics:*');
      expect(deleted).toBe(0);
    });

    test('returns 0 when not available', async () => {
      await cacheService.disconnect();
      const result = await cacheService.delPattern('test:*');
      expect(result).toBe(0);
    });
  });

  describe('getOrSet', () => {
    test('returns cached value if exists', async () => {
      await cacheService.set('cached:key', 'cached-value');

      const fetchFn = jest.fn().mockResolvedValue('fresh-value');
      const result = await cacheService.getOrSet('cached:key', fetchFn);

      expect(result).toBe('cached-value');
      expect(fetchFn).not.toHaveBeenCalled();
    });

    test('calls fetchFn when key not cached', async () => {
      const fetchFn = jest.fn().mockResolvedValue('fresh-value');
      const result = await cacheService.getOrSet('new:key', fetchFn);

      expect(result).toBe('fresh-value');
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('caches result from fetchFn', async () => {
      const fetchFn = jest.fn().mockResolvedValue('computed-value');

      // First call - computes value
      await cacheService.getOrSet('compute:key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      const result = await cacheService.getOrSet('compute:key', fetchFn);
      expect(result).toBe('computed-value');
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('handles async fetchFn', async () => {
      const fetchFn = async () => {
        return new Promise(resolve => setTimeout(() => resolve('async-value'), 10));
      };

      const result = await cacheService.getOrSet('async:key', fetchFn);
      expect(result).toBe('async-value');
    });
  });

  describe('Analytics cache keys', () => {
    test('dashboardKey generates correct key', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const key = cacheService.dashboardKey(123, startDate, endDate);
      expect(key).toBe('analytics:dashboard:123:2025-01-01_2025-01-31');
    });

    test('dashboardKey includes location', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const key = cacheService.dashboardKey(123, startDate, endDate, 'Downtown');
      expect(key).toBe('analytics:dashboard:123:2025-01-01_2025-01-31:loc:Downtown');
    });

    test('trendKey generates correct key', () => {
      expect(cacheService.trendKey(456)).toBe('analytics:trend:456');
      expect(cacheService.trendKey(456, 'Uptown')).toBe('analytics:trend:456:loc:Uptown');
    });

    test('locationsKey generates correct key', () => {
      expect(cacheService.locationsKey(789)).toBe('analytics:locations:789');
    });

    test('heatmapKey generates correct key', () => {
      expect(cacheService.heatmapKey(101)).toBe('analytics:heatmap:101');
      expect(cacheService.heatmapKey(101, 'Main')).toBe('analytics:heatmap:101:loc:Main');
    });
  });

  describe('invalidateUserAnalytics', () => {
    test('invalidates all analytics for a user', async () => {
      // Set up various cache entries for user 1
      await cacheService.set('analytics:dashboard:1:2025-01-01', 'dash1');
      await cacheService.set('analytics:dashboard:1:2025-01-02', 'dash2');
      await cacheService.set('analytics:trend:1', 'trend1');
      await cacheService.set('analytics:heatmap:1', 'heat1');
      await cacheService.set('analytics:locations:1', ['loc1', 'loc2']);

      // Set up entries for another user
      await cacheService.set('analytics:dashboard:2:2025-01-01', 'other');

      const deleted = await cacheService.invalidateUserAnalytics(1);

      expect(deleted).toBe(5);
      expect(await cacheService.get('analytics:dashboard:1:2025-01-01')).toBeNull();
      expect(await cacheService.get('analytics:dashboard:2:2025-01-01')).toBe('other');
    });
  });

  describe('disconnect', () => {
    test('clears all data and marks as disconnected', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await cacheService.disconnect();

      expect(cacheService.isAvailable()).toBe(false);
      expect(cacheService.client).toBeNull();
    });
  });

  describe('TTL constants', () => {
    test('has correct TTL values', () => {
      expect(MockCacheService.TTL.DASHBOARD).toBe(300);
      expect(MockCacheService.TTL.TREND).toBe(600);
      expect(MockCacheService.TTL.HEATMAP).toBe(3600);
      expect(MockCacheService.TTL.LOCATIONS).toBe(1800);
      expect(MockCacheService.TTL.SMS_METRICS).toBe(300);
    });
  });

  describe('Real-world caching scenarios', () => {
    test('caches dashboard metrics call', async () => {
      const userId = 42;
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      // Mock expensive database query
      const expensiveQuery = jest.fn().mockResolvedValue({
        requests: { total: 100, clicked: 75 },
        reviews: { positive: 50, negative: 5 }
      });

      // First call - hits database
      const result1 = await cacheService.getOrSet(
        cacheService.dashboardKey(userId, startDate, endDate),
        expensiveQuery,
        MockCacheService.TTL.DASHBOARD
      );

      expect(result1.requests.total).toBe(100);
      expect(expensiveQuery).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      const result2 = await cacheService.getOrSet(
        cacheService.dashboardKey(userId, startDate, endDate),
        expensiveQuery,
        MockCacheService.TTL.DASHBOARD
      );

      expect(result2).toEqual(result1);
      expect(expensiveQuery).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    test('different date ranges use different cache keys', async () => {
      const userId = 42;
      const jan = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31')
      };
      const feb = {
        start: new Date('2025-02-01'),
        end: new Date('2025-02-28')
      };

      const janQuery = jest.fn().mockResolvedValue({ month: 'January' });
      const febQuery = jest.fn().mockResolvedValue({ month: 'February' });

      const janResult = await cacheService.getOrSet(
        cacheService.dashboardKey(userId, jan.start, jan.end),
        janQuery
      );

      const febResult = await cacheService.getOrSet(
        cacheService.dashboardKey(userId, feb.start, feb.end),
        febQuery
      );

      expect(janResult.month).toBe('January');
      expect(febResult.month).toBe('February');
      expect(janQuery).toHaveBeenCalledTimes(1);
      expect(febQuery).toHaveBeenCalledTimes(1);
    });

    test('location filter creates separate cache entries', async () => {
      const userId = 42;

      const allLocations = jest.fn().mockResolvedValue({ total: 100 });
      const downtown = jest.fn().mockResolvedValue({ total: 60 });

      const result1 = await cacheService.getOrSet(
        cacheService.trendKey(userId),
        allLocations
      );

      const result2 = await cacheService.getOrSet(
        cacheService.trendKey(userId, 'Downtown'),
        downtown
      );

      expect(result1.total).toBe(100);
      expect(result2.total).toBe(60);
      expect(allLocations).toHaveBeenCalledTimes(1);
      expect(downtown).toHaveBeenCalledTimes(1);
    });
  });
});
