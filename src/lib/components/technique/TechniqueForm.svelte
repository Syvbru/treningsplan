<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Video, X } from 'lucide-svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import State from '$lib/components/ui/State.svelte';
	import { api, message } from '$lib/client/api';
	import { uploadVideos, abandonVideos, type UploadedVideo } from '$lib/client/uploads';
	import { validateVideoFiles } from '$lib/domain/videos';
	import type { TechniqueLog } from '$lib/domain/types';
	export let initial: TechniqueLog | null = null;
	export let onSaved: (log: TechniqueLog) => void;
	export let onCancel: () => void;
	const prefix = initial ? `edit-${initial.id}` : 'new-log';
	let dato = initial?.dato ?? '';
	let stilart = initial?.stilart ?? '';
	let text = initial?.tilbakemelding ?? '';
	let existing = [...(initial?.video_urls ?? [])];
	let files: File[] = [],
		uploaded: UploadedVideo[] = [];
	let progress = 0,
		perFile: number[] = [],
		error = '';
	let stage: 'idle' | 'uploading' | 'saving' = 'idle';
	let controller: AbortController | null = null;
	let cancelling = false,
		destroyed = false;
	async function discard() {
		try {
			await abandonVideos(uploaded);
		} catch {
			console.warn('Videoer uten lagret logg må avstemmes senere.');
		}
		uploaded = [];
	}
	onDestroy(() => {
		destroyed = true;
		controller?.abort();
		void discard();
	});
	function selectFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		try {
			const selected = Array.from(input.files ?? []);
			validateVideoFiles(selected, existing.length);
			files = selected;
			error = '';
		} catch (cause) {
			error = message(cause);
			input.value = '';
		}
	}
	async function cancel() {
		if (stage === 'saving') return;
		if (stage === 'uploading') {
			cancelling = true;
			controller?.abort();
			return;
		}
		await discard();
		onCancel();
	}
	async function uploadSelectedVideos(signal: AbortSignal): Promise<void> {
		await uploadVideos(
			files,
			uploaded,
			signal,
			(total, each) => {
				progress = total;
				perFile = each;
			},
			(video) => {
				uploaded = [...uploaded, video];
			}
		);
	}
	function logPayload() {
		return {
			...(initial ? { id: initial.id } : {}),
			dato,
			stilart,
			tilbakemelding: text,
			video_urls: [...existing, ...uploaded.map((video) => video.url)]
		};
	}
	async function persistLog(): Promise<TechniqueLog> {
		return api<TechniqueLog>('/api/teknikk', {
			method: initial ? 'PUT' : 'POST',
			body: JSON.stringify(logPayload())
		});
	}
	async function save() {
		if (stage !== 'idle') return;
		error = '';
		cancelling = false;
		controller = new AbortController();
		stage = 'uploading';
		try {
			validateVideoFiles(files, existing.length);
			await uploadSelectedVideos(controller.signal);
			controller.signal.throwIfAborted();
			stage = 'saving';
			const log = await persistLog();
			uploaded = [];
			if (!destroyed) onSaved(log);
		} catch (cause) {
			if (!cancelling && !destroyed) error = message(cause);
		} finally {
			stage = 'idle';
			controller = null;
			if (cancelling) {
				await discard();
				onCancel();
			}
		}
	}
</script>

<form
	on:submit|preventDefault={save}
	class="teknikk-skjema flex flex-col gap-3"
	aria-busy={stage !== 'idle'}
>
	<Field
		textClass="text-form"
		id={`${prefix}-date`}
		label="Dato"
		type="date"
		bind:value={dato}
		required
		disabled={stage !== 'idle'}
	/>
	<Field
		textClass="text-form"
		id={`${prefix}-style`}
		label="Stilart"
		kind="select"
		bind:value={stilart}
		required
		disabled={stage !== 'idle'}
	>
		<option value="">Velg stilart…</option><option>Klassisk</option><option>Skate</option>
	</Field>
	<Field
		textClass="text-form"
		id={`${prefix}-text`}
		label="Tilbakemelding / hva øvde du på"
		kind="textarea"
		bind:value={text}
		required
		maxlength={10000}
		disabled={stage !== 'idle'}
		placeholder="F.eks. fokus på armtrekket, tilbakemelding fra trener…"
	/>
	{#if existing.length}<div>
			<p class="text-form text-xs font-semibold uppercase mb-2">Videoer ({existing.length})</p>
			{#each existing as url, i (url)}<div
					class="flex items-center gap-2 rounded-xl border border-divider bg-surface px-3 py-2 mb-2"
				>
					<Video class="h-4 w-4 text-primary" /><span class="flex-1 text-xs">Video {i + 1}</span>
					<button
						type="button"
						disabled={stage !== 'idle'}
						aria-label={`Fjern video ${i + 1}`}
						on:click={() => (existing = existing.filter((v) => v !== url))}
						class="text-red-400"><X class="h-4 w-4" /></button
					>
				</div>{/each}
		</div>{/if}
	<div>
		<p class="text-form text-xs font-semibold uppercase mb-1">Video (valgfritt)</p>
		<label
			for={`${prefix}-video`}
			class="text-form relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-divider p-4 cursor-pointer hover:border-primary focus-within:border-primary"
		>
			<input
				id={`${prefix}-video`}
				type="file"
				aria-label="Velg videoer"
				accept="video/mp4,video/quicktime,video/webm"
				multiple
				class="sr-only"
				disabled={stage !== 'idle' || uploaded.length > 0}
				on:change={selectFiles}
			/>
			<Video class="h-5 w-5 text-muted mb-1" />
			{#if files.length}{#each files as file, i (i)}<p
						class="text-form text-sm font-semibold truncate max-w-full"
					>
						{file.name}
					</p>
					{#if perFile[i] > 0}<progress
							aria-label={`Opplasting av ${file.name}`}
							max="100"
							value={perFile[i]}
							class="w-full h-1.5 accent-primary"
						></progress>{/if}
				{/each}{:else}<p class="text-sm text-form">Trykk for å velge én eller flere videoer</p>{/if}
		</label>
		<p class="text-xs text-form mt-1">MP4, MOV eller WebM. Maks 100 MB per video, 6 per logg.</p>
	</div>
	{#if stage === 'uploading' && files.length}<div role="status">
			<progress
				aria-label="Samlet videofremdrift"
				value={progress}
				max="100"
				class="w-full h-2 accent-primary"
			></progress>
			<p class="text-form text-xs text-center">Laster opp videoer… {progress}%</p>
		</div>{/if}
	<State {error} />
	{#if uploaded.length && error}<p class="text-xs text-form">
			Videoene er lastet opp, men loggen er ikke lagret. Prøv å lagre igjen for å bruke de samme
			videoene, eller avbryt. Ubrukte videoer registreres for senere opprydding.
		</p>{/if}
	<div class="flex gap-2 pt-1">
		<Button secondary disabled={stage === 'saving' || cancelling} on:click={cancel}>Avbryt</Button
		><Button type="submit" disabled={stage !== 'idle' || !dato || !stilart || !text.trim()}
			>{stage === 'uploading'
				? `Laster opp… ${progress}%`
				: stage === 'saving'
					? 'Lagrer…'
					: 'Lagre'}</Button
		>
	</div>
</form>
