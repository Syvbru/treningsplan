import { classifyWorkout } from '$lib/domain/workouts';

/** The plan keeps the original title; its only type-specific visual is the colour. */
export function getWorkoutColor(title: string): string {
	return `var(--workout-${classifyWorkout(title)})`;
}
