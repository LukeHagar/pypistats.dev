import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma.js';
import { getRedisClient } from '$lib/redis.js';

/**
 * Lightweight health endpoint for container orchestration.
 *
 * - Default: liveness only (always 200 if the server is running)
 * - Deep checks: GET /health?deep=1
 *   - validates DB and Redis connectivity and returns 503 if either fails
 */
export const GET: RequestHandler = async ({ url }) => {
	const deep = url.searchParams.get('deep') === '1';

	const base = {
		status: 'ok',
		time: new Date().toISOString()
	} as const;

	if (!deep) return json(base);

	const details: Record<string, any> = {};
	let ok = true;

	// DB check
	try {
		await prisma.$queryRaw`SELECT 1`;
		details.db = 'ok';
	} catch (e) {
		ok = false;
		details.db = 'error';
		details.dbError = (e as Error)?.message ?? String(e);
	}

	// Redis check
	try {
		const client = getRedisClient();
		if (!client) throw new Error('redis client not connected');
		const res = await client.ping();
		details.redis = res === 'PONG' ? 'ok' : 'unexpected';
		if (res !== 'PONG') ok = false;
	} catch (e) {
		ok = false;
		details.redis = 'error';
		details.redisError = (e as Error)?.message ?? String(e);
	}

	return json(
		{
			...base,
			status: ok ? 'ok' : 'degraded',
			...details
		},
		{ status: ok ? 200 : 503 }
	);
};


