export type PackageNameResult =
	| { ok: true; name: string }
	| { ok: false; reason: string };

/**
 * Normalize user-provided package identifiers into a canonical form used by this app.
 * - Converts dots/underscores to hyphens (common normalization used across routes here).
 * - Lowercases.
 * - Trims whitespace.
 */
export function normalizePackageName(input: string): string {
	return (input || '').trim().toLowerCase().replace(/\./g, '-').replace(/_/g, '-');
}

export function validatePackageName(name: string): PackageNameResult {
	const n = normalizePackageName(name);
	if (!n) return { ok: false, reason: 'empty' };
	if (n === '__all__') return { ok: false, reason: 'reserved' };
	// Conservative validation: allow typical PyPI project name chars after normalization.
	if (!/^[a-z0-9][a-z0-9-]*$/.test(n)) return { ok: false, reason: 'invalid_chars' };
	return { ok: true, name: n };
}


