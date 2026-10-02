import { env } from '$env/dynamic/private';
import { isISODate } from '$lib/domain/dates';
import type { TechniqueInput } from '$lib/domain/types';
import { ApiError } from './http';
export function logId(value: unknown): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0)
		throw new ApiError(400, 'INVALID_ID', 'Ugyldig logg-ID.');
	return value;
}
export function videoURL(value: unknown): string {
	if (typeof value !== 'string' || value.length > 2048)
		throw new ApiError(400, 'INVALID_VIDEO', 'Ugyldig video-URL.');
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new ApiError(400, 'INVALID_VIDEO', 'Ugyldig video-URL.');
	}
	const cloud = env.CLOUDINARY_CLOUD_NAME;
	if (
		!cloud ||
		url.protocol !== 'https:' ||
		url.hostname !== 'res.cloudinary.com' ||
		url.port ||
		url.username ||
		url.password ||
		!url.pathname.startsWith(`/${cloud}/video/upload/`) ||
		url.search ||
		url.hash
	)
		throw new ApiError(400, 'INVALID_VIDEO', 'Videoen må komme fra appens Cloudinary-konto.');
	return value;
}
export function techniqueInput(body: Record<string, unknown>): TechniqueInput {
	const { dato, stilart, tilbakemelding, video_urls } = body;
	if (typeof dato !== 'string' || !isISODate(dato))
		throw new ApiError(400, 'INVALID_DATE', 'Oppgi en gyldig dato.');
	if (stilart !== 'Klassisk' && stilart !== 'Skate')
		throw new ApiError(400, 'INVALID_STYLE', 'Velg Klassisk eller Skate.');
	if (
		typeof tilbakemelding !== 'string' ||
		!tilbakemelding.trim() ||
		tilbakemelding.length > 10_000 ||
		Array.from(tilbakemelding).some((c) => c.charCodeAt(0) < 32 && !['\t', '\n', '\r'].includes(c))
	)
		throw new ApiError(400, 'INVALID_TEXT', 'Tilbakemeldingen må inneholde 1–10 000 tegn.');
	if (!Array.isArray(video_urls) || video_urls.length > 6)
		throw new ApiError(400, 'INVALID_VIDEO', 'Maks 6 videoer per logg.');
	const urls = video_urls.map(videoURL);
	if (new Set(urls).size !== urls.length)
		throw new ApiError(400, 'INVALID_VIDEO', 'Samme video kan ikke legges til flere ganger.');
	return { dato, stilart, tilbakemelding: tilbakemelding.trim(), video_urls: urls };
}
