import type { DestinationId } from '../portfolio/contracts';
import type { WorldControls } from './hero/world';
import { destinations, homePose, destinationPose } from './destinations';
import { contentTiming, type TransitPhase } from './flight';
import type { FilmHandle } from './stage';

export type TransitState = { phase: TransitPhase; destination: DestinationId; active: boolean; elapsed: number; duration: number };
export function createNavigator(world: WorldControls, film: FilmHandle) {
  let token = 0;
  let destination: DestinationId = 'home';
  let state: TransitState = { phase: 'idle', destination, active: false, elapsed: 0, duration: 0 };
  let active = false;
  const subscribers = new Set<(state: TransitState) => void>();
  const lifetime = new AbortController();
  function emit(type: 'start' | 'progress' | 'cancel' | 'complete' | 'snap') {
    document.dispatchEvent(new CustomEvent('stage:flight', { detail: { ...state, type, timestamp: performance.now(), startedAt: performance.now() - state.elapsed } }));
    for (const fn of subscribers) fn(state);
  }
  function cancel() {
    if (!active) return;
    active = false;
    world.cancelFlight();
    if (destination === 'about') {
      film.pause();
      film.render(0);
      document.documentElement.dataset.destination = 'about';
      delete document.documentElement.dataset.returning;
    }
    world.setComposition(destination === 'home' ? 0 : 1);
    state = { ...state, phase: 'arrive', active: false };
    emit('cancel');
  }
  async function go(id: DestinationId, options: { instant?: boolean } = {}) {
    const own = ++token;
    const notice = document.getElementById('loading');
    if (notice?.dataset.destinationFallback) {
      notice.hidden = true;
      notice.classList.remove('journey-error');
      delete notice.dataset.destinationFallback;
    }
    delete document.documentElement.dataset.returning;
    const previous = destination;
    destination = id;
    film.pause();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instant = options.instant || reduced || previous === id;
    if (id === 'about') {
      active = false;
      world.cancelFlight();
      world.setBody(null);
      world.setComposition(0);
      if (instant) {
        document.documentElement.dataset.destination = id;
        film.render(0);
        state = { phase: 'idle', destination: id, active: false, elapsed: 0, duration: 0 };
        emit('snap');
        return;
      }
      // Keep the persistent Earth/ground renderer visible until we reach the room.
      document.documentElement.dataset.destination = 'home';
      document.documentElement.dataset.returning = 'true';
      world.snap('home', homePose(innerWidth / innerHeight));
      active = true;
      state = { phase: 'empty', destination: id, active: true, elapsed: 0, duration: 6500 };
      emit('start');
      await film.play({ from: 1, to: 0, ms: 6500 });
      if (own !== token) return;
      active = false;
      document.documentElement.dataset.destination = id;
      delete document.documentElement.dataset.returning;
      state = { phase: 'arrive', destination: id, active: false, elapsed: 6500, duration: 6500 };
      emit('complete');
      return;
    }
    const bodyDestination = destinations[id]?.load ? destinations[id] : undefined;
    const bodyChanged = world.snapshot().body !== (bodyDestination?.body ?? 'earth');
    const loadBody = async () => {
      if (!bodyChanged) return;
      if (bodyDestination) {
        const bodyModule = await bodyDestination.load!();
        const spec = bodyModule.moonSpec(innerWidth <= 1023);
        const material = await world.prepareBody(spec);
        if (own !== token) {
          for (const texture of new Set([material.map, material.displacementMap, material.userData?.ringTexture])) if (texture) { texture.dispose(); (texture.image as ImageBitmap)?.close?.(); }
          material.dispose(); return;
        }
        world.setBody(spec, material);
      } else world.setBody(null);
    };
    const pose = destinationPose(id, innerWidth / innerHeight);
    const recoverBody = (error: unknown) => {
      if (own !== token) return;
      console.error('[portfolio-world] destination texture', error);
      active = false;
      world.cancelFlight();
      world.setBody(null);
      world.snap(id, homePose(innerWidth / innerHeight));
      world.setComposition(id === 'home' ? 0 : 1, 1);
      document.documentElement.dataset.destination = id;
      state = { ...state, destination: id, phase: 'arrive', active: false };
      if (notice) {
        notice.dataset.destinationFallback = 'true';
        notice.classList.add('journey-error');
        notice.textContent = 'Planet imagery is unavailable. Showing Earth while you explore.';
        notice.hidden = false;
      }
      emit('cancel');
    };
    if (instant) {
      active = false;
      world.cancelFlight();
      film.render(1);
      try { await loadBody(); } catch (error) { recoverBody(error); return; }
      if (own !== token) return;
      world.snap(id, pose);
      world.setComposition(id === 'home' ? 0 : 1);
      state = { phase: 'idle', destination: id, active: false, elapsed: 0, duration: 0 };
      document.documentElement.dataset.destination = id;
      emit('snap');
      return;
    }
    if (film.snapshot().progress < 1) { film.render(1); world.snap('home', homePose(innerWidth / innerHeight)); }
    let loading: Promise<void> | undefined;
    let loaded = !bodyChanged;
    const beginBodyLoad = () => {
      if (loading || own !== token) return;
      loading = loadBody().then(() => { loaded = true; if (!active && own === token) world.setComposition(id === 'home' ? 0 : 1); }).catch(recoverBody);
    };
    // Loading survives camera cancellation, so the destination still resolves.
    setTimeout(beginBodyLoad, 300);
    active = true;
    const plan = world.fly(id, pose, raw => {
      if (own !== token || !active) return;
      const elapsed = raw * plan.duration;
      if (elapsed >= 300 && !loading) {
        beginBodyLoad();
      }
      const phase = contentTiming(elapsed, plan.duration);
      // The body leaves during the old copy; the new limb arrives after the empty beat.
      const reveal = !bodyChanged ? 1 : elapsed < 600 ? Math.max(0, 1 - elapsed / 600)
        : elapsed < 900 || !loaded ? 0 : Math.min(1, .025 + .975 * ((elapsed - 900) / (plan.duration - 1700)) ** 1.25);
      world.setComposition(id === 'home' ? 1 - raw : raw, reveal);
      state = { phase, destination: id, active: raw < 1, elapsed, duration: plan.duration };
      if (raw >= 1) { active = false; world.setComposition(id === 'home' ? 0 : 1, loaded ? 1 : 0); emit('complete'); }
      else if (phase !== lastPhase) { lastPhase = phase; emit('progress'); }
    });
    let lastPhase: TransitPhase = 'leave';
    state = { phase: 'leave', destination: id, active: true, elapsed: 0, duration: plan.duration };
    document.documentElement.dataset.destination = id;
    emit('start');
  }
  window.addEventListener('pointerdown', event => {
    // Reading, copying, and following content links must not interrupt the scene.
    if (event.target instanceof Element && event.target.closest('[data-content-interaction], nav, a, button, input, summary')) return;
    cancel();
  }, { capture: true, signal: lifetime.signal });
  window.addEventListener('keydown', event => { if (event.key === 'Escape') cancel(); }, { signal: lifetime.signal });
  return { go, cancel, snapshot: () => state, subscribe(fn: (state: TransitState) => void) { subscribers.add(fn); fn(state); return () => { subscribers.delete(fn); }; },
    dispose() { ++token; active = false; lifetime.abort(); subscribers.clear(); } };
}
