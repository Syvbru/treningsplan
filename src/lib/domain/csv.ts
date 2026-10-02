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
	const date = header.findIndex((h) => h.includes('dato'));
	const first = header.findIndex((h) => h.includes('hva økt 1'));
	const time1 = header.indexOf('tid');
	const second = header.findIndex((h) => h.includes('hva økt 2'));
	const time2 = header.indexOf('tid', time1 + 1);
	const comment = header.findIndex((h) => h.includes('kommentar'));
	const missing = [
		date < 0 ? 'Dato' : '',
		first < 0 ? 'Hva økt 1' : '',
		time1 < 0 ? 'Tid' : '',
		second >= 0 && time2 < 0 ? 'Tid for økt 2' : ''
	].filter(Boolean);
	if (missing.length) throw new SheetFormatError(`Manglende kolonner: ${missing.join(', ')}.`);
	const workouts: Workout[] = [];
	for (const [index, row] of data.slice(1).entries()) {
		if (!row[first]?.trim() && !row[second]?.trim()) continue;
		const iso = parseDate(row[date] ?? '', anchor);
		if (!iso) throw new SheetFormatError(`Rad ${index + 2}: ugyldig dato.`);
		for (const [titleIndex, timeIndex] of [
			[first, time1],
			[second, time2]
		]) {
			if (titleIndex < 0 || !row[titleIndex]?.trim()) continue;
			let durationMin: number;
			try {
				durationMin = toMin(row[timeIndex] ?? '');
			} catch {
				throw new SheetFormatError(`Rad ${index + 2}: ugyldig varighet, forventet timer:minutter.`);
			}
			workouts.push({
				date: iso,
				title: row[titleIndex].trim(),
				durationMin,
				description: row[comment]?.trim() ?? ''
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
