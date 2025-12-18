import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getSystemDownloads } from "$lib/api.js";
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
	const os = url.searchParams.get("os");

	const rl = await rateLimit(event, "api:system", 300, 3600);
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
		const downloads = await getSystemDownloads(packageName, os || undefined);

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
			type: "system_downloads",
			data: downloads.map((r) => ({
				date: r.date,
				category: r.category,
				downloads: r.downloads,
			})),
		};
		trackApiEvent(
			"api_system",
			`/api/packages/${encodeURIComponent(packageName)}/system`,
			{
				package: packageName,
				os: String(os ?? ""),
				ok: true,
			},
			request.headers,
		);
		return json(response, { headers: rl.headers });
	} catch (error) {
		console.error("Error fetching system downloads:", error);
		trackApiEvent(
			"api_system",
			`/api/packages/${encodeURIComponent(packageName)}/system`,
			{
				package: packageName,
				os: String(os ?? ""),
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
