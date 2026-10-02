<script lang="ts">
	export let loading = false;
	export let error = '';
	export let empty = '';
	export let onRetry: (() => void) | undefined = undefined;
</script>

{#if loading}<p role="status" class="rounded-xl bg-[var(--card)] p-4 text-sm text-[var(--text2)]">
		Laster…
	</p>
{:else if error}<div
		role="alert"
		class="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-500"
	>
		<p>{error}</p>
		{#if onRetry}<button type="button" on:click={onRetry} class="mt-2 font-bold underline"
				>Prøv igjen</button
			>{/if}
	</div>
{:else if empty}<p
		class="rounded-2xl border border-[var(--br)] bg-[var(--card)] p-6 text-center text-sm text-[var(--text2)]"
	>
		{empty}
	</p>{/if}
