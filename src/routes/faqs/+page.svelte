<svelte:head>
	<title>FAQs - PyPI Stats</title>
	<meta name="description" content="Frequently asked questions about PyPI Stats" />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="mb-8 text-3xl font-bold text-gray-100">Frequently Asked Questions</h1>
	
	<div class="space-y-8">
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">What is PyPI Stats?</h2>
            <p class="text-gray-400">
				PyPI Stats is a service that provides download statistics for Python packages from the Python Package Index (PyPI). 
				We collect and process download data to help developers understand package usage patterns.
			</p>
		</div>
		
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">How accurate is the data?</h2>
            <p class="text-gray-400">
				Our data comes directly from PyPI's download logs, so it represents actual downloads from PyPI's CDN. 
				However, this may not capture all downloads if users are using mirrors or other distribution methods.
			</p>
		</div>
		
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">How often is the data updated?</h2>
            <p class="text-gray-400">
				We process new data daily from PyPI's BigQuery dataset. Recent statistics (day, week, month) are updated more frequently.
			</p>
		</div>
		
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">What do the different download categories mean?</h2>
            <ul class="list-disc pl-6 text-gray-400">
				<li><strong>Overall:</strong> Total downloads, with options for including or excluding mirror downloads</li>
				<li><strong>Python Major:</strong> Downloads by Python major version (2.x vs 3.x)</li>
				<li><strong>Python Minor:</strong> Downloads by specific Python versions (2.7, 3.6, 3.7, etc.)</li>
				<li><strong>System:</strong> Downloads by operating system (Windows, Linux, macOS)</li>
			</ul>
		</div>
		
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">Is the API free to use?</h2>
            <p class="text-gray-400">
				Yes, all our API endpoints are free to use. We don't require authentication for basic usage, 
				though we may implement rate limiting to ensure fair usage.
			</p>
		</div>
		
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">How do I use the API?</h2>
            <p class="text-gray-400">
				Our API provides RESTful endpoints that return JSON data. You can find detailed documentation 
                on our <a href="/api" class="text-blue-400 hover:text-blue-300">API page</a>.
			</p>
		</div>
		
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">Why don't I see data for my package?</h2>
            <p class="text-gray-400">
				If your package doesn't appear in our database, it might be because:
			</p>
            <ul class="list-disc pl-6 text-gray-400">
				<li>The package has very few downloads</li>
				<li>The package is relatively new and hasn't been processed yet</li>
				<li>There might be an issue with the package name format</li>
			</ul>
		</div>
		
		<div>
            <h2 class="mb-3 text-xl font-semibold text-gray-100">Can I contribute to PyPI Stats?</h2>
            <p class="text-gray-400">
				Yes! PyPI Stats is open source. You can contribute by reporting bugs, suggesting features, 
				or submitting pull requests on our GitHub repository.
			</p>
		</div>
	</div>
</div> 