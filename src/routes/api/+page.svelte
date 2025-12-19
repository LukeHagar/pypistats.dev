<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import Card from '$lib/components/ui/Card.svelte';

	// Keeps certain tooling from incorrectly flagging component imports as unused in .svelte files.
	const _components = { MetaTags, Card };
</script>

<MetaTags
	title="API Documentation - PyPI Stats"
	description="Complete API documentation for PyPI Stats. Learn how to access Python package download statistics programmatically with our free REST API."
	keywords={["PyPI Stats API", "API documentation", "REST API", "Python package statistics", "download statistics API", "JSON API"]}
/>

<div class="py-12">
	<h1 class="text-3xl font-bold tracking-tight">API Documentation</h1>

	<div class="prose prose-lg mt-6 max-w-none">
		<p>
			The PyPI Stats API provides programmatic access to download statistics for Python packages. All endpoints
			return JSON data and are free to use.
		</p>

		<h2>Base URL</h2>
		<Card class="not-prose">
			<code class="text-sm">https://pypistats.dev/api</code>
		</Card>

		<h2>Interactive API Documentation</h2>
		<p>
			Explore our API endpoints interactively using the documentation below. You can test endpoints directly
			from this interface.
		</p>

		<Card padding="none" class="not-prose overflow-hidden">
			<iframe
				src="/api-docs.html"
				class="h-[800px] w-full border-0"
				title="PyPI Stats API Documentation"
				loading="lazy"
			></iframe>
		</Card>
	</div>
</div>