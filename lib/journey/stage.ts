import { createEarthJourney } from './earth';
import { createNavigator } from './navigator';
import { destinationForPath } from './destinations';
import { publishWorldStage, releaseWorldStage, markWorldUnavailable } from './bridge';
let introVisited = false;
export type FilmHandle = { render(p: number): void; syncContent(): void; pause(): void; play(options: { from: number; to: number; ms: number }): Promise<void>; snapshot(): { progress: number; playing: boolean } };
export type WorldStageHandle = { id: string; film: FilmHandle; world: NonNullable<ReturnType<typeof createEarthJourney>['controls']>; navigator: ReturnType<typeof createNavigator>; dispose(): void };
declare global { interface Window { roomProof?: { readonly state: unknown }; __portfolioWorld?: WorldStageHandle; } }
export function createWorldStage(root: HTMLElement) {
const lifetime = new AbortController();
const earth = createEarthJourney(root);
const { initEarth, scrubEarth, earthSnapshot, dispose } = earth;
root.dataset.enhanced = 'true';
const wrapper = root.querySelector<HTMLElement>('[data-world-stage]');
if (wrapper) wrapper.dataset.enhanced = 'true';
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
const photo = $('#room-photo') as HTMLImageElement;
const room = $('#room');
const exterior = $('#exterior');
const exteriorPhoto = $('#exterior-photo') as HTMLImageElement;
const housePlane = $('#house-plane');
const light = $('#light');
const aerial = $('#aerial-image');
const loading = $('#loading');
$('#film-hint').hidden = true;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (a: number, b: number, n: number) => { const x = clamp((n - a) / (b - a)); return x * x * (3 - 2 * x); };
let progress = 0;
let playing = false;
let raf = 0;
let ready = false;
let failed = false;
let playStart = 0;
let playFrom = 0;
let playbackRate = 1;
let expectedScroll = -1;
let settleFilmPlay: (() => void) | undefined;
let suspendedIntro = false;
let autoplayPending = location.pathname === '/' && !introVisited && (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type !== 'back_forward';
const previousScrollRestoration = window.history?.scrollRestoration;
if (autoplayPending && window.history) window.history.scrollRestoration = 'manual';
const duration = 14000;
let scrollEnabled = autoplayPending;

const imageLoads = [];
imageLoads.push(photo.decode());
imageLoads.push(exteriorPhoto.decode());

function render(p: number) {
  const introduction = document.querySelector<HTMLElement>("#introduction");
  const arrival = document.querySelector<HTMLElement>("#arrival");
  if (failed) return;
  progress = clamp(p);
  const q = reduced.matches ? (p < .12 ? 0 : p < .28 ? .6 : 1) : clamp(progress / .4);
  // The original photographed Toronto world sits directly behind the house.
  // Its own camera carries the journey from neighbourhood scale into orbit.
  scrubEarth(reduced.matches ? (p < .28 ? 0 : p < .5 ? .35 : p < .75 ? .65 : 1) : progress);
  const retreat = smooth(0, .36, q);
  // The window is in the same photograph: its border enters by straight dolly-out.
  const crop = innerWidth <= 700 ? 1.72 : 2.15;
  const roomScale = crop - (crop - 1) * retreat;
  // Image1 opening centre is (51.29%,47.13%); frame aligned to image2 opening.
  photo.style.transform = `translate(-51.29%, -47.13%) scale(${roomScale})`;
  photo.style.transformOrigin = '51.29% 47.13%';
  room.style.opacity = String(1 - smooth(.29, .39, q));
  const houseFlight = smooth(.39, .72, q);
  // Source1 remains inside the source2 aperture, so the desk/chair never regenerate.
  // The initial scale maps source1's601px opening height to source2's161px aperture.
  const alignedScale = roomScale * (601 / 161);
  const houseScale = alignedScale * (1 - houseFlight) + 1.035 * houseFlight;
  const houseY = 32.996812 + (50 - 32.996812) * houseFlight;
  const houseX = 52.302632 + (50 - 52.302632) * houseFlight;
  housePlane.style.transform = `translate(-${houseX}%, -${houseY}%) scale(${houseScale})`;
  housePlane.style.transformOrigin = `${houseX}% ${houseY}%`;
  exterior.style.opacity = String(1 - smooth(.7, .82, q));
  // A brief light occlusion marks the change of photographic viewpoint.
  const windowVeil = smooth(.27, .33, q) * (1 - smooth(.34, .41, q)) * .24;
  const skyVeil = smooth(.69, .755, q) * (1 - smooth(.765, .86, q)) * .3;
  light.style.opacity = String(Math.max(windowVeil, skyVeil));
  const flight = smooth(.76, 1, q);
  aerial.style.transform = `translate(-50%, -50%) scale(${1.75 - .69 * flight}) rotate(${1.2 - 1.2 * flight}deg)`;
  $('.shade').style.opacity = String(1 - smooth(.3, .4, progress));
  if (introduction) introduction.style.opacity = String(1 - smooth(.04, .24, q));
  if (introduction) introduction.inert = q > .2;
  if (arrival) arrival.style.opacity = String(smooth(.95, 1, progress));
  if (arrival) arrival.inert = progress < .97;
  document.documentElement.dataset.progress = progress.toFixed(4);
}

const runway = () => document.getElementById("film-runway");
const scrollSpan = () => Math.max(1, (runway()?.offsetHeight ?? innerHeight) - innerHeight);
function seek(p: number) {
  p = clamp(p);
  expectedScroll = Math.round(p * scrollSpan());
  if (runway()) window.scrollTo({ top: expectedScroll, behavior: 'instant' });
  render(p);
}
function pause() {
  suspendedIntro = false;
  autoplayPending = false;
  playing = false;
  cancelAnimationFrame(raf);
  const settle = settleFilmPlay;
  settleFilmPlay = undefined;
  settle?.();
}
function resumeScrubbing() {
  if (!runway()) return;
  // Route restoration can restore a pre-flight scroll offset. Reconcile the
  // runway with the displayed film frame before applying the first real input.
  if (!scrollEnabled) {
    expectedScroll = Math.round(progress * scrollSpan());
    window.scrollTo({ top: expectedScroll, behavior: 'instant' });
  }
  pause();
  scrollEnabled = true;
}
function tick(now: number) {
  if (!playing) return;
  const p = clamp(playFrom + (now - playStart) * playbackRate / duration);
  seek(p);
  if (p >= 1) pause();
  else raf = requestAnimationFrame(tick);
}
function start() {
  if (!ready) return;
  autoplayPending = false;
  if (reduced.matches) { seek(progress >= .999 ? 0 : 1); pause(); return; }
  if (progress >= .999) { playbackRate = 1; seek(0); }
  playing = true;
  scrollEnabled = true;
  playStart = performance.now();
  playFrom = progress;
  raf = requestAnimationFrame(tick);
}
function tryAutoplay() {
  if (!autoplayPending || !ready || document.hidden) return;
  autoplayPending = false;
  if (!reduced.matches) { seek(0); start(); }
}

root.addEventListener('click', (event) => {
  if (!runway() || event.button !== 0 || !(event.target instanceof Element) || event.target.closest('a, button, input, summary, .credits, [data-content-interaction]')) return;
  if (reduced.matches || document.hidden || failed || (!ready && !autoplayPending) || progress >= 1) return;
  // Rebase the clock at the rendered position so increasing speed never seeks ahead.
  playFrom = progress;
  playStart = performance.now();
  playbackRate = Math.min(8, playbackRate * 2);
  render(progress);
  if (ready && !playing) start();
}, { signal: lifetime.signal });
window.addEventListener('scroll', () => {
  if (!runway() || location.pathname !== '/' || !scrollEnabled) return;
  // Browser restoration and our own scrollTo events are not user input.
  // Wheel/touch/navigation keys explicitly pause before taking over the film.
  if (playing || (autoplayPending && !ready)) return;
  if (expectedScroll >= 0 && Math.abs(scrollY - expectedScroll) < 3) { expectedScroll = -1; return; }
  expectedScroll = -1;
  pause();
  render(scrollY / scrollSpan());
}, { passive: true, signal: lifetime.signal });
window.addEventListener('wheel', resumeScrubbing, { passive: true, signal: lifetime.signal });
window.addEventListener('touchmove', resumeScrubbing, { passive: true, signal: lifetime.signal });
window.addEventListener('keydown', (event) => {
  if (!runway()) return;
  if (!ready) pause();
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) resumeScrubbing();
}, { signal: lifetime.signal });
window.addEventListener('resize', () => {
  if (!runway()) return;
  const continueIntro = playing && location.pathname === '/' && !document.documentElement.dataset.returning;
  pause(); seek(progress);
  if (continueIntro && progress < 1) start();
}, { signal: lifetime.signal });
reduced.addEventListener('change', () => {
  pause();
  const destination = stage?.navigator.snapshot().destination;
  if ((!stage && location.pathname === '/') || (destination === 'home' && progress < 1)) render(progress);
  else if (reduced.matches && stage) void stage.navigator.go(destination!, { instant: true }).catch(fail);
}, { signal: lifetime.signal });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const resume = playing && location.pathname === '/' && !document.documentElement.dataset.returning;
    if (playing) pause();
    suspendedIntro = resume;
  } else if (suspendedIntro) { suspendedIntro = false; start(); }
  else tryAutoplay();
}, { signal: lifetime.signal });
window.addEventListener('pagehide', pause, { signal: lifetime.signal });

