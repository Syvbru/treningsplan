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
		? 'border border-muted text-foreground hover:bg-surface'
		: 'bg-primary text-white hover:opacity-80'}"><slot /></button
>
