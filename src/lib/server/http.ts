import { json } from '@sveltejs/kit';
import type { ApiFailure } from '$lib/domain/types';
export class ApiError extends Error {
	constructor(
		public status: number,
		public code: string,
		message: string,
		public retryAfterSeconds?: number
	) {
		super(message);
	}
}
export function failure(error: unknown): Response {
	const known = error instanceof ApiError;
	if (!known) console.error('[server] Request failed; internal details withheld.');
	const body: ApiFailure = {
		success: false,
		error: known ? error.message : 'Tjenesten er midlertidig utilgjengelig. Prøv igjen.',
		code: known ? error.code : 'SERVICE_UNAVAILABLE'
	};
	return json(body, {
		status: known ? error.status : 503,
		headers: {
			'Cache-Control': 'private, no-store',
			...(known && error.retryAfterSeconds
				? { 'Retry-After': String(error.retryAfterSeconds) }
				: {})
		}
	});
}
export async function endpoint(fn: () => Promise<unknown>): Promise<Response> {
	try {
		return json(
			{ success: true, data: await fn() },
			{ headers: { 'Cache-Control': 'private, no-store' } }
		);
	} catch (error) {
		return failure(error);
	}
}
export async function readJSON(request: Request): Promise<Record<string, unknown>> {
	if (!request.headers.get('content-type')?.startsWith('application/json'))
		throw new ApiError(415, 'CONTENT_TYPE', 'Bruk JSON-format.');
	const reader = request.body?.getReader();
	if (!reader) throw new ApiError(400, 'INVALID_JSON', 'Tom forespørsel.');
	const chunks: Uint8Array[] = [];
	let size = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > 32_768) {
			await reader.cancel();
			throw new ApiError(413, 'BODY_TOO_LARGE', 'Forespørselen er for stor.');
		}
		chunks.push(value);
	}
	try {
		const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString());
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
		return parsed as Record<string, unknown>;
	} catch {
		throw new ApiError(400, 'INVALID_JSON', 'Ugyldig JSON.');
	}
}
