<script lang="ts">
	import { tick } from 'svelte';
	import {
		addDays,
		addMonths,
		addWeeks,
		addYears,
		format,
		getISOWeek,
		isSameDay,
		isSameMonth,
		startOfDay,
		startOfMonth,
		startOfWeek
	} from 'date-fns';
	import { nb } from 'date-fns/locale';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import DayPlanCarousel from '$lib/components/training/DayPlanCarousel.svelte';
	import { dragCarousel } from '$lib/client/dragCarousel';
	import { horizontalSwipe } from '$lib/client/swipe';
	import type { Workout, SharedWorkout } from '$lib/domain/types';
	import { calendarDays, workoutsByDate } from './calendar';
	export let workouts: Workout[];
	export let shared: SharedWorkout[];
	export let athleteName: string;
	export let selected = startOfDay(new Date());
	export let view: 'week' | 'month' | 'year' = 'week';
	let cursor = startOfMonth(selected);
	let calendarElement: HTMLElement;
	const today = startOfDay(new Date());
	const weekdays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
	const weekdayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
	$: byDate = workoutsByDate(workouts);
	$: weekStart = startOfWeek(selected, { weekStartsOn: 1 });
	$: weeks = [-1, 0, 1].map((offset) => ({
		offset,
		days: Array.from({ length: 7 }, (_, index) => addDays(addWeeks(weekStart, offset), index))
	}));
	$: monthDays = calendarDays(cursor);
	$: months = Array.from({ length: 12 }, (_, index) => new Date(cursor.getFullYear(), index, 1));
	const yearOptions = Array.from({ length: 101 }, (_, index) => today.getFullYear() - 80 + index);
	$: if (selected) cursor = startOfMonth(selected);

	function navigate(direction: number) {
		if (view === 'week') selected = addWeeks(selected, direction);
		else if (view === 'month') cursor = addMonths(cursor, direction);
		else cursor = addYears(cursor, direction);
	}
	async function zoomOut(event: MouseEvent) {
		if (view === 'week') {
			cursor = startOfMonth(selected);
			view = 'month';
		} else if (view === 'month') view = 'year';
		await tick();
		if (event.detail === 0)
			calendarElement.querySelector<HTMLElement>('.year-picker select, .calendar-heading')?.focus();
	}
	async function chooseDay(day: Date, event: MouseEvent) {
		selected = startOfDay(day);
		view = 'week';
		await tick();
		if (event.detail === 0)
			calendarElement.querySelector<HTMLElement>('.week-day[aria-pressed="true"]')?.focus();
	}
	async function chooseMonth(month: Date, event: MouseEvent) {
		cursor = month;
		view = 'month';
		await tick();
		if (event.detail === 0)
			calendarElement.querySelector<HTMLElement>('.calendar-heading')?.focus();
	}
	function goToday() {
		selected = today;
		cursor = startOfMonth(today);
		view = 'week';
	}
	function dayLabel(day: Date) {
		const count = byDate.get(format(day, 'yyyy-MM-dd'))?.length ?? 0;
		return `${format(day, 'EEEE d. MMMM yyyy', { locale: nb })}, ${count} ${count === 1 ? 'økt' : 'økter'}`;
	}
</script>

<section
	bind:this={calendarElement}
	class="plan-calendar bg-card rounded-[1.75rem] px-5 pt-6 pb-7 sm:px-10 sm:pt-8 sm:pb-10 max-[360px]:px-4"
	class:week-view={view === 'week'}
	aria-label="Treningskalender"
