import { format, getISOWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import { seasonYear } from '$lib/domain/dates';
import type { StatPeriod } from '$lib/domain/types';

interface WorkoutCounts {
	hard: number;
	strength: number;
	long: number;
	rest: number;
}

export function barChartPresentation(counts: WorkoutCounts) {
	const items = [
		{ label: 'Hardøkter', value: counts.hard, barColor: 'var(--workout-hard)' },
		{ label: 'Styrke', value: counts.strength, barColor: 'var(--workout-strength)' },
		{ label: 'Langturer', value: counts.long, barColor: 'var(--workout-long)' },
		{ label: 'Hvile', value: counts.rest, barColor: 'var(--workout-rest)' }
	];
	const scale = Math.max(...items.map((item) => item.value), 3);
	return {
		scale,
		items: items.map((item, index) => {
			const width = 36;
			const gap = 20;
			const height = Math.max((item.value / scale) * 70, item.value > 0 ? 2 : 0);
			return { ...item, width, height, x: index * (width + gap) + 24, y: 90 - height };
		})
	};
}

export function lineChartPresentation(
	series: { label: string; hours: number }[],
	period: StatPeriod
) {
	const maximumHours = Math.max(...series.map((point) => point.hours), 0.1);
	const roundedMaximum = Math.max(Math.ceil(maximumHours), 1);
	const maxTicks = period === 'uke' ? 6 : 4;
	const candidates = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50];
	const step =
		candidates.find((value) => Math.ceil(roundedMaximum / value) <= maxTicks) ??
		Math.ceil(roundedMaximum / maxTicks);
	const top = Math.ceil(roundedMaximum / step) * step;
	const ticks: number[] = [];
	for (let value = step; value <= top; value += step) ticks.push(value);
	const maximum = ticks[ticks.length - 1] ?? 1;
	const points =
		series.length > 1
			? series.map((point, index) => ({
					x: (index / (series.length - 1)) * 224 + 30,
					y: 82 - (point.hours / maximum) * 62,
					label: point.label,
					hours: point.hours
				}))
			: [];
	const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
	const area =
		points.length > 0
			? `M ${points[0].x},88 ` +
				points.map((point) => `L ${point.x},${point.y}`).join(' ') +
				` L ${points[points.length - 1].x},88 Z`
			: '';
	return { ticks, maximum, points, polyline, area };
}

export function periodLabel(period: StatPeriod, anchor: Date): string {
	if (period === 'uke') return `Uke ${getISOWeek(anchor)}`;
	if (period === 'maaned') return format(anchor, 'MMMM yyyy', { locale: nb });
	const year = seasonYear(anchor);
	return `Sesong ${year}/${year + 1}`;
}

export function tooltipTime(hours: number): string {
	const totalMinutes = Math.round(hours * 60);
	const wholeHours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (wholeHours > 0 && minutes > 0) return `${wholeHours}t ${minutes}m`;
	return wholeHours > 0 ? `${wholeHours}t` : `${minutes}m`;
}
