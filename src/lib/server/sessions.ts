import { randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { db } from './db';
import { account, sha256, type Account } from './users';
export const SESSION_COOKIE = 'training_session';
export const SESSION_SECONDS = 365 * 24 * 60 * 60;
export async function createSession(a: Account, cookies: Cookies): Promise<void> {
	const token = randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + SESSION_SECONDS * 1000);
	await db()`INSERT INTO auth_sessions (token_hash, user_id, credential_source, expires_at) VALUES (${sha256(token)}, ${a.user.id}, ${a.source}, ${expires.toISOString()})`;
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: SESSION_SECONDS
	});
}
export async function resolveSession(token: string): Promise<Account | null> {
	if (!/^[a-f0-9]{64}$/.test(token)) return null;
	const [row] =
		await db()`SELECT user_id, credential_source FROM auth_sessions WHERE token_hash = ${sha256(token)} AND revoked_at IS NULL AND expires_at > now()`;
	if (!row) return null;
	const a = account(String(row.user_id));
	return a && a.source === row.credential_source ? a : null;
}
export async function revokeSession(token: string): Promise<void> {
	if (/^[a-f0-9]{64}$/.test(token))
		await db()`UPDATE auth_sessions SET revoked_at = now() WHERE token_hash = ${sha256(token)} AND revoked_at IS NULL`;
}
export function removeLegacyCookies(cookies: Cookies): void {
	for (const name of ['auth_token', 'last_search_hash', 'last_search_name'])
		if (cookies.get(name)) cookies.delete(name, { path: '/' });
}
