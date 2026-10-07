<script lang="ts">
	import {
		addDays,
		addMonths,
		subMonths,
		setMonth,
		setYear,
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
	const months = Array.from({ length: 12 }, (_, month) => ({
		value: month,
		label: format(new Date(2000, month, 1), 'MMMM', { locale: nb })
	}));
	$: firstYear = Math.min(today.getFullYear() - 20, selected.getFullYear(), cursor.getFullYear());
	$: lastYear = Math.max(today.getFullYear() + 10, selected.getFullYear(), cursor.getFullYear());
	$: years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
	$: days = [
		...Array<Date | null>((getDay(cursor) + 6) % 7).fill(null),
		...Array.from({ length: endOfMonth(cursor).getDate() }, (_, i) => addDays(cursor, i))
	];
</script>

<Dialog title="Velg dato" variant="calendar" {onClose}>
	<div class="p-5 pt-14">
		<div class="flex items-center gap-2 mb-4">
			<button
				type="button"
				aria-label="Forrige måned"
				on:click={() => (cursor = subMonths(cursor, 1))}
				class="shrink-0 bg-surface rounded-xl p-2"
				><ChevronLeft class="h-4 w-4 text-primary" /></button
			>
			<div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2 min-w-0 flex-1">
				<select
					aria-label="Velg måned"
					value={cursor.getMonth()}
					on:change={(event) => (cursor = setMonth(cursor, Number(event.currentTarget.value)))}
					class="min-w-0 w-full bg-surface text-foreground rounded-xl px-2 py-2 text-sm font-semibold capitalize"
				>
					{#each months as month (month.value)}
						<option value={month.value}>{month.label}</option>
					{/each}
				</select>
				<select
					aria-label="Velg år"
					value={cursor.getFullYear()}
					on:change={(event) => (cursor = setYear(cursor, Number(event.currentTarget.value)))}
					class="bg-surface text-foreground rounded-xl px-2 py-2 text-sm font-semibold"
				>
					{#each years as year (year)}
						<option value={year}>{year}</option>
					{/each}
				</select>
			</div>
			<button
				type="button"
				aria-label="Neste måned"
				on:click={() => (cursor = addMonths(cursor, 1))}
				class="shrink-0 bg-surface rounded-xl p-2"
				><ChevronRight class="h-4 w-4 text-primary" /></button
			>
		</div>
		<div class="grid grid-cols-7 gap-1 mb-1">
			{#each ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'] as d (d)}<div
					class="text-center text-xs font-bold text-muted py-1"
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
							? 'bg-primary text-white font-bold'
							: isSameDay(day, today)
								? 'bg-secondary text-primary font-bold'
								: 'hover:bg-surface'}">{format(day, 'd')}</button
					>
				{:else}<div></div>{/if}{/each}
		</div>
		<button
			type="button"
			on:click={() => onSelect(today)}
			class="w-full mt-4 py-2.5 rounded-xl border border-primary bg-primary-soft text-primary text-sm font-semibold"
			>Gå til i dag</button
		>
	</div>
</Dialog>
