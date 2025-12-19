<script lang="ts">
	import Skeleton from './Skeleton.svelte';

	type Props = {
		cols?: number;
		rows?: number;
		class?: string;
	};

	let { cols = 3, rows = 5, class: className = '' }: Props = $props();
</script>

<div class={`table-wrap ${className}`.trim()} aria-busy="true" aria-live="polite">
	<table class="table">
		<thead>
			<tr>
				{#each Array.from({ length: cols }) as _}
					<th><Skeleton h="h-3" w="w-20" /></th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each Array.from({ length: rows }) as _row}
				<tr>
					{#each Array.from({ length: cols }) as _col}
						<td><Skeleton h="h-4" /></td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>


