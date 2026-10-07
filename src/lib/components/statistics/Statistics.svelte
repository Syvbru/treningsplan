<script lang="ts">
	import { startOfDay } from 'date-fns';
	import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-svelte';
	import DatePicker from '$lib/components/calendar/DatePicker.svelte';
	import { shiftPeriod } from '$lib/domain/dates';
	import { workoutStatistics, volumeSeries } from '$lib/domain/statistics';
	import type { Workout, StatPeriod } from '$lib/domain/types';
	import {
		barChartPresentation,
		lineChartPresentation,
		periodLabel,
		tooltipTime
	} from './presentation';

	export let workouts: Workout[];
	let statPeriod: StatPeriod = 'uke';
	let statAnchor = startOfDay(new Date());
	let showStatDropdown = false;
	let showStatCalendar = false;
	let lineTooltip: { x: number; y: number; label: string; hours: number } | null = null;
	const periods = [
		{ value: 'uke', label: 'Uke' },
		{ value: 'maaned', label: 'Måned' },
		{ value: 'sesong', label: 'Sesong' }
	] as const;

	$: summary = workoutStatistics(workouts, statPeriod, statAnchor);
	$: barChart = barChartPresentation(summary.counts);
	$: lineChartData = volumeSeries(workouts, statPeriod, statAnchor);
	$: lineChart = lineChartPresentation(lineChartData, statPeriod);
	$: statPeriodLabel = periodLabel(statPeriod, statAnchor);

	function openStatCalendar() {
		showStatCalendar = true;
		showStatDropdown = false;
	}

	function setPeriod(period: StatPeriod) {
		statPeriod = period;
		statAnchor = startOfDay(new Date());
		showStatDropdown = false;
	}

	function navigatePeriod(direction: -1 | 1) {
		statAnchor = shiftPeriod(statPeriod, statAnchor, direction);
	}
</script>

