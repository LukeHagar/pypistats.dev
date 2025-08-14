<script lang="ts">
	import type { PageData } from './$types';

	const { data } = $props<{ data: PageData }>();
	
	let searchTerm = $state('');
</script>

<svelte:head>
	<title>PyPI Stats - Download statistics for Python packages</title>
	<meta name="description" content="Get download statistics for Python packages from PyPI" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-100 mb-8">
			PyPI Stats
		</h1>
        <p class="text-xl text-gray-400 mb-8">
			Download statistics for Python packages
		</p>
		
		<!-- Search Form -->
        <div class="max-w-md mx-auto">
            <form method="GET" action="/search" class="flex gap-2">
				<input
					type="text"
					name="q"
					bind:value={searchTerm}
					placeholder="Enter package name..."
                    class="flex-1 px-4 py-2 rounded-md border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
					required
				/>
				<button
					type="submit"
                    class="px-6 py-2 rounded-md bg-blue-700 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
				>
					Search
				</button>
			</form>
		</div>
		
        <div class="mt-8 text-sm text-gray-400">
            Tracking {data.packageCount ? data.packageCount.toLocaleString() : 'tons of'} packages
        </div>
	</div>
	
	<!-- Quick Links -->
    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-sm">
                <h3 class="mb-2 text-lg font-semibold text-gray-100">Popular Packages (last 30 days)</h3>
                <p class="mb-4 text-gray-400">Top projects by downloads (without mirrors)</p>
				{#if data.popular && data.popular.length > 0}
                    <ul class="divide-y divide-gray-800">
						{#each data.popular as row}
							<li class="py-2 flex items-center justify-between">
                                <a class="font-medium text-blue-400 hover:text-blue-300" href="/packages/{row.package}" data-sveltekit-preload-data="off">{row.package}</a>
                                <span class="text-sm text-gray-400">{row.downloads.toLocaleString()}</span>
							</li>
						{/each}
					</ul>
				{:else}
                    <div class="text-sm text-gray-400">No data yet.</div>
				{/if}
			</div>
		
        <div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <h3 class="mb-2 text-lg font-semibold text-gray-100">API Access</h3>
            <p class="mb-4 text-gray-400">Programmatic access to download statistics</p>
            <a href="/api" class="font-medium text-blue-400 hover:text-blue-300">API Documentation →</a>
		</div>
		
        <div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <h3 class="mb-2 text-lg font-semibold text-gray-100">About</h3>
            <p class="mb-4 text-gray-400">Learn more about PyPI Stats and how it works</p>
            <a href="/about" class="font-medium text-blue-400 hover:text-blue-300">Learn More →</a>
		</div>
	</div>
</div>
