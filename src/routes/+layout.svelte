<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { dev, browser } from '$app/environment';
	import { page } from '$app/stores';
	import { darkTheme, initialiseTheme, syncPageTheme } from '$lib/client/theme';
	$: if (browser) syncPageTheme($darkTheme, $page.url.pathname === '/login');
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	onMount(() => {
		initialiseTheme();
		injectAnalytics({ mode: dev ? 'development' : 'production' });
	});
</script>

<slot />
