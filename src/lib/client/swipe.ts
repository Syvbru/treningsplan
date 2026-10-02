/** Mobile touch navigation, while vertical scrolling and ordinary taps remain native. */
export function horizontalSwipe(node: HTMLElement, onSwipe: (direction: -1 | 1) => void) {
	let start: { id: number; x: number; y: number } | null = null;
	let suppressClickUntil = 0;
	function pointerDown(event: PointerEvent) {
		if (!event.isPrimary) {
			start = null;
			return;
		}
		if (event.pointerType !== 'touch' || !window.matchMedia('(max-width: 767px)').matches) return;
		start = { id: event.pointerId, x: event.clientX, y: event.clientY };
	}
	function pointerUp(event: PointerEvent) {
		if (!start || event.pointerId !== start.id) return;
		const dx = event.clientX - start.x,
			dy = event.clientY - start.y;
		start = null;
		if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
		suppressClickUntil = Date.now() + 350;
		onSwipe(dx < 0 ? 1 : -1);
	}
	function cancel() {
		start = null;
	}
	function click(event: MouseEvent) {
		if (Date.now() > suppressClickUntil) return;
		suppressClickUntil = 0;
		event.preventDefault();
		event.stopPropagation();
	}
	node.addEventListener('pointerdown', pointerDown);
	node.addEventListener('pointerup', pointerUp);
	node.addEventListener('pointercancel', cancel);
	node.addEventListener('click', click, true);
	return {
		update(callback: typeof onSwipe) {
			onSwipe = callback;
		},
		destroy() {
			node.removeEventListener('pointerdown', pointerDown);
			node.removeEventListener('pointerup', pointerUp);
			node.removeEventListener('pointercancel', cancel);
			node.removeEventListener('click', click, true);
		}
	};
}
