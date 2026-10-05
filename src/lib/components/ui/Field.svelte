<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	export let id: string;
	export let label: string;
	export let value = '';
	export let kind: 'input' | 'textarea' | 'select' = 'input';
	export let type: 'text' | 'date' | 'password' = 'text';
	export let disabled = false;
	export let required = false;
	export let autocomplete: HTMLInputAttributes['autocomplete'] = undefined;
	export let maxlength: number | undefined = undefined;
	export let placeholder = '';
	const style =
		'form-field w-full appearance-none max-w-full min-w-0 rounded-xl border border-[var(--br)] bg-[var(--surface)] px-3 py-2.5 text-base text-[var(--text1)] outline-none focus:border-[var(--p1)] transition';
	$: inputAttributes = type === 'date' ? {} : { autocomplete, maxlength, placeholder };
</script>

<div class="min-w-0">
	<label
		for={id}
		class="mb-1 block text-xs font-semibold uppercase tracking-widest text-[var(--text1)]"
		>{label}</label
	>
	{#if kind === 'textarea'}<textarea
			{id}
			bind:value
			{disabled}
			{required}
			{maxlength}
			{placeholder}
			rows="3"
			class="{style} resize-none"></textarea>
	{:else if kind === 'select'}<select {id} bind:value {disabled} {required} class={style}
			><slot /></select
		>
	{:else}<input
			{id}
			{type}
			bind:value
			{disabled}
			{required}
			{...inputAttributes}
			class={style}
		/>{/if}
</div>
