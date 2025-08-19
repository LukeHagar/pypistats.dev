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
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Technology Stack</h2>
        <p class="mb-4 text-gray-400">
			PyPI Stats is built with modern web technologies to provide fast, reliable, and scalable download statistics:
		</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 class="text-lg font-semibold text-gray-100 mb-3">Frontend</h3>
                <ul class="space-y-2 text-gray-400">
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        <strong>SvelteKit</strong> - Modern web framework for reactive UI
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        <strong>TypeScript</strong> - Type-safe JavaScript development
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        <strong>Tailwind CSS</strong> - Utility-first CSS framework
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        <strong>Chart.js</strong> - Interactive data visualization
                    </li>
                </ul>
            </div>
            
            <div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 class="text-lg font-semibold text-gray-100 mb-3">Backend & Data</h3>
                <ul class="space-y-2 text-gray-400">
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        <strong>PostgreSQL</strong> - Primary database for statistics
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        <strong>Redis</strong> - Caching and distributed locks
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        <strong>BigQuery</strong> - Google's data warehouse for PyPI logs
                    </li>
                    <li class="flex items-center">
                        <span class="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        <strong>Prisma</strong> - Type-safe database ORM
                    </li>
                </ul>
            </div>
        </div>
        
        <div class="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
            <h3 class="text-lg font-semibold text-gray-100 mb-3">Infrastructure & Deployment</h3>
            <ul class="space-y-2 text-gray-400">
                <li class="flex items-center">
                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    <strong>Docker Compose</strong> - Containerized deployment stack
                </li>
                <li class="flex items-center">
                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    <strong>pnpm</strong> - Fast, disk space efficient package manager
                </li>
                <li class="flex items-center">
                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    <strong>OpenAPI</strong> - Standardized API documentation
                </li>
                <li class="flex items-center">
                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    <strong>Scalar</strong> - Interactive API documentation interface
                </li>
            </ul>
        </div>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Key Features</h2>
        <ul class="mb-6 list-disc pl-6 text-gray-400">
			<li><strong>On-demand ingestion</strong> - Data is fetched from BigQuery only when needed</li>
			<li><strong>Incremental updates</strong> - Only new or stale data is processed</li>
			<li><strong>Redis-backed deduplication</strong> - Prevents duplicate data processing</li>
			<li><strong>Streaming responses</strong> - Fast page loads with progressive data enhancement</li>
			<li><strong>RESTful API</strong> - Clean JSON endpoints for programmatic access</li>
			<li><strong>Dark mode UI</strong> - Modern, accessible user interface</li>
		</ul>
		
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
        
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Open Source</h2>
        <p class="mb-4 text-gray-400">
			PyPI Stats is completely open source and available on GitHub. We welcome contributions from the community!
		</p>
        
        <div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-100 mb-2">GitHub Repository</h3>
                    <p class="text-gray-400 mb-4">
                        View the source code, report issues, or contribute to the project.
                    </p>
                </div>
                <a 
                    href="https://github.com/LukeHagar/pypistats.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-6 py-3 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View on GitHub
                </a>
            </div>
        </div>
	</div>
</div> 