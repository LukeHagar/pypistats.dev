<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<MetaTags
	title="About PyPI Stats - Download Statistics for Python Packages"
	description="Learn about PyPI Stats, how we collect download data from PyPI, and what statistics we provide for Python packages."
	keywords={["PyPI Stats", "about", "data collection", "Python package statistics", "PyPI downloads", "BigQuery"]}
/>

<div class="mx-auto max-w-4xl py-12">
	<h1 class="text-3xl font-bold tracking-tight">About PyPI Stats</h1>

	<div class="prose prose-lg mt-6 max-w-none">
		<p>
			PyPI Stats provides download statistics for Python packages from the Python Package Index (PyPI). Our
			data is collected from PyPI's download logs and processed to provide insights into package usage.
		</p>

		<h2>What We Track</h2>
		<ul>
			<li>Overall download counts (with and without mirrors)</li>
			<li>Downloads by Python major version (2.x, 3.x)</li>
			<li>Downloads by Python minor version (2.7, 3.6, 3.7, etc.)</li>
			<li>Downloads by operating system (Windows, Linux, macOS)</li>
			<li>Recent download statistics (day, week, month)</li>
		</ul>

		<h2>Data Sources</h2>
		<p>
			Our data comes from PyPI's BigQuery public dataset, which contains download logs from PyPI's CDN. We
			process this data daily to provide up-to-date statistics.
		</p>

		<h2>Technology Stack</h2>
		<p>PyPI Stats is built with modern web technologies to provide fast, reliable analytics:</p>

		<div class="not-prose grid grid-cols-1 gap-6 md:grid-cols-2">
			<Card>
				<h3 class="text-lg font-semibold">Frontend</h3>
				<ul class="mt-3 space-y-2 text-sm text-muted">
					<li><strong class="text-strong">SvelteKit</strong> - reactive UI framework</li>
					<li><strong class="text-strong">TypeScript</strong> - type-safe JS</li>
					<li><strong class="text-strong">Tailwind</strong> + <strong class="text-strong">Skeleton</strong> - design system</li>
					<li><strong class="text-strong">Chart.js</strong> - charts</li>
				</ul>
			</Card>

			<Card>
				<h3 class="text-lg font-semibold">Backend & Data</h3>
				<ul class="mt-3 space-y-2 text-sm text-muted">
					<li><strong class="text-strong">PostgreSQL</strong> - primary datastore</li>
					<li><strong class="text-strong">Redis</strong> - caching + locks</li>
					<li><strong class="text-strong">BigQuery</strong> - PyPI logs</li>
					<li><strong class="text-strong">Prisma</strong> - ORM</li>
				</ul>
			</Card>
		</div>

		<div class="not-prose mt-6">
			<Card>
				<h3 class="text-lg font-semibold">Infrastructure & Deployment</h3>
				<ul class="mt-3 space-y-2 text-sm text-muted">
					<li><strong class="text-strong">Docker Compose</strong> - container stack</li>
					<li><strong class="text-strong">OpenAPI</strong> - standardized API docs</li>
					<li><strong class="text-strong">Scalar</strong> - interactive API UI</li>
				</ul>
			</Card>
		</div>

		<h2>Key Features</h2>
		<ul>
			<li><strong>On-demand ingestion</strong> - fetched only when needed</li>
			<li><strong>Incremental updates</strong> - process stale/new data only</li>
			<li><strong>Redis-backed deduplication</strong> - avoids duplicate work</li>
			<li><strong>Streaming responses</strong> - progressive page loads</li>
			<li><strong>RESTful API</strong> - clean JSON endpoints</li>
		</ul>

		<h2>Open Source</h2>
		<p>PyPI Stats is open source and available on GitHub. Issues and PRs are welcome.</p>

		<div class="not-prose">
			<Card class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 class="text-lg font-semibold">GitHub Repository</h3>
					<p class="mt-1 text-sm text-muted">
						View the source code, report issues, or contribute.
					</p>
				</div>
				<a
					class="btn preset-filled-primary-500"
					href="https://github.com/LukeHagar/pypistats.dev"
					target="_blank"
					rel="noopener noreferrer"
				>
					View on GitHub
				</a>
			</Card>
		</div>
	</div>
</div>