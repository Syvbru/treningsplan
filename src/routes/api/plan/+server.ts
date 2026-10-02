import type { RequestHandler } from './$types';
import { endpoint } from '$lib/server/http';
import { readTarget, requireUser } from '$lib/server/policy';
import { workoutPlan } from '$lib/server/sheets';
export const GET: RequestHandler = ({ locals, url }) =>
	endpoint(async () => {
		const user = requireUser(locals);
		const target = readTarget(locals, url.searchParams.get('utoverId'));
		return workoutPlan(user.id, target, url.searchParams.get('refresh') === '1');
	});
