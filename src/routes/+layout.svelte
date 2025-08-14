<script lang="ts">
	import '../app.css';
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/" class="text-xl font-bold text-gray-900">
							PyPI Stats
						</a>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a href="/" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Home
						</a>
						<a href="/about" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							About
						</a>
						<a href="/faqs" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							FAQs
						</a>
						<a href="/api" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
	<footer class="bg-white border-t mt-16">
		<div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div class="text-center text-gray-500 text-sm">
				<p>PyPI Stats - Download statistics for Python packages</p>
			</div>
		</div>
	</footer>
</div>
