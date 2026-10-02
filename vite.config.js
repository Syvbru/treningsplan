import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
	plugins: [sveltekit()],

	cacheDir: command === 'serve' ? 'node_modules/.vite-dev' : 'node_modules/.vite-build',
	server: {
		port: 5173,
		strictPort: true
	}
}));
