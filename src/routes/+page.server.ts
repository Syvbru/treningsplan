import { homePath } from '$lib/server/users';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ locals }) =>
	redirect(303, locals.user ? homePath(locals.user) : '/login');
