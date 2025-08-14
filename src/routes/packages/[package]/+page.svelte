<script lang="ts">
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	const { data }: { data: PageData } = $props();

	let overallCanvas: HTMLCanvasElement | null = $state(null);
	let pyMajorCanvas: HTMLCanvasElement | null = $state(null);
	let pyMinorCanvas: HTMLCanvasElement | null = $state(null);
	let systemCanvas: HTMLCanvasElement | null = $state(null);
	let charts: any[] = [];
	let installerCanvas: HTMLCanvasElement | null = $state(null);

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
		return `/api/packages/${encodeURIComponent(data.packageName)}/${path}`;
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
				plugins: {
					legend: { position: 'bottom' },
					title: { display: true, text: payload.title },
					tooltip: {
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
							autoSkip: true,
							maxTicksLimit: 8,
							callback: (value: any, index: number, ticks: any[]) => {
								const label = (payload.labels?.[index] ?? '').toString();
								// Show MM/dd for compactness
								const d = new Date(label);
								if (!isNaN(d.getTime())) return `${d.getMonth() + 1}/${d.getDate()}`;
								return label;
							}
						}
					},
					y: {
						title: { display: true, text: 'Downloads' },
						beginAtZero: true,
						ticks: {
							callback: (value: any) => formatCompact(Number(value))
						}
					}
				}
			}
		});
		charts.push(chart);
	}

	onMount(() => {
		loadAndRenderChart(overallCanvas, 'overall');
		requestAnimationFrame(() => {
			loadAndRenderChart(pyMajorCanvas, 'python_major');
			loadAndRenderChart(pyMinorCanvas, 'python_minor');
			loadAndRenderChart(systemCanvas, 'system');
			loadAndRenderChart(installerCanvas, 'installer');
		});
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

<svelte:head>
	<title>{data.packageName} - PyPI Stats</title>
	<meta name="description" content="Download statistics for {data.packageName} package" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-gray-100">{data.packageName}</h1>
		<p class="text-gray-400">Download statistics from PyPI</p>

		{#if data.meta}
			{#await data.meta}
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					<span
						class="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 px-2.5 py-1 text-gray-300"
						>Loading…</span
					>
				</div>
			{:then meta}
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					{#if meta.version}
						<span
							class="inline-flex items-center rounded-full border border-blue-900 bg-blue-950 px-2.5 py-1 text-blue-300"
							>v{meta.version}</span
						>
					{/if}
					{#if meta.latestReleaseDate}
						<span
							class="inline-flex items-center rounded-full border border-green-900 bg-green-950 px-2.5 py-1 text-green-300"
							>Released {meta.latestReleaseDate}</span
						>
					{/if}
				</div>
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					{#if data.summaryTotals}
						{#await data.summaryTotals then totals}
							{#if totals?.system}
								{#await Promise.resolve(Object.entries(totals.system).sort((a, b) => Number(b[1]) - Number(a[1]))[0]) then topSys}
									{#if topSys}
										<span
											class="inline-flex items-center rounded-full border border-purple-900 bg-purple-950 px-2.5 py-1 text-purple-300"
											>Popular system: {topSys[0]}</span
										>
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
										<span
											class="inline-flex items-center rounded-full border border-indigo-900 bg-indigo-950 px-2.5 py-1 text-indigo-300"
											>Popular installer: {topInst[0]}</span
										>
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
										<span
											class="inline-flex items-center rounded-full border border-amber-900 bg-amber-950 px-2.5 py-1 text-amber-300"
											>Top version: {topVer[0]}</span
										>
									{/if}
								{/await}
							{/if}
						{/await}
					{/if}
				</div>
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					<a
						class="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 px-2.5 py-1 text-gray-300 hover:bg-gray-800"
						href={meta.pypiUrl}
						rel="noopener"
						target="_blank">View on PyPI</a
					>
					{#if meta.homePage}
						<a
							class="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 px-2.5 py-1 text-gray-300 hover:bg-gray-800"
							href={meta.homePage}
							rel="noopener"
							target="_blank">Homepage</a
						>
					{/if}
					{#if meta.projectUrls}
						{#each Object.entries(meta.projectUrls).filter(([label, url]) => !['homepage'].includes(label.toLowerCase())) as [label, url]}
							{#if typeof url === 'string'}
								<a
									class="inline-flex items-center rounded-full border border-gray-700 bg-gray-900 px-2.5 py-1 text-gray-300 hover:bg-gray-800"
									href={url}
									rel="noopener"
									target="_blank">{label}</a
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
		<div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 shadow-sm">
			<div class="border-b border-gray-800 px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-100">Recent Downloads</h2>
			</div>
			<div class="p-6">
				<div class="flex flex-wrap gap-6">
					<div class="max-w-full min-w-[280px] flex-1 grow">
						<h4 class="mb-2 text-sm font-semibold text-gray-300">Recent</h4>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-800 overflow-hidden rounded-md">
								<thead>
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase"
											>Period</th
										>
										<th
											class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase"
											>Downloads</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-800 bg-gray-950">
									{#await data.recentStats}
										<tr><td class="px-6 py-3 text-sm text-gray-400" colspan="2"><LoadingSpinner size="sm" text="Loading recent stats..." /></td></tr>
									{:then rs}
										{#each [['week', Number((rs as any)?.last_week || 0)], ['month', Number((rs as any)?.last_month || 0)]] as [period, count]}
											<tr>
												<td class="px-6 py-3 text-sm text-gray-300 capitalize">{period}</td>
												<td class="px-6 py-3 text-right text-sm font-semibold text-gray-100"
													>{formatNumber(Number(count))}</td
												>
											</tr>
										{/each}
									{:catch _}
										<tr
											><td class="px-6 py-3 text-sm text-red-600" colspan="2">Failed to load</td
											></tr
										>
									{/await}
								</tbody>
							</table>
						</div>
					</div>
					<div class="max-w-full min-w-[280px] flex-1 grow">
						<h4 class="mb-2 text-sm font-semibold text-gray-300">Overall</h4>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-800 overflow-hidden rounded-md">
								<thead>
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase"
											>Category</th
										>
										<th
											class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase"
											>Downloads</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-800 bg-gray-950">
									{#await (data as any).summaryTotals}
										<tr><td class="px-6 py-3 text-sm text-gray-400" colspan="2"><LoadingSpinner size="sm" text="Loading overall stats..." /></td></tr>
									{:then totals}
										{#each Object.entries(totals?.overall || {}).sort((a, b) => Number(b[1]) - Number(a[1])) as [k, v]}
											<tr>
												<td class="px-6 py-3 text-sm text-gray-300 capitalize"
													>{k.replace(/_/g, ' ')}</td
												>
												<td class="px-6 py-3 text-right text-sm font-semibold text-gray-100"
													>{formatNumber(Number(v))}</td
												>
											</tr>
										{/each}
									{:catch _}
										<tr
											><td class="px-6 py-3 text-sm text-red-600" colspan="2">Failed to load</td
											></tr
										>
									{/await}
								</tbody>
							</table>
						</div>
					</div>
					<div class="max-w-full min-w-[280px] flex-1 grow">
						<h4 class="mb-2 text-sm font-semibold text-gray-300">Systems</h4>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-800 overflow-hidden rounded-md">
								<thead>
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase"
											>System</th
										>
										<th
											class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase"
											>Downloads</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-800 bg-gray-950">
									{#await (data as any).summaryTotals}
										<tr><td class="px-6 py-3 text-sm text-gray-400" colspan="2"><LoadingSpinner size="sm" text="Loading system stats..." /></td></tr>
									{:then totals}
										{#each Object.entries(totals?.system || {}).sort((a, b) => Number(b[1]) - Number(a[1])) as [k, v]}
											<tr>
												<td class="px-6 py-3 text-sm text-gray-300 capitalize">{k}</td>
												<td class="px-6 py-3 text-right text-sm font-semibold text-gray-100"
													>{formatNumber(Number(v))}</td
												>
											</tr>
										{/each}
									{:catch _}
										<tr
											><td class="px-6 py-3 text-sm text-red-600" colspan="2">Failed to load</td
											></tr
										>
									{/await}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<div class="mt-8">
					<h3 class="text-md mb-2 font-semibold text-gray-100">Python Versions</h3>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-800 overflow-hidden rounded-md">
							<thead>
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase"
										>Version</th
									>
									<th
										class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-400 uppercase"
										>Downloads</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800 bg-gray-950">
								{#await (data as any).summaryTotals}
									<tr><td class="px-6 py-3 text-sm text-gray-400" colspan="2"><LoadingSpinner size="sm" text="Loading Python versions..." /></td></tr>
								{:then totals}
									{#each buildPythonVersionRows(totals?.python_major || {}, totals?.python_minor || {}) as row}
										<tr class={row.kind === 'major' ? 'bg-gray-900' : ''}>
											<td class="px-6 py-3 text-sm text-gray-300 capitalize">
												{#if row.kind === 'major'}
													Python {row.label}
												{:else}
													<span class="inline-block pl-6">{row.label}</span>
												{/if}
											</td>
											<td class="px-6 py-3 text-right text-sm font-semibold text-gray-100"
												>{formatNumber(row.downloads)}</td
											>
										</tr>
									{/each}
								{:catch _}
									<tr><td class="px-6 py-3 text-sm text-red-400" colspan="2">Failed to load</td></tr
									>
								{/await}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Charts -->
	{#if data.packageName}
		<div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 shadow-sm">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-100">Overall Downloads Over Time</h2>
				<p class="text-sm text-gray-400">Includes with and without mirrors</p>
			</div>
			<div class="p-6">
				<div class="w-full overflow-x-auto">
					<div class="relative h-96 w-full">
						<canvas bind:this={overallCanvas}></canvas>
					</div>
				</div>
			</div>
		</div>

		{#await data.pythonMajorStats}
			<!-- loading placeholder omitted to reduce layout shift -->
		{:then majorArr}
			{#if majorArr && majorArr.length > 0}
				<div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-100">Python Major Versions</h2>
					</div>
					<div class="p-6">
						<div class="w-full overflow-x-auto">
							<div class="relative h-96 w-full">
								<canvas bind:this={pyMajorCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/await}

		{#await data.pythonMinorStats}
			<!-- waiting -->
		{:then minorArr}
			{#if minorArr && minorArr.length > 0}
				<div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-100">Python Minor Versions</h2>
					</div>
					<div class="p-6">
						<div class="w-full overflow-x-auto">
							<div class="relative h-96 w-full">
								<canvas bind:this={pyMinorCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/await}

		{#await data.systemStats}
			<!-- waiting -->
		{:then sysArr}
			{#if sysArr && sysArr.length > 0}
				<div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-100">System Downloads</h2>
					</div>
					<div class="p-6">
						<div class="w-full overflow-x-auto">
							<div class="relative h-96 w-full">
								<canvas bind:this={systemCanvas}></canvas>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/await}

		{#await (data as any).summaryTotals}
			<!-- waiting -->
		{:then totals}
			{#if totals && totals.installer}
				<div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-100">Installer Breakdown</h2>
					</div>
					<div class="p-6">
						<div class="relative h-96 w-full">
							<canvas bind:this={installerCanvas}></canvas>
						</div>
					</div>
				</div>
			{/if}
		{/await}
	{/if}

	<!-- API Links -->
	<div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
		<h3 class="mb-4 text-lg font-semibold text-gray-100">API Links</h3>
		<div class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
			{#each apiEndpoints as ep}
				<div
					class="flex items-center justify-between rounded-md border border-gray-800 bg-gray-950 px-3 py-2"
				>
					<div class="min-w-0">
						<div class="text-gray-300">{ep.label}</div>
						<a
							class="truncate text-xs text-blue-400 hover:text-blue-300"
							href={endpointUrl(ep.path)}
							rel="noopener"
							target="_blank">{endpointUrl(ep.path)}</a
						>
					</div>
					<button
						class="ml-3 shrink-0 rounded-md border border-blue-700 bg-blue-800 px-2 py-1 text-xs text-white hover:bg-blue-700"
						onclick={() => navigator.clipboard?.writeText(endpointUrl(ep.path))}
						aria-label={`Copy ${ep.label} URL`}
					>
						Copy
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>
