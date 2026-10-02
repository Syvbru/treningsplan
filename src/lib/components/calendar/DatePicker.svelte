<script lang="ts">
	import {
		addDays,
		addMonths,
		subMonths,
		startOfMonth,
		endOfMonth,
		getDay,
		isSameDay,
		format
	} from 'date-fns';
	import { nb } from 'date-fns/locale';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	export let selected: Date;
	export let onSelect: (date: Date) => void;
	export let onClose: () => void;
	let cursor = startOfMonth(selected);
	const today = new Date();
	$: days = [
		...Array<Date | null>((getDay(cursor) + 6) % 7).fill(null),
		...Array.from({ length: endOfMonth(cursor).getDate() }, (_, i) => addDays(cursor, i))
	];
</script>

<Dialog title="Velg dato" variant="calendar" {onClose}>
	<div class="p-5 pt-14">
		<div class="flex items-center justify-between mb-4">
			<button
				type="button"
				aria-label="Forrige måned"
				on:click={() => (cursor = subMonths(cursor, 1))}
				class="bg-[var(--surface)] rounded-xl p-2"
				><ChevronLeft class="h-4 w-4 text-[var(--p1)]" /></button
			>
			<h2 class="font-bold capitalize">{format(cursor, 'MMMM yyyy', { locale: nb })}</h2>
			<button
				type="button"
				aria-label="Neste måned"
				on:click={() => (cursor = addMonths(cursor, 1))}
				class="bg-[var(--surface)] rounded-xl p-2"
				><ChevronRight class="h-4 w-4 text-[var(--p1)]" /></button
			>
		</div>
		<div class="grid grid-cols-7 gap-1 mb-1">
			{#each ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'] as d (d)}<div
					class="text-center text-xs font-bold text-[var(--text2)] py-1"
				>
					{d}
				</div>{/each}
		</div>
		<div class="grid grid-cols-7 gap-1">
			{#each days as day, i (i)}{#if day}
					<button
						type="button"
						aria-label={format(day, 'd. MMMM yyyy', { locale: nb })}
						aria-pressed={isSameDay(day, selected)}
						on:click={() => onSelect(day)}
						class="aspect-square rounded-lg text-sm flex items-center justify-center {isSameDay(
							day,
							selected
						)
							? 'bg-[var(--p1)] text-white font-bold'
							: isSameDay(day, today)
								? 'bg-[var(--p2)] text-[var(--p1)] font-bold'
								: 'hover:bg-[var(--surface)]'}">{format(day, 'd')}</button
					>
				{:else}<div></div>{/if}{/each}
		</div>
		<button
			type="button"
			on:click={() => onSelect(today)}
			class="w-full mt-4 py-2.5 rounded-xl border border-[var(--p1)] bg-[var(--p3)] text-[var(--p1)] text-sm font-semibold"
			>Gå til i dag</button
		>
	</div>
</Dialog>
