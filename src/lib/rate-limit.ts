import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/redis.js';

function getClientIp(event: RequestEvent): string {
	const xfwd = event.request.headers.get('x-forwarded-for') || '';
	if (xfwd) {
		// take first IP in list
		return xfwd.split(',')[0]?.trim() || 'unknown';
	}
	return event.request.headers.get('x-real-ip') || 'unknown';
}

export type RateLimitResult =
	| { limited: false; headers: Record<string, string> }
	| { limited: true; headers: Record<string, string>; retryAfterSeconds: number };

/**
 * Fixed-window rate limit backed by Redis.
 * If Redis is unavailable, it fails open (no rate limiting).
 */
export async function rateLimit(
	event: RequestEvent,
	scope: string,
	limit: number,
	windowSeconds: number
): Promise<RateLimitResult> {
	const client = getRedisClient();
	if (!client) {
		return { limited: false, headers: {} };
	}

	const ip = getClientIp(event);
	const key = `pypistats:rl:${scope}:${ip}`;

	try {
		const current = Number(await client.incr(key));
		if (current === 1) {
			await client.expire(key, windowSeconds);
		}
		const ttl = Number(await client.ttl(key));
		const retryAfterSeconds = ttl >= 0 ? ttl : windowSeconds;
		const remaining = Math.max(0, limit - current);

		const headers: Record<string, string> = {
			'X-RateLimit-Limit': String(limit),
			'X-RateLimit-Remaining': String(remaining),
			'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfterSeconds),
			'Retry-After': String(retryAfterSeconds)
		};

		if (current > limit) {
			return { limited: true, headers, retryAfterSeconds };
		}
		return { limited: false, headers };
	} catch {
		// If Redis errors, fail open (don’t take the API down).
		return { limited: false, headers: {} };
	}
}


