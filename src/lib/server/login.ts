import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { account, usernameId, homePath } from './users';
import { ApiError } from './http';
import { hashPassword, verifyPassword, verifyLegacy, dummyPasswordCheck } from './passwords';
import { createSession } from './sessions';
import type { Cookies } from '@sveltejs/kit';
export async function limitLogin(username: string, ip: string): Promise<void> {
	if (!env.AUTH_RATE_LIMIT_SECRET)
		throw new ApiError(503, 'CONFIGURATION', 'Innlogging er ikke konfigurert.');
	// Two atomic shared buckets, so changing usernames cannot evade the per-IP limit.
	for (const [key, limit] of [
		[`ip:${ip}`, 30],
		[`user:${usernameId(username)}`, 10]
	] as const) {
		const bucket = createHmac('sha256', env.AUTH_RATE_LIMIT_SECRET).update(key).digest('hex');
		const [row] =
			await db()`INSERT INTO auth_login_attempts (bucket, window_start, attempts) VALUES (${bucket}, now(), 1)
      ON CONFLICT (bucket) DO UPDATE SET
      attempts = CASE WHEN auth_login_attempts.window_start < now() - interval '15 minutes' THEN 1 ELSE auth_login_attempts.attempts + 1 END,
      window_start = CASE WHEN auth_login_attempts.window_start < now() - interval '15 minutes' THEN now() ELSE auth_login_attempts.window_start END RETURNING attempts`;
		if (Number(row.attempts) > limit)
			throw new ApiError(
				429,
				'RATE_LIMITED',
				'For mange innloggingsforsøk. Prøv igjen om 15 minutter.'
			);
	}
}
export async function login(body: Record<string, unknown>, ip: string, cookies: Cookies) {
	const { username, password } = body;
	if (
		typeof username !== 'string' ||
		!username.trim() ||
		username.length > 120 ||
		typeof password !== 'string' ||
		!password ||
		password.length > 1024
	)
		throw new ApiError(400, 'INVALID_INPUT', 'Oppgi brukernavn og passord.');
	await limitLogin(username, ip);
	const a = account(usernameId(username), username.trim());
	let valid = false;
	if (a) {
		const [upgraded] =
			await db()`SELECT password_hash FROM auth_passwords WHERE user_id = ${a.user.id} AND credential_source = ${a.source}`;
		if (upgraded) valid = await verifyPassword(password, String(upgraded.password_hash));
		else if (a.passwordHash.startsWith('scrypt$'))
			valid = await verifyPassword(password, a.passwordHash);
		else {
			valid = verifyLegacy(password, a.passwordHash);
			const stronger = await hashPassword(password); // same expensive work on failed legacy/unknown logins
			if (valid)
				await db()`INSERT INTO auth_passwords (user_id, credential_source, password_hash) VALUES (${a.user.id},${a.source},${stronger}) ON CONFLICT (user_id) DO UPDATE SET credential_source = EXCLUDED.credential_source, password_hash = EXCLUDED.password_hash, upgraded_at = now()`;
		}
	} else await dummyPasswordCheck(password);
	if (!valid || !a)
		throw new ApiError(401, 'INVALID_CREDENTIALS', 'Ugyldig brukernavn eller passord.');
	await createSession(a, cookies);
	return { user: a.user, redirectTo: homePath(a.user) };
}
