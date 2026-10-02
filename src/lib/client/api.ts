export class ClientError extends Error {
	constructor(
		message: string,
		public status: number,
		public retryAfterSeconds?: number
	) {
		super(message);
	}
}

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
	const controller = new AbortController();
	const abort = () => controller.abort(init.signal?.reason);
	const timer = setTimeout(() => controller.abort(), 15_000);
	init.signal?.addEventListener('abort', abort, { once: true });
	if (init.signal?.aborted) abort();
	const headers = new Headers(init.headers);
	if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
	try {
		const response = await fetch(url, {
			...init,
			signal: controller.signal,
			headers
		});
		const body: unknown = await response.json().catch(() => null);
		if (!body || typeof body !== 'object' || !('success' in body))
			throw new ClientError('Tjenesten svarte ikke som forventet. Prøv igjen.', response.status);
		if (!response.ok || body.success !== true)
			throw new ClientError(
				'error' in body && typeof body.error === 'string'
					? body.error
					: 'Tjenesten svarte ikke som forventet. Prøv igjen.',
				response.status,
				response.status === 429
					? Number(response.headers.get('Retry-After')) || undefined
					: undefined
			);
		if (!('data' in body))
			throw new ClientError('Tjenesten svarte ikke som forventet. Prøv igjen.', response.status);
		return body.data as T;
	} catch (error) {
		if (init.signal?.aborted) throw init.signal.reason ?? error;
		if (error instanceof ClientError) throw error;
		throw new ClientError('Kunne ikke koble til serveren. Prøv igjen.', 0);
	} finally {
		clearTimeout(timer);
		init.signal?.removeEventListener('abort', abort);
	}
}
export const message = (error: unknown): string =>
	error instanceof Error ? error.message : 'Noe gikk galt. Prøv igjen.';
