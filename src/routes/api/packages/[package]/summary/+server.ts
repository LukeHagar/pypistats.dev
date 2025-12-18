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

	const rl = await rateLimit(event, "api:summary", 300, 3600);
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

		const [overallAll, systemAll, pyMajorAll, pyMinorAll] = await Promise.all([
			prisma.overallDownloadCount.groupBy({
				by: ["category"],
				where: { package: packageName },
				_sum: { downloads: true },
			}),
			prisma.systemDownloadCount.groupBy({
				by: ["category"],
				where: { package: packageName },
				_sum: { downloads: true },
			}),
			prisma.pythonMajorDownloadCount.groupBy({
				by: ["category"],
				where: { package: packageName },
				_sum: { downloads: true },
			}),
			prisma.pythonMinorDownloadCount.groupBy({
				by: ["category"],
				where: { package: packageName },
				_sum: { downloads: true },
			}),
		]);

		const overallTotal = overallAll.reduce(
			(sum, r) => sum + Number(r._sum.downloads || 0),
			0,
		);
		const systemTotals = Object.fromEntries(
			systemAll.map((r) => [r.category, Number(r._sum.downloads || 0)]),
		);
		const pythonMajorTotals = Object.fromEntries(
			pyMajorAll.map((r) => [r.category, Number(r._sum.downloads || 0)]),
		);
		const pythonMinorTotals = Object.fromEntries(
			pyMinorAll.map((r) => [r.category, Number(r._sum.downloads || 0)]),
		);

		trackApiEvent(
			"api_summary",
			`/api/packages/${encodeURIComponent(packageName)}/summary`,
			{
				package: packageName,
				ok: true,
			},
			request.headers,
		);
		return json(
			{
				package: packageName,
				type: "summary",
				totals: {
					overall: overallTotal,
					system: systemTotals,
					python_major: pythonMajorTotals,
					python_minor: pythonMinorTotals,
				},
			},
			{ headers: rl.headers },
		);
	} catch (error) {
		console.error("Error building package summary:", error);
		trackApiEvent(
			"api_summary",
			`/api/packages/${encodeURIComponent(packageName)}/summary`,
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
