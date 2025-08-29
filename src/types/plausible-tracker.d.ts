declare module '@plausible-analytics/tracker' {
	export function init(options: any): void;
	export const track: (name: string, options?: any) => void;
}


