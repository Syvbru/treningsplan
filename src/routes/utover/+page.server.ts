import type { PageServerLoad } from './$types';
import { requirePage, readTarget } from '$lib/server/policy';
export const load: PageServerLoad = ({ locals }) => {
	const user = requirePage(locals, 'utover');
	const target = readTarget(locals, user.id);
	return {
		user,
		athlete: { id: user.id, name: user.name, editPlanSheet: target.editPlanSheet },
		athletes: []
	};
};
