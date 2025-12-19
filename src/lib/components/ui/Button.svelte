<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'surface';
	type ButtonSize = 'sm' | 'md' | 'lg';

	type Props = {
		href?: string;
		target?: string;
		rel?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		'aria-label'?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	};

	let {
		href,
		target,
		rel,
		type = 'button',
		disabled = false,
		variant = 'primary',
		size = 'md',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const sizeClass = $derived(
		size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-base'
	);

	const presetClass = $derived(
		variant === 'secondary'
			? 'preset-filled-secondary-500'
			: variant === 'surface'
				? 'preset-filled'
				: 'preset-filled-primary-500'
	);

	const classes = $derived(`btn ${sizeClass} ${presetClass} ${className}`.trim());
</script>

{#if href}
	<a class={classes} href={href} target={target} rel={rel} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button class={classes} type={type} disabled={disabled} {...rest}>
		{@render children?.()}
	</button>
{/if}


