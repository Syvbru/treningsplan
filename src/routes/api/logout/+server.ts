import type { RequestHandler } from './$types';
import { endpoint } from '$lib/server/http';
import { revokeSession, SESSION_COOKIE, removeLegacyCookies } from '$lib/server/sessions';
export const POST: RequestHandler = ({ cookies }) =>
	endpoint(async () => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) await revokeSession(token);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		removeLegacyCookies(cookies);
		return null;
	});
