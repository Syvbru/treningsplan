export const PERIODER: { fra: string; til: string; ark: string }[] = [
	{ fra: '2026-05-29', til: '2026-06-11', ark: 'Uke 24-28 26/27' },
	{ fra: '2026-07-03', til: '2026-07-16', ark: 'Uke 29-33 26/27' },
	{ fra: '2026-08-07', til: '2026-08-20', ark: 'Uke 34-38 26/27' },
	{ fra: '2026-09-11', til: '2026-09-24', ark: 'Uke 39-43 26/27' },
	{ fra: '2026-10-16', til: '2026-10-29', ark: 'Uke 44-49 26/27' },
	{ fra: '2026-11-27', til: '2026-12-10', ark: 'Uke 50-1 26/27' },
	{ fra: '2027-01-01', til: '2027-01-14', ark: 'Uke 2-5 26/27' },
	{ fra: '2027-01-29', til: '2027-02-11', ark: 'Uke 6-11 26/27' }
];

export function activePlanSheet(now = new Date()): string | null {
	const iso = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(now);
	return PERIODER.find((p) => p.fra <= iso && p.til >= iso)?.ark ?? null;
}
