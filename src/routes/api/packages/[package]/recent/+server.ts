import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getRecentDownloads } from "$lib/api.js";
import { RECENT_CATEGORIES } from "$lib/database.js";
import { trackApiEvent } from "$lib/analytics.js";
import { rateLimit } from "$lib/rate-limit.js";
import { jsonError } from "$lib/api-response.js";
import { validatePackageName } from "$lib/package-name.js";

export const GET: RequestHandler = async (event) => {
	const { params, url, request } = event;
	const parsed = validatePackageName(params.package || "");
	if (!parsed.ok) {
		return jsonError(event, 400, "invalid_package", "Invalid package name");
	}
	const packageName = parsed.name;
	const category = url.searchParams.get("period");

	const rl = await rateLimit(event, "api:recent", 300, 3600);
	if (rl.limited) {
		return jsonError(
			event,
			429,
			"rate_limited",
			"Too many requests. Please try again later.",
			rl.headers,
		);
	}

	try {
		const downloads = await getRecentDownloads(
			packageName,
			category || undefined,
		);

		if (downloads.length === 0) {
			return jsonError(
				event,
				404,
				"not_found",
				"Package not found",
				rl.headers,
			);
		}

		const response: {
			package: string;
			type: "recent_downloads";
			data: Record<string, number | bigint>;
		} = {
			package: packageName,
			type: "recent_downloads",
			data: {},
		};

		if (category) response.data[`last_${category}`] = 0;
		else {
			response.data[`last_${RECENT_CATEGORIES[0]}`] = 0;
			response.data[`last_${RECENT_CATEGORIES[1]}`] = 0;
			response.data[`last_${RECENT_CATEGORIES[2]}`] = 0;
		}

		for (const download of downloads) {
			response.data[`last_${download.category}`] = download.downloads;
		}

		trackApiEvent(
			"api_recent",
			`/api/packages/${encodeURIComponent(packageName)}/recent`,
			{
				package: packageName,
				period: String(category ?? ""),
				ok: true,
			},
			request.headers,
		);
		return json(response, { headers: rl.headers });
	} catch (error) {
		console.error("Error fetching recent downloads:", error);
		trackApiEvent(
			"api_recent",
			`/api/packages/${encodeURIComponent(packageName)}/recent`,
			{
				package: packageName,
				period: String(category ?? ""),
				ok: false,
			},
			request.headers,
		);
		return jsonError(
			event,
			500,
			"internal_error",
			"Internal server error",
			rl.headers,
		);
	}
};
