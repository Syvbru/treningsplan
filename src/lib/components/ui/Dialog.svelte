<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { X } from 'lucide-svelte';
	export let title: string;
	export let onClose: () => void;
	export let swipeToClose = true;
	export let animateSwipe = false;
	export let animateEntrance = false;
	export let hideCloseOnMobile = false;
	let dragX = 0,
		dragY = 0,
		dragging = false,
		closing = false;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	export let variant: 'sheet' | 'calendar' | 'sidebar' = 'sheet';
	$: entranceSheet = animateEntrance && variant === 'sheet';
	let element: HTMLDialogElement;
	let content: HTMLDivElement;
	let previous: HTMLElement | null = null;
	let introReady = false;
	let gestureActive = false;
	let suppressClickUntil = 0;
	function suppressSwipeClick(event: MouseEvent) {
		if (Date.now() >= suppressClickUntil) return;
		suppressClickUntil = 0;
		event.preventDefault();
		event.stopPropagation();
	}
	let startX = 0,
		startY = 0,
		atTop = false;
	function blocksSwipe(target: EventTarget | null): boolean {
		const selector =
			variant === 'sidebar'
				? 'input,textarea,select,video,iframe'
				: 'input,textarea,select,video,iframe,button,a';
		return Boolean((target as Element).closest(selector));
	}
	function touchOffset(touch: Touch) {
		return { dx: touch.clientX - startX, dy: touch.clientY - startY };
	}
	function animateClose(): boolean {
		return (
			(variant === 'sidebar' || (animateSwipe && variant === 'sheet')) &&
			!prefersReducedMotion.current
		);
	}
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
		if (!swipeToClose || e.touches.length !== 1 || blocksSwipe(e.target)) {
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
		const { dx, dy } = touchOffset(e.touches[0]);
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
			blocksSwipe(e.target)
		) {
			resetDrag();
			return;
		}
		const { dx, dy } = touchOffset(e.changedTouches[0]);
		if (
			variant === 'sidebar' ? dx > 80 && Math.abs(dy) < dx : atTop && dy > 100 && Math.abs(dx) < dy
		) {
			if (animateClose()) {
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
	class="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent border-0 text-foreground open:flex {variant ===
	'calendar'
		? 'items-start justify-center pt-24 px-4 pb-4'
		: variant === 'sidebar'
			? 'items-end justify-end overflow-hidden p-0'
			: 'items-end justify-center lg:items-center p-0'}"
	class:calendar={variant === 'calendar'}
	class:sidebar={variant === 'sidebar'}
	on:cancel|preventDefault={onClose}
	on:click={(e) => {
		if (e.target === element) onClose();
	}}
>
	<div
		class="dialog-motion {variant === 'sidebar'
			? 'block w-72 max-w-[85vw] h-dvh shrink-0'
			: entranceSheet
				? 'block w-full lg:max-w-[42rem]'
				: 'contents'}"
		class:sidebar-motion={variant === 'sidebar'}
		class:sheet-motion={entranceSheet}
		style:visibility={(variant === 'sidebar' || entranceSheet) && !introReady
			? 'hidden'
			: undefined}
		on:introstart={() => (introReady = true)}
		in:fly={{
			x: variant === 'sidebar' ? '100%' : 0,
			y: entranceSheet ? '100%' : 0,
			duration: prefersReducedMotion.current || !(variant === 'sidebar' || entranceSheet) ? 0 : 350,
			opacity: 1
		}}
	>
		<div
			bind:this={content}
			role="group"
			class:dragging
			class:closing
			class:swipe-sheet={animateSwipe}
			class:entrance-sheet={entranceSheet}
			style:transform={dragX
				? `translateX(${dragX}px)`
				: dragY
					? `translateY(${dragY}px)`
					: undefined}
			class="dialog-content relative w-full overflow-y-auto bg-card shadow-2xl text-foreground {variant ===
			'sidebar'
				? 'max-w-none h-dvh max-h-dvh rounded-none touch-pan-y'
				: variant === 'calendar'
					? 'max-w-96 max-h-[88dvh] rounded-3xl'
					: 'max-h-[88dvh] rounded-t-3xl lg:rounded-3xl lg:max-w-[42rem]'} {(variant ===
				'sidebar' ||
				animateSwipe) &&
			!dragging
				? 'transition-transform duration-[180ms] ease-[ease-out] motion-reduce:transition-none'
				: 'transition-none'} {closing ? 'pointer-events-none' : ''} {variant !== 'sidebar' &&
			!animateSwipe &&
			!entranceSheet &&
			!dragging &&
			!closing
				? 'motion-safe:animate-dialog-appear'
				: ''}"
			on:touchstart={touchStart}
			on:touchmove|nonpassive={touchMove}
			on:touchcancel={resetDrag}
			on:touchend={touchEnd}
		>
			{#if variant === 'sheet'}<div class="lg:hidden flex justify-center pt-4" aria-hidden="true">
					<div class="w-16 h-[5px] rounded-full bg-slate-300"></div>
				</div>{/if}
			{#if $$slots.header}
				<div class="dialog-header flex items-start gap-4 px-5 pt-5">
					<div class="min-w-0 flex-1"><slot name="header" /></div>
					<button
						type="button"
						aria-label="Lukk dialog"
						on:click={onClose}
						class="quiet-focus dialog-close shrink-0 h-8 w-8 items-center justify-center text-muted {variant ===
						'sidebar'
							? 'hidden'
							: hideCloseOnMobile
								? 'hidden lg:flex'
								: 'flex'}"><X class="h-5 w-5" /></button
					>
				</div>
			{:else}
				<button
					type="button"
					aria-label="Lukk dialog"
					on:click={onClose}
					class="quiet-focus dialog-close absolute right-5 top-4 z-10 rounded-lg bg-surface p-1.5 text-muted {variant ===
					'sidebar'
						? 'hidden'
						: hideCloseOnMobile
							? 'hidden lg:flex'
							: 'flex'}"><X class="h-5 w-5" /></button
				>
			{/if}
			<slot />
		</div>
	</div>
</dialog>
