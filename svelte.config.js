import adapter from '@sveltejs/adapter-auto';

const config = {
	compilerOptions: {
		warningFilter: (warning) =>
			warning.code !== 'a11y_media_has_caption' ||
			!warning.filename?.endsWith('TechniqueLogs.svelte')
	},
	kit: {
		adapter: adapter()
	}
};

export default config;
