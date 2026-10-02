<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import type { Athlete } from '$lib/domain/types';
	export let athletes: Athlete[];
	export let selectedId = '';
	export let onSelect: ((id: string) => void) | undefined = undefined;
	function select(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		if (id) onSelect?.(id);
	}
</script>

<div class="relative mt-2">
	<label for="athlete-picker" class="sr-only">Velg utøver</label>
	<select
		id="athlete-picker"
		value={selectedId}
		on:change={select}
		class="w-full appearance-none rounded-full border px-4 py-2 pr-9 text-base outline-none bg-[var(--card)] border-[var(--br)] text-[var(--p1)]"
	>
		<option value="">— Velg utøver —</option>{#each athletes as athlete (athlete.id)}<option
				value={athlete.id}>{athlete.name}</option
			>{/each}
	</select><ChevronDown
		class="h-4 w-4 text-[var(--p1)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
	/>
</div>
