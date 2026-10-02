<script lang="ts">
	import { onMount } from 'svelte';
	import { startOfDay } from 'date-fns';
	import { X } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import State from '$lib/components/ui/State.svelte';
	import PlanCalendar from '$lib/components/calendar/PlanCalendar.svelte';
	import TrainingNavigation from './TrainingNavigation.svelte';
	import Statistics from '$lib/components/statistics/Statistics.svelte';
	import TechniqueLogs from '$lib/components/technique/TechniqueLogs.svelte';
	import TechniqueVideos from '$lib/components/resources/TechniqueVideos.svelte';
	import ResourcesPanel from '$lib/components/resources/ResourcesPanel.svelte';
	import AthletePicker from '$lib/components/coach/AthletePicker.svelte';
	import { darkTheme, initialiseTheme } from '$lib/client/theme';
	import { api, message } from '$lib/client/api';
	import type { User, Athlete, PlanData, SharedWorkout } from '$lib/domain/types';
	export let user: User;
	export let athlete: Athlete;
	export let athletes: Athlete[] = [];
	export let onAthleteSelect: ((id: string) => void) | undefined = undefined;
	let plan: PlanData | null = null,
		shared: SharedWorkout[] = [];
	let planLoading = true,
		planError = '',
		sharedError = '';
	let noticeDismissed = false,
		profile = false;
	let activeSection: 'plan' | 'logg' | 'statistikk' | 'film' = 'plan';
	let activeDate = startOfDay(new Date());
	const controller = new AbortController();
	let generation = 0;
	onMount(() => {
		initialiseTheme();
		syncSection();
		void load();
		return () => {
			generation++;
			controller.abort();
		};
	});
	async function load(refresh = false) {
		const request = ++generation;
		planLoading = true;
		planError = '';
		sharedError = '';
		await Promise.all([
			api<PlanData>(`/api/plan?utoverId=${athlete.id}${refresh ? '&refresh=1' : ''}`, {
				signal: controller.signal
			})
				.then((data) => {
					if (request === generation) plan = data;
				})
				.catch((error) => {
					if (request === generation && !controller.signal.aborted) planError = message(error);
				}),
			api<SharedWorkout[]>(`/api/felles-okter${refresh ? '?refresh=1' : ''}`, {
				signal: controller.signal
			})
				.then((data) => {
					if (request === generation) shared = data;
				})
				.catch((error) => {
					if (request === generation && !controller.signal.aborted) sharedError = message(error);
				})
		]);
		if (request === generation) planLoading = false;
	}
	function syncSection() {
		const section = window.location.hash.slice(1);
		activeSection =
			section === 'logg' || section === 'statistikk' || section === 'film' ? section : 'plan';
	}
	function selectSection(section: typeof activeSection) {
		activeSection = section;
		window.location.hash = section;
		window.scrollTo({ top: 0, behavior: 'instant' });
	}
</script>

<svelte:window on:hashchange={syncSection} />

<div
	class="min-h-screen {$darkTheme ? 'dk' : 'lt'} text-[var(--text1)]"
	style="background-color:var(--bg)"
>
	{#if plan?.status === 'NEI' && user.role === 'utover' && !noticeDismissed}<div
			class="fixed top-0 inset-x-0 z-[100] shadow-lg bg-[#7f1d1d] text-[#fecaca]"
		>
			<div class="mx-auto max-w-5xl p-4 m-4">
				<div class="flex items-center gap-3">
					<p class="flex-1 font-bold text-sm">Vennligst fullfør skissen for neste periodeplan</p>
					<button aria-label="Lukk varsel" on:click={() => (noticeDismissed = true)}
						><X class="h-5 w-5" /></button
					>
				</div>
				<p class="text-xs mt-1">
					Ferdigstill skissen din og endre feltet «MIN PLAN ER KLAR FOR Å FERDIGSTILLES» til «JA».
				</p>
			</div>
		</div>{/if}
	<PageHeader onProfile={() => (profile = true)}>
		{#if user.role === 'trener'}<div class="mt-3">
				<AthletePicker {athletes} selectedId={athlete.id} onSelect={onAthleteSelect} />
			</div>{/if}
	</PageHeader>
	<TrainingNavigation active={activeSection} onSelect={selectSection} />
	<main class="training-main mx-auto max-w-5xl px-4 py-6">
		<div hidden={activeSection !== 'plan'} class="plan-panel space-y-5">
			<State loading={planLoading} error={planError} onRetry={() => load(true)} />
			{#if !planLoading && !planError && plan}
				{#if plan.status}<div
						class="rounded-xl px-2 py-1 flex items-center gap-3 text-xs font-semibold {plan.status ===
						'JA'
							? 'bg-green-500/15 border border-green-500/40 text-green-400'
							: 'bg-red-500/15 border border-red-500/40 text-red-400'}"
					>
						<span
							class="w-2 h-2 rounded-full {plan.status === 'JA' ? 'bg-green-500' : 'bg-red-500'}"
						></span>{plan.status === 'JA'
							? 'Neste periodeplan klar for å ferdigstilles'
							: 'Neste periodeplan ikke klar for å ferdigstilles'}
					</div>{/if}
				{#each plan.warnings as warning (warning)}<State
						error={warning}
						onRetry={() => load(true)}
					/>{/each}
				<State error={sharedError} onRetry={() => load(true)} />
				{#if !plan.workouts.length}<State empty="Ingen treningsøkter er lagt inn ennå." />{/if}
				<PlanCalendar
					workouts={plan.workouts}
					{shared}
					athleteName={athlete.name}
					bind:selected={activeDate}
				/>
			{/if}
		</div>
		<div hidden={activeSection !== 'logg'}>
			<TechniqueLogs athleteId={athlete.id} readOnly={user.role === 'trener'} />
		</div>
		<div hidden={activeSection !== 'statistikk'}>
			<State loading={planLoading} error={planError} onRetry={() => load(true)} />
			{#if !planLoading && !planError && plan}<Statistics workouts={plan.workouts} />{/if}
		</div>
		{#if activeSection === 'film'}<TechniqueVideos />{/if}
	</main>
	{#if profile}<ResourcesPanel
			{user}
			{athlete}
			bind:darkMode={$darkTheme}
			onClose={() => (profile = false)}
		/>{/if}
</div>

<style>
	.training-main {
		padding-bottom: calc(7rem + env(safe-area-inset-bottom));
	}
	.plan-panel {
		width: 100%;
	}
	@media (min-width: 768px) {
		.training-main {
			padding-bottom: 3rem;
		}
	}
</style>
