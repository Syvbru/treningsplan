import type { RequestHandler } from './$types';
import { endpoint, ApiError } from '$lib/server/http';
import { requireCoach } from '$lib/server/policy';
import { athletes, account } from '$lib/server/users';
import { planStatus } from '$lib/server/sheets';
export const GET: RequestHandler = ({ locals, url }) =>
	endpoint(async () => {
		const user = requireCoach(locals);
		return Promise.all(
			athletes().map(async (athlete) => {
				try {
					return {
						...athlete,
						status: await planStatus(
							user.id,
							account(athlete.id)!,
							url.searchParams.get('refresh') === '1'
						),
						statusError: null
					};
				} catch (error) {
					return {
						...athlete,
						status: null,
						statusError: error instanceof ApiError ? error.message : 'Kunne ikke hente planstatus.'
					};
				}
			})
		);
	});
