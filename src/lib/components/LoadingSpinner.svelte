<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		text?: string;
	}

	let { size = 'md', text }: Props = $props();
</script>

<div class="flex items-center justify-center gap-2">
	<div class="animate-spin rounded-full border-2 border-gray-600 border-t-blue-500 {size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'}"></div>
	{#if text}
		<span class="text-sm text-gray-400">{text}</span>
	{/if}
</div>
