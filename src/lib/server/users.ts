import { createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { User, Athlete } from '$lib/domain/types';
import { ApiError } from './http';
export function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}
export function usernameId(name: string): string {
	return sha256(name.trim().toLowerCase());
}
interface Credential {
	hash: string;
	sheetUrl: string;
	editPlanSheet: string;
	name?: string;
}
export interface Account {
	user: User;
	passwordHash: string;
	source: string;
	sheetUrl: string;
	editPlanSheet: string;
}
function credentials(): Record<string, Credential> {
	try {
		const parsed = JSON.parse(env.USER_CREDENTIALS || '{}');
		if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
		return parsed;
	} catch {
		throw new ApiError(503, 'CONFIGURATION', 'Brukerkonfigurasjonen er ugyldig.');
	}
}
function coachAccount(id: string): Account | null {
	if (id === env.ADMIN_USERNAME_HASH && env.ADMIN_PASSWORD_HASH) {
		return {
			user: { id, name: env.ADMIN_DISPLAY_NAME || 'Trener', role: 'trener' },
			passwordHash: env.ADMIN_PASSWORD_HASH,
			source: sha256(env.ADMIN_PASSWORD_HASH),
			sheetUrl: '',
			editPlanSheet: ''
		};
	}
	return null;
}

function configuredNames(): Map<string, string> {
	const names = new Map<string, string>();
	for (const value of (env.USER_NAMES || '').split(',')) {
		const name = value.trim();
		const id = usernameId(name);
		if (!names.has(id)) names.set(id, name);
	}
	return names;
}

function athleteAccount(
	id: string,
	credential: Credential | undefined,
	names: Map<string, string>,
	suppliedName = ''
): Account | null {
	if (!credential || typeof credential.hash !== 'string') return null;
	const name = names.get(id) || credential.name || suppliedName || 'Utøver';
	return {
		user: { id, name, role: 'utover' },
		passwordHash: credential.hash,
		source: sha256(credential.hash),
		sheetUrl: credential.sheetUrl || '',
		editPlanSheet: credential.editPlanSheet || ''
	};
}

export function account(id: string, suppliedName = ''): Account | null {
	if (!/^[a-f0-9]{64}$/.test(id)) return null;
	const coach = coachAccount(id);
	if (coach) return coach;
	return athleteAccount(id, credentials()[id], configuredNames(), suppliedName);
}

export function athletes(): Athlete[] {
	const configuredCredentials = credentials();
	const names = configuredNames();
	return Object.keys(configuredCredentials)
		.filter((id) => /^[a-f0-9]{64}$/.test(id) && !coachAccount(id))
		.map((id) => athleteAccount(id, configuredCredentials[id], names))
		.filter((account): account is Account => account !== null)
		.map((account) => ({
			id: account.user.id,
			name: account.user.name,
			editPlanSheet: account.editPlanSheet
		}))
		.sort((a, b) => a.name.localeCompare(b.name, 'nb'));
}

export function homePath(user: User): string {
	if (user.role !== 'trener') return '/utover';
	const first = athletes()[0];
	return first ? `/trener/utovere/${first.id}` : '/trener';
}
