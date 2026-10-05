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
import { periodRange, seasonYear } from './dates';
import { classifyWorkout } from './workouts';
import type { Workout, StatPeriod } from './types';

// Statistics prioritises rest, strength and long sessions before hard sessions.
function statisticsKind(title: string) {
	const lower = title.toLowerCase();
	if (lower.includes('hvile')) return 'rest';
	if (/styrke|basis/.test(lower)) return 'strength';
	if (lower.includes('langtur')) return 'long';
	return classifyWorkout(title);
}

export function workoutStatistics(workouts: Workout[], period: StatPeriod, anchor: Date) {
	const { start, end } = periodRange(period, anchor);
	const selected = workouts.filter((workout) => {
		const d = parseISO(workout.date);
		return d >= start && d <= end;
	});
	const counts = { hard: 0, strength: 0, long: 0, rest: 0 };
	for (const workout of selected) {
		const kind = statisticsKind(workout.title);
		if (kind in counts) counts[kind as keyof typeof counts]++;
	}
	const minutes = selected.reduce((sum, workout) => sum + (workout.durationMin ?? 0), 0);
	return {
		counts,
		invalidDurationCount: selected.filter((workout) => workout.durationMin === null).length,
		total: selected.length - counts.rest,
		totalHours: Math.floor(minutes / 60),
		totalMins: minutes % 60
	};
}
export function volumeSeries(workouts: Workout[], statPeriod: StatPeriod, statAnchor: Date) {
	if (workouts.length === 0) return [];
	const anchor = statAnchor;
	const result: { label: string; hours: number }[] = [];

	if (statPeriod === 'uke') {
		const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
		for (let i = 0; i < 7; i++) {
			const day = addDays(weekStart, i);
			const key = format(day, 'yyyy-MM-dd');
			const mins = workouts
				.filter((workout) => workout.date === key && workout.durationMin)
				.reduce((sum, workout) => sum + (workout.durationMin || 0), 0);
			result.push({ label: format(day, 'EEE', { locale: nb }), hours: mins / 60 });
		}
	} else if (statPeriod === 'maaned') {
		const monthStart = startOfMonth(anchor);
		const monthEnd = endOfMonth(anchor);
		let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
		while (weekStart <= monthEnd) {
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

			const mins = workouts
				.filter((workout) => {
					const d = parseISO(workout.date);
					return d >= weekStart && d <= weekEnd && workout.durationMin;
				})
				.reduce((sum, workout) => sum + (workout.durationMin || 0), 0);
			result.push({ label: `U${getISOWeek(weekStart)}`, hours: mins / 60 });
			weekStart = addWeeks(weekStart, 1);
		}
	} else {
		const year = seasonYear(anchor);
		const addMonth = (year: number, month: number) => {
			const key = format(new Date(year, month, 1), 'yyyy-MM');
			const mins = workouts
				.filter((workout) => workout.date.startsWith(key) && workout.durationMin)
				.reduce((sum, workout) => sum + (workout.durationMin || 0), 0);
			result.push({
				label: format(new Date(year, month, 1), 'MMM', { locale: nb }),
				hours: mins / 60
			});
		};
		for (let m = 4; m <= 11; m++) addMonth(year, m);
		for (let m = 0; m <= 3; m++) addMonth(year + 1, m);
	}
	return result;
}
