import { createHash, randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { ApiError } from './http';
import { VIDEO_MAX_BYTES, VIDEO_TYPES } from '$lib/domain/videos';
import { videoURL } from './validation';
import { sha256 } from './users';
function config() {
	const cloud = env.CLOUDINARY_CLOUD_NAME;
	const preset = env.CLOUDINARY_UPLOAD_PRESET;
	if (!cloud || !preset || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)
		throw new ApiError(
			503,
			'UPLOAD_CONFIGURATION',
			'Videoopplasting er ikke konfigurert. Prøv igjen senere.'
		);
	return { cloud, preset, key: env.CLOUDINARY_API_KEY, secret: env.CLOUDINARY_API_SECRET };
}
export async function reserveUpload(
	owner: string,
	body: Record<string, unknown>
): Promise<{ id: string; url: string; params: Record<string, string> }> {
	if (
		typeof body.size !== 'number' ||
		!Number.isSafeInteger(body.size) ||
		body.size <= 0 ||
		body.size > VIDEO_MAX_BYTES ||
		typeof body.type !== 'string' ||
		!VIDEO_TYPES.includes(body.type)
	)
		throw new ApiError(400, 'INVALID_FILE', 'Velg MP4, MOV eller WebM på maks 100 MB.');
	const c = config();
	const id = randomUUID();
	const publicId = `teknikk/${owner}/${id}`;
	const bucket = sha256(`upload:${owner}`);
	const [quota] =
		await db()`INSERT INTO auth_login_attempts (bucket,window_start,attempts) VALUES (${bucket},now(),1)
 ON CONFLICT (bucket) DO UPDATE SET
 attempts = CASE WHEN auth_login_attempts.window_start < now() - interval '1 hour' THEN 1 ELSE auth_login_attempts.attempts + 1 END,
 window_start = CASE WHEN auth_login_attempts.window_start < now() - interval '1 hour' THEN now() ELSE auth_login_attempts.window_start END RETURNING attempts`;
	if (Number(quota.attempts) > 30)
		throw new ApiError(429, 'UPLOAD_LIMIT', 'For mange videoopplastinger. Prøv igjen senere.');

	await db()`INSERT INTO video_uploads (id,user_id,public_id) VALUES (${id},${owner},${publicId})`;
	const params: Record<string, string> = {
		public_id: publicId,
		timestamp: String(Math.floor(Date.now() / 1000)),
		upload_preset: c.preset,
		overwrite: 'false'
	};
	const canonical = Object.keys(params)
		.sort()
		.map((k) => `${k}=${params[k]}`)
		.join('&');
	const signature = createHash('sha256')
		.update(canonical + c.secret)
		.digest('hex');
	return {
		id,
		url: `https://api.cloudinary.com/v1_1/${c.cloud}/video/upload`,
		params: { ...params, signature, api_key: c.key }
	};
}
export async function confirmUpload(owner: string, id: string) {
	const [row] =
		await db()`SELECT public_id,secure_url FROM video_uploads WHERE id = ${id} AND user_id = ${owner} AND log_id IS NULL`;
	if (!row) throw new ApiError(404, 'NOT_FOUND', 'Opplastingen finnes ikke.');
	const c = config();
	let response: Response;
	try {
		response = await fetch(
			`https://api.cloudinary.com/v1_1/${c.cloud}/resources/video/upload/${encodeURIComponent(String(row.public_id))}`,
			{
				signal: AbortSignal.timeout(10_000),
				headers: {
					Authorization: `Basic ${Buffer.from(`${c.key}:${c.secret}`).toString('base64')}`
				}
			}
		);
	} catch {
		throw new ApiError(502, 'UPLOAD_VERIFY', 'Kunne ikke bekrefte videoen. Prøv igjen.');
	}
	if (!response.ok)
		throw new ApiError(502, 'UPLOAD_VERIFY', 'Cloudinary kunne ikke bekrefte videoen. Prøv igjen.');
	let raw: unknown;
	try {
		raw = await response.json();
	} catch {
		throw new ApiError(502, 'UPLOAD_VERIFY', 'Cloudinary returnerte ugyldige metadata.');
	}
	if (!raw || typeof raw !== 'object' || Array.isArray(raw))
		throw new ApiError(502, 'UPLOAD_VERIFY', 'Cloudinary returnerte ugyldige metadata.');
	const asset = raw as Record<string, unknown>;
	if (
		asset.public_id !== row.public_id ||
		asset.resource_type !== 'video' ||
		typeof asset.format !== 'string' ||
		!['mp4', 'mov', 'webm'].includes(asset.format) ||
		typeof asset.bytes !== 'number' ||
		!Number.isSafeInteger(asset.bytes) ||
		asset.bytes <= 0 ||
		asset.bytes > VIDEO_MAX_BYTES
	)
		throw new ApiError(400, 'INVALID_VIDEO', 'Videoens format eller størrelse er ikke tillatt.');
	const url = videoURL(asset.secure_url);
	await db()`UPDATE video_uploads SET secure_url = ${url}, state = 'pending' WHERE id = ${id} AND user_id = ${owner} AND log_id IS NULL`;
	return { url };
}
export async function abandonUpload(owner: string, id: string) {
	await db()`UPDATE video_uploads SET state = 'abandoned' WHERE id = ${id} AND user_id = ${owner} AND log_id IS NULL`;
}
export function uploadId(value: unknown): string {
	if (
		typeof value !== 'string' ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)
	)
		throw new ApiError(400, 'INVALID_ID', 'Ugyldig opplastings-ID.');
	return value;
}
