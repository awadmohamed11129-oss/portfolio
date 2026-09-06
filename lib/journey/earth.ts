import { createHeroWorld, type HeroWorld } from './hero/world';
import { progressForAltitude } from './prototype/camera';
import { endAltitudeKm } from './hero/math';

export function createEarthJourney(root: HTMLElement) {
const host = root.querySelector<HTMLElement>('#hero-scene')!;
const mobileButton = root.querySelector<HTMLButtonElement>('#mobile-drag')!;
const coarse = matchMedia('(pointer: coarse)');
const lifetime = new AbortController();
let world: HeroWorld | undefined;
let progress = 0;
let mobileDragEnabled = false;
let frame = 0;
let pointer: { id: number; x: number; y: number } | null = null;
let pauseJourney = () => {};
let failJourney = () => {};
const clamp = (n: number) => Math.max(0, Math.min(1, n));

function earthProgress(p: number): number {
  const start = progressForAltitude(.35, endAltitudeKm(innerWidth / innerHeight));
  return start + (1 - start) * clamp((p - .28) / .72);
}
function endPointer(): void {
  if (pointer && host.hasPointerCapture(pointer.id)) host.releasePointerCapture(pointer.id);
  pointer = null;
  world?.prototype?.endDrag();
  host.dataset.dragging = 'false';
}
function scrubEarth(p: number): void {
  progress = clamp(p);
  endPointer();
  mobileDragEnabled = false;
  world?.prototype?.scrub(earthProgress(progress));
}
function earthSnapshot() {
  return { ...world?.prototype?.snapshot(), mobileDragEnabled, progress };
}
async function initEarth(pause: () => void, unavailable: () => void): Promise<void> {
  pauseJourney = pause;
  failJourney = unavailable;
  const created = await createHeroWorld({ host,
    ground: root.querySelector<HTMLCanvasElement>('#ground-canvas')!,
    space: root.querySelector<HTMLCanvasElement>('#space-canvas')!,
    prototype: { camera: 'earth-drag' }, signal: lifetime.signal });
  if (lifetime.signal.aborted) { created.dispose(); return; }
  world = created;
  created.prototype!.scrub(earthProgress(progress));
  created.start();
  const opening = created.prototype!.snapshot();
  if (!opening.sceneAlive || !opening.globeReady) throw new Error('Earth imagery unavailable');
  const update = (): void => {
    const snapshot = created.prototype!.snapshot();
    if (!snapshot.sceneAlive) { unavailable(); return; }
    const canDrag = progress >= .999 && snapshot.canDrag;
    const bodyName = snapshot.body.charAt(0).toUpperCase() + snapshot.body.slice(1);
    host.style.pointerEvents = progress > .35 ? 'auto' : 'none';
    host.dataset.canDrag = String(canDrag && (!coarse.matches || mobileDragEnabled));
    host.dataset.touchDrag = String(canDrag && mobileDragEnabled);
    host.tabIndex = canDrag ? 0 : -1;
    host.setAttribute('aria-label', canDrag ? `${bodyName}. Drag or use arrow keys to rotate; R or Escape to reset.` : `${bodyName} photographic journey.`);
    mobileButton.hidden = !coarse.matches || !canDrag;
    mobileButton.setAttribute('aria-pressed', String(mobileDragEnabled));
    mobileButton.textContent = mobileDragEnabled ? 'Done rotating' : `Rotate ${bodyName}`;
    frame = requestAnimationFrame(update);
  };
  frame = requestAnimationFrame(update);
}
function listen(target: EventTarget, name: string, handler: EventListener, passive = false): void {
  target.addEventListener(name, handler, { signal: lifetime.signal, passive });
}
for (const canvas of root.querySelectorAll('canvas')) listen(canvas, 'webglcontextlost', () => failJourney());
listen(mobileButton, 'click', () => {
  pauseJourney(); endPointer(); mobileDragEnabled = !mobileDragEnabled;
  if (!mobileDragEnabled) world?.prototype?.reset();
});
listen(host, 'pointerdown', (raw) => {
  const event = raw as PointerEvent;
  if (progress < .999) return;
  if (event.button !== 0 || pointer || (event.pointerType === 'touch' && !mobileDragEnabled)) return;
  if (!world?.prototype?.beginDrag()) return;
  pauseJourney();
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  host.setPointerCapture(event.pointerId);
  host.focus({ preventScroll: true });
  host.dataset.dragging = 'true';
  event.preventDefault();
});
listen(host, 'pointermove', (raw) => {
  const event = raw as PointerEvent;
  if (!pointer || pointer.id !== event.pointerId) return;
  world?.prototype?.drag(event.clientX - pointer.x, event.clientY - pointer.y);
  pointer.x = event.clientX; pointer.y = event.clientY;
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(host, name, endPointer);
listen(host, 'keydown', (raw) => {
  const event = raw as KeyboardEvent;
  if (event.key === 'Escape' || event.key.toLowerCase() === 'r') { endPointer(); world?.prototype?.reset(); event.preventDefault(); return; }
  const delta: Record<string, [number, number]> = { ArrowLeft: [-28, 0], ArrowRight: [28, 0], ArrowUp: [0, -28], ArrowDown: [0, 28] };
  if (!delta[event.key] || !world?.prototype?.beginDrag()) return;
  pauseJourney(); event.preventDefault(); world.prototype.drag(...delta[event.key]); world.prototype.endDrag();
});
listen(coarse, 'change', () => { mobileDragEnabled = false; endPointer(); });

return { initEarth, scrubEarth, get controls() { return world?.prototype; }, earthSnapshot, dispose() { endPointer(); cancelAnimationFrame(frame); lifetime.abort(); world?.dispose(); } };
}
