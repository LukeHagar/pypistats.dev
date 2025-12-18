import type { Handle, HandleServerError } from "@sveltejs/kit";
import { dev } from "$app/environment";

export const handle: Handle = async ({ event, resolve }) => {
	// Correlation ID for logs/debugging
	const requestId =
		// Bun/Node 18+ typically has crypto.randomUUID
		("randomUUID" in globalThis.crypto
			? globalThis.crypto.randomUUID()
			: undefined) ??
		`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
	event.locals.requestId = requestId;

	const response = await resolve(event);

	// Always include a request ID header for debugging/support
	response.headers.set("X-Request-Id", requestId);

	// ---- Security headers (safe defaults) ----
	// HSTS should only be set in production behind HTTPS.
	if (!dev) {
		response.headers.set(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains; preload",
		);
	}
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set(
		"Permissions-Policy",
		"geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()",
	);

	// ---- Cache defaults (only if handler didn’t already set them) ----
	if (!response.headers.has("Cache-Control")) {
		const { pathname } = event.url;
		const isApi = pathname.startsWith("/api/");
		const isOpenApi = pathname === "/openapi.yaml";
		const isHealth = pathname === "/health";

		if (isHealth) {
			response.headers.set("Cache-Control", "no-store");
		} else if (isOpenApi) {
			// route already sets this, but keep safe fallback
			response.headers.set("Cache-Control", "public, max-age=3600");
		} else if (isApi && event.request.method === "GET") {
			// Short shared cache; Redis is still the primary cache layer
			response.headers.set(
				"Cache-Control",
				"public, max-age=60, stale-while-revalidate=300",
			);
		} else {
			// Default for HTML and other dynamic content
			response.headers.set("Cache-Control", "no-store");
		}
	}

	return response;
};

export const handleError: HandleServerError = ({ error, event }) => {
	const requestId = event.locals?.requestId;
	const routeId = event.route?.id;
	const method = event.request.method;
	const url = event.url?.toString?.() ?? String(event.url);

	// Centralized error logging. Keep it short and avoid logging secrets.
	console.error("request_error", {
		requestId,
		routeId,
		method,
		url,
		message: error instanceof Error ? error.message : String(error),
	});

	// Expose a requestId to SvelteKit error pages (App.Error).
	return {
		message: "Unexpected error",
		requestId,
	};
};
