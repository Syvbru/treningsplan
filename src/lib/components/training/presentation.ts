import { classifyWorkout } from '$lib/domain/workouts';

export type TrainingSection = 'plan' | 'logg' | 'statistikk' | 'film';

export function getWorkoutColor(title: string): string {
	return `var(--workout-${classifyWorkout(title)})`;
}
