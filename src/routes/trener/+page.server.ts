import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requirePage } from '$lib/server/policy';
import { athletes, homePath } from '$lib/server/users';
export const load: PageServerLoad = ({ locals }) => {
	const user = requirePage(locals, 'trener');
	const destination = homePath(user);
	if (destination !== '/trener') redirect(303, destination);
	return { user, athletes: athletes() };
};
