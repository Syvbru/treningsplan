import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requirePage, readTarget } from '$lib/server/policy';
import { athletes } from '$lib/server/users';
import { ApiError } from '$lib/server/http';
export const load: PageServerLoad = ({ locals, params }) => {
	const user = requirePage(locals, 'trener');
	try {
		const target = readTarget(locals, params.utoverId);
		return {
			user,
			athlete: { id: target.user.id, name: target.user.name, editPlanSheet: target.editPlanSheet },
			athletes: athletes()
		};
	} catch (cause) {
		if (cause instanceof ApiError) error(cause.status, cause.message);
		throw cause;
	}
};
