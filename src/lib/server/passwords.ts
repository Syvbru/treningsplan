import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { sha256 } from './users';
const COST = 32_768;
async function derive(password: string, salt: string): Promise<Buffer> {
	return new Promise((resolve, reject) =>
		scrypt(password, salt, 64, { N: COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) =>
			err ? reject(err) : resolve(key)
		)
	);
}
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex');
	return `scrypt$${COST}$8$1$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const parts = hash.split('$');
	if (
		parts.length !== 6 ||
		parts[0] !== 'scrypt' ||
		parts[1] !== String(COST) ||
		parts[2] !== '8' ||
		parts[3] !== '1' ||
		!/^[a-f0-9]{32}$/.test(parts[4]) ||
		!/^[a-f0-9]{128}$/.test(parts[5])
	)
		return false;
	const key = await derive(password, parts[4]);
	return timingSafeEqual(key, Buffer.from(parts[5], 'hex'));
}
export function verifyLegacy(password: string, hash: string): boolean {
	return (
		/^[a-f0-9]{64}$/.test(hash) &&
		timingSafeEqual(Buffer.from(sha256(password), 'hex'), Buffer.from(hash, 'hex'))
	);
}
export async function dummyPasswordCheck(password: string): Promise<void> {
	await derive(password, '00000000000000000000000000000000');
}
