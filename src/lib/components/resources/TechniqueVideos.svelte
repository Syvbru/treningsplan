<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { teknikkVideoer } from '$lib/config/resources';
	let activeVideos = new Set<string>();
	function activateVideo(id: string) {
		activeVideos = new Set([...activeVideos, id]);
	}
	let teknikkScrollEl: HTMLDivElement;
	let teknikkAktivIndeks = 0;

	function scrollTeknikkTil(index: number) {
		if (!teknikkScrollEl) return;
		const bredde = teknikkScrollEl.clientWidth;
		teknikkScrollEl.scrollTo({ left: index * bredde, behavior: 'smooth' });
	}
	function teknikkForrige() {
		if (teknikkAktivIndeks > 0) scrollTeknikkTil(teknikkAktivIndeks - 1);
	}
	function teknikkNeste() {
		if (teknikkAktivIndeks < teknikkVideoer.length - 1) scrollTeknikkTil(teknikkAktivIndeks + 1);
	}
	function onTeknikkScroll() {
		if (!teknikkScrollEl) return;
		const bredde = teknikkScrollEl.clientWidth;
		teknikkAktivIndeks = bredde ? Math.round(teknikkScrollEl.scrollLeft / bredde) : 0;
	}
</script>

<section>
	<h2 class="text-base font-bold text-[var(--p1)] mb-3">Teknikkvideoer:</h2>

	<div class="flex-1 min-w-0">
		<div
			bind:this={teknikkScrollEl}
			on:scroll={onTeknikkScroll}
			class="no-scrollbar flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
		>
			{#each teknikkVideoer as video, i (video.url + i)}
				<div class="snap-center shrink-0 w-full p-2">
					<p class="text-md font-bold text-[var(--p2)] mb-3">
						{video.stilart} <span class="italic"> - {video.teknikk} </span>
					</p>
					<div class="rounded-2xl overflow-hidden">
						<div class="aspect-video relative w-full">
							{#if activeVideos.has(video.url)}
								<iframe
									class="w-full h-full"
									src="https://www.youtube.com/embed/{video.url}?autoplay=1"
									title={video.teknikk}
									frameborder="0"
									allowfullscreen
									allow="autoplay"
								></iframe>
							{:else}
								<button
									type="button"
									aria-label={`Spill ${video.stilart} ${video.teknikk}`}
									class="relative w-full h-full group"
									on:click={() => activateVideo(video.url)}
								>
									<img
										class="w-full h-full object-cover"
										src="https://img.youtube.com/vi/{video.url}/hqdefault.jpg"
										alt={video.teknikk}
										loading="lazy"
									/>
									<div class="absolute inset-0 flex items-center justify-center">
										<svg
											viewBox="0 0 68 48"
											class="w-16 h-11 drop-shadow-lg group-hover:scale-110 transition-transform"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<rect width="68" height="48" rx="12" fill="#FF0000" />
											<polygon points="26,14 26,34 46,24" fill="white" />
										</svg>
									</div>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	{#if teknikkVideoer.length > 1}
		<div class="flex justify-center items-center gap-3 mt-3">
			<button
				type="button"
				on:click={teknikkForrige}
				disabled={teknikkAktivIndeks === 0}
				aria-label="Forrige video"
				class="hidden sm:flex flex-shrink-0 items-center justify-center w-11 h-11 rounded-full text-[var(--p1)] hover:text-[var(--p1)]/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
			>
				<ChevronLeft class="h-7 w-7" strokeWidth={3} />
			</button>

			<div class="flex items-center gap-1.5">
				{#each teknikkVideoer as _, i (i)}
					<button
						type="button"
						on:click={() => scrollTeknikkTil(i)}
						aria-label={`Gå til video ${i + 1}`}
						class="h-2 rounded-full transition-all {i === teknikkAktivIndeks
							? 'w-5 bg-[var(--p1)]'
							: 'w-2 bg-[var(--br)]'}"
					>
					</button>
				{/each}
			</div>

			<button
				type="button"
				on:click={teknikkNeste}
				disabled={teknikkAktivIndeks === teknikkVideoer.length - 1}
				aria-label="Neste video"
				class="hidden sm:flex flex-shrink-0 items-center justify-center w-11 h-11 rounded-full text-[var(--p1)] hover:text-[var(--p1)]/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
			>
				<ChevronRight class="h-7 w-7" strokeWidth={3} />
			</button>
		</div>
	{/if}
</section>
