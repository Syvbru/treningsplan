import type { SharedWorkout } from './types';
type WorkoutKind = 'hard' | 'rest' | 'long' | 'speed' | 'technique' | 'strength' | 'easy';
export function classifyWorkout(title: string): WorkoutKind {
	const lower = title.toLowerCase();
	const isHard =
		lower.includes('motbakkeløp') ||
		lower.includes('sprint') ||
		lower.includes('distanseøkt') ||
		/(rennet|(?<!lang)renn(?!forbered))/u.test(lower) ||
		lower.includes('dsv-cup') ||
		lower.includes('km ') ||
		lower.includes(' km') ||
		lower.includes('birken') ||
		lower.includes('klubbmesterskap') ||
		lower.includes('skifestival') ||
		lower.includes('vestmarka opp') ||
		lower.includes('gjelleråsbakken') ||
		lower.includes('askerspurten') ||
		lower.includes('oslo marat') ||
		lower.includes('terrengløp') ||
		lower.includes('10 for grete') ||
		lower.includes('kong harald') ||
		lower.includes('nm stafett') ||
		lower.includes('rulleskicup') ||
		lower.includes('swix/foss sport');

	if (lower.includes('intervall') || isHard) return 'hard';
	if (lower.includes('hvile')) return 'rest';
	if (lower.includes('langtur')) return 'long';
	if (lower.includes('hurtighet') || lower.includes('fartsøkt')) return 'speed';
	if (lower.includes('styrke') || lower.includes('basis')) return 'strength';
	return 'easy';
}
export function sharedAthletes(
	data: SharedWorkout[],
	name: string,
	date: string,
	title: string
): string[] {
	const current = name.trim().toLowerCase();
	const names = new Set<string>();
	for (const row of data) {
		if (
			row.dato === date &&
			row.okt.toLowerCase() === title.toLowerCase() &&
			row.utovere.some((n) => n.toLowerCase() === current)
		) {
			for (const n of row.utovere) if (n.toLowerCase() !== current) names.add(n);
		}
	}
	return [...names].sort((a, b) => a.localeCompare(b, 'nb'));
}
