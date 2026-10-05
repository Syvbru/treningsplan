import Papa from 'papaparse';
import { parseDate, toMin } from './dates';
import type { Workout, SharedWorkout, PlanStatus } from './types';
export class SheetFormatError extends Error {}
function rows(csv: string): string[][] {
	if (csv.length > 5_000_000 || /^\s*<!?\s*(?:DOCTYPE|html)/i.test(csv))
		throw new SheetFormatError(
			'Regnearket returnerte ikke gyldig CSV. Kontroller deling og eksportadresse.'
		);
	const result = Papa.parse<string[]>(csv, { skipEmptyLines: 'greedy' });
	if (result.errors.length)
		throw new SheetFormatError('CSV-formatet er ugyldig. Kontroller anførselstegn og kolonner.');
	return result.data;
}
export function parseWorkoutCSV(csv: string, anchor = new Date()): Workout[] {
	const data = rows(csv);
	if (!data.length) throw new SheetFormatError('Regnearket mangler kolonneoverskrifter.');
	const header = data[0].map((h) => h.trim().toLowerCase());
	const dateColumn = header.findIndex((h) => h.includes('dato'));
	const firstSessionColumn = header.findIndex((h) => h.includes('hva økt 1'));
	const firstDurationColumn = header.indexOf('tid');
	const secondSessionColumn = header.findIndex((h) => h.includes('hva økt 2'));
	const secondDurationColumn = header.indexOf('tid', firstDurationColumn + 1);
	const commentColumn = header.findIndex((h) => h.includes('kommentar'));
	const missing = [
		dateColumn < 0 ? 'Dato' : '',
		firstSessionColumn < 0 ? 'Hva økt 1' : '',
		firstDurationColumn < 0 ? 'Tid' : '',
		secondSessionColumn >= 0 && secondDurationColumn < 0 ? 'Tid for økt 2' : ''
	].filter(Boolean);
	if (missing.length) throw new SheetFormatError(`Manglende kolonner: ${missing.join(', ')}.`);
	const workouts: Workout[] = [];
	for (const [index, row] of data.slice(1).entries()) {
		if (!row[firstSessionColumn]?.trim() && !row[secondSessionColumn]?.trim()) continue;
		const iso = parseDate(row[dateColumn] ?? '', anchor);
		if (!iso) throw new SheetFormatError(`Rad ${index + 2}: ugyldig dato.`);
		for (const [titleColumn, durationColumn] of [
			[firstSessionColumn, firstDurationColumn],
			[secondSessionColumn, secondDurationColumn]
		]) {
			if (titleColumn < 0 || !row[titleColumn]?.trim()) continue;
			let durationMin: number | null;
			try {
				durationMin = toMin(row[durationColumn] ?? '');
			} catch {
				durationMin = null;
			}
			workouts.push({
				date: iso,
				title: row[titleColumn].trim(),
				durationMin,
				description: row[commentColumn]?.trim() ?? ''
			});
		}
	}
	return workouts;
}
export function parseSharedCSV(csv: string, anchor = new Date()): SharedWorkout[] {
	const data = rows(csv);
	const header = data[0]?.map((h) => h.trim().toLowerCase().replaceAll('ø', 'o')) ?? [];
	const indexes = ['dato', 'okt', 'utovere'].map((h) => header.indexOf(h));
	if (indexes.some((i) => i < 0))
		throw new SheetFormatError('Fellesøkter mangler kolonnene Dato, Økt eller Utøvere.');
	return data.slice(1).map((row, index) => {
		const dato = parseDate(row[indexes[0]] ?? '', anchor);
		const okt = row[indexes[1]]?.trim();
		const utovere = row[indexes[2]]
			?.split(',')
			.map((n) => n.trim())
			.filter(Boolean);
		if (!dato || !okt || !utovere?.length)
			throw new SheetFormatError(
				`Fellesøkter rad ${index + 2}: ugyldig dato, økt eller utøverliste.`
			);
		return { dato, okt, utovere };
	});
}
export function parsePlanStatus(csv: string): PlanStatus {
	for (const row of rows(csv)) {
		const index = row.findIndex(
			(c) => c.trim().toUpperCase() === 'MIN PLAN ER KLAR FOR Å FERDIGSTILLES'
		);
		if (index >= 0) {
			const value = row[index + 1]?.trim().toUpperCase();
			if (value !== 'JA' && value !== 'NEI')
				throw new SheetFormatError('Planstatus må være JA eller NEI.');
			return value;
		}
	}
	throw new SheetFormatError('Regnearket mangler feltet «MIN PLAN ER KLAR FOR Å FERDIGSTILLES».');
}
