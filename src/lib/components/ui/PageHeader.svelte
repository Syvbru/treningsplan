<script lang="ts">
	import { User } from 'lucide-svelte';
	export let onProfile: () => void;
</script>

<header
	class="relative md:sticky md:top-0 z-40"
	style="background-color:var(--bg);padding-top:env(safe-area-inset-top, 0px)"
>
	<div class="header-content mx-auto max-w-5xl px-4 pt-0 md:pt-3 pb-2">
		<div class="flex justify-between items-center gap-3">
			<div>
				<h1
					class="text-[clamp(1.5rem,7.7vw,1.875rem)] md:text-4xl font-bold italic leading-none tracking-tight"
				>
					<span class="text-[var(--p2)]">TRENINGS</span><span class="text-[var(--p1)]">PLAN</span>
				</h1>
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					data-dialog-focus-fallback
					on:click={(e) => {
						e.currentTarget.focus();
						onProfile();
					}}
					aria-label="Profil"
					class="quiet-focus bg-[var(--card)] text-[var(--p1)] rounded-full p-2 md:p-2.5 border border-transparent"
					><User class="h-4 w-4 md:h-5 md:w-5" /></button
				>
			</div>
		</div>
		<slot />
	</div>
</header>

<style>
	@media (display-mode: standalone) {
		.header-content {
			padding-top: 1.25rem;
		}
	}
</style>
