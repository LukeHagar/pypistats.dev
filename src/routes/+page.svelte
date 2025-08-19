<script lang="ts">
	import type { PageData } from './$types';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { MetaTags } from 'svelte-meta-tags';

	const { data }: { data: PageData } = $props();
	
	let searchTerm = $state('');
</script>

<MetaTags
	title="PyPI Stats - Download Statistics for Python Packages"
	description="Get comprehensive download statistics for Python packages from PyPI. Track package popularity, Python version usage, system breakdowns, and more with our free API."
	keywords={["PyPI", "Python packages", "download statistics", "package analytics", "Python package stats", "PyPI downloads"]}
/>

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
            Tracking {#await data.packageCount}...{:then count}{count !== undefined ? count.toLocaleString() : '0'}{:catch}0{/await} packages
        </div>
	</div>
	
	<!-- Quick Links -->
    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-sm">
                <h3 class="mb-2 text-lg font-semibold text-gray-100">Popular Packages (last 30 days)</h3>
                <p class="mb-4 text-gray-400">Top projects by downloads (without mirrors)</p>
				{#await data.popular}
					<div class="text-sm text-gray-400"><LoadingSpinner size="sm" text="Loading popular packages..." /></div>
				{:then popular}
					{#if popular && popular.length > 0}
						<ul class="divide-y divide-gray-800">
							{#each popular as row}
								<li class="py-2 flex items-center justify-between">
									<a class="font-medium text-blue-400 hover:text-blue-300" href="/packages/{row.package}" data-sveltekit-preload-data="off">{row.package}</a>
									<span class="text-sm text-gray-400">{row.downloads.toLocaleString()}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<div class="text-sm text-gray-400">No data yet.</div>
					{/if}
				{:catch}
					<div class="text-sm text-gray-400">Failed to load.</div>
				{/await}
			</div>
		
        <div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-100">API Access</h3>
            </div>
            <p class="mb-4 text-gray-400">Programmatic access to download statistics</p>
            
            <div class="space-y-3 mb-6">
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    RESTful JSON API
                </div>
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    Free to use
                </div>
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    Interactive documentation
                </div>
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    Rate limited
                </div>
            </div>
            
            <a href="/api" class="inline-flex items-center font-medium text-blue-400 hover:text-blue-300">
                View API Documentation 
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </a>
		</div>
		
        <div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-sm">
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-100">About PyPI Stats</h3>
            </div>
            <p class="mb-4 text-gray-400">Learn more about PyPI Stats and how it works</p>
            
            <div class="space-y-3 mb-6">
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                    </svg>
                    Real-time data from PyPI
                </div>
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                    </svg>
                    BigQuery integration
                </div>
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                    </svg>
                    Daily updates
                </div>
                <div class="flex items-center text-sm text-gray-300">
                    <svg class="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                    </svg>
                    Open source
                </div>
            </div>
            
            <a href="/about" class="inline-flex items-center font-medium text-blue-400 hover:text-blue-300">
                Learn More 
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </a>
		</div>
	</div>
</div>
