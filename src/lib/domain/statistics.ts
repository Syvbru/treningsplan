import {
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	addDays,
	addWeeks,
	format,
	parseISO,
	getISOWeek
} from 'date-fns';
import { nb } from 'date-fns/locale';
import { periodRange } from './dates';
import { classifyWorkout } from './workouts';
import type { Workout, StatPeriod } from './types';
export function workoutStatistics(workouts: Workout[], period: StatPeriod, anchor: Date) {
	const { start, end } = periodRange(period, anchor);
	const selected = workouts.filter((w) => {
		const d = parseISO(w.date);
		return d >= start && d <= end;
	});
	const counts = { hard: 0, strength: 0, long: 0, rest: 0 };
	for (const w of selected) {
		const lower = w.title.toLowerCase();
		// Preserve existing statistics precedence for combined session names.
		const kind = lower.includes('hvile')
			? 'rest'
			: /styrke|basis/.test(lower)
				? 'strength'
				: lower.includes('langtur')
					? 'long'
					: classifyWorkout(w.title);
		if (kind in counts) counts[kind as keyof typeof counts]++;
	}
	const minutes = selected.reduce((sum, w) => sum + (w.durationMin ?? 0), 0);
	return {
		counts,
		invalidDurationCount: selected.filter((w) => w.durationMin === null).length,
		total: selected.length - counts.rest,
		totalHours: Math.floor(minutes / 60),
		totalMins: minutes % 60
	};
}
export function volumeSeries(workouts: Workout[], statPeriod: StatPeriod, statAnchor: Date) {
	if (workouts.length === 0) return [];
	const t = statAnchor;
	const result: { label: string; hours: number }[] = [];

	if (statPeriod === 'uke') {
		const weekStart = startOfWeek(t, { weekStartsOn: 1 });
		for (let i = 0; i < 7; i++) {
			const day = addDays(weekStart, i);
			const key = format(day, 'yyyy-MM-dd');
			const mins = workouts
				.filter((w) => w.date === key && w.durationMin)
				.reduce((s, w) => s + (w.durationMin || 0), 0);
			result.push({ label: format(day, 'EEE', { locale: nb }), hours: mins / 60 });
		}
	} else if (statPeriod === 'maaned') {
		const mStart = startOfMonth(t);
		const mEnd = endOfMonth(t);
		let weekStart = startOfWeek(mStart, { weekStartsOn: 1 });
		while (weekStart <= mEnd) {
			const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
			// Use full week range for the chart — days outside the month are included
			const mins = workouts
				.filter((w) => {
					const d = parseISO(w.date);
					return d >= weekStart && d <= wEnd && w.durationMin;
				})
				.reduce((s, w) => s + (w.durationMin || 0), 0);
			result.push({ label: `U${getISOWeek(weekStart)}`, hours: mins / 60 });
			weekStart = addWeeks(weekStart, 1);
		}
	} else {
		const isAfterMay = t.getMonth() >= 4;
		const sYear = isAfterMay ? t.getFullYear() : t.getFullYear() - 1;
		const addM = (year: number, month: number) => {
			const key = format(new Date(year, month, 1), 'yyyy-MM');
			const mins = workouts
				.filter((w) => w.date.startsWith(key) && w.durationMin)
				.reduce((s, w) => s + (w.durationMin || 0), 0);
			result.push({
				label: format(new Date(year, month, 1), 'MMM', { locale: nb }),
				hours: mins / 60
			});
		};
		for (let m = 4; m <= 11; m++) addM(sYear, m);
		for (let m = 0; m <= 3; m++) addM(sYear + 1, m);
	}
	return result;
}
