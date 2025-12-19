<script lang="ts">
	import Skeleton from './Skeleton.svelte';

	type Props = {
		rows?: number;
		rowHeight?: string;
		class?: string;
	};

	let { rows = 5, rowHeight = 'h-4', class: className = '' }: Props = $props();
</script>

<div class={`space-y-3 ${className}`.trim()} aria-busy="true" aria-live="polite">
	{#each Array.from({ length: rows }) as _}
		<Skeleton h={rowHeight} />
	{/each}
</div>


