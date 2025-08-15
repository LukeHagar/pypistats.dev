<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
</script>

<MetaTags
	title="About PyPI Stats - Download Statistics for Python Packages"
	description="Learn about PyPI Stats, how we collect download data from PyPI, and what statistics we provide for Python packages."
	keywords={["PyPI Stats", "about", "data collection", "Python package statistics", "PyPI downloads", "BigQuery"]}
/>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-100">About PyPI Stats</h1>
	
    <div class="prose prose-lg max-w-none">
        <p class="mb-6 text-gray-400">
			PyPI Stats provides download statistics for Python packages from the Python Package Index (PyPI). 
			Our data is collected from PyPI's download logs and processed to provide insights into package usage.
		</p>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">What We Track</h2>
        <ul class="mb-6 list-disc pl-6 text-gray-400">
			<li>Overall download counts (with and without mirrors)</li>
			<li>Downloads by Python major version (2.x, 3.x)</li>
			<li>Downloads by Python minor version (2.7, 3.6, 3.7, etc.)</li>
			<li>Downloads by operating system (Windows, Linux, macOS)</li>
			<li>Recent download statistics (day, week, month)</li>
		</ul>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Data Sources</h2>
        <p class="mb-6 text-gray-400">
			Our data comes from PyPI's BigQuery public dataset, which contains download logs from PyPI's CDN. 
			We process this data daily to provide up-to-date statistics.
		</p>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">API Access</h2>
        <p class="mb-6 text-gray-400">
			We provide a RESTful API for programmatic access to download statistics. 
			All endpoints return JSON data and are free to use.
		</p>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Privacy</h2>
        <p class="mb-6 text-gray-400">
			We only collect aggregate statistics and do not track individual users or their download patterns. 
			All data is anonymized and used solely for providing download statistics.
		</p>
	</div>
</div> 