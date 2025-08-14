import { closeRedisClient, forceDisconnectRedis, getRedisClient } from '$lib/redis.js';
import type { Handle } from '@sveltejs/kit';

// Minimal server hooks without cron
if (typeof process !== 'undefined') {
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, closing connections...');
    await closeRedisClient();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT, closing connections...');
    await closeRedisClient();
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('🛑 Uncaught Exception:', error);
    await forceDisconnectRedis();
    process.exit(1);
  });
  
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('🛑 Unhandled Rejection at:', promise, 'reason:', reason);
    await forceDisconnectRedis();
    process.exit(1);
  });
}

// Sliding window rate limit parameters
const WINDOW_SECONDS = 60; // 1 minute
const MAX_REQUESTS = 300; // per id per window

async function consumeSlidingWindow(key: string, points: number, windowSeconds: number) {
  const client = getRedisClient();
  if (!client) return { allowed: true, remaining: MAX_REQUESTS };
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const listKey = `rl:sw:${key}`;

  // Remove old entries and push current
  const lua = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local points = tonumber(ARGV[3])
    local limit = tonumber(ARGV[4])
    -- Trim old timestamps
    redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
    -- Add current request timestamps (as single timestamp repeated 'points' times)
    for i=1,points do
      redis.call('ZADD', key, now, now .. '-' .. i)
    end
    local count = redis.call('ZCARD', key)
    -- Set expiry just beyond window
    redis.call('EXPIRE', key, windowStart + (60*60*24) == 0 and 60 or math.floor((now - windowStart)/1000) + 5)
    return count
  `;
  const count = (await client.eval(lua, {
    keys: [listKey],
    arguments: [String(now), String(windowStart), String(points), String(MAX_REQUESTS)]
  })) as number;
  return { allowed: count <= MAX_REQUESTS, remaining: Math.max(0, MAX_REQUESTS - count) };
}

export const handle: Handle = async ({ event, resolve }) => {
  // Only apply to API routes
  if (event.url.pathname.startsWith('/api/')) {
    // Identify client by IP (or forwarded-for)
    const ip = (event.getClientAddress?.() || event.request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const key = `ip:${ip}`;
    const result = await consumeSlidingWindow(key, 1, WINDOW_SECONDS);
    if (!result.allowed) {
      const reset = WINDOW_SECONDS; // approximate
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(reset),
          'RateLimit-Policy': `${MAX_REQUESTS};w=${WINDOW_SECONDS}`,
          'RateLimit-Remaining': '0'
        }
      });
    }
  }
  return resolve(event);
};