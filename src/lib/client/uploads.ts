import { api } from './api';
import { validateVideoFiles } from '$lib/domain/videos';
export interface UploadedVideo {
	id: string;
	url: string;
}
interface Ticket {
	id: string;
	url: string;
	params: Record<string, string>;
}
function transfer(
	file: File,
	ticket: Ticket,
	signal: AbortSignal,
	progress: (loaded: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const data = new FormData();
		data.append('file', file);
		for (const [key, value] of Object.entries(ticket.params)) data.append(key, value);
		const abort = () => xhr.abort();
		const finish = (error?: Error) => {
			signal.removeEventListener('abort', abort);
			if (error) reject(error);
			else resolve();
		};
		xhr.open('POST', ticket.url);
		xhr.timeout = 120_000;
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) progress(Math.min(file.size, (e.loaded / e.total) * file.size));
		};
		xhr.onload = () =>
			finish(
				xhr.status >= 200 && xhr.status < 300
					? undefined
					: new Error('Cloudinary avviste opplastingen. Prøv igjen.')
			);
		xhr.onerror = () => finish(new Error('Nettverksfeil under videoopplasting.'));
		xhr.ontimeout = () => finish(new Error('Videoopplastingen tok for lang tid. Prøv igjen.'));
		xhr.onabort = () => finish(new DOMException('Opplasting avbrutt.', 'AbortError'));
		signal.addEventListener('abort', abort, { once: true });
		if (signal.aborted) finish(new DOMException('Opplasting avbrutt.', 'AbortError'));
		else xhr.send(data);
	});
}
/** Append each confirmed upload immediately, so retries reuse it even after partial failure. */
export async function uploadVideos(
	files: File[],
	confirmed: UploadedVideo[],
	signal: AbortSignal,
	onProgress: (total: number, perFile: number[]) => void,
	onConfirmed: (video: UploadedVideo) => void
): Promise<void> {
	validateVideoFiles(files);
	const loaded = files.map((f, i) => (i < confirmed.length ? f.size : 0));
	const total = files.reduce((sum, f) => sum + f.size, 0);
	const report = () =>
		onProgress(
			total ? Math.round((loaded.reduce((a, b) => a + b, 0) / total) * 100) : 0,
			loaded.map((bytes, i) => Math.round((bytes / files[i].size) * 100))
		);
	for (let i = confirmed.length; i < files.length; i++) {
		signal.throwIfAborted();
		const ticket = await api<Ticket>('/api/uploads', {
			method: 'POST',
			body: JSON.stringify({ size: files[i].size, type: files[i].type }),
			signal
		});
		try {
			await transfer(files[i], ticket, signal, (bytes) => {
				loaded[i] = bytes;
				report();
			});
			const { url } = await api<{ url: string }>('/api/uploads', {
				method: 'PUT',
				body: JSON.stringify({ id: ticket.id }),
				signal
			});
			loaded[i] = files[i].size;
			report();
			onConfirmed({ id: ticket.id, url });
		} catch (error) {
			// Best effort only: the pre-upload database reservation remains if this request fails.
			await api('/api/uploads', {
				method: 'DELETE',
				body: JSON.stringify({ id: ticket.id })
			}).catch(() => {
				console.warn('Opplastingen må avstemmes senere.');
			});
			throw error;
		}
	}
}
export async function abandonVideos(videos: UploadedVideo[]): Promise<void> {
	await Promise.all(
		videos.map((v) => api('/api/uploads', { method: 'DELETE', body: JSON.stringify({ id: v.id }) }))
	);
}
