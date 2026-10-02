import type { TechniqueLog, TechniqueInput } from '$lib/domain/types';
import { db } from './db';
import { ApiError } from './http';
function normalise(row: Record<string, unknown>): TechniqueLog {
	return {
		id: Number(row.id),
		dato: String(row.dato).slice(0, 10),
		stilart: row.stilart as TechniqueLog['stilart'],
		tilbakemelding: String(row.tilbakemelding || ''),
		video_urls: Array.isArray(row.video_urls) ? (row.video_urls as string[]) : []
	};
}
export async function listLogs(owner: string): Promise<TechniqueLog[]> {
	const rows =
		await db()`SELECT id, dato::text, stilart, tilbakemelding, COALESCE(video_urls,'{}') AS video_urls FROM teknikk_logger WHERE user_key_hash = ${owner} ORDER BY dato DESC, created_at DESC`;
	return rows.map(normalise);
}
async function validateAttachments(
	owner: string,
	urls: string[],
	previous: string[] = [],
	id: number | null = null
) {
	const added = urls.filter((u) => !previous.includes(u));
	if (!added.length) return;
	const rows =
		await db()`SELECT secure_url FROM video_uploads WHERE user_id = ${owner} AND secure_url = ANY(${added}::text[]) AND (log_id IS NULL OR log_id = ${id})`;
	if (added.some((url) => !rows.some((r) => r.secure_url === url)))
		throw new ApiError(
			400,
			'UNVERIFIED_VIDEO',
			'Videoen er ikke en bekreftet opplasting fra din konto. Prøv igjen.'
		);
}
export async function createLog(owner: string, input: TechniqueInput): Promise<TechniqueLog> {
	await validateAttachments(owner, input.video_urls);
	const [row] = await db()`WITH inserted AS (
    INSERT INTO teknikk_logger (user_key_hash,dato,stilart,tilbakemelding,video_urls) VALUES (${owner},${input.dato},${input.stilart},${input.tilbakemelding},${input.video_urls}) RETURNING *
  ), linked AS (
    UPDATE video_uploads SET state = 'attached', log_id = (SELECT id FROM inserted) WHERE user_id = ${owner} AND secure_url = ANY(${input.video_urls}::text[]) RETURNING id
  ) SELECT id,dato::text,stilart,tilbakemelding,video_urls FROM inserted`;
	return normalise(row);
}
export async function updateLog(
	owner: string,
	id: number,
	input: TechniqueInput
): Promise<TechniqueLog> {
	const [previous] =
		await db()`SELECT video_urls FROM teknikk_logger WHERE id = ${id} AND user_key_hash = ${owner}`;
	if (!previous) throw new ApiError(404, 'NOT_FOUND', 'Loggen finnes ikke eller er ikke din.');
	await validateAttachments(owner, input.video_urls, previous.video_urls ?? [], id);
	const [row] = await db()`WITH changed AS (
    UPDATE teknikk_logger SET dato = ${input.dato}, stilart = ${input.stilart}, tilbakemelding = ${input.tilbakemelding}, video_urls = ${input.video_urls}
    WHERE id = ${id} AND user_key_hash = ${owner} RETURNING *
  ), linked AS (
    UPDATE video_uploads SET log_id = CASE WHEN secure_url = ANY(${input.video_urls}::text[]) THEN ${id}::bigint ELSE NULL END,
    state = CASE WHEN secure_url = ANY(${input.video_urls}::text[]) THEN 'attached' ELSE 'abandoned' END
    WHERE user_id = ${owner} AND EXISTS (SELECT 1 FROM changed) AND (log_id = ${id} OR secure_url = ANY(${input.video_urls}::text[])) RETURNING id
  ) SELECT id,dato::text,stilart,tilbakemelding,video_urls FROM changed`;
	if (!row) throw new ApiError(404, 'NOT_FOUND', 'Loggen finnes ikke eller er ikke din.');
	return normalise(row);
}
export async function deleteLog(owner: string, id: number): Promise<void> {
	const rows = await db()`WITH deleted AS (
    DELETE FROM teknikk_logger WHERE id = ${id} AND user_key_hash = ${owner} RETURNING id
  ), detached AS (
    UPDATE video_uploads SET log_id = NULL, state = 'abandoned' WHERE user_id = ${owner} AND log_id = ${id} AND EXISTS (SELECT 1 FROM deleted) RETURNING id
  ) SELECT id FROM deleted`;
	if (!rows.length) throw new ApiError(404, 'NOT_FOUND', 'Loggen finnes ikke eller er ikke din.');
}
