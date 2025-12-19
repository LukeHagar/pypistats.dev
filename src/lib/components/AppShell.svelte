<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { Dialog } from '@skeletonlabs/skeleton-svelte';

	let { children }: { children?: Snippet } = $props();

	type NavItem = { href: string; label: string };
	const navItems: NavItem[] = [
		{ href: '/', label: 'Home' },
		{ href: '/search', label: 'Search' },
		{ href: '/about', label: 'About' },
		{ href: '/faqs', label: 'FAQs' },
		{ href: '/api', label: 'API' }
	];

	let mobileOpen = $state(false);

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		return href === '/' ? path === '/' : path.startsWith(href);
	}
</script>

<div class="min-h-screen">
	<header class="sticky top-0 z-10 border-b border-subtle bg-inset backdrop-blur">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<a href="/" class="text-lg font-bold tracking-tight text-strong">
				PyPI Stats
			</a>

			<!-- Desktop Nav -->
			<nav class="hidden items-center gap-2 sm:flex" aria-label="Primary">
				{#each navItems as item}
					<a
						href={item.href}
						class={`btn btn-sm ${
							isActive(item.href)
								? 'preset-filled-primary-500'
								: 'preset-outlined-surface-200-800'
						}`}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Mobile Nav Trigger -->
			<div class="sm:hidden">
				<Dialog open={mobileOpen} onOpenChange={(d: any) => (mobileOpen = Boolean(d?.open))}>
					<Dialog.Trigger class="btn btn-sm preset-outlined-surface-200-800" aria-label="Open menu"
						>Menu</Dialog.Trigger
					>

					<Dialog.Backdrop class="fixed inset-0 bg-[rgb(0_0_0_/_0.55)]" />
					<Dialog.Positioner class="fixed inset-0 flex items-start justify-end p-4">
						<Dialog.Content class="card preset-filled w-full max-w-xs p-4 shadow-xl">
							<div class="flex items-center justify-between">
								<div class="text-sm font-semibold text-strong">Menu</div>
								<Dialog.CloseTrigger class="btn btn-sm preset-outlined-surface-200-800" aria-label="Close menu"
									>Close</Dialog.CloseTrigger
								>
							</div>

							<div class="mt-4 flex flex-col gap-2">
								{#each navItems as item}
									<a
										href={item.href}
										class={`btn ${
											isActive(item.href)
												? 'preset-filled-primary-500'
												: 'preset-outlined-surface-200-800'
										}`}
										onclick={() => (mobileOpen = false)}
									>
										{item.label}
									</a>
								{/each}
							</div>
						</Dialog.Content>
					</Dialog.Positioner>
				</Dialog>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		{@render children?.()}
	</main>

	<footer class="mx-auto mt-16 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
		<div class="text-center text-sm text-muted">
			PyPI Stats - Download statistics for Python packages
		</div>
	</footer>
</div>


