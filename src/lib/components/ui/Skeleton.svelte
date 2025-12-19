<script lang="ts">
	type Props = {
		/** Tailwind width class, e.g. "w-full", "w-32", "w-[12rem]" */
		w?: string;
		/** Tailwind height class, e.g. "h-4", "h-8", "h-[320px]" */
		h?: string;
		rounded?: 'sm' | 'md' | 'lg' | 'full';
		class?: string;
	};

	let { w = 'w-full', h = 'h-4', rounded = 'md', class: className = '' }: Props = $props();

	const roundedClass = $derived(
		rounded === 'full'
			? 'rounded-full'
			: rounded === 'lg'
				? 'rounded-lg'
				: rounded === 'sm'
					? 'rounded-sm'
					: 'rounded-md'
	);
</script>

<div class={`placeholder animate-pulse ${w} ${h} ${roundedClass} ${className}`.trim()}></div>


