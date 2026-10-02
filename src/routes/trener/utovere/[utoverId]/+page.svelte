<script lang="ts">
	import { goto } from '$app/navigation';
	import TrainingView from '$lib/components/training/TrainingView.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head><title>{data.athlete.name} – Treningsplan</title></svelte:head>
{#key data.athlete.id}<TrainingView
		user={data.user}
		athlete={data.athlete}
		athletes={data.athletes}
		onAthleteSelect={(id) => {
			void goto(`/trener/utovere/${id}`);
		}}
	/>{/key}
