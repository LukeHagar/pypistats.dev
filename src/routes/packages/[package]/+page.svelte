<script lang="ts">
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { PLAUSIBLE_DOMAIN, PLAUSIBLE_EVENT_ENDPOINT, PLAUSIBLE_CAPTURE_LOCALHOST } from '$lib/plausible-config.js';
	import { MetaTags } from 'svelte-meta-tags';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	const { data }: { data: PageData } = $props();

	let overallCanvas: HTMLCanvasElement | null = $state(null);
	let pyMajorCanvas: HTMLCanvasElement | null = $state(null);
	let pyMinorCanvas: HTMLCanvasElement | null = $state(null);
	let systemCanvas: HTMLCanvasElement | null = $state(null);
	let charts: any[] = [];
	let installerCanvas: HTMLCanvasElement | null = $state(null);

	// Plausible: track package views
	let lastTrackedPackage: string = '';
	let plausibleInitDone: boolean = false;
	let plausibleTrack: ((name: string, options?: any) => void) | null = null;

	async function ensurePlausible() {
		if (plausibleInitDone && plausibleTrack) return;
		if (typeof window === 'undefined') return;
		const mod = await import('@plausible-analytics/tracker');
		const domain = PLAUSIBLE_DOMAIN || window.location.hostname;
		const endpoint = PLAUSIBLE_EVENT_ENDPOINT || undefined;
		mod.init({
			domain,
			endpoint,
			captureOnLocalhost: PLAUSIBLE_CAPTURE_LOCALHOST,
			logging: false,
			bindToWindow: false
		});
		plausibleTrack = mod.track;
		plausibleInitDone = true;
	}

	async function trackPackageView(pkg: string) {
		if (!pkg || lastTrackedPackage === pkg) return;
		if (typeof window === 'undefined') return;
		await ensurePlausible();
		if (!plausibleTrack) return;
		plausibleTrack('package_view', { props: { package: pkg } });
		lastTrackedPackage = pkg;
	}

	const numberFormatter = new Intl.NumberFormat(undefined);
	const compactFormatter = new Intl.NumberFormat(undefined, {
		notation: 'compact',
		maximumFractionDigits: 1
	});
	function formatNumber(n: number) {
		try {
			return numberFormatter.format(n);
		} catch {
			return String(n);
		}
	}
	function formatCompact(n: number) {
		try {
			return compactFormatter.format(n);
		} catch {
			return String(n);
		}
	}

	// API endpoints for quick links
	const apiEndpoints = [
		{ label: 'Recent downloads', path: 'recent' },
		{ label: 'Overall downloads', path: 'overall' },
		{ label: 'Python major versions', path: 'python_major' },
		{ label: 'Python minor versions', path: 'python_minor' },
		{ label: 'System downloads', path: 'system' },
		{ label: 'Installer breakdown', path: 'installer' },
		{ label: 'Summary totals', path: 'summary' }
	];

	function endpointUrl(path: string): string {
		return `https://pypistats.dev/api/packages/${encodeURIComponent(data.packageName)}/${path}`;
	}

	// Streaming handled with {#await} blocks below

	// Build combined Python versions rows reactively
	type PythonRow = { kind: 'major' | 'minor'; label: string; downloads: number };
	function buildPythonVersionRows(
		pyMajorTotalsMap: Record<string, number>,
		pyMinorTotalsMap: Record<string, number>
	): PythonRow[] {
		const rows: PythonRow[] = [];
		const majorOrder = ['2', '3', 'unknown'];
		for (const major of majorOrder) {
			const majorDownloads = Number(pyMajorTotalsMap[major] || 0);
			if (majorDownloads > 0 || major in pyMajorTotalsMap) {
				rows.push({ kind: 'major', label: major, downloads: majorDownloads });
				// Only show minor breakdown for known major versions.
				if (major !== 'unknown') {
					const minors: Array<[string, number]> = Object.entries(pyMinorTotalsMap)
						.filter(([k]) => k.startsWith(major + '.'))
						.map(([k, v]) => [k, Number(v)]);
					minors.sort((a, b) => {
						const ak = parseFloat(a[0].split('.')[1] || '0');
						const bk = parseFloat(b[0].split('.')[1] || '0');
						return ak - bk;
					});
					for (const [minor, dls] of minors) rows.push({ kind: 'minor', label: minor, downloads: dls });
				}
			}
		}
		return rows;
	}

	async function loadAndRenderChart(
		canvas: HTMLCanvasElement | null,
		type: string,
		params: Record<string, string> = {}
	) {
		if (!canvas) return;

		const resolveCssColor = (variable: string, fallback: string): string => {
			if (typeof window === 'undefined') return fallback;
			const el = document.createElement('span');
			el.style.color = `var(${variable})`;
			el.style.position = 'absolute';
			el.style.left = '-9999px';
			document.body.appendChild(el);
			const color = getComputedStyle(el).color || fallback;
			el.remove();
			return color;
		};

		const resolveCssBg = (variable: string, fallback: string): string => {
			if (typeof window === 'undefined') return fallback;
			const el = document.createElement('span');
			el.style.backgroundColor = `var(${variable})`;
			el.style.position = 'absolute';
			el.style.left = '-9999px';
			document.body.appendChild(el);
			const color = getComputedStyle(el).backgroundColor || fallback;
			el.remove();
			return color;
		};

		const chartText = resolveCssColor('--base-font-color-dark', 'rgb(229, 231, 235)');
		const chartGrid = resolveCssColor('--color-surface-200-800', 'rgba(255, 255, 255, 0.12)');
		const chartMuted = resolveCssColor('--color-surface-400-600', 'rgba(255, 255, 255, 0.7)');
		const tooltipBg = resolveCssBg('--color-surface-100-900', 'rgba(17, 24, 39, 0.95)');
		const qs = new URLSearchParams({ format: 'json', chart: 'line', ...params });
		const resp = await fetch(
			`/api/packages/${encodeURIComponent(data.packageName)}/chart/${type}?${qs.toString()}`
		);
		if (!resp.ok) return;
		const payload = await resp.json();
		const { default: Chart } = await import('chart.js/auto');
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const chart = new Chart(ctx, {
			type: (payload.chartType || 'line') as any,
			data: { labels: payload.labels, datasets: payload.datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				color: chartText,
				plugins: {
					legend: {
						position: 'bottom',
						labels: { color: chartText }
					},
					title: { display: true, text: payload.title, color: chartText },
					tooltip: {
						backgroundColor: tooltipBg,
						titleColor: chartText,
						bodyColor: chartText,
						callbacks: {
							label: (ctx: any) =>
								`${ctx.dataset.label}: ${formatNumber(Number(ctx.parsed?.y ?? ctx.raw?.y ?? 0))}`
						}
					}
				},
				scales: {
					x: {
						title: { display: true, text: 'Date' },
						ticks: {
							color: chartMuted,
							autoSkip: true,
							maxTicksLimit: 8,
							callback: (value: any, index: number, ticks: any[]) => {
								const label = (payload.labels?.[index] ?? '').toString();
								// Show MM/dd for compactness
								const d = new Date(label);
								if (!isNaN(d.getTime())) return `${d.getMonth() + 1}/${d.getDate()}`;
								return label;
							}
						},
						grid: { color: chartGrid }
					},
					y: {
						title: { display: true, text: 'Downloads', color: chartMuted },
						beginAtZero: true,
						ticks: {
							color: chartMuted,
							callback: (value: any) => formatCompact(Number(value))
						},
						grid: { color: chartGrid }
					}
				}
			}
		});
		charts.push(chart);
	}

	onMount(() => {
		// Track initial view
		if (data?.packageName) trackPackageView(data.packageName);

		loadAndRenderChart(overallCanvas, 'overall');
		requestAnimationFrame(() => {
			loadAndRenderChart(pyMajorCanvas, 'python_major');
			loadAndRenderChart(pyMinorCanvas, 'python_minor');
			loadAndRenderChart(systemCanvas, 'system');
			loadAndRenderChart(installerCanvas, 'installer');
		});
	});

	afterNavigate((nav) => {
		let url: URL;
		const maybe = (nav as any);
		if (maybe && maybe.to && maybe.to.url instanceof URL) {
			url = maybe.to.url as URL;
		} else {
			url = new URL(window.location.href);
		}
		const match = url.pathname.match(/^\/packages\/([^\/]+)/);
		const pkg = match?.[1] ? decodeURIComponent(match[1]) : '';
		if (pkg) void trackPackageView(pkg);
	});

	onDestroy(() => {
		for (const c of charts) {
			try {
				c.destroy();
			} catch {}
		}
		charts = [];
	});
