import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import { ApiError } from './http';
export function db() {
	if (!env.POSTGRES_URL)
		throw new ApiError(503, 'CONFIGURATION', 'Datatjenesten er ikke konfigurert.');
	return neon(env.POSTGRES_URL, { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
}
