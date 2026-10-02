<script lang="ts">
	import { CalendarDays, NotebookPen, ChartNoAxesCombined, Clapperboard } from 'lucide-svelte';
	export let active: 'plan' | 'logg' | 'statistikk' | 'film';
	export let onSelect: (section: typeof active) => void;
	const sections = [
		{ id: 'plan', label: 'Plan', icon: CalendarDays },
		{ id: 'logg', label: 'Logg', icon: NotebookPen },
		{ id: 'statistikk', label: 'Statistikk', icon: ChartNoAxesCombined },
		{ id: 'film', label: 'Film', icon: Clapperboard }
	] as const;
</script>

<nav class="training-navigation" aria-label="Hovedmeny">
	<div class="navigation-items relative isolate [anchor-scope:--training-active]">
		{#each sections as section (section.id)}
			<a
				class="relative [&[aria-current]]:[anchor-name:--training-active]"
				href={`#${section.id}`}
				aria-current={active === section.id ? 'page' : undefined}
				on:click|preventDefault={() => onSelect(section.id)}
			>
				<svelte:component
					this={section.icon}
					size={22}
					strokeWidth={active === section.id ? 2 : 1.6}
					aria-hidden="true"
				/>
				<span>{section.label}</span>
			</a>
		{/each}
		<span
			aria-hidden="true"
			class="nav-pill hidden pointer-events-none absolute -z-10 rounded-full bg-[var(--p3)] [position-anchor:--training-active] [left:anchor(left)] [top:anchor(top)] [width:anchor-size(width)] [height:anchor-size(height)] transition-[left,top,width,height] duration-250 ease-out motion-reduce:transition-none"
		></span>
	</div>
</nav>

<style>
	.training-navigation {
		position: fixed;
		left: max(1rem, env(safe-area-inset-left));
		right: max(1rem, env(safe-area-inset-right));
		bottom: calc(0.75rem + env(safe-area-inset-bottom));
		max-width: 38rem;
		margin-inline: auto;
		z-index: 50;
		border: 1px solid var(--br);
		border-radius: 999px;
		background: var(--nav-bg);
		backdrop-filter: blur(20px) saturate(180%);
		box-shadow: 0 3px 12px rgb(0 0 0 / 0.08);
		padding: 0.375rem;
	}
	.navigation-items {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		max-width: 40rem;
		margin: 0 auto;
		gap: 0.25rem;
	}
	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		min-height: 54px;
		color: var(--text2);
		border-radius: 999px;
		font-size: 0.6875rem;
		font-weight: 550;
	}
	a[aria-current] {
		color: var(--p1);
		background: var(--p3);
	}
	@supports (anchor-name: --training-active) and (left: anchor(left)) and
		(width: anchor-size(width)) {
		.nav-pill {
			display: block;
		}
		a[aria-current] {
			background: transparent;
		}
	}
	@media (hover: hover) and (pointer: fine) {
		a:not([aria-current]):hover {
			background: var(--surface);
		}
	}
	@media (min-width: 768px) {
		.training-navigation {
			position: static;
			width: 100%;
			max-width: 64rem;
			margin: 0 auto;
			border: 0;
			border-radius: 0;
			background: transparent;
			backdrop-filter: none;
			box-shadow: none;
			padding: 1.5rem 1rem 0;
		}
		.navigation-items {
			display: flex;
			max-width: none;
			justify-content: space-between;
			gap: 0.5rem;
		}
		a {
			flex-direction: row;
			font-size: 0.875rem;
			padding: 0.5rem 1.5rem;
			gap: 0.5rem;
			min-height: 44px;
		}
	}
</style>
