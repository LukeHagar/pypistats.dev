<script lang="ts">
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
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
				const minors: Array<[string, number]> = Object.entries(pyMinorTotalsMap)
					.filter(([k]) => (major === 'unknown' ? k === 'unknown' : k.startsWith(major + '.')))
					.map(([k, v]) => [k, Number(v)]);
				minors.sort((a, b) => {
					const ak =
						a[0] === 'unknown' ? Number.POSITIVE_INFINITY : parseFloat(a[0].split('.')[1] || '0');
					const bk =
						b[0] === 'unknown' ? Number.POSITIVE_INFINITY : parseFloat(b[0].split('.')[1] || '0');
					return ak - bk;
				});
				for (const [minor, dls] of minors)
					rows.push({ kind: 'minor', label: minor, downloads: dls });
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
		<h1 class="mb-2 text-3xl font-bold text-gray-900">{data.packageName}</h1>
		<p class="text-gray-600">Download statistics from PyPI</p>

		{#if data.meta}
			{#await data.meta}
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					<span
						class="inline-flex items-center rounded-full border bg-gray-50 px-2.5 py-1 text-gray-700"
						>Loading…</span
					>
				</div>
			{:then meta}
				<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
					{#if meta.version}
						<span
							class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700"
							>v{meta.version}</span
						>
					{/if}
					{#if meta.latestReleaseDate}
						<span
							class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-green-700"
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
											class="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-purple-700"
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
											class="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-indigo-700"
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
											class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700"
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
						class="inline-flex items-center rounded-full border bg-gray-50 px-2.5 py-1 text-gray-700 hover:bg-gray-100"
						href={meta.pypiUrl}
						rel="noopener"
						target="_blank">View on PyPI</a
					>
					{#if meta.homePage}
						<a
							class="inline-flex items-center rounded-full border bg-gray-50 px-2.5 py-1 text-gray-700 hover:bg-gray-100"
							href={meta.homePage}
							rel="noopener"
							target="_blank">Homepage</a
						>
					{/if}
					{#if meta.projectUrls}
						{#each Object.entries(meta.projectUrls).filter(([label, url]) => !['homepage'].includes(label.toLowerCase())) as [label, url]}
							{#if typeof url === 'string'}
								<a
									class="inline-flex items-center rounded-full border bg-gray-50 px-2.5 py-1 text-gray-700 hover:bg-gray-100"
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
		<div class="mb-8 rounded-lg border bg-white shadow-sm">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Recent Downloads</h2>
			</div>
			<div class="p-6">
				<div class="flex flex-wrap gap-6">
					<div class="max-w-full min-w-[280px] flex-1 grow">
						<h4 class="mb-2 text-sm font-semibold text-gray-700">Recent</h4>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead>
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Period</th
										>
										<th
											class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Downloads</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200 bg-white">
									{#await data.recentStats}
										<tr><td class="px-6 py-3 text-sm text-gray-500" colspan="2">Loading…</td></tr>
									{:then rs}
										{#each [['week', Number((rs as any)?.last_week || 0)], ['month', Number((rs as any)?.last_month || 0)]] as [period, count]}
											<tr>
												<td class="px-6 py-3 text-sm text-gray-700 capitalize">{period}</td>
												<td class="px-6 py-3 text-right text-sm font-semibold text-gray-900"
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
						<h4 class="mb-2 text-sm font-semibold text-gray-700">Overall</h4>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead>
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Category</th
										>
										<th
											class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Downloads</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200 bg-white">
									{#await (data as any).summaryTotals}
										<tr><td class="px-6 py-3 text-sm text-gray-500" colspan="2">Loading…</td></tr>
									{:then totals}
										{#each Object.entries(totals?.overall || {}).sort((a, b) => Number(b[1]) - Number(a[1])) as [k, v]}
											<tr>
												<td class="px-6 py-3 text-sm text-gray-700 capitalize"
													>{k.replace(/_/g, ' ')}</td
												>
												<td class="px-6 py-3 text-right text-sm font-semibold text-gray-900"
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
						<h4 class="mb-2 text-sm font-semibold text-gray-700">Systems</h4>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead>
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>System</th
										>
										<th
											class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
											>Downloads</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200 bg-white">
									{#await (data as any).summaryTotals}
										<tr><td class="px-6 py-3 text-sm text-gray-500" colspan="2">Loading…</td></tr>
									{:then totals}
										{#each Object.entries(totals?.system || {}).sort((a, b) => Number(b[1]) - Number(a[1])) as [k, v]}
											<tr>
												<td class="px-6 py-3 text-sm text-gray-700 capitalize">{k}</td>
												<td class="px-6 py-3 text-right text-sm font-semibold text-gray-900"
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
					<h3 class="text-md mb-2 font-semibold text-gray-900">Python Versions</h3>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead>
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
										>Version</th
									>
									<th
										class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
										>Downloads</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								{#await (data as any).summaryTotals}
									<tr><td class="px-6 py-3 text-sm text-gray-500" colspan="2">Loading…</td></tr>
								{:then totals}
									{#each buildPythonVersionRows(totals?.python_major || {}, totals?.python_minor || {}) as row}
										<tr class={row.kind === 'major' ? 'bg-gray-50' : ''}>
											<td class="px-6 py-3 text-sm text-gray-700 capitalize">
												{#if row.kind === 'major'}
													Python {row.label}
												{:else}
													<span class="inline-block pl-6">{row.label}</span>
												{/if}
											</td>
											<td class="px-6 py-3 text-right text-sm font-semibold text-gray-900"
												>{formatNumber(row.downloads)}</td
											>
										</tr>
									{/each}
								{:catch _}
									<tr><td class="px-6 py-3 text-sm text-red-600" colspan="2">Failed to load</td></tr
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
		<div class="mb-8 rounded-lg border bg-white shadow-sm">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Overall Downloads Over Time</h2>
				<p class="text-sm text-gray-500">Includes with and without mirrors</p>
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
				<div class="mb-8 rounded-lg border bg-white shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-900">Python Major Versions</h2>
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
				<div class="mb-8 rounded-lg border bg-white shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-900">Python Minor Versions</h2>
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
				<div class="mb-8 rounded-lg border bg-white shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-900">System Downloads</h2>
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
				<div class="mb-8 rounded-lg border bg-white shadow-sm">
					<div class="border-b px-6 py-4">
						<h2 class="text-lg font-semibold text-gray-900">Installer Breakdown</h2>
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
	<div class="rounded-lg bg-blue-50 p-6">
		<h3 class="mb-4 text-lg font-semibold text-gray-900">API Access</h3>
		<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
			<div>
				<strong>Recent downloads:</strong>
				<a
					href="/api/packages/{data.packageName}/recent"
					class="ml-2 text-blue-600 hover:text-blue-800">JSON</a
				>
			</div>
			<div>
				<strong>Overall downloads:</strong>
				<a
					href="/api/packages/{data.packageName}/overall"
					class="ml-2 text-blue-600 hover:text-blue-800">JSON</a
				>
			</div>
			<div>
				<strong>Python major versions:</strong>
				<a
					href="/api/packages/{data.packageName}/python_major"
					class="ml-2 text-blue-600 hover:text-blue-800">JSON</a
				>
			</div>
			<div>
				<strong>System downloads:</strong>
				<a
					href="/api/packages/{data.packageName}/system"
					class="ml-2 text-blue-600 hover:text-blue-800">JSON</a
				>
			</div>
		</div>
	</div>
</div>
