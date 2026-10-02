import { error, redirect } from '@sveltejs/kit';
import type { User } from '$lib/domain/types';
import { account, homePath, type Account } from './users';
import { ApiError } from './http';
export function requireUser(locals: App.Locals): User {
	if (locals.authUnavailable)
		throw new ApiError(
			503,
			'AUTH_UNAVAILABLE',
			'Innloggingstjenesten er midlertidig utilgjengelig.'
		);
	if (!locals.user) throw new ApiError(401, 'UNAUTHENTICATED', 'Du må logge inn.');
	return locals.user;
}
export function requireCoach(locals: App.Locals): User {
	const user = requireUser(locals);
	if (user.role !== 'trener') throw new ApiError(403, 'FORBIDDEN', 'Ingen tilgang.');
	return user;
}
export function requireAthlete(locals: App.Locals): User {
	const user = requireUser(locals);
	if (user.role !== 'utover')
		throw new ApiError(403, 'READ_ONLY', 'Trener har kun lesetilgang til teknikklogger.');
	return user;
}
export function readTarget(locals: App.Locals, requestedId: string | null): Account {
	const user = requireUser(locals);
	const id = requestedId || (user.role === 'utover' ? user.id : '');
	if (!/^[a-f0-9]{64}$/.test(id)) throw new ApiError(400, 'INVALID_ID', 'Velg en gyldig utøver.');
	if (user.role === 'utover' && user.id !== id)
		throw new ApiError(403, 'FORBIDDEN', 'Ingen tilgang.');
	const target = account(id);
	if (!target || target.user.role !== 'utover')
		throw new ApiError(404, 'NOT_FOUND', 'Utøveren finnes ikke.');
	return target;
}
export function requirePage(locals: App.Locals, role: User['role']): User {
	if (locals.authUnavailable) error(503, 'Innloggingstjenesten er midlertidig utilgjengelig.');
	if (!locals.user) redirect(303, '/login');
	if (locals.user.role !== role) redirect(303, homePath(locals.user));
	return locals.user;
}
