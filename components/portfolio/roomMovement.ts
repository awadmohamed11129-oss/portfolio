export type RoomView = { x: number; y: number };

/** Shared direct manipulation for both rooms. No inertia or automatic motion. */
export function bindRoomMovement(host: HTMLElement, onChange: (view: RoomView) => void) {
  let view: RoomView = { x: 0, y: 0 };
  let gesture: { id: number; x: number; y: number; origin: RoomView; dragging: boolean; scroll: boolean } | null = null;
  let suppressClick = false;
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  const update = (x: number, y: number) => {
    view = { x: clamp(x), y: clamp(y) };
    onChange(view);
  };
  const finish = () => {
    const pointerId = gesture?.id;
    gesture = null;
    if (pointerId !== undefined && host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId);
    host.dataset.dragging = "false";
  };
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    suppressClick = false;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: view, dragging: false, scroll: false };
  };
  const move = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.id || gesture.scroll) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      if (event.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) {
        gesture.scroll = true;
        return;
      }
      gesture.dragging = true;
      suppressClick = true;
      host.dataset.dragging = "true";
      host.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    const bounds = host.getBoundingClientRect();
    update(gesture.origin.x + dx / Math.max(1, bounds.width * 0.45), gesture.origin.y + (event.pointerType === "touch" ? 0 : dy / Math.max(1, bounds.height * 0.45)));
  };
  const up = (event: PointerEvent) => { if (gesture?.id === event.pointerId) finish(); };
  const leave = () => { if (!gesture?.dragging) finish(); };
  const click = (event: MouseEvent) => {
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  const reset = () => { finish(); update(0, 0); };
  const key = (event: KeyboardEvent) => {
    // Native controls inside the room retain their own keyboard behavior.
    if (event.target !== host || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = 0.16;
    switch (event.key) {
      case "ArrowLeft": update(view.x - step, view.y); break;
      case "ArrowRight": update(view.x + step, view.y); break;
      case "ArrowUp": update(view.x, view.y - step); break;
      case "ArrowDown": update(view.x, view.y + step); break;
      case "Home": reset(); break;
      default: return;
    }
    event.preventDefault();
  };
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerup", up);
  host.addEventListener("pointercancel", up);
  host.addEventListener("lostpointercapture", up);
  host.addEventListener("pointerleave", leave);
  host.addEventListener("click", click, true);
  host.addEventListener("keydown", key);
  return {
    reset,
    dispose() {
      finish();
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", up);
      host.removeEventListener("lostpointercapture", up);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("click", click, true);
      host.removeEventListener("keydown", key);
    },
  };
}
