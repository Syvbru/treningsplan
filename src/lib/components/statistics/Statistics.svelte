<script lang="ts">
	import {
		format,
		startOfDay,
		subWeeks,
		addWeeks,
		subMonths,
		addMonths,
		subYears,
		addYears,
		getISOWeek
	} from 'date-fns';
	import { nb } from 'date-fns/locale';
	import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-svelte';
	import DatePicker from '$lib/components/calendar/DatePicker.svelte';
	import { workoutStatistics, volumeSeries } from '$lib/domain/statistics';
	import type { Workout, StatPeriod } from '$lib/domain/types';
	export let workouts: Workout[];
	let statPeriod: StatPeriod = 'uke';
	let statAnchor = startOfDay(new Date());
	let showStatDropdown = false,
		showStatCalendar = false;
	let lineTooltip: { x: number; y: number; label: string; hours: number } | null = null;
	$: summary = workoutStatistics(workouts, statPeriod, statAnchor);
	$: barStats = {
		...summary,
		items: [
			{ label: 'Hardøkter', value: summary.counts.hard, barColor: 'var(--workout-hard)' },
			{ label: 'Styrke', value: summary.counts.strength, barColor: 'var(--workout-strength)' },
			{ label: 'Langturer', value: summary.counts.long, barColor: 'var(--workout-long)' },
			{ label: 'Hvile', value: summary.counts.rest, barColor: 'var(--workout-rest)' }
		]
	};
	$: lineChartData = volumeSeries(workouts, statPeriod, statAnchor);
	function openStatCalendar() {
		showStatCalendar = true;
		showStatDropdown = false;
	}
	// Pre-computed chart values (avoids {@const} outside block elements)
	$: barMaxV = Math.max(...barStats.items.map((i) => i.value), 1);
	$: barScale = Math.max(barMaxV, 3); // alltid minst 3 som tak
	$: barChartItems = barStats.items.map((item, idx) => {
		const bw = 36,
			gap = 20;
		const x = idx * (bw + gap) + 24;
		const bh = Math.max((item.value / barScale) * 70, item.value > 0 ? 2 : 0);
		const y = 90 - bh;
		return { ...item, bw, x, bh, y };
	});

	$: lineMaxH = Math.max(...lineChartData.map((d) => d.hours), 0.1);
	$: lineYTicks = (() => {
		const maxVal = Math.max(Math.ceil(lineMaxH), 1);
		const maxTicks = statPeriod === 'uke' ? 6 : 4;
		// Find a "nice" step: smallest of [1,2,3,4,5,6,8,10,12,15,20,25,30] giving ≤ maxTicks ticks
		const candidates = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50];
		const step =
			candidates.find((s) => Math.ceil(maxVal / s) <= maxTicks) ?? Math.ceil(maxVal / maxTicks);
		const top = Math.ceil(maxVal / step) * step;
		const ticks: number[] = [];
		for (let v = step; v <= top; v += step) ticks.push(v);
		return ticks;
	})();
	$: lineMaxCeil = lineYTicks[lineYTicks.length - 1] ?? 1;
	$: linePts =
		lineChartData.length > 1
			? lineChartData.map((d, i) => ({
					x: (i / (lineChartData.length - 1)) * 224 + 30,
					y: 82 - (d.hours / lineMaxCeil) * 62,
					label: d.label,
					hours: d.hours
				}))
			: [];

	$: linePoly = linePts.map((p) => `${p.x},${p.y}`).join(' ');
	$: lineArea =
		linePts.length > 0
			? `M ${linePts[0].x},88 ` +
				linePts.map((p) => `L ${p.x},${p.y}`).join(' ') +
				` L ${linePts[linePts.length - 1].x},88 Z`
			: '';

	function setPeriod(val: string) {
		statPeriod = val as 'uke' | 'maaned' | 'sesong';
		statAnchor = startOfDay(new Date());
		showStatDropdown = false;
	}

	function prevStatPeriod() {
		if (statPeriod === 'uke') statAnchor = subWeeks(statAnchor, 1);
		else if (statPeriod === 'maaned') statAnchor = subMonths(statAnchor, 1);
		else statAnchor = subYears(statAnchor, 1);
	}

	function nextStatPeriod() {
		if (statPeriod === 'uke') statAnchor = addWeeks(statAnchor, 1);
		else if (statPeriod === 'maaned') statAnchor = addMonths(statAnchor, 1);
		else statAnchor = addYears(statAnchor, 1);
	}

	$: statPeriodLabel = (() => {
		const t = statAnchor;
		if (statPeriod === 'uke') return `Uke ${getISOWeek(t)}`;
		if (statPeriod === 'maaned') return format(t, 'MMMM yyyy', { locale: nb });
		const isAfterMay = t.getMonth() >= 4;
		const sYear = isAfterMay ? t.getFullYear() : t.getFullYear() - 1;
		return `Sesong ${sYear}/${sYear + 1}`;
	})();
</script>

