import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import type { Workout } from '$lib/domain/types';

export function calendarDays(month: Date): Date[] {
	const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
	const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
	const days: Date[] = [];
	for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
	return days;
}

export function workoutsByDate(workouts: Workout[]): Map<string, Workout[]> {
	const byDate = new Map<string, Workout[]>();
	for (const workout of workouts) {
		const sessions = byDate.get(workout.date);
		if (sessions) sessions.push(workout);
		else byDate.set(workout.date, [workout]);
	}
	return byDate;
}
