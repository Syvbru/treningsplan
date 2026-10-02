<script lang="ts">
	import { tick } from 'svelte';
	import {
		addDays,
		addMonths,
		addWeeks,
		addYears,
		endOfMonth,
		endOfWeek,
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
	import DayPlan from '$lib/components/training/DayPlan.svelte';
	import { horizontalSwipe } from '$lib/client/swipe';
	import type { Workout, SharedWorkout } from '$lib/domain/types';
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
	$: byDate = workouts.reduce((map, workout) => {
		map.set(workout.date, [...(map.get(workout.date) ?? []), workout]);
		return map;
	}, new Map<string, Workout[]>());
	$: selectedISO = format(selected, 'yyyy-MM-dd');
	$: sessions = byDate.get(selectedISO) ?? [];
	$: weekStart = startOfWeek(selected, { weekStartsOn: 1 });
	$: weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
	$: monthDays = calendarDays(cursor);
	$: months = Array.from({ length: 12 }, (_, index) => new Date(cursor.getFullYear(), index, 1));
	const yearOptions = Array.from({ length: 101 }, (_, index) => today.getFullYear() - 80 + index);
	$: if (selected) cursor = startOfMonth(selected);

	function calendarDays(month: Date) {
		const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
		const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
		const days: Date[] = [];
		for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
		return days;
	}
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
	class="plan-calendar"
	class:week-view={view === 'week'}
	aria-label="Treningskalender"
>
	<div class="calendar-content">
		<div class="calendar-toolbar">
			{#if view === 'year'}
				<label class="year-picker">
					<span class="sr-only">Velg år</span>
					<select
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
					class="calendar-heading"
					aria-label={view === 'week' ? 'Vis måned' : 'Vis år'}
					on:click={zoomOut}
				>
					{#if view === 'week'}Uke {getISOWeek(selected)}, {format(selected, 'MMMM', {
							locale: nb
						})}
					{:else}<ChevronLeft size={18} /> {cursor.getFullYear()}{/if}
				</button>
			{/if}
			<div class="calendar-actions">
				<button type="button" class="today-button" on:click={goToday}>I dag</button>
				<button
					type="button"
					class="arrow"
					aria-label={view === 'week'
						? 'Forrige uke'
						: view === 'month'
							? 'Forrige måned'
							: 'Forrige år'}
					on:click={() => navigate(-1)}><ChevronLeft size={20} /></button
				>
				<button
					type="button"
					class="arrow"
					aria-label={view === 'week' ? 'Neste uke' : view === 'month' ? 'Neste måned' : 'Neste år'}
					on:click={() => navigate(1)}><ChevronRight size={20} /></button
				>
			</div>
		</div>
		{#if view === 'week'}
			<p class="date-caption">
				{format(weekStart, 'd. MMM', { locale: nb })} – {format(
					addDays(weekStart, 6),
					'd. MMM yyyy',
					{ locale: nb }
				)}
			</p>
			<div
				class="week-grid"
				use:horizontalSwipe={(direction) => (selected = addWeeks(selected, direction))}
			>
				{#each weekDays as day, index (format(day, 'yyyy-MM-dd'))}
					{@const daySessions = byDate.get(format(day, 'yyyy-MM-dd')) ?? []}
					<button
						type="button"
						class="week-day"
						aria-label={dayLabel(day)}
						aria-pressed={isSameDay(day, selected)}
						aria-current={isSameDay(day, today) ? 'date' : undefined}
						on:click={() => (selected = day)}
					>
						<span class="weekday" aria-hidden="true">{weekdays[index]}</span>
						<span
							class="day-number"
							class:selected={isSameDay(day, selected)}
							class:today={isSameDay(day, today)}>{format(day, 'd')}</span
						>
						<span class="session-dots" aria-hidden="true"
							>{#each daySessions.slice(0, 3) as _, dot (dot)}<span></span>{/each}</span
						>
					</button>
				{/each}
			</div>
			<div
				class="day-content"
				aria-live="polite"
				aria-atomic="true"
				use:horizontalSwipe={(direction) => (selected = addDays(selected, direction))}
			>
				<h2 class="sr-only">{format(selected, 'EEEE d. MMMM yyyy', { locale: nb })}</h2>
				<DayPlan date={selectedISO} {sessions} {shared} {athleteName} />
			</div>
		{:else if view === 'month'}
			<h2 class="month-title">{format(cursor, 'MMMM', { locale: nb })}</h2>
			<div class="month-grid" use:horizontalSwipe={navigate}>
				{#each weekdays as day, index (index)}<span class="weekday" aria-label={weekdayNames[index]}
						>{day}</span
					>{/each}
				{#each monthDays as day (format(day, 'yyyy-MM-dd'))}
					{@const daySessions = byDate.get(format(day, 'yyyy-MM-dd')) ?? []}
					<button
						type="button"
						class="month-day"
						class:outside={!isSameMonth(day, cursor)}
						aria-label={dayLabel(day)}
						aria-pressed={isSameDay(day, selected)}
						aria-current={isSameDay(day, today) ? 'date' : undefined}
						on:click={(event) => chooseDay(day, event)}
					>
						<span
							class="day-number"
							class:selected={isSameDay(day, selected)}
							class:today={isSameDay(day, today)}>{format(day, 'd')}</span
						>
						<span class="session-dots" aria-hidden="true"
							>{#each daySessions.slice(0, 3) as _, dot (dot)}<span></span>{/each}</span
						>
					</button>
				{/each}
			</div>
		{:else}
			<h2 class="sr-only">Årsvisning {cursor.getFullYear()}</h2>
			<div class="year-grid" use:horizontalSwipe={navigate}>
				{#each months as month (month.getMonth())}
					<button
						type="button"
						class="mini-month"
						aria-label={`Vis ${format(month, 'MMMM yyyy', { locale: nb })}`}
						on:click={(event) => chooseMonth(month, event)}
					>
						<span class="mini-month-title">{format(month, 'MMMM', { locale: nb })}</span>
						<span class="mini-grid" aria-hidden="true">
							{#each weekdays as day, index (index)}<span class="mini-weekday">{day}</span>{/each}
							{#each calendarDays(month) as day (format(day, 'yyyy-MM-dd'))}
								<span class="mini-day" class:mini-today={isSameDay(day, today)}
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

<style>
	.plan-calendar {
		background: var(--card);
		border-radius: 1.75rem;
		padding: 1.5rem 1.25rem 1.75rem;
	}
	.calendar-content {
		max-width: 43rem;
		margin-inline: auto;
	}
	.calendar-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem;
	}
	.calendar-heading {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		color: var(--p1);
		font-size: 1.125rem;
		font-weight: 650;
		text-align: left;
		min-height: 44px;
		line-height: 1.3;
	}
	.calendar-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.today-button {
		padding: 0 0.5rem;
		min-height: 44px;
		color: var(--p1);
		font-size: 0.8125rem;
	}
	.arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 44px;
		color: var(--p1);
		border-radius: 0.75rem;
	}
	@media (hover: hover) and (pointer: fine) {
		.arrow:hover,
		.today-button:hover,
		.month-day:hover {
			background: var(--surface);
		}
	}
	.date-caption {
		margin-top: 0.125rem;
		font-size: 0.75rem;
		color: var(--text2);
	}
	.week-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		margin: 1.5rem -0.375rem 1.625rem;
	}
	.week-day,
	.month-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}
	.weekday {
		color: var(--text2);
		font-size: 0.9375rem;
		text-align: center;
		font-weight: 550;
	}
	.week-day .weekday {
		margin-bottom: 0.75rem;
	}
	.day-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		font-size: 1.375rem;
		font-weight: 450;
	}
	.day-number.today {
		color: var(--p1);
	}
	.day-number.selected {
		background: var(--p1);
		color: #fff;
		font-weight: 600;
	}
	.session-dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
		height: 12px;
	}
	.session-dots span {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--calendar-dot);
	}
	.day-content {
		min-height: 18.5rem;
		border-top: 1px solid var(--br);
	}
	@media (max-width: 767px) {
		.week-grid,
		.week-day,
		.month-grid,
		.month-day,
		.year-grid,
		.mini-month,
		.day-content {
			touch-action: pan-y;
		}
	}
	.month-title {
		font-size: 1.875rem;
		font-weight: 700;
		text-transform: capitalize;
		margin: 1rem 0 1.5rem;
	}
	.month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.5rem 0;
		margin: 0 -0.375rem;
	}
	.month-grid > .weekday {
		margin-bottom: 0.5rem;
	}
	.month-day {
		border-radius: 0.75rem;
	}
	.month-day.outside {
		opacity: 0.35;
	}
	.year-picker select {
		color: var(--p1);
		background: var(--card);
		font-weight: 700;
		font-size: 1rem;
		min-height: 44px;
		padding-right: 0.5rem;
	}
	.year-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem 0.75rem;
		margin-top: 1.5rem;
	}
	.mini-month {
		text-align: left;
		border-radius: 0.5rem;
		align-self: start;
	}
	.mini-month-title {
		display: block;
		color: var(--p1);
		text-transform: capitalize;
		font-weight: 600;
		font-size: 0.8125rem;
		margin-bottom: 0.5rem;
	}
	.mini-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		font-size: 0.5625rem;
		text-align: center;
		gap: 0.1875rem 0;
	}
	.mini-weekday {
		color: var(--text2);
		font-size: 0.5rem;
	}
	.mini-day {
		position: relative;
		padding: 0.125rem 0;
	}
	.mini-today {
		color: var(--p1);
		font-weight: 700;
	}
	@media (min-width: 640px) {
		.plan-calendar {
			padding: 2rem 2.5rem 2.5rem;
		}
		.calendar-heading {
			font-size: 1.5rem;
		}
		.arrow {
			width: 44px;
		}
		.week-grid {
			margin-top: 2rem;
		}
		.day-number {
			width: 48px;
			height: 48px;
			font-size: 1.625rem;
		}
		.year-grid {
			gap: 2rem;
		}
		.mini-month-title {
			font-size: 1rem;
		}
		.mini-grid {
			font-size: 0.75rem;
			gap: 0.375rem 0;
		}
		.mini-weekday {
			font-size: 0.625rem;
		}
	}
	@media (max-width: 359px) {
		.plan-calendar {
			padding-left: 1rem;
			padding-right: 1rem;
		}
		.calendar-heading {
			font-size: 1rem;
		}
		.day-number {
			width: 34px;
			height: 34px;
			font-size: 1.25rem;
		}
		.year-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 639px) {
		.week-view .calendar-heading {
			font-size: 1rem;
		}
		.week-view .today-button {
			font-size: 0.75rem;
		}
		.week-view .date-caption {
			font-size: 0.6875rem;
		}
		.week-view .week-day .weekday {
			font-size: 0.875rem;
		}
		.week-view .week-day .day-number {
			font-size: 1.25rem;
		}
	}
</style>
