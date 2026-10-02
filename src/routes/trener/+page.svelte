<script lang="ts">
	import CoachOverview from '$lib/components/coach/CoachOverview.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head><title>Treneroversikt – Treningsplan</title></svelte:head>
<CoachOverview user={data.user} athletes={data.athletes} />
