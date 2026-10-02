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
export function account(id: string, suppliedName = ''): Account | null {
	if (!/^[a-f0-9]{64}$/.test(id)) return null;
	if (id === env.ADMIN_USERNAME_HASH && env.ADMIN_PASSWORD_HASH) {
		return {
			user: { id, name: env.ADMIN_DISPLAY_NAME || 'Trener', role: 'trener' },
			passwordHash: env.ADMIN_PASSWORD_HASH,
			source: sha256(env.ADMIN_PASSWORD_HASH),
			sheetUrl: '',
			editPlanSheet: ''
		};
	}
	const credential = credentials()[id];
	if (!credential || typeof credential.hash !== 'string') return null;
	const name =
		(env.USER_NAMES || '')
			.split(',')
			.map((n) => n.trim())
			.find((n) => usernameId(n) === id) ||
		credential.name ||
		suppliedName ||
		'Utøver';
	return {
		user: { id, name, role: 'utover' },
		passwordHash: credential.hash,
		source: sha256(credential.hash),
		sheetUrl: credential.sheetUrl || '',
		editPlanSheet: credential.editPlanSheet || ''
	};
}
export function athletes(): Athlete[] {
	return Object.keys(credentials())
		.map((id) => account(id))
		.filter((a): a is Account => !!a && a.user.role === 'utover')
		.map((a) => ({ id: a.user.id, name: a.user.name, editPlanSheet: a.editPlanSheet }))
		.sort((a, b) => a.name.localeCompare(b.name, 'nb'));
}

/** Coaches open the first athlete in the same order as the athlete picker. */
export function homePath(user: User): string {
	if (user.role !== 'trener') return '/utover';
	const first = athletes()[0];
	return first ? `/trener/utovere/${first.id}` : '/trener';
}
