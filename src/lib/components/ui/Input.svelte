<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		name?: string;
		type?: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		class?: string;
		oninput?: (event: Event) => void;
	};

	let {
		name,
		type = 'text',
		value = $bindable(''),
		placeholder,
		required = false,
		disabled = false,
		autocomplete,
		class: className = '',
		...rest
	}: Props = $props();
</script>

<input
	class={`input ${className}`.trim()}
	{type}
	{name}
	bind:value={value}
	{placeholder}
	{required}
	{disabled}
	{autocomplete}
	{...rest}
/>


