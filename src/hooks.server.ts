import type { Handle, HandleServerError } from '@sveltejs/kit';
import { resolveSession, removeLegacyCookies, SESSION_COOKIE } from '$lib/server/sessions';
import { ApiError, failure } from '$lib/server/http';
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.authUnavailable = false;
	removeLegacyCookies(event.cookies);
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		try {
			event.locals.user = (await resolveSession(token))?.user ?? null;
			if (!event.locals.user) event.cookies.delete(SESSION_COOKIE, { path: '/' });
		} catch {
			event.locals.authUnavailable = true;
			console.error('[auth] Session service unavailable.');
		}
	}
	if (
		event.url.pathname.startsWith('/api/') &&
		!['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) &&
		event.request.headers.get('origin') !== event.url.origin
	)
		return failure(new ApiError(403, 'INVALID_ORIGIN', 'Ugyldig forespørselsopprinnelse.'));
	const response = await resolve(event);
	if (
		event.url.pathname.startsWith('/api/') ||
		event.url.pathname.startsWith('/trener') ||
		event.url.pathname.startsWith('/utover') ||
		event.url.pathname === '/login' ||
		event.url.pathname === '/'
	)
		response.headers.set('Cache-Control', 'private, no-store');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	return response;
};
export const handleError: HandleServerError = () => {
	console.error('[server] Unhandled request error.');
	return { message: 'Tjenesten er midlertidig utilgjengelig. Prøv igjen.' };
};
