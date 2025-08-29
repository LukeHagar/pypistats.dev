import { PLAUSIBLE_DOMAIN as PUBLIC_DOMAIN, PLAUSIBLE_EVENT_ENDPOINT } from '$lib/plausible-config.js';


type TrackProps = Record<string, string | number | boolean | null | undefined>;

function getEnv(name: string, fallback: string = ''): string {
	const v = process.env[name];
	return typeof v === 'string' && v.trim() !== '' ? v : fallback;
}

function buildEventUrl(pathname: string): string {
	const siteBase = 'https://pypistats.dev';
	return `${siteBase}${pathname}`;
}

export function trackApiEvent(
	name: string,
	pathname: string,
	props: TrackProps = {},
	requestHeaders?: Headers
): void {
	const endpoint = PLAUSIBLE_EVENT_ENDPOINT;
	const domain = PUBLIC_DOMAIN;
	if (!domain) return;

	const url = endpoint;
	const body = {
		name,
		url: buildEventUrl(pathname),
		domain,
		props
	} as any;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	const apiKey = getEnv('PLAUSIBLE_API_KEY');
	if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

	const ua = requestHeaders?.get('user-agent');
	if (ua) headers['User-Agent'] = ua;

	const ip =
		requestHeaders?.get('x-forwarded-for') ||
		requestHeaders?.get('x-real-ip') ||
		'';
	if (ip) headers['X-Forwarded-For'] = ip;

	// Fire-and-forget; never throw or await
	void fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
		.then(() => {})
		.catch(() => {});
}


