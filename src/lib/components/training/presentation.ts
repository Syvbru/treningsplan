import { classifyWorkout } from '$lib/domain/workouts';

export function getWorkoutColor(title: string): string {
	return `var(--workout-${classifyWorkout(title)})`;
}