function fail() {
  if (failed || lifetime.signal.aborted) return;
  clearTimeout(startupDeadline);
  pause();
  render(0);
  failed = true;
  ready = false;
  dispose();
  stage?.navigator.dispose();
  markWorldUnavailable();
  loading.hidden = false;
  loading.classList.add('journey-error');
  loading.textContent = 'The view is unavailable. You can still explore the portfolio above.';
}
render(autoplayPending ? 0 : 1);
let stage: WorldStageHandle | undefined;
const film: FilmHandle = { render, pause: () => { pause(); scrollEnabled = false; }, syncContent() {
  const introduction = document.getElementById('introduction');
  const arrival = document.getElementById('arrival');
  if (introduction) { introduction.style.opacity = progress >= .4 ? '0' : '1'; introduction.inert = progress >= .4; }
  if (arrival) { arrival.style.opacity = progress >= .97 ? '1' : '0'; arrival.inert = progress < .97; }
  if (runway() && progress >= .999) {
    expectedScroll = Math.round(progress * scrollSpan());
    window.scrollTo({ top: expectedScroll, behavior: 'instant' });
  }
}, snapshot: () => ({ progress, playing }), play({ from, to, ms }) {
  pause(); render(from);
  if (reduced.matches || ms <= 0) { render(to); return Promise.resolve(); }
  const began = performance.now(); playing = true;
  return new Promise(resolve => { settleFilmPlay = resolve; const step = (now: number) => { if (!playing) { resolve(); return; } const t = clamp((now - began) / ms); render(from + (to - from) * t); if (t >= 1) pause(); else raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); });
} };
const cleanup = () => { clearTimeout(startupDeadline); pause(); lifetime.abort(); stage?.navigator.dispose(); dispose(); if (previousScrollRestoration && window.history) window.history.scrollRestoration = previousScrollRestoration; if (stage) releaseWorldStage(stage); if (window.__portfolioWorld === stage) delete window.__portfolioWorld; if (window.roomProof === diagnostic) delete window.roomProof; };
const startupDeadline = setTimeout(fail, 15000);
Promise.all([...imageLoads, initEarth(pause, fail)]).then(() => {
  clearTimeout(startupDeadline);
  if (lifetime.signal.aborted || failed) return;
  ready = true;
  if (location.pathname === '/') introVisited = true;
  loading.hidden = true;
  const world = earth.controls!;
  stage = { id: crypto.randomUUID(), film, world, navigator: createNavigator(world, film), dispose: cleanup };
  window.__portfolioWorld = stage;
  publishWorldStage(stage);
  if (!autoplayPending) void stage.navigator.go(destinationForPath(location.pathname), { instant: true }).catch(fail);
  else tryAutoplay();
}).catch(fail);

// Read-only state for the bounded proof's functional inspection.
const diagnostic = window.roomProof = { get state() { return { progress, playing, ready, reducedMotion: reduced.matches, duration, playbackRate, earth: earthSnapshot() }; } };

return cleanup;
}
