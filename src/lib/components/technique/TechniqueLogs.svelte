<script lang="ts">
	import { onMount } from 'svelte';
	import { format, parseISO } from 'date-fns';
	import { nb } from 'date-fns/locale';
	import { Plus, Video, MessageSquare, SquarePen, Trash2 } from 'lucide-svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import State from '$lib/components/ui/State.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TechniqueForm from './TechniqueForm.svelte';
	import { api, message } from '$lib/client/api';
	import { cloudinaryThumb } from '$lib/domain/videos';
	import type { TechniqueLog } from '$lib/domain/types';
	export let athleteId: string;
	export let readOnly: boolean;
	let logs: TechniqueLog[] = [],
		selected: TechniqueLog | null = null;
	let creating = false,
		editing = false,
		confirmingDelete = false;
	let loading = true,
		deleting = false,
		error = '',
		mutationError = '',
		feedback = '';
	const controller = new AbortController();
	onMount(() => {
		void load();
		return () => controller.abort();
	});
	async function load() {
		loading = true;
		error = '';
		try {
			const result = await api<TechniqueLog[]>(`/api/teknikk?utoverId=${athleteId}`, {
				signal: controller.signal
			});
			if (!controller.signal.aborted) logs = result;
		} catch (cause) {
			if (!controller.signal.aborted) error = message(cause);
		} finally {
			if (!controller.signal.aborted) loading = false;
		}
	}
	function saved(log: TechniqueLog) {
		const edit = logs.some((l) => l.id === log.id);
		logs = [log, ...logs.filter((l) => l.id !== log.id)].sort(
			(a, b) => b.dato.localeCompare(a.dato) || b.id - a.id
		);
		feedback = edit ? 'Loggen er oppdatert.' : 'Loggen er lagret.';
		if (edit) selected = log;
		creating = false;
		editing = false;
		mutationError = '';
	}
	async function remove() {
		if (!selected || deleting) return;
		const id = selected.id;
		deleting = true;
		mutationError = '';
		try {
			await api('/api/teknikk', { method: 'DELETE', body: JSON.stringify({ id }) });
			logs = logs.filter((l) => l.id !== id);
			selected = null;
			confirmingDelete = false;
			feedback = 'Loggen er slettet.';
		} catch (cause) {
			mutationError = message(cause);
		} finally {
			deleting = false;
		}
	}
	function close() {
		if (deleting) return;
		selected = null;
		editing = false;
		confirmingDelete = false;
		mutationError = '';
	}
</script>

