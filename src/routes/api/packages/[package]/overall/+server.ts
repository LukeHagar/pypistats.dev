import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getOverallDownloads } from "$lib/api.js";
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
	const mirrors = url.searchParams.get("mirrors");

	const rl = await rateLimit(event, "api:overall", 300, 3600);
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
		const downloads = await getOverallDownloads(
			packageName,
			mirrors || undefined,
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

		const response = {
			package: packageName,
			type: "overall_downloads",
			data: downloads.map((r) => ({
				date: r.date,
				category: r.category,
				downloads: r.downloads,
			})),
		};

		trackApiEvent(
			"api_overall",
			`/api/packages/${encodeURIComponent(packageName)}/overall`,
			{
				package: packageName,
				mirrors: String(mirrors ?? ""),
				ok: true,
			},
			request.headers,
		);
		return json(response, { headers: rl.headers });
	} catch (error) {
		console.error("Error fetching overall downloads:", error);
		trackApiEvent(
			"api_overall",
			`/api/packages/${encodeURIComponent(packageName)}/overall`,
			{
				package: packageName,
				mirrors: String(mirrors ?? ""),
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
