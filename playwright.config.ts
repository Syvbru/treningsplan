import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: './tests/browser',
	fullyParallel: false,
	workers: 1,
	use: { baseURL: 'http://localhost:5189', trace: 'retain-on-failure' },
	webServer: {
		command: 'npx vite --config tests/preview/vite.config.ts',
		url: 'http://localhost:5189',
		reuseExistingServer: false
	},
	projects: [
		{ name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
		{
			name: 'mobile',
			use: {
				browserName: 'chromium',
				viewport: { width: 390, height: 844 },
				isMobile: true,
				hasTouch: true
			}
		}
	]
});
