/**
 * Redis Distributed Cache - Session state and caching across Orchestra instances
 *
 * Provides:
 * - Distributed session storage
 * - Response caching with TTL
 * - Pub/Sub for cross-instance communication
 * - Automatic cleanup and expiration
 * - Cluster support
 */

import { createClient, RedisClientType } from 'redis';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  defaultTTL?: number;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl?: number;
  tags?: string[];
}

export interface SessionState {
  sessionId: string;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  files: string[];
  metrics: Record<string, any>;
}

export interface CacheStatistics {
  keys: number;
  memory: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Redis Distributed Cache Manager
 */
export class RedisCache {
  public readonly client: RedisClientType;
  private config: Required<RedisConfig>;
  private connected = false;
  private stats = { hits: 0, misses: 0 };

  constructor(config: RedisConfig = {}) {
    this.config = {
      url: config.url || `redis://${config.host || 'localhost'}:${config.port || 6379}`,
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password || '',
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'orchestra:',
      defaultTTL: config.defaultTTL || 3600, // 1 hour
    };

    this.client = createClient({
      url: this.config.url,
      password: this.config.password || undefined,
      database: this.config.db,
    });

    // Setup error handling
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      this.connected = true;
      console.log('Redis connected');
    });

    this.client.on('disconnect', () => {
      this.connected = false;
      console.warn('Redis disconnected');
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  /**
   * Generate full key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const serialized = JSON.stringify(value);

    if (ttl || this.config.defaultTTL) {
      await this.client.setEx(fullKey, ttl || this.config.defaultTTL, serialized);
    } else {
      await this.client.set(fullKey, serialized);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);
      const value = await this.client.get(fullKey);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    const result = await this.client.del(fullKey);
    return result > 0;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    const result = await this.client.exists(fullKey);
    return result > 0;
  }

  /**
   * Set multiple values
   */
  async mset(entries: CacheEntry[]): Promise<void> {
    const pipeline = this.client.multi();

    for (const entry of entries) {
      const fullKey = this.getKey(entry.key);
      const serialized = JSON.stringify(entry.value);
      const ttl = entry.ttl || this.config.defaultTTL;

      pipeline.setEx(fullKey, ttl, serialized);
    }

    await pipeline.exec();
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const fullKeys = keys.map(k => this.getKey(k));
    const values = await this.client.mGet(fullKeys);

    return values.map(v => {
      if (v === null) {
        this.stats.misses++;
        return null;
      }
      this.stats.hits++;
      return JSON.parse(v) as T;
    });
  }

  /**
   * Delete multiple keys
   */
  async delPattern(pattern: string): Promise<number> {
    const fullPattern = this.getKey(pattern);
    const keys = await this.client.keys(fullPattern);

    if (keys.length === 0) {
      return 0;
    }

    return await this.client.del(keys);
  }

  /**
   * Increment counter
   */
  async incr(key: string, amount = 1): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.client.incrBy(fullKey, amount);
  }

  /**
   * Decrement counter
   */
  async decr(key: string, amount = 1): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.client.decrBy(fullKey, amount);
  }

  /**
   * Get and set (atomic)
   */
  async getSet<T>(key: string, value: T): Promise<T | null> {
    const fullKey = this.getKey(key);
    const serialized = JSON.stringify(value);
    const oldValue = await this.client.getSet(fullKey, serialized);

    if (oldValue === null) {
      return null;
    }

    return JSON.parse(oldValue) as T;
  }

  /**
   * Set value if not exists
   */
  async setNX<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const fullKey = this.getKey(key);
    const serialized = JSON.stringify(value);

    const result = await this.client.set(fullKey, serialized, {
      NX: true,
      EX: ttl || this.config.defaultTTL,
    });

    return result === 'OK';
  }

  /**
   * Add item to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.client.sAdd(fullKey, members);
  }

  /**
   * Remove item from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.client.sRem(fullKey, members);
  }

  /**
   * Get all set members
   */
  async smembers(key: string): Promise<string[]> {
    const fullKey = this.getKey(key);
    return await this.client.sMembers(fullKey);
  }

  /**
   * Add to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.client.zAdd(fullKey, { score, value: member });
  }

  /**
   * Get range from sorted set
   */
  async zrange(key: string, start = 0, stop = -1): Promise<string[]> {
    const fullKey = this.getKey(key);
    return await this.client.zRange(fullKey, start, stop);
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: any): Promise<number> {
    const serialized = JSON.stringify(message);
    return await this.client.publish(channel, serialized);
  }

  /**
   * Subscribe to channel
   */
  async subscribe(
    channel: string,
    callback: (message: any) => void | Promise<void>
  ): Promise<void> {
    const subscriber = this.client.duplicate();

    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        callback(parsed);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStatistics> {
    if (!this.connected) {
      return {
        keys: 0,
        memory: 0,
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: 0,
      };
    }

    const info = await this.client.info('stats');
    const keyspace = await this.client.info('keyspace');

    const keysMatch = keyspace.match(/keys=(\d+)/);
    const memoryMatch = info.match(/used_memory_human:(.+)/);

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      keys: keysMatch ? parseInt(keysMatch[1]) : 0,
      memory: memoryMatch ? memoryMatch[1] as any : 0,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Flush all Orchestra keys (not entire database)
   */
  async flush(): Promise<number> {
    const pattern = this.getKey('*');
    const keys = await this.client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    return await this.client.del(keys);
  }

  /**
   * Clear cache statistics
   */
  clearStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }
}

