import type { RequestHandler } from './$types';
import { endpoint, ApiError } from '$lib/server/http';
export const GET: RequestHandler = ({ locals }) =>
	endpoint(async () => {
		if (locals.authUnavailable)
			throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Innloggingstjenesten er utilgjengelig.');
		return { authenticated: !!locals.user, user: locals.user };
	});
