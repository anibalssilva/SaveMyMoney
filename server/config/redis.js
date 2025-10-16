const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

function initRedis() {
  // Skip Redis if not configured
  if (!process.env.REDIS_URL) {
    logger.warn('Redis URL not configured, caching disabled');
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return null;
  }
}

class CacheService {
  constructor() {
    this.client = redisClient;
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (!this.client) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.client) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async del(key) {
    if (!this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   * @param {string} pattern
   * @returns {Promise<number>}
   */
  async delPattern(pattern) {
    if (!this.client) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      const pipeline = this.client.pipeline();
      keys.forEach(key => pipeline.del(key));
      await pipeline.exec();

      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    if (!this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   * @param {string} key
   * @param {number} seconds
   * @returns {Promise<boolean>}
   */
  async expire(key, seconds) {
    if (!this.client) return false;

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Flush all cache
   * @returns {Promise<boolean>}
   */
  async flushAll() {
    if (!this.client) return false;

    try {
      await this.client.flushall();
      logger.info('Redis cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Cache middleware for Express routes
   * @param {number} ttl - Time to live in seconds
   * @returns {Function}
   */
  middleware(ttl = this.defaultTTL) {
    return async (req, res, next) => {
      if (!this.client) return next();

      // Only cache GET requests
      if (req.method !== 'GET') return next();

      const key = `cache:${req.originalUrl}`;

      try {
        const cached = await this.get(key);

        if (cached) {
          logger.debug(`Cache hit for ${req.originalUrl}`);
          return res.json(cached);
        }

        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json
        res.json = (data) => {
          // Cache the response
          this.set(key, data, ttl).catch(err =>
            logger.error('Failed to cache response:', err)
          );

          // Call original json
          return originalJson(data);
        };

        next();
      } catch (error) {
        logger.error('Cache middleware error:', error);
        next();
      }
    };
  }
}

// Initialize Redis
initRedis();

// Export cache service
module.exports = new CacheService();
