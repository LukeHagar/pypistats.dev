// Hardcoded Plausible configuration for public usage

// Self-hosted Plausible server base
export const PLAUSIBLE_BASE = 'https://events.plygrnd.org';

// Standard event endpoint derived from the unified base
export const PLAUSIBLE_EVENT_ENDPOINT = `${PLAUSIBLE_BASE}/api/event`;

// Public domain/site ID for this app
export const PLAUSIBLE_DOMAIN = 'pypistats.dev';

// Dev capture toggle (public) — default false; override via Vite define if needed
export const PLAUSIBLE_CAPTURE_LOCALHOST = false;


