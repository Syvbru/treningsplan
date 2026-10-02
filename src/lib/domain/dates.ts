import {
	parse,
	format,
	startOfDay,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth
} from 'date-fns';
import { nb } from 'date-fns/locale';
import type { StatPeriod } from './types';

/** Training seasons run from 1 May through 30 April. Dates without years use this season. */
export function seasonYear(anchor: Date): number {
	return anchor.getMonth() >= 4 ? anchor.getFullYear() : anchor.getFullYear() - 1;
}
export function parseDate(value: string, anchor = new Date()): string {
	const clean = value?.trim().toLowerCase();
	if (!clean) return '';
	if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return isISODate(clean) ? clean : '';
	if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(clean)) {
		const d = parse(clean, 'd.M.yyyy', anchor);
		return Number.isNaN(d.getTime()) ? '' : format(d, 'yyyy-MM-dd');
	}
	const spaced = clean.replace(/(\d+)\.(\p{L}+)/u, '$1. $2').replace(/\.$/, '');
	let d = parse(`${spaced} ${2024}`, 'd. MMMM yyyy', anchor, { locale: nb });
	if (Number.isNaN(d.getTime())) d = parse(`${spaced}.${2024}`, 'd.M.yyyy', anchor);
	if (Number.isNaN(d.getTime())) return '';
	// Reparse after choosing the year so a leap day is validated against its actual year.
	const year = seasonYear(anchor) + (d.getMonth() < 4 ? 1 : 0);
	d = parse(`${format(d, 'd.M')}.${year}`, 'd.M.yyyy', anchor);
	return Number.isNaN(d.getTime()) ? '' : format(startOfDay(d), 'yyyy-MM-dd');
}
export function isISODate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const d = new Date(`${value}T12:00:00Z`);
	return (
		!Number.isNaN(d.getTime()) &&
		d.toISOString().slice(0, 10) === value &&
		Number(value.slice(0, 4)) >= 1900
	);
}
export function toMin(value: string): number {
	if (!value?.trim()) return 0;
	const match = value.trim().match(/^(\d{1,2}):([0-5]\d)(?::00)?$/);
	if (!match) throw new Error(`Ugyldig varighet: forventet timer:minutter.`);
	const mins = Number(match[1]) * 60 + Number(match[2]);
	if (mins > 24 * 60) throw new Error('Varighet kan ikke overstige 24 timer.');
	return mins;
}
export function formatTime(mins: number): string {
	if (!mins) return '';
	const h = Math.floor(mins / 60),
		m = mins % 60;
	return h && m ? `${h}t ${m}min` : h ? `${h}t` : `${m}min`;
}
export function periodRange(period: StatPeriod, anchor: Date): { start: Date; end: Date } {
	if (period === 'uke')
		return {
			start: startOfWeek(anchor, { weekStartsOn: 1 }),
			end: endOfWeek(anchor, { weekStartsOn: 1 })
		};
	if (period === 'maaned') return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
	const year = seasonYear(anchor);
	return { start: new Date(year, 4, 1), end: new Date(year + 1, 3, 30, 23, 59, 59, 999) };
}
