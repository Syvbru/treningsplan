import { homePath } from '$lib/server/users';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, homePath(locals.user));
	return { authUnavailable: locals.authUnavailable };
};
