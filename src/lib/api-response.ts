import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export type ApiErrorBody = {
	error: {
		code: string;
		message: string;
		requestId?: string;
	};
};

function getRequestId(event: RequestEvent): string | undefined {
	return event.locals?.requestId;
}

function mergeHeaders(
	...parts: Array<Record<string, string> | undefined>
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const p of parts) {
		if (!p) continue;
		for (const [k, v] of Object.entries(p)) out[k] = v;
	}
	return out;
}

export function jsonOk<T>(
	event: RequestEvent,
	body: T,
	options?: { headers?: Record<string, string>; status?: number },
) {
	const requestId = getRequestId(event);
	const headers = mergeHeaders(options?.headers);
	if (requestId) headers["X-Request-Id"] = requestId;
	return json(body, { status: options?.status ?? 200, headers });
}

export function jsonError(
	event: RequestEvent,
	status: number,
	code: string,
	message: string,
	headers?: Record<string, string>,
) {
	const requestId = getRequestId(event);
	const body: ApiErrorBody = {
		error: {
			code,
			message,
			...(requestId ? { requestId } : {}),
		},
	};

	return json(body, {
		status,
		headers: mergeHeaders(
			headers,
			requestId ? { "X-Request-Id": requestId } : undefined,
		),
	});
}