<!-- STATISTIKK -->
<section>
	<div class="mb-3">
		<h2 class="text-base font-bold text-[var(--p1)] mb-2">Statistikk:</h2>
		<div class="flex items-center gap-2">
			<!-- Prev / Next navigation -->
			<button
				aria-label="Forrige periode"
				on:click={prevStatPeriod}
				class="bg-[var(--card)] border border-[var(--br)] hover:border-[var(--p1)] text-[var(--text2)] hover:text-[var(--p1)] rounded-lg p-1.5 transition-colors"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>

			<!-- Period dropdown -->
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
						{#each [['uke', 'Uke'], ['maaned', 'Måned'], ['sesong', 'Sesong']] as [val, lbl] (val)}
							<button
								on:click={() => setPeriod(val)}
								class="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors {statPeriod ===
								val
									? 'bg-[var(--p1)] text-white'
									: 'text-[var(--text1)] hover:bg-[var(--surface)]'}"
							>
								{lbl}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button
				aria-label="Neste periode"
				on:click={nextStatPeriod}
				class="bg-[var(--card)] border border-[var(--br)] hover:border-[var(--p1)] text-[var(--text2)] hover:text-[var(--p1)] rounded-lg p-1.5 transition-colors"
			>
				<ChevronRight class="h-4 w-4" />
			</button>

			<!-- Calendar picker button -->
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
		<!-- BAR CHART -->
		<div class="bg-[var(--card)] rounded-2xl border border-[var(--br)] p-4">
			<svg
				viewBox="0 0 272 110"
				class="w-full pb-3"
				role="img"
				aria-label="Antall økter etter type"
			>
				{#each [1 / 3, 2 / 3, 1] as frac (frac)}
					{@const scale = Math.max(barMaxV, 3)}
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
				{#each barChartItems as item (item.label)}
					<rect
						x={item.x + 1}
						y={item.y + 1}
						width={item.bw}
						height={item.bh}
						fill="rgba(0,0,0,0.05)"
						rx="5"
						style="transition: y 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1);"
					/>
					<rect
						x={item.x}
						y={item.y}
						width={item.bw}
						height={item.bh}
						fill={item.barColor}
						rx="5"
						style="transition: y 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1);"
					/>
					<text
						x={item.x + item.bw / 2}
						y={item.y - 3}
						text-anchor="middle"
						font-size="8"
						font-weight="700"
						fill={item.barColor}
						style="transition: y 0.4s cubic-bezier(0.4,0,0.2,1);">{item.value}</text
					>
					<text
						x={item.x + item.bw / 2}
						y="106"
						text-anchor="middle"
						font-size="6.5"
						fill="var(--text2)">{item.label}</text
					>
				{/each}
				<line x1="18" y1="90" x2="260" y2="90" stroke="var(--br)" stroke-width="0.8" />
			</svg>
			<!-- Antall økter at the bottom -->
			<div class="text-center pt-2 border-t border-[var(--br)]">
				<span class="text-sm text-[var(--text2)] font-medium ml-1.5">Antall økter: </span>
				<span class="text-sm font-medium text-[var(--p1)]">{barStats.total}</span>
			</div>
		</div>

		<!-- LINE CHART -->
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
					<path d={lineArea} fill="url(#lg)" />
					{#each lineYTicks as tick (tick)}
						{@const ty = 82 - (tick / lineMaxCeil) * 62}
						<line x1="28" y1={ty} x2="258" y2={ty} stroke="var(--br)" stroke-width="0.7" />
						<text x="26" y={ty + 2} font-size="6" fill="var(--text2)" text-anchor="end"
							>{tick}t</text
						>
					{/each}
					<polyline
						points={linePoly}
						fill="none"
						stroke="var(--p1)"
						stroke-width="2"
						stroke-linejoin="round"
						stroke-linecap="round"
					/>
					{#each linePts as p (p.label)}
						<!-- Invisible wider hit area -->

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
					<!-- Tooltip bubble -->
					<line x1="28" y1="88" x2="258" y2="88" stroke="var(--br)" stroke-width="0.8" />
					<!-- Tooltip bubble – rendered last so it's always on top -->
					{#if lineTooltip}
						{@const tx = Math.min(Math.max(lineTooltip.x, 30), 242)}
						{@const ty = Math.max(lineTooltip.y - 18, 10)}
						{@const totalMin = Math.round(lineTooltip.hours * 60)}
						{@const hh = Math.floor(totalMin / 60)}
						{@const mm = totalMin % 60}
						{@const lbl = hh > 0 && mm > 0 ? `${hh}t ${mm}m` : hh > 0 ? `${hh}t` : `${mm}m`}
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
			<!-- Timer totalt at the bottom -->
			<div class="text-center mt-1 pt-2 border-t border-[var(--br)]">
				<span class="text-sm text-[var(--text2)] font-medium ml-1.5">Timer totalt:</span>
				<span class="text-sm font-medium text-[var(--p1)]"
					>{barStats.totalHours}t{barStats.totalMins > 0 ? ` ${barStats.totalMins}min` : ''}</span
				>
			</div>
		</div>
	</div>
</section>
