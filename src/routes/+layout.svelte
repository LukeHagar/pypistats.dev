<script lang="ts">
	import '../app.css';
</script>


<div class="min-h-screen bg-gray-950 text-gray-100">
	<!-- Navigation -->
	<nav class="bg-gray-900 shadow-sm border-b border-gray-800">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="text-xl font-bold text-gray-100">
							PyPI Stats
						</a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a href="/" class="border-transparent text-gray-300 hover:border-gray-600 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Home
						</a>
						<a href="/about" class="border-transparent text-gray-300 hover:border-gray-600 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							About
						</a>
						<a href="/faqs" class="border-transparent text-gray-300 hover:border-gray-600 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							FAQs
						</a>
						<a href="/api" class="border-transparent text-gray-300 hover:border-gray-600 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							API
						</a>
                        
					</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main content -->
	<main>
		<slot />
	</main>

	<!-- Footer -->
	<footer class="bg-gray-900 border-t border-gray-800 mt-16">
		<div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div class="text-center text-gray-400 text-sm">
				<p>PyPI Stats - Download statistics for Python packages</p>
			</div>
		</div>
	</footer>
</div>
