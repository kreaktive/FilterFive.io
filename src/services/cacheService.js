/**
 * Cache Service
 * Redis-based caching for analytics and frequently accessed data
 *
 * Provides short-lived caching to reduce database load while
 * maintaining data freshness for dashboards.
 */

const Redis = require('ioredis');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default
  }

  /**
   * Initialize Redis connection
   * Call this once at app startup
   */
  async connect() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn('REDIS_URL not configured - caching disabled');
      return false;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true
      });

      await this.client.connect();

      this.client.on('connect', () => {
        logger.info('Redis cache connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis cache error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis cache connection closed');
        this.isConnected = false;
      });

      this.isConnected = true;
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON serialized)
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    if (!this.isAvailable()) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache del error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern using non-blocking SCAN
   * @param {string} pattern - Key pattern (e.g., "analytics:user:123:*")
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.isAvailable()) return 0;

    try {
      let cursor = '0';
      let totalDeleted = 0;

      // Use SCAN instead of KEYS to avoid blocking Redis
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.client.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      return totalDeleted;
    } catch (error) {
      logger.error('Cache delPattern error', { pattern, error: error.message });
      return 0;
    }
  }

  /**
   * Get or set with callback (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to fetch data if not cached
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<any>} Cached or freshly fetched value
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const value = await fetchFn();

    // D8 FIX: Cache the result (async, don't wait) but log errors
    this.set(key, value, ttl).catch((error) => {
      logger.warn('Cache set failed in getOrSet', { key, error: error.message });
    });

    return value;
  }

  // ============================================
  // Analytics-specific cache methods
  // ============================================

  /**
   * Cache key for dashboard metrics
   */
  dashboardKey(userId, startDate, endDate, location = null) {
    const dateStr = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    const locStr = location ? `:loc:${location}` : '';
    return `analytics:dashboard:${userId}:${dateStr}${locStr}`;
  }

  /**
   * Cache key for trend data
   */
  trendKey(userId, location = null) {
    const locStr = location ? `:loc:${location}` : '';
    return `analytics:trend:${userId}${locStr}`;
  }

  /**
   * Cache key for user locations
   */
  locationsKey(userId) {
    return `analytics:locations:${userId}`;
  }

  /**
   * Cache key for timing heatmap
   */
  heatmapKey(userId, location = null) {
    const locStr = location ? `:loc:${location}` : '';
    return `analytics:heatmap:${userId}${locStr}`;
  }

  /**
   * Invalidate all analytics cache for a user
   * Call this when new data is added (SMS sent, review received, etc.)
   */
  async invalidateUserAnalytics(userId) {
    const deleted = await this.delPattern(`analytics:*:${userId}*`);
    if (deleted > 0) {
      logger.info('Invalidated analytics cache', { userId, keysDeleted: deleted });
    }
    return deleted;
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis cache disconnected');
    }
  }
}

// TTL constants for different data types
CacheService.TTL = {
  DASHBOARD: 300,      // 5 minutes - main dashboard metrics
  TREND: 600,          // 10 minutes - trend/sparkline data
  HEATMAP: 3600,       // 1 hour - timing heatmap (rarely changes)
  LOCATIONS: 1800,     // 30 minutes - user location list
  SMS_METRICS: 300,    // 5 minutes - SMS event metrics
  QUERY: 60,           // 1 minute - generic query cache
  USER_DATA: 60,       // 1 minute - user record cache
  STATS: 120           // 2 minutes - aggregate statistics
};

// ============================================
// Query caching helper methods
// ============================================

/**
 * Cache key for user-specific queries
 */
CacheService.prototype.userQueryKey = function(userId, queryName, params = {}) {
  const paramStr = Object.keys(params).length > 0
    ? ':' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(':')
    : '';
  return `query:user:${userId}:${queryName}${paramStr}`;
};

/**
 * Cache key for global queries (non-user-specific)
 */
CacheService.prototype.globalQueryKey = function(queryName, params = {}) {
  const paramStr = Object.keys(params).length > 0
    ? ':' + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(':')
    : '';
  return `query:global:${queryName}${paramStr}`;
};

/**
 * Cache a database query result for a user
 * @param {number} userId - User ID
 * @param {string} queryName - Unique query identifier
 * @param {Function} queryFn - Async function that performs the query
 * @param {object} options - Options
 * @param {number} options.ttl - Cache TTL in seconds (default: QUERY)
 * @param {object} options.params - Query parameters for cache key
 * @returns {Promise<any>} Query result
 */
CacheService.prototype.cacheUserQuery = async function(userId, queryName, queryFn, options = {}) {
  const { ttl = CacheService.TTL.QUERY, params = {} } = options;
  const key = this.userQueryKey(userId, queryName, params);
  return this.getOrSet(key, queryFn, ttl);
};

/**
 * Cache a global query result
 * @param {string} queryName - Unique query identifier
 * @param {Function} queryFn - Async function that performs the query
 * @param {object} options - Options
 * @returns {Promise<any>} Query result
 */
CacheService.prototype.cacheGlobalQuery = async function(queryName, queryFn, options = {}) {
  const { ttl = CacheService.TTL.QUERY, params = {} } = options;
  const key = this.globalQueryKey(queryName, params);
  return this.getOrSet(key, queryFn, ttl);
};

/**
 * Invalidate all cached queries for a user
 * Call when user data changes significantly
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of keys deleted
 */
CacheService.prototype.invalidateUserQueries = async function(userId) {
  const deleted = await this.delPattern(`query:user:${userId}:*`);
  if (deleted > 0) {
    logger.info('Invalidated user query cache', { userId, keysDeleted: deleted });
  }
  return deleted;
};

/**
 * Increment a counter in cache (atomic)
 * Useful for rate limiting or statistics
 * @param {string} key - Counter key
 * @param {number} ttl - TTL in seconds (only set on creation)
 * @returns {Promise<number>} New counter value
 */
CacheService.prototype.increment = async function(key, ttl = 60) {
  if (!this.isAvailable()) return null;

  try {
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, ttl);
    const results = await multi.exec();
    return results[0][1]; // Get INCR result
  } catch (error) {
    logger.error('Cache increment error', { key, error: error.message });
    return null;
  }
};

/**
 * Get current counter value
 * @param {string} key - Counter key
 * @returns {Promise<number>} Counter value or 0
 */
CacheService.prototype.getCounter = async function(key) {
  if (!this.isAvailable()) return 0;

  try {
    const value = await this.client.get(key);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    logger.error('Cache getCounter error', { key, error: error.message });
    return 0;
  }
};

// Export singleton
module.exports = new CacheService();
