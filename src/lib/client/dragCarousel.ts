import { tick } from 'svelte';

interface DragCarouselOptions {
	key: number;
	onChange: (direction: -1 | 1) => void;
	allowButtons?: boolean;
}

export function dragCarousel(node: HTMLElement, options: DragCarouselOptions) {
	const track = node.querySelector<HTMLElement>('[data-carousel-track]')!;
	let start: { id: number; x: number; y: number; time: number } | null = null;
	let offset = 0;
	let dragging = false;
	let settling = false;
	let animation: Animation | null = null;
	let generation = 0;
	let suppressClickUntil = 0;

	function reset() {
		generation++;
		const id = start?.id;
		start = null;
		if (id !== undefined && node.hasPointerCapture(id)) node.releasePointerCapture(id);
		animation?.cancel();
		animation = null;
		dragging = settling = false;
		offset = 0;
		track.style.transform = 'translateX(0px)';
	}

	async function settle(direction: -1 | 0 | 1) {
		const run = ++generation;
		const id = start?.id;
		start = null;
		if (id !== undefined && node.hasPointerCapture(id)) node.releasePointerCapture(id);
		settling = true;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		animation = track.animate(
			[
				{ transform: `translateX(${offset}px)` },
				{ transform: `translateX(${-direction * node.clientWidth}px)` }
			],
			{ duration: reduced ? 0 : 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
		);
		try {
			await animation.finished;
		} catch {
			return;
		}
		if (run !== generation) return;
		if (direction) options.onChange(direction);
		await tick();
		if (run === generation) reset();
	}

	function down(event: PointerEvent) {
		if (event.pointerType !== 'touch') return;
		if (!event.isPrimary) {
			if (start) void settle(0);
			return;
		}
		if (settling || !window.matchMedia('(max-width: 767px)').matches) return;
		const controls = options.allowButtons
			? 'a, input, textarea, select, video'
			: 'button, a, input, textarea, select, video';
		if ((event.target as Element).closest(controls)) return;
		start = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
	}

	function move(event: PointerEvent) {
		if (!start || start.id !== event.pointerId) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		if (!dragging) {
			if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
			if (Math.abs(dx) < Math.abs(dy) * 1.5) {
				reset();
				return;
			}
			dragging = true;
			node.setPointerCapture(event.pointerId);
		}
		offset = Math.max(-node.clientWidth, Math.min(node.clientWidth, dx));
		suppressClickUntil = Date.now() + 350;
		track.style.transform = `translateX(${offset}px)`;
	}

	function up(event: PointerEvent) {
		if (!start || start.id !== event.pointerId) return;
		if (!dragging) {
			reset();
			return;
		}
		const speed = Math.abs(offset) / Math.max(1, event.timeStamp - start.time);
		const change =
			Math.abs(offset) > node.clientWidth * 0.25 || (Math.abs(offset) > 32 && speed > 0.5);
		suppressClickUntil = Date.now() + 350;
		void settle(change ? (offset < 0 ? 1 : -1) : 0);
	}

	function cancel(event: PointerEvent) {
		if (start?.id === event.pointerId) void settle(0);
	}

	function lostCapture(event: PointerEvent) {
		// Ignore a child's implicit touch capture being transferred to this viewport.
		if (event.target === node) cancel(event);
	}

	function click(event: MouseEvent) {
		if (Date.now() >= suppressClickUntil) return;
		event.preventDefault();
		event.stopPropagation();
	}

	node.addEventListener('pointerdown', down);
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerup', up);
	node.addEventListener('pointercancel', cancel);
	node.addEventListener('lostpointercapture', lostCapture);
	node.addEventListener('click', click, true);
	return {
		update(next: DragCarouselOptions) {
			const changed = next.key !== options.key;
			options = next;
			if (changed) reset();
		},
		destroy() {
			reset();
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointercancel', cancel);
			node.removeEventListener('lostpointercapture', lostCapture);
			node.removeEventListener('click', click, true);
		}
	};
}