<section>
	<div class="flex items-center justify-between mb-3">
		<h2 class="text-base font-bold text-[var(--p1)]">Teknikklogg:</h2>
		{#if !readOnly}<button
				type="button"
				on:click={() => (creating = !creating)}
				class="flex items-center gap-1.5 bg-[var(--p1)] text-white rounded-full px-3 py-1.5 text-xs font-bold"
				><Plus class="h-3.5 w-3.5" />Ny logg</button
			>{/if}
	</div>
	{#if creating && !readOnly}<div
			class="bg-[var(--card)] rounded-2xl border border-[var(--br)] p-4 mb-4"
		>
			<h3 class="font-bold text-sm text-[var(--p1)] mb-3">Logg ny teknikkøkt</h3>
			<TechniqueForm onSaved={saved} onCancel={() => (creating = false)} />
		</div>{/if}
	<State
		{loading}
		{error}
		onRetry={load}
		empty={!loading && !error && logs.length === 0 ? 'Ingen teknikkøkter logget ennå.' : ''}
	/>
	{#if feedback}<p role="status" class="text-sm text-[var(--p1)] mb-3">{feedback}</p>{/if}
	{#if !loading && !error}<div class="technique-log-grid grid grid-cols-2 gap-3">
			{#each logs as log (log.id)}<button
					type="button"
					class="quiet-focus min-w-0 w-full rounded-2xl p-3 text-left bg-[var(--card)] border border-[var(--br)] flex flex-col"
					on:click={(event) => {
						event.currentTarget.focus();
						selected = log;
						mutationError = '';
					}}
				>
					<p
						class="text-sm font-bold italic uppercase leading-tight break-words text-[var(--p2)] mb-1.5"
					>
						Teknikk {log.stilart}
					</p>
					<p class="text-xs font-semibold text-[var(--p2)] mb-3">
						{format(parseISO(log.dato), 'd. MMM yyyy', { locale: nb })}
					</p>
					{#if log.video_urls.length}<div
							class="w-full rounded-lg overflow-hidden mb-2 bg-[var(--surface)] aspect-video"
						>
							<img
								src={cloudinaryThumb(log.video_urls[0])}
								alt="Forhåndsvisning av teknikkvideo"
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						</div>{/if}
					<div class="flex items-center gap-2 mt-auto pt-1 text-[var(--p2)]">
						{#if log.tilbakemelding}<MessageSquare
								class="h-5 w-5"
							/>{/if}{#if log.video_urls.length}<Video class="h-5 w-5" />{/if}
					</div>
				</button>{/each}
		</div>{/if}
</section>
{#if selected}<Dialog
		title={editing ? 'Rediger teknikklogg' : 'Teknikklogg'}
		onClose={close}
		swipeToClose={!editing && !confirmingDelete}
		animateSwipe
	>
		<div slot="header">
			<h2 class="font-bold text-lg text-[var(--p1)]">
				{editing ? 'Rediger logg' : `Teknikk – ${selected.stilart}`}
			</h2>
			<p class="text-sm mt-0.5 font-bold">
				{format(parseISO(selected.dato), 'd. MMMM yyyy', { locale: nb })}
			</p>
		</div>
		<div class="max-w-lg mx-auto lg:max-w-none p-5 pb-8">
			<State error={mutationError} />
			{#if confirmingDelete}<div class="rounded-xl border border-red-400/40 p-3 my-3">
					<p class="mb-3">Slett denne loggen?</p>
					<div class="flex gap-2">
						<Button secondary disabled={deleting} on:click={() => (confirmingDelete = false)}
							>Avbryt</Button
						><Button disabled={deleting} on:click={remove}
							>{deleting ? 'Sletter…' : 'Bekreft sletting'}</Button
						>
					</div>
				</div>
			{:else if editing && !readOnly}<TechniqueForm
					initial={selected}
					onSaved={saved}
					onCancel={() => (editing = false)}
				/>
			{:else}
				{#if !readOnly}<div class="flex items-center gap-6 mb-3">
						<button
							type="button"
							aria-label="Rediger logg"
							on:click={() => (editing = true)}
							class="flex items-center gap-2 min-h-11 text-sm text-[var(--p1)]"
							><SquarePen class="h-4 w-4" />Rediger</button
						>
						<button
							type="button"
							aria-label="Slett logg"
							on:click={() => (confirmingDelete = true)}
							class="flex items-center gap-2 min-h-11 text-sm text-red-400"
							><Trash2 class="h-4 w-4" />Slett</button
						>
					</div>{/if}
				<div class="rounded-xl bg-[var(--surface)] p-3.5 mb-4">
					<p class="text-xs font-bold uppercase text-[var(--p2)] tracking-widest mb-1.5">
						Tilbakemelding
					</p>
					<p class="text-sm whitespace-pre-wrap leading-relaxed">{selected.tilbakemelding}</p>
				</div>
				{#each selected.video_urls as url, i (url)}<div class="mb-4">
						<p class="text-xs font-semibold mb-2">Video {i + 1}</p>

						<video
							controls
							playsinline
							preload="metadata"
							aria-label={`Teknikkvideo ${i + 1}`}
							src={url}
							poster={cloudinaryThumb(url)}
							class="w-full aspect-video object-contain rounded-xl bg-black"
						></video>
					</div>{/each}
			{/if}
		</div>
	</Dialog>{/if}
