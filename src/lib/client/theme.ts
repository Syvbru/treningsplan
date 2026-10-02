import { writable } from 'svelte/store';
export const darkTheme = writable(true);
let started = false;
export function initialiseTheme(): void {
	if (started) return;
	started = true;
	try {
		darkTheme.set(localStorage.getItem('dk') !== '0');
	} catch {
		console.warn('Tema kan ikke lagres i nettleseren.');
	}
	darkTheme.subscribe((value) => {
		try {
			localStorage.setItem('dk', value ? '1' : '0');
		} catch {
			console.warn('Tema kan ikke lagres i nettleseren.');
		}
	});
}

/** Keep browser edge areas and supported browser chrome in sync with the page. */
export function syncPageTheme(dark: boolean, login = false): void {
	if (typeof document === 'undefined') return;
	const background = login ? '#ffe6f7' : dark ? '#000000' : '#f2f2f7';
	document.documentElement.style.setProperty('--page-bg', background);
	document.documentElement.style.colorScheme = dark && !login ? 'dark' : 'light';
	let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
	if (!meta) {
		meta = document.createElement('meta');
		meta.name = 'theme-color';
		document.head.append(meta);
	}
	meta.content = background;
}
