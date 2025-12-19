<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<MetaTags
	title="Frequently Asked Questions - PyPI Stats"
	description="Find answers to common questions about PyPI Stats, data accuracy, API usage, and how we collect Python package download statistics."
	keywords={["PyPI Stats FAQ", "frequently asked questions", "Python package statistics", "API usage", "data accuracy", "download statistics"]}
/>

<div class="mx-auto max-w-4xl py-12">
	<h1 class="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>

	<div class="mt-8 space-y-4">
		<Card>
			<h2 class="text-xl font-semibold">What is PyPI Stats?</h2>
			<p class="mt-2 text-sm text-muted">
				PyPI Stats provides download statistics for Python packages from PyPI. We collect and process
				download data to help developers understand package usage patterns.
			</p>
		</Card>

		<Card>
			<h2 class="text-xl font-semibold">How accurate is the data?</h2>
			<p class="mt-2 text-sm text-muted">
				Our data comes from PyPI's download logs, so it represents actual downloads from PyPI's CDN. It may
				not capture all downloads if users are using mirrors or other distribution methods.
			</p>
		</Card>

		<Card>
			<h2 class="text-xl font-semibold">How often is the data updated?</h2>
			<p class="mt-2 text-sm text-muted">
				We process new data daily from PyPI's BigQuery dataset. Recent statistics (day, week, month) are
				updated more frequently.
			</p>
		</Card>

		<Card>
			<h2 class="text-xl font-semibold">What do the different download categories mean?</h2>
			<ul class="mt-3 list-disc pl-6 text-sm text-muted">
				<li><strong class="text-strong">Overall:</strong> Total downloads</li>
				<li><strong class="text-strong">Python Major:</strong> Downloads by 2.x vs 3.x</li>
				<li><strong class="text-strong">Python Minor:</strong> Downloads by version (3.11, etc.)</li>
				<li><strong class="text-strong">System:</strong> Downloads by OS</li>
			</ul>
		</Card>

		<Card>
			<h2 class="text-xl font-semibold">Is the API free to use?</h2>
			<p class="mt-2 text-sm text-muted">
				Yes, all our API endpoints are free to use. We may implement rate limiting to ensure fair usage.
			</p>
		</Card>

		<Card>
			<h2 class="text-xl font-semibold">How do I use the API?</h2>
			<p class="mt-2 text-sm text-muted">
				Our API provides RESTful endpoints that return JSON. See the <a href="/api">API page</a> for details.
			</p>
		</Card>

		<Card>
			<h2 class="text-xl font-semibold">Why don't I see data for my package?</h2>
			<p class="mt-2 text-sm text-muted">This can happen if:</p>
			<ul class="mt-2 list-disc pl-6 text-sm text-muted">
				<li>The package has very few downloads</li>
				<li>The package is relatively new and hasn't been processed yet</li>
				<li>There’s an issue with the package name format</li>
			</ul>
		</Card>

		<Card>
			<h2 class="text-xl font-semibold">Can I contribute to PyPI Stats?</h2>
			<p class="mt-2 text-sm text-muted">
				Yes! PyPI Stats is open source. You can contribute by reporting bugs, suggesting features, or submitting
				pull requests on GitHub.
			</p>
		</Card>
	</div>
</div>