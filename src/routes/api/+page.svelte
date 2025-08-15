<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
</script>

<MetaTags
	title="API Documentation - PyPI Stats"
	description="Complete API documentation for PyPI Stats. Learn how to access Python package download statistics programmatically with our free REST API."
	keywords={["PyPI Stats API", "API documentation", "REST API", "Python package statistics", "download statistics API", "JSON API"]}
/>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-100">API Documentation</h1>
	
    <div class="prose prose-lg max-w-none">
        <p class="mb-8 text-gray-400">
			The PyPI Stats API provides programmatic access to download statistics for Python packages. 
			All endpoints return JSON data and are free to use.
		</p>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Base URL</h2>
        <div class="mb-6 rounded-md bg-gray-900 p-4">
            <code class="text-sm text-gray-200">https://pypistats.dev/api</code>
		</div>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Interactive API Documentation</h2>
        <p class="mb-6 text-gray-400">
			Explore our API endpoints interactively using the documentation below. You can test endpoints directly from this interface.
		</p>
		
        <!-- Scalar API Reference iframe -->
        <div class="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
            <iframe
                src="/api-docs.html"
                class="w-full h-[800px] border-0"
                title="PyPI Stats API Documentation"
                loading="lazy"
            ></iframe>
        </div>
        
        <div class="mt-6 text-sm text-gray-400">
            <p>
                <strong>Note:</strong> The interactive documentation above uses our OpenAPI specification. 
                All endpoints are free to use and return JSON data. For programmatic access, use the base URL: 
                <code class="bg-gray-800 px-2 py-1 rounded">https://pypistats.dev/api</code>
            </p>
        </div>
	</div>
</div> 