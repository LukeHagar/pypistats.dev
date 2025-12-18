import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/prisma.js";
import { ensurePackageFreshnessFor } from "$lib/api.js";
import { trackApiEvent } from "$lib/analytics.js";
import { rateLimit } from "$lib/rate-limit.js";
import { jsonError } from "$lib/api-response.js";
import { validatePackageName } from "$lib/package-name.js";

export const GET: RequestHandler = async (event) => {
	const { params, request } = event;
	const parsed = validatePackageName(params.package || "");
	if (!parsed.ok) {
		return jsonError(event, 400, "invalid_package", "Invalid package name");
	}
	const packageName = parsed.name;

	const rl = await rateLimit(event, "api:installer", 300, 3600);
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
		await ensurePackageFreshnessFor(packageName);

		const rows = await prisma.installerDownloadCount.findMany({
			where: { package: packageName },
			orderBy: { date: "asc" },
		});

		const response = {
			package: packageName,
			type: "installer_downloads",
			data: rows.map((r) => ({
				date: r.date,
				category: r.category,
				downloads: r.downloads,
			})),
		};
		trackApiEvent(
			"api_installer",
			`/api/packages/${encodeURIComponent(packageName)}/installer`,
			{
				package: packageName,
				ok: true,
			},
			request.headers,
		);
		return json(response, { headers: rl.headers });
	} catch (error) {
		console.error("Error fetching installer downloads:", error);
		trackApiEvent(
			"api_installer",
			`/api/packages/${encodeURIComponent(packageName)}/installer`,
			{
				package: packageName,
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
