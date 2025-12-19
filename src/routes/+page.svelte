<script lang="ts">
	import type { PageData } from './$types';
	import { MetaTags } from 'svelte-meta-tags';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import SkeletonList from '$lib/components/ui/SkeletonList.svelte';

	const { data }: { data: PageData } = $props();
	
	let searchTerm = $state('');
</script>

<MetaTags
	title="PyPI Stats - Download Statistics for Python Packages"
	description="Get comprehensive download statistics for Python packages from PyPI. Track package popularity, Python version usage, system breakdowns, and more with our free API."
	keywords={["PyPI", "Python packages", "download statistics", "package analytics", "Python package stats", "PyPI downloads"]}
/>

<div class="py-12">
	<div class="text-center">
		<h1 class="text-4xl font-bold tracking-tight">PyPI Stats</h1>
		<p class="mt-3 text-lg text-muted">
			Download statistics for Python packages
		</p>

		<!-- Search Form -->
		<div class="mx-auto mt-8 max-w-md">
			<form method="GET" action="/search" class="flex gap-2">
				<Input name="q" bind:value={searchTerm} placeholder="Enter package name…" required />
				<Button type="submit">Search</Button>
			</form>
		</div>

		<div class="mt-8 text-sm text-muted">
			Tracking
			{#await data.packageCount}
				<Skeleton w="w-24" h="h-3" class="inline-block align-middle" />
			{:then count}
				{count !== undefined ? count.toLocaleString() : '0'}
			{:catch}
				0
			{/await}
			packages
		</div>
	</div>

	<!-- Quick Links -->
	<div class="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
		<Card>
			<h3 class="text-lg font-semibold">Popular Packages (last 30 days)</h3>
			<p class="mt-1 text-sm text-muted">
				Top projects by downloads (without mirrors)
			</p>

			<div class="mt-4">
				{#await data.popular}
					<SkeletonList rows={6} />
				{:then popular}
					{#if popular && popular.length > 0}
						<ul class="divide-y divide-[var(--color-surface-200-800)]">
							{#each popular as row}
								<li class="flex items-center justify-between py-2">
									<a href="/packages/{row.package}" data-sveltekit-preload-data="off">{row.package}</a>
									<span class="text-sm text-muted"
										>{row.downloads.toLocaleString()}</span
									>
								</li>
							{/each}
						</ul>
					{:else}
						<div class="text-sm text-muted">No data yet.</div>
					{/if}
				{:catch}
					<div class="text-sm text-muted">Failed to load.</div>
				{/await}
			</div>
		</Card>

		<Card>
			<h3 class="text-lg font-semibold">API Access</h3>
			<p class="mt-1 text-sm text-muted">
				Programmatic access to download statistics
			</p>

			<ul class="mt-4 space-y-2 text-sm">
				<li>RESTful JSON API</li>
				<li>Free to use</li>
				<li>Interactive documentation</li>
				<li>Rate limited</li>
			</ul>

			<div class="mt-6">
				<Button href="/api" variant="secondary">View API documentation</Button>
			</div>
		</Card>

		<Card>
			<h3 class="text-lg font-semibold">About PyPI Stats</h3>
			<p class="mt-1 text-sm text-muted">
				Learn more about PyPI Stats and how it works
			</p>

			<ul class="mt-4 space-y-2 text-sm">
				<li>Real-time data from PyPI</li>
				<li>BigQuery integration</li>
				<li>Daily updates</li>
				<li>Open source</li>
			</ul>

			<div class="mt-6">
				<Button href="/about" variant="secondary">Learn more</Button>
			</div>
		</Card>
	</div>
</div>
