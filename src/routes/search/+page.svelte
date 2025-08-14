<script lang="ts">
    import type { PageData } from './$types';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    const { data } = $props<{ data: PageData }>();
    let searchTerm = $state(data.searchTerm ?? '');
</script>

<svelte:head>
	<title>Search Packages - PyPI Stats</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<div class="max-w-2xl mx-auto">
		<h1 class="text-3xl font-bold text-gray-100 mb-8">Search Packages</h1>
		
		<!-- Search Form -->
        <form method="GET" action="/search" class="mb-8">
			<div class="flex gap-2">
				<input
					type="text"
					name="q"
					bind:value={searchTerm}
					placeholder="Enter package name..."
					class="flex-1 px-4 py-2 border border-gray-700 bg-gray-900 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					required
				/>
				<button
					type="submit"
					class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Search
				</button>
			</div>
		</form>
		
		{#if data.searchTerm}
			{#await data.packages}
				<div class="text-center py-12">
					<div class="text-gray-400">
						<LoadingSpinner size="lg" text="Searching packages..." />
					</div>
				</div>
			{:then packages}
				{#if packages && packages.length > 0}
					<div class="bg-gray-900 rounded-lg shadow-sm border border-gray-800">
						<div class="px-6 py-4 border-b border-gray-800">
							<h2 class="text-lg font-semibold text-gray-100">
								Found {packages.length} package{packages.length === 1 ? '' : 's'}
							</h2>
						</div>
						<div class="divide-y divide-gray-800">
							{#each packages as pkg}
								<div class="px-6 py-4 hover:bg-gray-950">
									<a href="/packages/{pkg}" class="block" data-sveltekit-preload-data="off">
										<div class="text-lg font-medium text-blue-400 hover:text-blue-300">
											{pkg}
										</div>
										<div class="text-sm text-gray-400">
											View download statistics
										</div>
									</a>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="text-center py-12">
						<div class="text-gray-400">
							<p class="text-lg mb-2">No packages found</p>
							<p class="text-sm">Try searching for a different package name</p>
						</div>
					</div>
				{/if}
			{:catch}
				<div class="text-center py-12">
					<div class="text-red-400">
						<p class="text-lg mb-2">Search failed</p>
						<p class="text-sm">Please try again</p>
					</div>
				</div>
			{/await}
		{/if}
	</div>
</div> 