>
	<div class="calendar-content mx-auto max-w-[43rem]">
		<div class="calendar-toolbar flex items-center justify-between gap-1">
			{#if view === 'year'}
				<label class="year-picker">
					<span class="sr-only">Velg år</span>
					<select
						class="text-primary bg-card font-bold text-[1rem] min-h-11 pr-2"
						value={cursor.getFullYear()}
						on:change={(event) =>
							(cursor = new Date(Number(event.currentTarget.value), cursor.getMonth(), 1))}
					>
						{#if !yearOptions.includes(cursor.getFullYear())}<option value={cursor.getFullYear()}
								>{cursor.getFullYear()}</option
							>{/if}
						{#each yearOptions as year (year)}<option value={year}>{year}</option>{/each}
					</select>
				</label>
			{:else}
				<button
					type="button"
					class="calendar-heading flex items-center gap-0.5 text-primary text-[1.125rem] font-[650] text-left min-h-11 leading-[1.3] sm:text-[1.5rem] {view ===
					'week'
						? 'max-sm:text-[1rem]'
						: 'max-[360px]:text-[1rem]'}"
					aria-label={view === 'week' ? 'Vis måned' : 'Vis år'}
					on:click={zoomOut}
				>
					{#if view === 'week'}Uke {getISOWeek(selected)}, {format(selected, 'MMMM', {
							locale: nb
						})}
					{:else}<ChevronLeft size={18} /> {cursor.getFullYear()}{/if}
				</button>
			{/if}
			<div class="calendar-actions flex items-center shrink-0">
				<button
					type="button"
					class="today-button px-2 min-h-11 text-primary text-[0.8125rem] hover:bg-surface {view ===
					'week'
						? 'max-sm:text-[0.75rem]'
						: ''}"
					on:click={goToday}>I dag</button
				>
				<button
					type="button"
					class="arrow flex items-center justify-center w-8 h-11 sm:w-11 text-primary rounded-xl hover:bg-surface"
					aria-label={view === 'week'
						? 'Forrige uke'
						: view === 'month'
							? 'Forrige måned'
							: 'Forrige år'}
					on:click={() => navigate(-1)}><ChevronLeft size={20} /></button
				>
				<button
					type="button"
					class="arrow flex items-center justify-center w-8 h-11 sm:w-11 text-primary rounded-xl hover:bg-surface"
					aria-label={view === 'week' ? 'Neste uke' : view === 'month' ? 'Neste måned' : 'Neste år'}
					on:click={() => navigate(1)}><ChevronRight size={20} /></button
				>
			</div>
		</div>
		{#if view === 'week'}
			<p class="date-caption mt-0.5 text-[0.75rem] max-sm:text-[0.6875rem] text-muted">
				{format(weekStart, 'd. MMM', { locale: nb })} – {format(
					addDays(weekStart, 6),
					'd. MMM yyyy',
					{ locale: nb }
				)}
			</p>
			<div
				class="week-viewport overflow-hidden mt-6 sm:mt-8 -mx-1.5 mb-[1.625rem] max-md:touch-pan-y"
				use:dragCarousel={{
					key: selected.getTime(),
					onChange: (direction) => (selected = addWeeks(selected, direction)),
					allowButtons: true
				}}
			>
				<div class="week-track relative" data-carousel-track>
					{#each weeks as week (week.offset)}
						<div
							class="week-grid week-panel grid grid-cols-7 top-0 left-0 w-full max-md:touch-pan-y {week.offset ===
							0
								? 'relative'
								: 'absolute'}"
							class:current={week.offset === 0}
							style:transform={`translateX(${week.offset * 100}%)`}
							aria-hidden={week.offset !== 0}
							inert={week.offset !== 0}
						>
							{#each week.days as day, index (format(day, 'yyyy-MM-dd'))}
								{@const daySessions = byDate.get(format(day, 'yyyy-MM-dd')) ?? []}
								<button
									type="button"
									class="week-day flex flex-col items-center min-w-0 max-md:touch-pan-y"
									aria-label={dayLabel(day)}
									aria-pressed={isSameDay(day, selected)}
									aria-current={isSameDay(day, today) ? 'date' : undefined}
									on:click={() => (selected = day)}
								>
									<span
										class="weekday mb-3 text-muted text-[0.9375rem] max-sm:text-[0.875rem] text-center font-[550]"
										aria-hidden="true">{weekdays[index]}</span
									>
									<span
										class="day-number flex items-center justify-center size-10 sm:size-12 max-[360px]:size-[34px] rounded-full text-[1.375rem] sm:text-[1.625rem] max-sm:text-[1.25rem] {isSameDay(
											day,
											selected
										)
											? 'bg-primary text-white font-semibold'
											: isSameDay(day, today)
												? 'text-primary font-[450]'
												: 'font-[450]'}"
										class:selected={isSameDay(day, selected)}
										class:today={isSameDay(day, today)}>{format(day, 'd')}</span
									>
									<span
										class="session-dots flex items-center justify-center gap-[3px] h-3"
										aria-hidden="true"
										>{#each daySessions.slice(0, 3) as _, dot (dot)}<span
												class="size-1 rounded-full bg-calendar-dot"
											></span>{/each}</span
									>
								</button>
							{/each}
						</div>
					{/each}
				</div>
			</div>
			<div class="day-content border-t border-divider max-md:touch-pan-y">
				<DayPlanCarousel bind:selected {byDate} {shared} {athleteName} />
			</div>
		{:else if view === 'month'}
			<h2 class="month-title text-[1.875rem] font-bold capitalize mt-4 mb-6">
				{format(cursor, 'MMMM', { locale: nb })}
			</h2>
			<div
				class="month-grid grid grid-cols-7 gap-y-2 gap-x-0 -mx-1.5 max-md:touch-pan-y"
				use:horizontalSwipe={navigate}
			>
				{#each weekdays as day, index (index)}<span
						class="weekday mb-2 text-muted text-[0.9375rem] text-center font-[550]"
						aria-label={weekdayNames[index]}>{day}</span
					>{/each}
				{#each monthDays as day (format(day, 'yyyy-MM-dd'))}
					{@const daySessions = byDate.get(format(day, 'yyyy-MM-dd')) ?? []}
					<button
						type="button"
						class="month-day flex flex-col items-center min-w-0 rounded-xl hover:bg-surface max-md:touch-pan-y {!isSameMonth(
							day,
							cursor
						)
							? 'opacity-[0.35]'
							: ''}"
						class:outside={!isSameMonth(day, cursor)}
						aria-label={dayLabel(day)}
						aria-pressed={isSameDay(day, selected)}
						aria-current={isSameDay(day, today) ? 'date' : undefined}
						on:click={(event) => chooseDay(day, event)}
					>
						<span
							class="day-number flex items-center justify-center size-10 sm:size-12 max-[360px]:size-[34px] rounded-full text-[1.375rem] sm:text-[1.625rem] max-[360px]:text-[1.25rem] {isSameDay(
								day,
								selected
							)
								? 'bg-primary text-white font-semibold'
								: isSameDay(day, today)
									? 'text-primary font-[450]'
									: 'font-[450]'}"
							class:selected={isSameDay(day, selected)}
							class:today={isSameDay(day, today)}>{format(day, 'd')}</span
						>
						<span
							class="session-dots flex items-center justify-center gap-[3px] h-3"
							aria-hidden="true"
							>{#each daySessions.slice(0, 3) as _, dot (dot)}<span
									class="size-1 rounded-full bg-calendar-dot"
								></span>{/each}</span
						>
					</button>
				{/each}
			</div>
		{:else}
			<h2 class="sr-only">Årsvisning {cursor.getFullYear()}</h2>
			<div
				class="year-grid grid grid-cols-3 max-[360px]:grid-cols-2 gap-y-6 gap-x-3 sm:gap-8 mt-6 max-md:touch-pan-y"
				use:horizontalSwipe={navigate}
			>
				{#each months as month (month.getMonth())}
					<button
						type="button"
						class="mini-month text-left rounded-lg self-start max-md:touch-pan-y"
						aria-label={`Vis ${format(month, 'MMMM yyyy', { locale: nb })}`}
						on:click={(event) => chooseMonth(month, event)}
					>
						<span
							class="mini-month-title block text-primary capitalize font-semibold text-[0.8125rem] sm:text-[1rem] mb-2"
							>{format(month, 'MMMM', { locale: nb })}</span
						>
						<span
							class="mini-grid grid grid-cols-7 text-[0.5625rem] sm:text-[0.75rem] text-center gap-x-0 gap-y-[0.1875rem] sm:gap-y-1.5"
							aria-hidden="true"
						>
							{#each weekdays as day, index (index)}<span
									class="mini-weekday text-muted text-[0.5rem] sm:text-[0.625rem]">{day}</span
								>{/each}
							{#each calendarDays(month) as day (format(day, 'yyyy-MM-dd'))}
								<span
									class="mini-day relative py-0.5 {isSameDay(day, today)
										? 'text-primary font-bold'
										: ''}"
									class:mini-today={isSameDay(day, today)}
									>{isSameMonth(day, month) ? format(day, 'd') : ''}</span
								>
							{/each}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>
