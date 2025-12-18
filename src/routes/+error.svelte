<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	<div class="rounded-lg border border-gray-800 bg-gray-900 p-8">
		<h1 class="text-2xl font-semibold text-gray-100">Something went wrong</h1>
		<p class="mt-2 text-gray-400">
			We hit an unexpected error while loading this page.
		</p>

		<div class="mt-6 space-y-2 text-sm text-gray-300">
			<div>
				<span class="font-medium text-gray-200">Status:</span>
				{$page.status}
			</div>
			{#if $page.error?.message}
				<div>
					<span class="font-medium text-gray-200">Message:</span>
					{$page.error.message}
				</div>
			{/if}
			{#if $page.error?.requestId}
				<div>
					<span class="font-medium text-gray-200">Request ID:</span>
					<code class="rounded bg-gray-950 px-2 py-0.5 text-gray-200">{$page.error.requestId}</code>
				</div>
			{/if}
		</div>

		<div class="mt-8 flex flex-wrap gap-3">
			<a
				class="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
				href="/"
				>Go home</a
			>
			<a
				class="inline-flex items-center rounded-md border border-gray-700 bg-gray-950 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
				href="/search"
				>Search packages</a
			>
		</div>
	</div>
</div>


