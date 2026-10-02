<script lang="ts">
	export let type: 'button' | 'submit' = 'button';
	export let disabled = false;
	export let secondary = false;
	export let label: string | undefined = undefined;
</script>

<button
	{type}
	{disabled}
	aria-label={label}
	on:click
	class="rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-40 {secondary
		? 'border border-[var(--text2)] text-[var(--text1)] hover:bg-[var(--surface)]'
		: 'bg-[var(--p1)] text-white hover:opacity-80'}"><slot /></button
>
