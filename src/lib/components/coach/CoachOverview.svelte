<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import State from '$lib/components/ui/State.svelte';
	import ResourcesPanel from '$lib/components/resources/ResourcesPanel.svelte';
	import { darkTheme, initialiseTheme } from '$lib/client/theme';
	import { api, message } from '$lib/client/api';
	import type { User, Athlete, AthleteStatus } from '$lib/domain/types';
	export let user: User;
	export let athletes: Athlete[];
	let status: AthleteStatus[] = [],
		loading = true,
		error = '',
		profile = false;
	const controller = new AbortController();
	onMount(() => {
		initialiseTheme();
		void load();
		return () => controller.abort();
	});
	async function load() {
		loading = true;
		error = '';
		try {
			const data = await api<AthleteStatus[]>('/api/utovere?refresh=1', {
				signal: controller.signal
			});
			if (!controller.signal.aborted) status = data;
		} catch (cause) {
			if (!controller.signal.aborted) error = message(cause);
		} finally {
			if (!controller.signal.aborted) loading = false;
		}
	}
</script>

<div class="min-h-screen {$darkTheme ? 'dk' : 'lt'} bg-[var(--bg)] text-[var(--text1)]">
	<PageHeader onProfile={() => (profile = true)} />
	<main class="max-w-5xl mx-auto px-4 py-6 space-y-4">
		<h2 class="font-bold text-[var(--p1)]">Utøvere</h2>
		<State
			{loading}
			{error}
			onRetry={load}
			empty={!athletes.length ? 'Ingen utøvere er konfigurert.' : ''}
		/>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{#each athletes as athlete (athlete.id)}
				{@const state = status.find((s) => s.id === athlete.id)}
				<a
					href={`/trener/utovere/${athlete.id}`}
					class="rounded-2xl bg-[var(--card)] border border-[var(--br)] hover:border-[var(--p1)] p-4"
					><h3 class="font-bold text-[var(--p1)]">{athlete.name}</h3>
					<p class="text-xs mt-2 text-[var(--text2)]">
						{state?.statusError ||
							(state?.status === 'JA'
								? '🟢 Neste periodeplan klar'
								: state?.status === 'NEI'
									? '🔴 Neste periodeplan ikke klar'
									: loading
										? 'Laster planstatus…'
										: 'Ingen aktiv periode')}
					</p></a
				>
			{/each}
		</div>
	</main>
	{#if profile}<ResourcesPanel
			{user}
			bind:darkMode={$darkTheme}
			onClose={() => (profile = false)}
		/>{/if}
</div>
