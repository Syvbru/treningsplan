import type { RequestHandler } from './$types';
import { endpoint, readJSON } from '$lib/server/http';
import { login } from '$lib/server/login';
export const POST: RequestHandler = (event) =>
	endpoint(async () =>
		login(await readJSON(event.request), event.getClientAddress(), event.cookies)
	);
