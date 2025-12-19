<script lang="ts">
	import type { Snippet } from 'svelte';

	type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'surface';

	type Props = {
		variant?: BadgeVariant;
		class?: string;
		children?: Snippet;
	};

	let { variant = 'surface', class: className = '', children }: Props = $props();

	const presetClass = $derived(
		variant === 'primary'
			? 'preset-filled-primary-500'
			: variant === 'secondary'
				? 'preset-filled-secondary-500'
				: variant === 'success'
					? 'preset-filled-success-500'
					: variant === 'warning'
						? 'preset-filled-warning-500'
						: variant === 'error'
							? 'preset-filled-error-500'
							: 'preset-filled'
	);

	const classes = $derived(`badge ${presetClass} ${className}`.trim());
</script>

<span class={classes}>
	{@render children?.()}
</span>


