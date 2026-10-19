<script lang="ts">
	import { CalendarDays, NotebookPen, ChartNoAxesCombined, Clapperboard } from 'lucide-svelte';
	import type { TrainingSection } from './presentation';
	export let active: TrainingSection;
	export let onSelect: (section: typeof active) => void;
	const sections = [
		{ id: 'plan', label: 'Plan', icon: CalendarDays },
		{ id: 'logg', label: 'Logg', icon: NotebookPen },
		{ id: 'statistikk', label: 'Statistikk', icon: ChartNoAxesCombined },
		{ id: 'film', label: 'Film', icon: Clapperboard }
	] as const;
</script>

<nav
	class="training-navigation fixed left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(0.1rem+env(safe-area-inset-bottom))] max-w-[38rem] mx-auto z-50 border [border-color:var(--nav-border)] rounded-[999px] bg-navigation [backdrop-filter:blur(20px)_saturate(180%)] shadow-[0_3px_12px_rgb(0_0_0_/_0.08)] p-1.5 md:static md:w-full md:max-w-5xl md:border-0 md:rounded-none md:bg-transparent md:backdrop-filter-none md:shadow-none md:px-4 md:pt-6 md:pb-0"
	aria-label="Hovedmeny"
>
	<div
		class="navigation-items relative isolate grid grid-cols-4 max-w-[40rem] mx-auto gap-1 md:flex md:max-w-none md:justify-between md:gap-2 [anchor-scope:--training-active]"
	>
		{#each sections as section (section.id)}
			<a
				class="relative flex flex-col items-center justify-center gap-0.5 min-h-[54px] text-muted rounded-[999px] text-[0.6875rem] font-[550] md:flex-row md:text-[0.875rem] md:py-2 md:px-6 md:gap-2 md:min-h-11 [&[aria-current]]:text-primary [&[aria-current]]:bg-primary/25 hover:[&:not([aria-current])]:bg-card [&[aria-current]]:[anchor-name:--training-active]"
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
			class="nav-pill moving-selection bg-primary/25 [--selection-anchor:--training-active]"
		></span>
	</div>
</nav>

<style>
	@supports (anchor-name: --training-active) and (left: anchor(left)) and
		(width: anchor-size(width)) {
		a[aria-current] {
			background: transparent;
		}
	}
</style>