<section>
	<div class="mb-3">
		<h2 class="text-base font-bold uppercase text-[var(--p1)] mb-2">Statistikk:</h2>
		<div class="flex items-center gap-2">
			<button
				aria-label="Forrige periode"
				on:click={() => navigatePeriod(-1)}
				class="bg-[var(--card)] border border-[var(--br)] hover:border-[var(--p1)] text-[var(--text2)] hover:text-[var(--p1)] rounded-lg p-1.5 transition-colors"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>

			<div class="relative">
				<button
					on:click={() => (showStatDropdown = !showStatDropdown)}
					class="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--br)] hover:border-[var(--p1)] rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--p1)] transition-colors min-w-[130px] justify-between"
				>
					<span class="capitalize">{statPeriodLabel}</span>
					<ChevronDown class="h-3.5 w-3.5 text-[var(--text2)] flex-shrink-0" />
				</button>
				{#if showStatDropdown}
					<div
						class="absolute left-0 top-full mt-1 z-30 bg-[var(--card)] border border-[var(--br)] rounded-xl shadow-lg overflow-hidden min-w-[120px]"
					>
						{#each periods as period (period.value)}
							<button
								on:click={() => setPeriod(period.value)}
								class="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors {statPeriod ===
								period.value
									? 'bg-[var(--p1)] text-white'
									: 'text-[var(--text1)] hover:bg-[var(--surface)]'}"
							>
								{period.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button
				aria-label="Neste periode"
				on:click={() => navigatePeriod(1)}
				class="bg-[var(--card)] border border-[var(--br)] hover:border-[var(--p1)] text-[var(--text2)] hover:text-[var(--p1)] rounded-lg p-1.5 transition-colors"
			>
				<ChevronRight class="h-4 w-4" />
			</button>

			<button
				aria-label="Velg statistikkdato"
				on:click={(e) => {
					e.currentTarget.focus();
					openStatCalendar();
				}}
				class="quiet-focus bg-[var(--card)] border border-[var(--br)] text-[var(--text2)] rounded-lg p-1.5 transition-colors"
			>
				<Calendar class="h-4 w-4" />
			</button>
		</div>
	</div>

	{#if showStatCalendar}<DatePicker
			selected={statAnchor}
			onClose={() => (showStatCalendar = false)}
			onSelect={(d) => {
				statAnchor = startOfDay(d);
				showStatCalendar = false;
			}}
		/>{/if}
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
		<div class="bg-[var(--card)] rounded-2xl border border-[var(--br)] p-4">
			<svg
				viewBox="0 0 272 110"
				class="w-full pb-3"
				role="img"
				aria-label="Antall økter etter type"
			>
				{#each [1 / 3, 2 / 3, 1] as frac (frac)}
					{@const scale = barChart.scale}
					<line
						x1="18"
						y1={90 - frac * 70}
						x2="260"
						y2={90 - frac * 70}
						stroke="var(--br)"
						stroke-width="0.7"
					/>
					<text x="16" y={90 - frac * 70 + 2} font-size="6" fill="var(--text2)" text-anchor="end"
						>{Math.round(frac * scale)}</text
					>
				{/each}
				{#each barChart.items as item (item.label)}
					<rect
						x={item.x + 1}
						y={item.y + 1}
						width={item.width}
						height={item.height}
						fill="rgba(0,0,0,0.05)"
						rx="5"
						style="transition: y 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1);"
					/>
					<rect
						x={item.x}
						y={item.y}
						width={item.width}
						height={item.height}
						fill={item.barColor}
						rx="5"
						style="transition: y 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1);"
					/>
					<text
						x={item.x + item.width / 2}
						y={item.y - 3}
						text-anchor="middle"
						font-size="8"
						font-weight="700"
						fill={item.barColor}
						style="transition: y 0.4s cubic-bezier(0.4,0,0.2,1);">{item.value}</text
					>
					<text
						x={item.x + item.width / 2}
						y="106"
						text-anchor="middle"
						font-size="6.5"
						fill="var(--text2)">{item.label}</text
					>
				{/each}
				<line x1="18" y1="90" x2="260" y2="90" stroke="var(--br)" stroke-width="0.8" />
			</svg>

			<div class="text-center pt-2 border-t border-[var(--br)]">
				<span class="text-sm text-[var(--text2)] font-medium ml-1.5">Antall økter: </span>
				<span class="text-sm font-medium text-[var(--p1)]">{summary.total}</span>
			</div>
		</div>

		<div class="bg-[var(--card)] rounded-2xl border border-[var(--br)] p-4">
			{#if lineChartData.length > 1}
				<svg
					viewBox="0 0 272 110"
					class="w-full"
					role="group"
					aria-label="Treningstimer i perioden"
				>
					<defs>
						<linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="var(--p1)" stop-opacity="0.25" />
							<stop offset="100%" stop-color="var(--p1)" stop-opacity="0.02" />
						</linearGradient>
					</defs>
					<path d={lineChart.area} fill="url(#lg)" />
					{#each lineChart.ticks as tick (tick)}
						{@const ty = 82 - (tick / lineChart.maximum) * 62}
						<line x1="28" y1={ty} x2="258" y2={ty} stroke="var(--br)" stroke-width="0.7" />
						<text x="26" y={ty + 2} font-size="6" fill="var(--text2)" text-anchor="end"
							>{tick}t</text
						>
					{/each}
					<polyline
						points={lineChart.polyline}
						fill="none"
						stroke="var(--p1)"
						stroke-width="2"
						stroke-linejoin="round"
						stroke-linecap="round"
					/>
					{#each lineChart.points as p (p.label)}
						<circle
							cx={p.x}
							cy={p.y}
							r="10"
							fill="transparent"
							role="button"
							tabindex="0"
							aria-label={`${p.label}: ${Math.round(p.hours * 60)} minutter`}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									lineTooltip = p;
								}
							}}
							on:focus={() => (lineTooltip = p)}
							on:blur={() => (lineTooltip = null)}
							on:mouseenter={() => (lineTooltip = p)}
							on:mouseleave={() => (lineTooltip = null)}
							on:click|stopPropagation={() => (lineTooltip = p)}
							class="cursor-pointer"
						/>
						<circle
							cx={p.x}
							cy={p.y}
							r={lineTooltip?.label === p.label ? 4.5 : 3}
							fill="var(--card)"
							stroke="var(--p1)"
							stroke-width={lineTooltip?.label === p.label ? 2.5 : 1.5}
							style="transition: r 0.1s, stroke-width 0.1s; pointer-events: none;"
						/>
						<text x={p.x} y="108" text-anchor="middle" font-size="6.5" fill="var(--text2)"
							>{p.label}</text
						>
					{/each}

					<line x1="28" y1="88" x2="258" y2="88" stroke="var(--br)" stroke-width="0.8" />

					{#if lineTooltip}
						{@const tx = Math.min(Math.max(lineTooltip.x, 30), 242)}
						{@const ty = Math.max(lineTooltip.y - 18, 10)}
						{@const lbl = tooltipTime(lineTooltip.hours)}
						<rect x={tx - 16} y={ty - 8} width="32" height="12" rx="4" fill="var(--p1)" />
						<text
							x={tx}
							y={ty + 1}
							text-anchor="middle"
							font-size="6.5"
							font-weight="700"
							fill="white">{lbl}</text
						>
					{/if}
				</svg>
			{:else}
				<div class="flex items-center justify-center h-32 text-[var(--text2)] text-sm">
					Ingen data ennå
				</div>
			{/if}

			<div class="text-center mt-1 pt-2 border-t border-[var(--br)]">
				<span class="text-sm text-[var(--text2)] font-medium ml-1.5">Timer totalt:</span>
				<span class="text-sm font-medium text-[var(--p1)]"
					>{summary.totalHours}t{summary.totalMins > 0 ? ` ${summary.totalMins}min` : ''}</span
				>
				{#if summary.invalidDurationCount > 0}
					<p class="mt-2 text-xs text-[var(--text2)]">
						{summary.invalidDurationCount}
						{summary.invalidDurationCount === 1 ? 'økt har' : 'økter har'} feil i tidsformat og er ikke
						med i beregnet treningstid.
					</p>
				{/if}
			</div>
		</div>
	</div>
</section>