</script>

<MetaTags
	title="Python Package Download Statistics - PyPI Stats"
	description="View comprehensive download statistics for Python packages from PyPI. Track package popularity, Python version usage, system breakdowns, and download trends."
	keywords={["Python package statistics", "PyPI downloads", "package analytics", "download trends", "Python version usage", "system breakdown"]}
/>

<div class="py-12">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">{data.packageName}</h1>
		<p class="mt-1 text-sm text-[var(--color-surface-400-600)]">Download statistics from PyPI</p>

		{#if data.meta}
			{#await data.meta}
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					<Skeleton w="w-28" h="h-6" class="inline-block" rounded="full" />
					<Skeleton w="w-36" h="h-6" class="inline-block" rounded="full" />
				</div>
			{:then meta}
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					{#if meta.version}
						<Badge variant="primary">v{meta.version}</Badge>
					{/if}
					{#if meta.latestReleaseDate}
						<Badge variant="success">Released {meta.latestReleaseDate}</Badge>
					{/if}
				</div>
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					{#if data.summaryTotals}
						{#await data.summaryTotals then totals}
							{#if totals?.system}
								{#await Promise.resolve(Object.entries(totals.system).sort((a, b) => Number(b[1]) - Number(a[1]))[0]) then topSys}
									{#if topSys}
										<Badge variant="secondary">Popular system: {topSys[0]}</Badge>
									{/if}
								{/await}
							{/if}
						{/await}
					{/if}
					{#if data.summaryTotals}
						{#await data.summaryTotals then totals}
							{#if totals?.installer}
								{#await Promise.resolve(Object.entries(totals.installer).sort((a, b) => Number(b[1]) - Number(a[1]))[0]) then topInst}
									{#if topInst}
										<Badge variant="secondary">Popular installer: {topInst[0]}</Badge>
									{/if}
								{/await}
							{/if}
						{/await}
					{/if}
					{#if data.summaryTotals}
						{#await data.summaryTotals then totals}
							{#if totals?.version}
								{#await Promise.resolve(Object.entries(totals.version).sort((a, b) => Number(b[1]) - Number(a[1]))[0]) then topVer}
									{#if topVer}
										<Badge variant="warning">Top version: {topVer[0]}</Badge>
									{/if}
								{/await}
							{/if}
						{/await}
					{/if}
				</div>
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					<Button href={meta.pypiUrl} target="_blank" rel="noopener" variant="surface" size="sm"
						>View on PyPI</Button
					>
					{#if meta.homePage}
						<Button href={meta.homePage} target="_blank" rel="noopener" variant="surface" size="sm"
							>Homepage</Button
						>
					{/if}
					{#if meta.projectUrls}
						{#each Object.entries(meta.projectUrls).filter(([label, url]) => !['homepage'].includes(label.toLowerCase())) as [label, url]}
							{#if typeof url === 'string'}
								<Button href={url} target="_blank" rel="noopener" variant="surface" size="sm"
									>{label}</Button
								>
							{/if}
						{/each}
					{/if}
				</div>
			{/await}
		{/if}
	</div>

	<!-- Recent Stats + Consolidated Totals -->
	{#if data.recentStats}
		<Card class="mb-8" padding="none">
			<div class="p-6">
				<h2 class="text-lg font-semibold">Recent Downloads</h2>
				<p class="mt-1 text-sm text-[var(--color-surface-400-600)]">Recent + overall breakdowns</p>
			</div>
			<div class="px-6 pb-6">
				<div class="flex flex-wrap gap-6">
					<div class="max-w-full min-w-[280px] flex-1 grow">
						<h4 class="mb-2 text-sm font-semibold text-[var(--color-surface-50-950)]">Recent</h4>
						{#await data.recentStats}
							<SkeletonTable cols={2} rows={2} />
						{:then rs}
							<div class="table-wrap">
								<table class="table">
									<thead>
										<tr>
											<th>Period</th>
											<th class="text-right">Downloads</th>
										</tr>
									</thead>
									<tbody>
										{#each [['week', Number((rs as any)?.last_week || 0)], ['month', Number((rs as any)?.last_month || 0)]] as [period, count]}
											<tr>
												<td class="capitalize">{period}</td>
												<td class="text-right font-semibold">{formatNumber(Number(count))}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:catch _}
							<div class="text-sm text-[var(--color-error-400)]">Failed to load</div>
						{/await}
					</div>
					<div class="max-w-full min-w-[280px] flex-1 grow">
						<h4 class="mb-2 text-sm font-semibold text-[var(--color-surface-50-950)]">Overall</h4>
						{#await (data as any).summaryTotals}
							<SkeletonTable cols={2} rows={6} />
						{:then totals}
							<div class="table-wrap">
								<table class="table">
									<thead>
										<tr>
											<th>Category</th>
											<th class="text-right">Downloads</th>
										</tr>
									</thead>
									<tbody>
										{#each Object.entries(totals?.overall || {}).sort((a, b) => Number(b[1]) - Number(a[1])) as [k, v]}
											<tr>
												<td class="capitalize">{k.replace(/_/g, ' ')}</td>
												<td class="text-right font-semibold">{formatNumber(Number(v))}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:catch _}
							<div class="text-sm text-[var(--color-error-400)]">Failed to load</div>
						{/await}
					</div>
					<div class="max-w-full min-w-[280px] flex-1 grow">
						<h4 class="mb-2 text-sm font-semibold text-[var(--color-surface-50-950)]">Systems</h4>
						{#await (data as any).summaryTotals}
							<SkeletonTable cols={2} rows={6} />
						{:then totals}
							<div class="table-wrap">
								<table class="table">
									<thead>
										<tr>
											<th>System</th>
											<th class="text-right">Downloads</th>
										</tr>
									</thead>
									<tbody>
										{#each Object.entries(totals?.system || {}).sort((a, b) => Number(b[1]) - Number(a[1])) as [k, v]}
											<tr>
												<td class="capitalize">{k}</td>
												<td class="text-right font-semibold">{formatNumber(Number(v))}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:catch _}
							<div class="text-sm text-[var(--color-error-400)]">Failed to load</div>
						{/await}
					</div>
				</div>

				<div class="mt-8">
					<h3 class="mb-2 text-md font-semibold">Python Versions</h3>
					{#await (data as any).summaryTotals}
						<SkeletonTable cols={2} rows={8} />
					{:then totals}
						<div class="table-wrap">
							<table class="table">
								<thead>
									<tr>
										<th>Version</th>
										<th class="text-right">Downloads</th>
									</tr>
								</thead>
								<tbody>
									{#each buildPythonVersionRows(totals?.python_major || {}, totals?.python_minor || {}) as row}
										<tr class={row.kind === 'major' ? 'bg-[var(--color-surface-100-900)]' : ''}>
											<td class="capitalize">
												{#if row.kind === 'major'}
													Python {row.label}
												{:else}
													<span class="inline-block pl-6">{row.label}</span>
												{/if}
											</td>
											<td class="text-right font-semibold">{formatNumber(row.downloads)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:catch _}
						<div class="text-sm text-[var(--color-error-400)]">Failed to load</div>
					{/await}
				</div>
			</div>
		</Card>
	{/if}

	<!-- Charts -->
	{#if data.packageName}
		<Card class="mb-8" padding="none">
			<div class="p-6">
				<h2 class="text-lg font-semibold">Overall Downloads Over Time</h2>
				<p class="mt-1 text-sm text-[var(--color-surface-400-600)]">Includes with and without mirrors</p>
			</div>
			<div class="px-6 pb-6">
				<div class="w-full overflow-x-auto">
					<div class="relative h-96 w-full">
						<canvas bind:this={overallCanvas}></canvas>
					</div>
				</div>
			</div>
		</Card>

		{#await data.pythonMajorStats}
			<Card class="mb-8" padding="none">
				<div class="p-6">
					<h2 class="text-lg font-semibold">Python Major Versions</h2>
				</div>
				<div class="px-6 pb-6">
					<Skeleton h="h-96" />
				</div>
			</Card>
		{:then majorArr}
			{#if majorArr && majorArr.length > 0}
				<Card class="mb-8" padding="none">
					<div class="p-6">
						<h2 class="text-lg font-semibold">Python Major Versions</h2>
					</div>
					<div class="px-6 pb-6">
						<div class="w-full overflow-x-auto">
							<div class="relative h-96 w-full">
								<canvas bind:this={pyMajorCanvas}></canvas>
							</div>
						</div>
					</div>
				</Card>
			{/if}
		{/await}

		{#await data.pythonMinorStats}
			<Card class="mb-8" padding="none">
				<div class="p-6">
					<h2 class="text-lg font-semibold">Python Minor Versions</h2>
				</div>
				<div class="px-6 pb-6">
					<Skeleton h="h-96" />
				</div>
			</Card>
		{:then minorArr}
			{#if minorArr && minorArr.length > 0}
				<Card class="mb-8" padding="none">
					<div class="p-6">
						<h2 class="text-lg font-semibold">Python Minor Versions</h2>
					</div>
					<div class="px-6 pb-6">
						<div class="w-full overflow-x-auto">
							<div class="relative h-96 w-full">
								<canvas bind:this={pyMinorCanvas}></canvas>
							</div>
						</div>
					</div>
				</Card>
			{/if}
		{/await}

		{#await data.systemStats}
			<Card class="mb-8" padding="none">
				<div class="p-6">
					<h2 class="text-lg font-semibold">System Downloads</h2>
				</div>
				<div class="px-6 pb-6">
					<Skeleton h="h-96" />
				</div>
			</Card>
		{:then sysArr}
			{#if sysArr && sysArr.length > 0}
				<Card class="mb-8" padding="none">
					<div class="p-6">
						<h2 class="text-lg font-semibold">System Downloads</h2>
					</div>
					<div class="px-6 pb-6">
						<div class="w-full overflow-x-auto">
							<div class="relative h-96 w-full">
								<canvas bind:this={systemCanvas}></canvas>
							</div>
						</div>
					</div>
				</Card>
			{/if}
		{/await}

		{#await (data as any).summaryTotals}
			<Card class="mb-8" padding="none">
				<div class="p-6">
					<h2 class="text-lg font-semibold">Installer Breakdown</h2>
				</div>
				<div class="px-6 pb-6">
					<Skeleton h="h-96" />
				</div>
			</Card>
		{:then totals}
			{#if totals && totals.installer}
				<Card class="mb-8" padding="none">
					<div class="p-6">
						<h2 class="text-lg font-semibold">Installer Breakdown</h2>
					</div>
					<div class="px-6 pb-6">
						<div class="relative h-96 w-full">
							<canvas bind:this={installerCanvas}></canvas>
						</div>
					</div>
				</Card>
			{/if}
		{/await}
	{/if}

	<!-- API Links -->
	<Card>
		<h3 class="text-lg font-semibold">API Links</h3>
		<div class="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
			{#each apiEndpoints as ep}
				<Card padding="sm" class="flex items-center justify-between">
					<div class="min-w-0">
						<div class="truncate">{ep.label}</div>
						<a
							class="block truncate text-xs text-[var(--color-primary-500)]"
							href={endpointUrl(ep.path)}
							rel="noopener"
							target="_blank"
							>{endpointUrl(ep.path)}</a
						>
					</div>
					<div class="ml-3 shrink-0">
						<Button
							size="sm"
							onclick={() => navigator.clipboard?.writeText(endpointUrl(ep.path))}
							aria-label={`Copy ${ep.label} URL`}
						>
							Copy
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	</Card>
</div>
