import type { RequestHandler } from './$types';
import { endpoint, readJSON } from '$lib/server/http';
import { readTarget, requireAthlete } from '$lib/server/policy';
import { listLogs, createLog, updateLog, deleteLog } from '$lib/server/technique';
import { techniqueInput, logId } from '$lib/server/validation';
export const GET: RequestHandler = ({ locals, url }) =>
	endpoint(async () => listLogs(readTarget(locals, url.searchParams.get('utoverId')).user.id));
export const POST: RequestHandler = ({ locals, request }) =>
	endpoint(async () => {
		const user = requireAthlete(locals);
		return createLog(user.id, techniqueInput(await readJSON(request)));
	});
export const PUT: RequestHandler = ({ locals, request }) =>
	endpoint(async () => {
		const user = requireAthlete(locals);
		const body = await readJSON(request);
		return updateLog(user.id, logId(body.id), techniqueInput(body));
	});
export const DELETE: RequestHandler = ({ locals, request }) =>
	endpoint(async () => {
		const user = requireAthlete(locals);
		const body = await readJSON(request);
		await deleteLog(user.id, logId(body.id));
		return null;
	});
