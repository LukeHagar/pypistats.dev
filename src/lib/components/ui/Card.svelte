<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		children?: Snippet;
	};

	let { class: className = '', padding = 'md', children }: Props = $props();

	const paddingClass = $derived(
		padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6'
	);

	// `card` provides the Skeleton card utility (radius, hover behavior via `card-hover` when needed).
	// `preset-filled` sets a theme-aware surface + text color pair.
	const classes = $derived(`card preset-filled ${paddingClass} ${className}`.trim());
</script>

<div class={classes}>
	{@render children?.()}
</div>


