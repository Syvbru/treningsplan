import type { RequestHandler } from './$types';
import { endpoint, readJSON } from '$lib/server/http';
import { requireAthlete } from '$lib/server/policy';
import { reserveUpload, confirmUpload, abandonUpload, uploadId } from '$lib/server/cloudinary';
export const POST: RequestHandler = ({ locals, request }) =>
	endpoint(async () => {
		const user = requireAthlete(locals);
		return reserveUpload(user.id, await readJSON(request));
	});
export const PUT: RequestHandler = ({ locals, request }) =>
	endpoint(async () => {
		const user = requireAthlete(locals);
		const body = await readJSON(request);
		return confirmUpload(user.id, uploadId(body.id));
	});
export const DELETE: RequestHandler = ({ locals, request }) =>
	endpoint(async () => {
		const user = requireAthlete(locals);
		const body = await readJSON(request);
		await abandonUpload(user.id, uploadId(body.id));
		return null;
	});
