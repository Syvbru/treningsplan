export type Role = 'utover' | 'trener';
export interface User {
	id: string;
	name: string;
	role: Role;
}
export interface Athlete {
	id: string;
	name: string;
	editPlanSheet: string;
}
export interface Workout {
	date: string;
	title: string;

	durationMin: number | null;
	description: string;
}
export interface SharedWorkout {
	dato: string;
	okt: string;
	utovere: string[];
}
export interface TechniqueLog {
	id: number;
	dato: string;
	stilart: 'Klassisk' | 'Skate';
	tilbakemelding: string;
	video_urls: string[];
}
export type TechniqueInput = Omit<TechniqueLog, 'id'>;
export type PlanStatus = 'JA' | 'NEI' | null;
export interface PlanData {
	workouts: Workout[];
	status: PlanStatus;
	warnings: string[];
}
export interface AthleteStatus extends Athlete {
	status: PlanStatus;
	statusError: string | null;
}
export type StatPeriod = 'uke' | 'maaned' | 'sesong';
export interface ApiFailure {
	success: false;
	error: string;
	code: string;
}
