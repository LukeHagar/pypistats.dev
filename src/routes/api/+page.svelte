<svelte:head>
	<title>API Documentation - PyPI Stats</title>
	<meta name="description" content="API documentation for PyPI Stats" />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-100">API Documentation</h1>
	
    <div class="prose prose-lg max-w-none">
        <p class="mb-8 text-gray-400">
			The PyPI Stats API provides programmatic access to download statistics for Python packages. 
			All endpoints return JSON data and are free to use.
		</p>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Base URL</h2>
        <div class="mb-6 rounded-md bg-gray-900 p-4">
            <code class="text-sm text-gray-200">https://pypistats.org/api</code>
		</div>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Endpoints</h2>
		
		<div class="space-y-8">
            <!-- Chart Data / Images -->
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
                <h3 class="mb-3 text-xl font-semibold text-gray-100">Chart Data / Images</h3>
                <div class="mb-4 rounded-md bg-gray-950 p-4">
                    <code class="text-sm text-gray-200">GET /api/packages/&#123;package&#125;/chart/&#123;type&#125;</code>
                </div>
                <p class="mb-4 text-gray-400">
                    Returns either a PNG chart image (default) or JSON payload for interactive charts.
                </p>
                <div class="mb-4">
                    <strong class="text-gray-100">Path params:</strong>
                    <ul class="mt-2 list-disc pl-6 text-gray-400">
                        <li><code>type</code>: one of <code>overall</code>, <code>python_major</code>, <code>python_minor</code>, <code>system</code>, <code>installer</code>, <code>version</code></li>
                    </ul>
                </div>
                <div class="mb-4">
                    <strong class="text-gray-100">Query params:</strong>
                    <ul class="mt-2 list-disc pl-6 text-gray-400">
                        <li><code>format</code>: <code>json</code> to return the data model instead of an image</li>
                        <li><code>chart</code>: <code>line</code> (default) or <code>bar</code></li>
                        <li><code>mirrors</code>: for <code>overall</code>, include mirror downloads (<code>true</code>/<code>false</code>)</li>
                        <li><code>version</code>: for <code>python_major</code>/<code>python_minor</code> filters</li>
                        <li><code>os</code>: for <code>system</code> filter (e.g. <code>Linux</code>, <code>Windows</code>, <code>Darwin</code>)</li>
                        <li><code>nocache</code> / <code>cache</code>: bypass caching (<code>nocache=1</code> or <code>cache=false</code>)</li>
                    </ul>
                </div>
                <div class="mb-4">
                    <strong class="text-gray-100">Example:</strong>
                    <div class="mt-2 rounded-md bg-gray-950 p-4">
                        <code class="text-sm text-gray-200">GET /api/packages/numpy/chart/overall?format=json&amp;chart=line&amp;mirrors=true</code>
                    </div>
                </div>
            </div>
			<!-- Recent Downloads -->
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
                <h3 class="mb-3 text-xl font-semibold text-gray-100">Recent Downloads</h3>
                <div class="mb-4 rounded-md bg-gray-950 p-4">
                    <code class="text-sm text-gray-200">GET /api/packages/&#123;package&#125;/recent</code>
				</div>
                <p class="mb-4 text-gray-400">
					Get recent download statistics for a package (day, week, month).
				</p>
				<div class="mb-4">
                    <strong class="text-gray-100">Parameters:</strong>
                    <ul class="mt-2 list-disc pl-6 text-gray-400">
						<li><code>period</code> (optional): Filter by period (day, week, month)</li>
					</ul>
				</div>
				<div class="mb-4">
                    <strong class="text-gray-100">Example:</strong>
                    <div class="mt-2 rounded-md bg-gray-950 p-4">
                        <code class="text-sm text-gray-200">GET /api/packages/numpy/recent?period=month</code>
					</div>
				</div>
			</div>
			
			<!-- Overall Downloads -->
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
                <h3 class="mb-3 text-xl font-semibold text-gray-100">Overall Downloads</h3>
                <div class="mb-4 rounded-md bg-gray-950 p-4">
                    <code class="text-sm text-gray-200">GET /api/packages/&#123;package&#125;/overall</code>
				</div>
                <p class="mb-4 text-gray-400">
					Get overall download time series for a package.
				</p>
				<div class="mb-4">
                    <strong class="text-gray-100">Parameters:</strong>
                    <ul class="mt-2 list-disc pl-6 text-gray-400">
						<li><code>mirrors</code> (optional): Include mirror downloads (true/false)</li>
					</ul>
				</div>
				<div class="mb-4">
                    <strong class="text-gray-100">Example:</strong>
                    <div class="mt-2 rounded-md bg-gray-950 p-4">
                        <code class="text-sm text-gray-200">GET /api/packages/numpy/overall?mirrors=true</code>
					</div>
				</div>
			</div>
			
			<!-- Python Major -->
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
                <h3 class="mb-3 text-xl font-semibold text-gray-100">Python Major Version Downloads</h3>
                <div class="mb-4 rounded-md bg-gray-950 p-4">
                    <code class="text-sm text-gray-200">GET /api/packages/&#123;package&#125;/python_major</code>
				</div>
                <p class="mb-4 text-gray-400">
					Get download statistics by Python major version (2.x, 3.x).
				</p>
				<div class="mb-4">
                    <strong class="text-gray-100">Parameters:</strong>
                    <ul class="mt-2 list-disc pl-6 text-gray-400">
						<li><code>version</code> (optional): Filter by Python major version (2, 3)</li>
					</ul>
				</div>
				<div class="mb-4">
                    <strong class="text-gray-100">Example:</strong>
                    <div class="mt-2 rounded-md bg-gray-950 p-4">
                        <code class="text-sm text-gray-200">GET /api/packages/numpy/python_major?version=3</code>
					</div>
				</div>
			</div>
			
			<!-- Python Minor -->
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
                <h3 class="mb-3 text-xl font-semibold text-gray-100">Python Minor Version Downloads</h3>
                <div class="mb-4 rounded-md bg-gray-950 p-4">
                    <code class="text-sm text-gray-200">GET /api/packages/&#123;package&#125;/python_minor</code>
				</div>
                <p class="mb-4 text-gray-400">
					Get download statistics by Python minor version (2.7, 3.6, 3.7, etc.).
				</p>
				<div class="mb-4">
                    <strong class="text-gray-100">Parameters:</strong>
                    <ul class="mt-2 list-disc pl-6 text-gray-400">
						<li><code>version</code> (optional): Filter by Python minor version (2.7, 3.6, etc.)</li>
					</ul>
				</div>
				<div class="mb-4">
                    <strong class="text-gray-100">Example:</strong>
                    <div class="mt-2 rounded-md bg-gray-950 p-4">
                        <code class="text-sm text-gray-200">GET /api/packages/numpy/python_minor?version=3.8</code>
					</div>
				</div>
			</div>
			
			<!-- System -->
            <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
                <h3 class="mb-3 text-xl font-semibold text-gray-100">System Downloads</h3>
                <div class="mb-4 rounded-md bg-gray-950 p-4">
                    <code class="text-sm text-gray-200">GET /api/packages/&#123;package&#125;/system</code>
				</div>
                <p class="mb-4 text-gray-400">
					Get download statistics by operating system (Windows, Linux, macOS).
				</p>
				<div class="mb-4">
                    <strong class="text-gray-100">Parameters:</strong>
                    <ul class="mt-2 list-disc pl-6 text-gray-400">
						<li><code>os</code> (optional): Filter by operating system (Windows, Linux, Darwin)</li>
					</ul>
				</div>
				<div class="mb-4">
                    <strong class="text-gray-100">Example:</strong>
                    <div class="mt-2 rounded-md bg-gray-950 p-4">
                        <code class="text-sm text-gray-200">GET /api/packages/numpy/system?os=Linux</code>
					</div>
				</div>
			</div>
		</div>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Response Format</h2>
        <p class="mb-4 text-gray-400">
			All API endpoints return JSON responses with the following structure:
		</p>
        <div class="mb-6 rounded-md bg-gray-900 p-4">
            <pre class="text-sm text-gray-200"><code>{`{
  "package": "package-name",
  "type": "endpoint_type",
  "data": [...]
}`}</code></pre>
		</div>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Error Handling</h2>
        <p class="mb-4 text-gray-400">
			The API uses standard HTTP status codes:
		</p>
        <ul class="mb-6 list-disc pl-6 text-gray-400">
			<li><strong>200:</strong> Success</li>
			<li><strong>404:</strong> Package not found</li>
			<li><strong>500:</strong> Internal server error</li>
		</ul>
		
        <h2 class="mt-8 mb-4 text-2xl font-semibold text-gray-100">Rate Limiting</h2>
        <p class="mb-6 text-gray-400">
			We may implement rate limiting to ensure fair usage. Please be respectful of our servers 
			and implement appropriate caching in your applications.
		</p>
	</div>
</div> 