/**
 * Session Cache - Specialized cache for Orchestra sessions
 */
export class SessionCache {
  private cache: RedisCache;
  private readonly SESSION_PREFIX = 'session:';
  private readonly LOCK_PREFIX = 'lock:';

  constructor(cache: RedisCache) {
    this.cache = cache;
  }

  /**
   * Save session state
   */
  async saveSession(session: SessionState, ttl = 86400): Promise<void> {
    const key = `${this.SESSION_PREFIX}${session.sessionId}`;
    await this.cache.set(key, session, ttl);
  }

  /**
   * Load session state
   */
  async loadSession(sessionId: string): Promise<SessionState | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    return await this.cache.get<SessionState>(key);
  }

  /**
   * Update session status
   */
  async updateStatus(
    sessionId: string,
    status: SessionState['status']
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (session) {
      session.status = status;
      await this.saveSession(session);
    }
  }

  /**
   * Add file to session
   */
  async addFile(sessionId: string, file: string): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (session) {
      if (!session.files.includes(file)) {
        session.files.push(file);
      }
      await this.saveSession(session);
    }
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<SessionState[]> {
    const pattern = `${this.SESSION_PREFIX}*`;
    const keys = await this.cache.client.keys(this.cache['getKey'](pattern));

    const sessions: SessionState[] = [];
    for (const key of keys) {
      const value = await this.cache.client.get(key);
      if (value) {
        const session = JSON.parse(value) as SessionState;
        if (session.status === 'in_progress' || session.status === 'pending') {
          sessions.push(session);
        }
      }
    }

    return sessions;
  }

  /**
   * Acquire lock for session
   */
  async acquireLock(
    sessionId: string,
    ttl = 300
  ): Promise<boolean> {
    const key = `${this.LOCK_PREFIX}${sessionId}`;
    return await this.cache.setNX(key, { locked: Date.now() }, ttl);
  }

  /**
   * Release lock for session
   */
  async releaseLock(sessionId: string): Promise<boolean> {
    const key = `${this.LOCK_PREFIX}${sessionId}`;
    return await this.cache.del(key);
  }

  /**
   * Check if session is locked
   */
  async isLocked(sessionId: string): Promise<boolean> {
    const key = `${this.LOCK_PREFIX}${sessionId}`;
    return await this.cache.exists(key);
  }
}

/**
 * Response Cache - Cache AI responses
 */
export class ResponseCache {
  private cache: RedisCache;
  private readonly RESPONSE_PREFIX = 'response:';

  constructor(cache: RedisCache) {
    this.cache = cache;
  }

  /**
   * Cache response
   */
  async cacheResponse(
    prompt: string,
    adapter: string,
    response: string,
    ttl = 7200
  ): Promise<void> {
    const key = this.generateKey(prompt, adapter);
    await this.cache.set(key, { prompt, adapter, response, cached: Date.now() }, ttl);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(prompt: string, adapter: string): Promise<string | null> {
    const key = this.generateKey(prompt, adapter);
    const cached = await this.cache.get<any>(key);

    return cached?.response || null;
  }

  /**
   * Invalidate cache for adapter
   */
  async invalidateAdapter(adapter: string): Promise<number> {
    const pattern = `${this.RESPONSE_PREFIX}${adapter}:*`;
    return await this.cache.delPattern(pattern);
  }

  /**
   * Generate cache key
   */
  private generateKey(prompt: string, adapter: string): string {
    // Simple hash of prompt for key
    const hash = Buffer.from(prompt).toString('base64').substring(0, 32);
    return `${this.RESPONSE_PREFIX}${adapter}:${hash}`;
  }
}

/**
 * Create Redis cache from environment variables
 */
export function createRedisFromEnv(): RedisCache | null {
  const url = process.env.REDIS_URL;

  if (!url && !process.env.REDIS_HOST) {
    return null;
  }

  return new RedisCache({
    url,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
    keyPrefix: process.env.REDIS_KEY_PREFIX,
    defaultTTL: process.env.REDIS_DEFAULT_TTL ? parseInt(process.env.REDIS_DEFAULT_TTL) : undefined,
  });
}

// Singleton instance
let redisCacheInstance: RedisCache | null = null;
let sessionCacheInstance: SessionCache | null = null;
let responseCacheInstance: ResponseCache | null = null;

export async function getRedisCache(): Promise<RedisCache> {
  if (!redisCacheInstance) {
    redisCacheInstance = createRedisFromEnv() || new RedisCache();
    await redisCacheInstance.connect();
  }
  return redisCacheInstance;
}

export async function getSessionCache(): Promise<SessionCache> {
  if (!sessionCacheInstance) {
    const cache = await getRedisCache();
    sessionCacheInstance = new SessionCache(cache);
  }
  return sessionCacheInstance;
}

export async function getResponseCache(): Promise<ResponseCache> {
  if (!responseCacheInstance) {
    const cache = await getRedisCache();
    responseCacheInstance = new ResponseCache(cache);
  }
  return responseCacheInstance;
}
