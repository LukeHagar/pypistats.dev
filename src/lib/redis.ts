import { createClient } from 'redis';

// Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;
let isDisconnecting = false;

export function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  // Skip connecting if no REDIS_URL is provided (e.g., during build)
  if (!redisUrl) {
    if (typeof process !== 'undefined') {
      console.warn('Redis disabled: REDIS_URL not set');
    }
    return null;
  }

  if (!redisClient && !isConnecting) {
    isConnecting = true;
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      isConnecting = false;
    });

    redisClient.on('disconnect', () => {
      console.log('Redis Client Disconnected');
    });

    redisClient.on('end', () => {
      console.log('Redis Client Connection Ended');
      redisClient = null;
      isConnecting = false;
      isDisconnecting = false;
    });

    redisClient.connect().catch((error) => {
      console.error('Redis Client Connection Failed:', error);
      isConnecting = false;
    });
  }
  return redisClient;
}

/**
 * Close the Redis client connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient && !isDisconnecting) {
    isDisconnecting = true;
    try {
      console.log('Closing Redis client connection...');
      await redisClient.quit();
      console.log('Redis client connection closed successfully');
    } catch (error) {
      console.error('Error closing Redis client:', error);
    } finally {
      redisClient = null;
      isDisconnecting = false;
    }
  }
}

/**
 * Force disconnect the Redis client (for cleanup)
 */
export async function forceDisconnectRedis(): Promise<void> {
  if (redisClient && !isDisconnecting) {
    isDisconnecting = true;
    try {
      console.log('Force disconnecting Redis client...');
      await redisClient.disconnect();
      console.log('Redis client force disconnected');
    } catch (error) {
      console.error('Error force disconnecting Redis client:', error);
    } finally {
      redisClient = null;
      isDisconnecting = false;
    }
  }
}

// Cache utilities
export class CacheManager {
  private client = getRedisClient();
  private defaultTTL = 3600; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for get operation');
        return null;
      }
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for set operation');
        return;
      }
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for del operation');
        return;
      }
      await client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for exists operation');
        return false;
      }
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for flush operation');
        return;
      }
      await client.flushDb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }

  // Cache key generators
  static getPackageKey(packageName: string, type: string): string {
    return `pypistats:package:${packageName}:${type}`;
  }

  static getSearchKey(query: string): string {
    return `pypistats:search:${query}`;
  }

  static getPackageCountKey(): string {
    return 'pypistats:package_count';
  }

  static getRecentStatsKey(packageName: string): string {
    return `pypistats:recent:${packageName}`;
  }
}

/**
 * Distributed lock utilities backed by Redis
 */
export class LockManager {
  private client = getRedisClient();

  /**
   * Try to acquire a lock for a specific key. Returns a unique token if acquired, or null if not.
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for acquireLock');
        return null;
      }
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await client.set(key, token, { NX: true, EX: ttlSeconds });
      return result === 'OK' ? token : null;
    } catch (error) {
      console.error('Redis acquireLock error:', error);
      return null;
    }
  }

  /**
   * Release a lock only if the token matches
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for releaseLock');
        return false;
      }
      // Lua script to atomically check token and delete
      const lua = `
        if redis.call('get', KEYS[1]) == ARGV[1] then
          return redis.call('del', KEYS[1])
        else
          return 0
        end
      `;
      const res = (await client.eval(lua, {
        keys: [key],
        arguments: [token]
      })) as number;
      return res === 1;
    } catch (error) {
      console.error('Redis releaseLock error:', error);
      return false;
    }
  }

  /**
   * Convenience helper to run a function while holding a lock
   */
  async withLock<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T | null> {
    const token = await this.acquireLock(key, ttlSeconds);
    if (!token) return null;
    try {
      const result = await fn();
      return result;
    } finally {
      await this.releaseLock(key, token);
    }
  }
}

// Rate limiting utilities
export class RateLimiter {
  private client = getRedisClient();

  async isRateLimited(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for rate limiting');
        return false;
      }
      const current = await client.incr(key);
      if (current === 1) {
        await client.expire(key, window);
      }
      return current > limit;
    } catch (error) {
      console.error('Rate limiter error:', error);
      return false;
    }
  }

  async getRemainingRequests(key: string): Promise<number> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for remaining requests check');
        return 100;
      }
      const current = await client.get(key);
      return current ? Math.max(0, 100 - parseInt(current)) : 100; // Default limit of 100
    } catch (error) {
      console.error('Get remaining requests error:', error);
      return 100;
    }
  }
}

// Session management utilities
export class SessionManager {
  private client = getRedisClient();
  private defaultTTL = 86400; // 24 hours

  async setSession(sessionId: string, data: any): Promise<void> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for set session');
        return;
      }
      await client.setEx(sessionId, this.defaultTTL, JSON.stringify(data));
    } catch (error) {
      console.error('Set session error:', error);
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for get session');
        return null;
      }
      const data = await client.get(sessionId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for delete session');
        return;
      }
      await client.del(sessionId);
    } catch (error) {
      console.error('Delete session error:', error);
    }
  }

  async refreshSession(sessionId: string): Promise<void> {
    try {
      const client = this.client;
      if (!client) {
        console.warn('Redis client not available for refresh session');
        return;
      }
      const data = await client.get(sessionId);
      if (data) {
        await client.setEx(sessionId, this.defaultTTL, data);
      }
    } catch (error) {
      console.error('Refresh session error:', error);
    }
  }
} 