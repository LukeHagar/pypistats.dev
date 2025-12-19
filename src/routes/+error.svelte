<script lang="ts">
	import { page } from '$app/stores';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="mx-auto max-w-3xl py-16">
	<Card class="p-8">
		<h1 class="text-2xl font-semibold">Something went wrong</h1>
		<p class="mt-2 text-sm text-[var(--color-surface-400-600)]">
			We hit an unexpected error while loading this page.
		</p>

		<div class="mt-6 space-y-2 text-sm text-[var(--color-surface-400-600)]">
			<div>
				<span class="font-medium text-[var(--color-surface-50-950)]">Status:</span>
				{$page.status}
			</div>
			{#if $page.error?.message}
				<div>
					<span class="font-medium text-[var(--color-surface-50-950)]">Message:</span>
					{$page.error.message}
				</div>
			{/if}
			{#if $page.error?.requestId}
				<div>
					<span class="font-medium text-[var(--color-surface-50-950)]">Request ID:</span>
					<code class="rounded bg-[var(--color-surface-100-900)] px-2 py-0.5 text-[var(--color-surface-50-950)]"
						>{$page.error.requestId}</code
					>
				</div>
			{/if}
		</div>

		<div class="mt-8 flex flex-wrap gap-3">
			<Button href="/">Go home</Button>
			<Button href="/search" variant="surface">Search packages</Button>
		</div>
	</Card>
</div>


