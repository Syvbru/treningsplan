import type { User } from '$lib/domain/types';
declare global {
	namespace App {
		interface Locals {
			user: User | null;
			authUnavailable: boolean;
		}
		interface Error {
			message: string;
		}
	}
}
export {};
