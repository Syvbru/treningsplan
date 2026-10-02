<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { X } from 'lucide-svelte';
	export let title: string;
	export let onClose: () => void;
	export let swipeToClose = true;
	export let animateSwipe = false;
	let dragX = 0,
		dragY = 0,
		dragging = false,
		closing = false;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	export let variant: 'sheet' | 'calendar' | 'sidebar' = 'sheet';
	let element: HTMLDialogElement;
	let content: HTMLDivElement;
	let previous: HTMLElement | null = null;
	let introReady = false;
	let gestureActive = false;
	let suppressClickUntil = 0;
	function panelEntrance(node: Element) {
		if (variant !== 'sidebar') return { duration: 0 };
		const width =
			parseFloat(getComputedStyle(node).width) || Math.min(288, window.innerWidth * 0.85);
		return {
			duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220,
			easing: cubicOut,
			css: (progress: number) => `transform: translateX(${(1 - progress) * width}px)`
		};
	}
	function suppressSwipeClick(event: MouseEvent) {
		if (Date.now() >= suppressClickUntil) return;
		suppressClickUntil = 0;
		event.preventDefault();
		event.stopPropagation();
	}
	let startX = 0,
		startY = 0,
		atTop = false;
	onMount(() => {
		previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const overflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		element.showModal();
		content.addEventListener('click', suppressSwipeClick, true);
		const observer = new MutationObserver(() => {
			if (element.open && !element.contains(document.activeElement)) {
				element
					.querySelector<HTMLElement>(
						'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
					)
					?.focus();
			}
		});
		observer.observe(content, { childList: true, subtree: true });
		return () => {
			clearTimeout(closeTimer);
			content.removeEventListener('click', suppressSwipeClick, true);
			observer.disconnect();
			element.close();
			document.body.style.overflow = overflow;
			if (previous?.isConnected && previous !== document.body) previous.focus();
			else document.querySelector<HTMLElement>('[data-dialog-focus-fallback]')?.focus();
		};
	});
	function touchStart(e: TouchEvent) {
		if (closing) return;
		dragging = false;
		dragY = 0;
		dragX = 0;
		gestureActive = false;
		if (
			!swipeToClose ||
			e.touches.length !== 1 ||
			(e.target as Element).closest(
				variant === 'sidebar'
					? 'input,textarea,select,video,iframe'
					: 'input,textarea,select,video,iframe,button,a'
			)
		) {
			atTop = false;
			return;
		}
		gestureActive = true;
		const scroll = (e.target as Element).closest('.overflow-y-auto, .dialog-content') || content;
		atTop = scroll.scrollTop <= 0;
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
	}
	function touchMove(e: TouchEvent) {
		if (!gestureActive || !swipeToClose || closing || e.touches.length !== 1) return;
		const dx = e.touches[0].clientX - startX;
		const dy = e.touches[0].clientY - startY;
		if (variant === 'sidebar') {
			if (!dragging && (dx < -8 || Math.abs(dy) > Math.max(24, dx))) {
				gestureActive = false;
				return;
			}
			if (!dragging && (dx < 8 || Math.abs(dy) >= dx)) return;
			dragging = true;
			dragX = Math.max(0, dx);
		} else {
			if (!animateSwipe || variant !== 'sheet' || !atTop) return;
			if (!dragging && (dy < -8 || Math.abs(dx) > Math.max(24, dy))) {
				gestureActive = false;
				return;
			}
			if (!dragging && (dy <= 0 || Math.abs(dx) >= dy)) return;
			dragging = true;
			dragY = Math.max(0, dy);
		}
		suppressClickUntil = Date.now() + 350;
		if (e.cancelable) e.preventDefault();
	}
	function resetDrag() {
		gestureActive = false;
		dragX = 0;
		dragging = false;
		dragY = 0;
		atTop = false;
	}
	function touchEnd(e: TouchEvent) {
		if (closing) return;
		if (
			!gestureActive ||
			!swipeToClose ||
			!e.changedTouches.length ||
			e.touches.length ||
			(e.target as Element).closest(
				variant === 'sidebar'
					? 'input,textarea,select,video,iframe'
					: 'input,textarea,select,video,iframe,button,a'
			)
		) {
			resetDrag();
			return;
		}
		const dx = e.changedTouches[0].clientX - startX,
			dy = e.changedTouches[0].clientY - startY;
		if (
			variant === 'sidebar' ? dx > 80 && Math.abs(dy) < dx : atTop && dy > 100 && Math.abs(dx) < dy
		) {
			if (
				(variant === 'sidebar' || (animateSwipe && variant === 'sheet')) &&
				!window.matchMedia('(prefers-reduced-motion: reduce)').matches
			) {
				dragging = false;
				closing = true;
				if (variant === 'sidebar') dragX = content.offsetWidth + 32;
				else dragY = content.offsetHeight + 32;
				closeTimer = setTimeout(onClose, 180);
			} else onClose();
		} else resetDrag();
	}
