import { env } from '$env/dynamic/private';
import {
	parseWorkoutCSV,
	parseSharedCSV,
	parsePlanStatus,
	SheetFormatError
} from '$lib/domain/csv';
import { activePlanSheet } from '$lib/config/seasons';
import type { PlanData, PlanStatus } from '$lib/domain/types';
import type { Account } from './users';
import { ApiError } from './http';
const cache = new Map<string, { text: string; expires: number }>();
export function sheetURL(value: string): URL {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new ApiError(502, 'SHEET_URL', 'Regnearkadressen er ugyldig.');
	}
	if (
		url.protocol !== 'https:' ||
		url.hostname !== 'docs.google.com' ||
		!url.pathname.startsWith('/spreadsheets/d/') ||
		url.username ||
		url.password ||
		url.port
	)
		throw new ApiError(502, 'SHEET_URL', 'Regnearkadressen må peke til Google Sheets.');
	return url;
}
async function fetchCSV(owner: string, url: URL, refresh = false): Promise<string> {
	const key = `${owner}:${url.href}`;
	const entry = cache.get(key);
	if (!refresh && entry && entry.expires > Date.now()) return entry.text;
	let response: Response;
	try {
		response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
	} catch {
		throw new ApiError(502, 'SHEETS_UNAVAILABLE', 'Kunne ikke hente regnearket. Prøv igjen.');
	}
	if (!response.ok)
		throw new ApiError(
			502,
			'SHEETS_HTTP',
			'Google Sheets avviste henting. Kontroller eksport og deling.'
		);
	const text = await response.text();
	if (text.length > 5_000_000) throw new ApiError(502, 'SHEETS_SIZE', 'Regnearket er for stort.');
	if (cache.size > 200) cache.clear();
	cache.set(key, { text, expires: Date.now() + 60_000 });
	return text;
}
function formatFailure(error: unknown): never {
	if (error instanceof SheetFormatError) throw new ApiError(502, 'SHEET_FORMAT', error.message);
	throw error;
}
export async function planStatus(
	readerId: string,
	target: Account,
	refresh = false
): Promise<PlanStatus> {
	const sheet = activePlanSheet();
	if (!sheet) return null;
	const edit = sheetURL(target.editPlanSheet);
	const id = edit.pathname.split('/')[3];
	const url = new URL(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq`);
	url.searchParams.set('tqx', 'out:csv');
	url.searchParams.set('sheet', sheet);
	try {
		return parsePlanStatus(await fetchCSV(`${readerId}:${target.user.id}`, url, refresh));
	} catch (error) {
		return formatFailure(error);
	}
}
export async function workoutPlan(
	readerId: string,
	target: Account,
	refresh = false
): Promise<PlanData> {
	let workouts;
	try {
		workouts = parseWorkoutCSV(
			await fetchCSV(`${readerId}:${target.user.id}`, sheetURL(target.sheetUrl), refresh)
		);
	} catch (error) {
		return formatFailure(error);
	}
	let status: PlanStatus = null;
	const warnings: string[] = [];
	try {
		status = await planStatus(readerId, target, refresh);
	} catch (error) {
		warnings.push(error instanceof ApiError ? error.message : 'Kunne ikke hente planstatus.');
	}
	return { workouts, status, warnings };
}
export async function sharedPlan(readerId: string, refresh = false) {
	if (!env.FELLES_OKTER_SHEET_URL)
		throw new ApiError(503, 'CONFIGURATION', 'Fellesøkter er ikke konfigurert.');
	try {
		return parseSharedCSV(await fetchCSV(readerId, sheetURL(env.FELLES_OKTER_SHEET_URL), refresh));
	} catch (error) {
		return formatFailure(error);
	}
}
