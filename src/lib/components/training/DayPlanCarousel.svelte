<script lang="ts">
	import { dragCarousel } from '$lib/client/dragCarousel';
	import { addDays, format } from 'date-fns';
	import { nb } from 'date-fns/locale';
	import DayPlan from '$lib/components/training/DayPlan.svelte';
	import type { Workout, SharedWorkout } from '$lib/domain/types';

	export let selected: Date;
	export let byDate: Map<string, Workout[]>;
	export let shared: SharedWorkout[];
	export let athleteName: string;

	$: pages = [-1, 0, 1].map((offset) => {
		const date = addDays(selected, offset);
		const iso = format(date, 'yyyy-MM-dd');
		return { offset, date, iso, sessions: byDate.get(iso) ?? [] };
	});
</script>

<div
	class="day-viewport overflow-hidden min-h-[14rem] max-md:touch-pan-y"
	aria-live="polite"
	aria-atomic="true"
	use:dragCarousel={{
		key: selected.getTime(),
		onChange: (direction) => (selected = addDays(selected, direction))
	}}
>
	<div class="day-track relative" data-carousel-track>
		{#each pages as page (page.offset)}
			<div
				class="day-panel top-0 left-0 w-full {page.offset === 0 ? 'relative' : 'absolute'}"
				class:current={page.offset === 0}
				style:transform={`translateX(${page.offset * 100}%)`}
				aria-hidden={page.offset !== 0}
				inert={page.offset !== 0}
			>
				<h2 class="sr-only">{format(page.date, 'EEEE d. MMMM yyyy', { locale: nb })}</h2>
				<DayPlan date={page.iso} sessions={page.sessions} {shared} {athleteName} />
			</div>
		{/each}
	</div>
</div>
