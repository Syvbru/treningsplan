import type { RequestHandler } from './$types';
import { endpoint } from '$lib/server/http';
import { requireUser } from '$lib/server/policy';
import { sharedPlan } from '$lib/server/sheets';
export const GET: RequestHandler = ({ locals, url }) =>
	endpoint(async () => sharedPlan(requireUser(locals).id, url.searchParams.get('refresh') === '1'));