</script>

<dialog
	bind:this={element}
	aria-label={title}
	class="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent"
	class:calendar={variant === 'calendar'}
	class:sidebar={variant === 'sidebar'}
	on:cancel|preventDefault={onClose}
	on:click={(e) => {
		if (e.target === element) onClose();
	}}
>
	<div
		class="dialog-motion"
		class:sidebar-motion={variant === 'sidebar'}
		style:visibility={variant === 'sidebar' && !introReady ? 'hidden' : undefined}
		on:introstart={() => (introReady = true)}
		in:panelEntrance
	>
		<div
			bind:this={content}
			role="group"
			class:dragging
			class:closing
			class:swipe-sheet={animateSwipe}
			style:transform={dragX
				? `translateX(${dragX}px)`
				: dragY
					? `translateY(${dragY}px)`
					: undefined}
			class="dialog-content bg-[var(--card)] shadow-2xl text-[var(--text1)]"
			on:touchstart={touchStart}
			on:touchmove|nonpassive={touchMove}
			on:touchcancel={resetDrag}
			on:touchend={touchEnd}
		>
			{#if variant === 'sheet'}<div class="lg:hidden flex justify-center pt-4" aria-hidden="true">
					<div class="w-16 h-[5px] rounded-full bg-slate-300"></div>
				</div>{/if}
			{#if $$slots.header}
				<div class="dialog-header">
					<div class="min-w-0 flex-1"><slot name="header" /></div>
					<button
						type="button"
						aria-label="Lukk dialog"
						on:click={onClose}
						class="quiet-focus dialog-close shrink-0 flex h-8 w-8 items-center justify-center text-[var(--text2)]"
						><X class="h-5 w-5" /></button
					>
				</div>
			{:else}
				<button
					type="button"
					aria-label="Lukk dialog"
					on:click={onClose}
					class="quiet-focus dialog-close absolute right-4 top-4 z-10 rounded-lg bg-[var(--surface)] p-1.5 text-[var(--text2)]"
					><X class="h-5 w-5" /></button
				>
			{/if}
			<slot />
		</div>
	</div>
</dialog>

<style>
	.dialog-motion {
		display: contents;
	}
	.dialog-motion.sidebar-motion {
		display: block;
		width: 18rem;
		max-width: 85vw;
		height: 100dvh;
		flex-shrink: 0;
	}
	dialog[open] {
		display: flex;
		align-items: end;
		justify-content: center;
	}
	.dialog-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem 1.25rem 0;
	}
	.dialog-content {
		position: relative;
		width: 100%;
		max-height: 88dvh;
		overflow-y: auto;
		border-radius: 1.5rem 1.5rem 0 0;
	}
	.dialog-content.swipe-sheet {
		animation: none;
		transition: transform 180ms ease-out;
	}
	.dialog-content.dragging {
		transition: none;
		animation: none;
	}
	.dialog-content.closing {
		pointer-events: none;
		animation: none;
	}
	dialog.calendar {
		align-items: start;
		padding: 6rem 1rem 1rem;
	}
	.calendar .dialog-content {
		max-width: 24rem;
		border-radius: 1.5rem;
	}
	dialog.sidebar {
		overflow: hidden;
		justify-content: end;
	}
	.sidebar .dialog-content {
		animation: none;
		transition: transform 180ms ease-out;
		touch-action: pan-y;
		width: 100%;
		max-width: none;
		height: 100dvh;
		max-height: 100dvh;
		border-radius: 0;
	}
	.sidebar .dialog-content.dragging {
		transition: none;
	}
	.sidebar .dialog-close {
		display: none;
	}
	@media (min-width: 1024px) {
		dialog[open]:not(.calendar):not(.sidebar) {
			align-items: center;
		}
		.dialog-content {
			max-width: 42rem;
			border-radius: 1.5rem;
		}
	}
	@media (prefers-reduced-motion: no-preference) {
		.dialog-content {
			animation: appear 200ms ease;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dialog-content.swipe-sheet,
		.sidebar .dialog-content {
			transition: none;
		}
	}
	@keyframes appear {
		from {
			transform: translateY(20px);
			opacity: 0.8;
		}
	}
</style>
