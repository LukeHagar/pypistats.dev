<script lang="ts">
    import type { PageData } from './$types';
    import { MetaTags } from 'svelte-meta-tags';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import SkeletonList from '$lib/components/ui/SkeletonList.svelte';
    const { data } = $props<{ data: PageData }>();
    let searchTerm = $state(data.searchTerm ?? '');
</script>

<MetaTags
	title="Search Python Packages - PyPI Stats"
	description="Search for Python packages to view their download statistics, usage trends, and popularity data from PyPI."
	keywords={["Python package search", "PyPI search", "package discovery", "Python packages", "download statistics"]}
/>

<div class="mx-auto max-w-2xl py-12">
	<h1 class="text-3xl font-bold tracking-tight">Search Packages</h1>

	<!-- Search Form -->
	<form method="GET" action="/search" class="mt-6">
		<div class="flex gap-2">
			<Input name="q" bind:value={searchTerm} placeholder="Enter package name…" required />
			<Button type="submit">Search</Button>
		</div>
	</form>

	{#if data.searchTerm}
		<div class="mt-8">
			{#await data.packages}
				<Card>
					<SkeletonList rows={8} />
				</Card>
			{:then packages}
				{#if packages && packages.length > 0}
					<Card padding="none">
						<div class="p-6">
							<h2 class="text-lg font-semibold">
								Found {packages.length} package{packages.length === 1 ? '' : 's'}
							</h2>
						</div>
						<div class="divide-y divide-[var(--color-surface-200-800)]">
							{#each packages as pkg}
								<a
									href="/packages/{pkg}"
									class="block px-6 py-4 hover:opacity-90"
									data-sveltekit-preload-data="off"
								>
									<div class="text-lg font-medium">{pkg}</div>
									<div class="text-sm text-muted">
										View download statistics
									</div>
								</a>
							{/each}
						</div>
					</Card>
				{:else}
					<div class="py-12 text-center text-muted">
						<p class="text-lg">No packages found</p>
						<p class="text-sm">Try searching for a different package name</p>
					</div>
				{/if}
			{:catch}
				<div class="py-12 text-center text-[var(--color-error-400)]">
					<p class="text-lg">Search failed</p>
					<p class="text-sm">Please try again</p>
				</div>
			{/await}
		</div>
	{/if}
</div>