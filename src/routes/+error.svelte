<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head><title>Kunne ikke åpne siden – Treningsplan</title></svelte:head>
<main
	class="lt min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg)] p-6 text-[var(--text1)]"
>
	<h1 class="text-2xl font-bold">Kunne ikke åpne siden</h1>
	<p role="alert">{$page.error?.message || 'Prøv igjen senere.'}</p>
	<a class="underline" href="/">Til startsiden</a>
	<button class="rounded-xl bg-[var(--p1)] px-4 py-2 text-white" on:click={() => location.reload()}
		>Prøv igjen</button
	>
</main>
