// The world: one damped camera over a real road that becomes the Earth.
//
// On load the film plays (12.5 s, scroll locked): a geometric zoom-out from
// 15 m over the route to a wide shot of the planet. After that the page is a
// place: the menu flies the camera to destinations, the camera breathes and
// drifts at rest, and every route is a place (#/road, #/drive, ...).
//
// Two stages share this camera: the ground mosaic (own renderer, disposed once
// it has faded) and the globe. Nothing here is keyframed; the camera only ever
// chases a target with a 0.5 s time constant.
import * as THREE from "three";
import { EarthDragCamera, progressForAltitude, spherical, type CameraMode } from "../prototype/camera";

import type { DestinationId } from "../../portfolio/contracts";
import { flightPlan, flightPose, type FlightView, type FlightPlan } from "../flight";
import { homePose, destinationPose } from "../destinations";
import type { BodyId, PlanetSpec } from "./bodies/types";
import { GlobeStage } from "./globe";
import { GroundStage } from "./ground";
import {
  altitudeForProgress,
  cameraPositionKm,
  clamp01,
  endAltitudeKm,
  smoothstep,
  viewWidthKm,
} from "./math";
import { createPlates, type Plates } from "./plates";

/** Frame f00266 of the scan: Sheppard Avenue East, mid-block, the car moving at
 *  a steady 5 m a frame. The previous anchor (f00430) was the car stopped at the
 *  Pharmacy / Lawrence light with a parking lot in frame: it read "intersection". */
export const ANCHOR = { lat: 43.7969339, lon: -79.2237139 };
const FILM_MS = 12_500;
const CHASE_TAU = 0.5;
/** Ground → globe crossfade, by how wide the view is (km). The brief starts at
 *  40→120 km and says tune: with a 4096 px globe (10 km/px) the planet is a
 *  smear at 120 km, so the ground carries Blue Marble tiles until the view is
 *  350 km wide and hands over by 720 km — 300→620 km on a 16:10 desktop, the
 *  reference's own window, and proportionally higher on a narrow phone. */
const GROUND_FADE_START_WIDTH_KM = 350;
const GROUND_FADE_END_WIDTH_KM = 720;
/** Orbital drift at rest: the camera slides east so the Earth keeps turning. */
const DRIFT_DEG_PER_SECOND = 0.55;
type View = FlightView;
type Flight = { plan: FlightPlan; startedAt: number; onProgress: (raw: number) => void };

export type HeroSnapshot = {
  filmProgress: number;
  altitudeKm: number;
  targetAltitudeKm: number;
  destination: DestinationId;
  body: BodyId;
  groundVariant: string;
  flightActive: boolean;
  groundZoom: number;
  pendingTiles: number;
  globeReady: boolean;
  groundMix: number;
  groundFadeKm: [number, number];
  groundAsleep: boolean;
  sceneAlive: boolean;
  endAltitudeKm: number;
};

export type PerformanceSnapshot = {
  samples: number;
  workP99Ms: number;
  intervalP99Ms: number;
  intervalsOver34Ms: number;
  intervalMaxMs: number;
  worst: Array<{ ms: number; atS: number }>;
};

export type MatchingView = "road" | "city" | "transition" | "earth";
export type WorldControls = {
  snapshot(): HeroSnapshot & { mode: CameraMode; interaction: string; canDrag: boolean;
    cameraPositionKm: { x: number; y: number; z: number }; radiusKm: number; latitude: number; longitude: number;
    sceneTimeSeconds: number; matchingView: MatchingView | null; disposed: boolean;
    diagnostics: { activeWorlds: number; rendererCount: number; listenerCount: number } };
  fly(id: DestinationId, pose: View, onProgress: (raw: number) => void): FlightPlan;
  snap(id: DestinationId, pose: View): void;
  cancelFlight(): void;
  setBody(spec: PlanetSpec | null, material?: THREE.MeshPhysicalMaterial): void;
  prepareBody(spec: PlanetSpec): Promise<THREE.MeshPhysicalMaterial>;
  setComposition(amount: number, reveal?: number): void;
  setMode(mode: CameraMode): void;
  match(view: MatchingView): void;
  replay(): void;
  reset(): void;
  scrub(progress: number): void;
  beginDrag(): boolean;
  drag(x: number, y: number): void;
  endDrag(): void;
};
export type HeroWorld = { start(): void; dispose(): void; prototype?: WorldControls };

declare global {
  interface Window {
    __world?: { snapshot(): HeroSnapshot; seek(progress: number): void; performance(): PerformanceSnapshot };
  }
}

function query(name: string): string | null {
  const raw = new URLSearchParams(location.search).get(name);
  return raw === null || raw.trim() === "" ? null : raw.trim();
}

function queryNumber(name: string): number | null {
  const raw = query(name);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function shortestLonDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

export async function createHeroWorld({
  host,
  ground: groundCanvas,
  space: spaceCanvas,
  prototype,
  signal,
}: {
  host: HTMLElement;
  ground: HTMLCanvasElement;
  space: HTMLCanvasElement;
  prototype?: { camera: CameraMode };
  signal?: AbortSignal;
}): Promise<HeroWorld> {
  const lifetime = new AbortController();
  let disposed = false;
  let frame = 0;
  let listenerCount = 0;
  let removeDebug = (): void => undefined;
  const listen = (target: EventTarget, event: string, listener: EventListener): void => {
    target.addEventListener(event, listener, { signal: lifetime.signal });
    listenerCount += 1;
  };
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionPreference.matches;
  listen(motionPreference, "change", () => { reduced = motionPreference.matches; });
  let aspect = window.innerWidth / window.innerHeight;
  const tier = query("tier");
  const scaleForViewport = (): number => {
    const baseScale = tier === "low" ? 0.6 : tier === "high" ? 1 : aspect < 1 ? 0.72 : 0.9;
    return Math.min(baseScale * Math.min(2, window.devicePixelRatio || 1), 2_048 / window.innerWidth);
  };
  const renderScale = scaleForViewport();
  let endAltitude = endAltitudeKm(aspect);
  let GROUND_FADE_START_KM = GROUND_FADE_START_WIDTH_KM / viewWidthKm(1, aspect);
  let GROUND_FADE_END_KM = GROUND_FADE_END_WIDTH_KM / viewWidthKm(1, aspect);

  const progressBar = document.getElementById("film-progress") as HTMLElement;
  const hint = document.getElementById("film-hint") as HTMLElement;
  const platesHost = document.getElementById("plates") as HTMLElement;

  // Stages. If WebGL is unavailable the page still works as text destinations.
  let ground: GroundStage | null = null;
  let globe: GlobeStage | null = null;
  let sceneAlive = true;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    sceneAlive = false;
    cancelAnimationFrame(frame);
    lifetime.abort();
    listenerCount = 0;
    removeDebug();
    ground?.dispose();
    globe?.dispose();
    ground = null;
    globe = null;
    host.dataset.ready = "false";
    signal?.removeEventListener("abort", dispose);
  };
  signal?.addEventListener("abort", dispose, { once: true });
  const sceneUnavailable = (error: unknown): void => {
    if (disposed) return;
    console.error("[portfolio-world] scene unavailable", error);
    ground?.dispose();
    ground = null;
    globe?.dispose();
    globe = null;
    sceneAlive = false;
    document.body.classList.add("hero-failed");
  };
  try {
    ground = new GroundStage(groundCanvas, ANCHOR.lat, ANCHOR.lon, renderScale);
    ground.setCeiling(GROUND_FADE_END_KM);
    globe = new GlobeStage(spaceCanvas, renderScale);
    const rest = cameraPositionKm(ANCHOR.lat, ANCHOR.lon, 0);
    globe.orientSky(new THREE.Vector3(rest.x, rest.y, rest.z).normalize());
  } catch (error) {
    sceneUnavailable(error);
  }
  // Attach before any other await: textures can reject while plates load, or
  // long after the startup cap. Both paths retain the destination interface.
  const globeLoaded = globe?.whenReady().catch(sceneUnavailable);
  const plates: Plates = sceneAlive ? await createPlates(prototype ? null : query("ground"), platesHost) : { variant: "a", update: () => undefined };
  if (signal?.aborted || disposed) { dispose(); throw new DOMException("World disposed", "AbortError"); }

  const forced = queryNumber("fp");
  const frozen = forced !== null && forced < 1;
  let filmProgress = forced === null ? (reduced || !sceneAlive || location.pathname !== "/" ? 1 : 0) : clamp01(forced);
  let filmDone = forced !== null || reduced || !sceneAlive || location.pathname !== "/";
  let filmStart = 0;
  let filmDuration = FILM_MS;
  let hiddenAt: number | null = null;

  const target: View = { ...ANCHOR, altitude: altitudeForProgress(filmProgress, endAltitude) };
  const view: View = { ...target };
  let logAltitude = Math.log(view.altitude);
  let destination: DestinationId = "home";
  let body: BodyId = "earth";
  let restPose = homePose(aspect);
  let flight: Flight | null = null;
  let drift = 0;
  let last = performance.now();
  let lastMix = -1;
  let groundShown = 1;
  const workMs: number[] = [];
  const intervalMs: number[] = [];
  const intervalAt: number[] = [];
  let startedAt = 0;
  const dragCamera = prototype ? new EarthDragCamera(prototype.camera) : null;
  let matchingView: MatchingView | null = null;
  let sceneTime = 0;
  let renderedPosition = cameraPositionKm(view.lat, view.lon, view.altitude);
  const canDrag = (): boolean => Boolean(prototype && sceneAlive && filmDone && !flight &&
    mixFor(view.altitude) >= 1 && Math.abs(Math.log(view.altitude / target.altitude)) < 0.003);

  const up = new THREE.Vector3(0, 1, 0);
  const position = new THREE.Vector3();
  const east = new THREE.Vector3();
  const north = new THREE.Vector3();

  const mixFor = (altitude: number): number => body !== "earth" ? 1 : smoothstep((altitude - GROUND_FADE_START_KM) / (GROUND_FADE_END_KM - GROUND_FADE_START_KM));

  const endFilm = (): void => {
    if (filmDone) return;
    filmDone = true;
    filmProgress = 1;
    target.altitude = endAltitude;
    document.body.classList.remove("film-lock");
    document.body.classList.add("film-complete");
    hint.textContent = "Choose a place";
    progressBar.style.transform = "scaleX(1)";
  };

  const settleTargetOnView = (): void => {
    target.lat = view.lat;
    target.lon = view.lon;
    target.altitude = view.altitude;
  };

  const cancelFlight = (): void => {
    if (!flight) return;
    flight = null;
    settleTargetOnView();
    restPose = { ...view };
    drift = 0;
  };
  const snap = (id: DestinationId, pose: View): void => {
    flight = null; filmDone = true; filmProgress = 1;
    destination = id; restPose = { ...pose }; drift = 0;
    Object.assign(target, pose); Object.assign(view, pose);
    logAltitude = Math.log(pose.altitude);
    dragCamera?.clear();
    renderedPosition = cameraPositionKm(pose.lat, pose.lon, pose.altitude);
  };
  const fly = (id: DestinationId, pose: View, onProgress: (raw: number) => void): FlightPlan => {
    filmDone = true; filmProgress = 1; destination = id; drift = 0; restPose = { ...pose };
    dragCamera?.clear();
    const plan = flightPlan(view, pose, reduced);
    if (reduced) { snap(id, pose); onProgress(1); }
    else flight = { plan, startedAt: performance.now(), onProgress };
    return plan;
  };
  const updateFlight = (now: number): void => {
    if (!flight) return;
    const current = flight;
    const raw = clamp01((now - current.startedAt) / current.plan.duration);
    Object.assign(target, flightPose(current.plan, raw));
    if (raw >= 1) flight = null;
    current.onProgress(raw);
  };

  const tick = (now: number): void => {
    if (disposed) return;
    if (document.hidden || document.documentElement.dataset.destination === 'about') {
      if (document.documentElement.dataset.destination === 'about') ground?.sleep();
      last = now;
      frame = requestAnimationFrame(tick);
      return;
    }
    const workStart = performance.now();
    const dt = Math.min(0.1, (now - last) / 1_000);
    intervalMs.push(now - last);
    intervalAt.push(now - startedAt);
    last = now;
    const cameraDt = dt;
    if (!reduced && sceneAlive && prototype && !matchingView && !dragCamera?.holdsOrbit) sceneTime += dt;
    const t = prototype ? sceneTime : now / 1_000;
    const motion = !reduced && sceneAlive;

    if (!sceneAlive && !filmDone) endFilm();

    if (!filmDone) {
      if (filmStart === 0) filmStart = now;
      const next = clamp01((now - filmStart) / filmDuration);
      const nextAltitude = altitudeForProgress(next, endAltitude);
      if (globe && !globe.isReady() && nextAltitude > GROUND_FADE_START_KM * 0.8) {
        // The globe has not arrived: hold the film instead of dissolving into nothing.
        filmStart += dt * 1_000;
      } else {
        filmProgress = next;
        target.altitude = nextAltitude;
      }
      progressBar.style.transform = `scaleX(${filmProgress})`;
      if (filmProgress >= 1) endFilm();
    } else if (flight) {
      updateFlight(now);
    } else if (motion && !frozen && !matchingView && !dragCamera?.holdsOrbit && restPose.altitude > GROUND_FADE_END_KM && (!prototype || filmProgress >= 1)) {
      drift += dt * DRIFT_DEG_PER_SECOND;
      target.lon = restPose.lon + drift;
    }

    // One damped chase for every state: film, flight, rest.
    const k = reduced || !sceneAlive ? 1 : 1 - Math.exp(-cameraDt / CHASE_TAU);
    view.lat += (target.lat - view.lat) * k;
    view.lon += shortestLonDelta(view.lon, target.lon) * k;
    // Rejoin over the globe before descending into the anchored aerial mosaic.
    const chasedAltitude = dragCamera?.manipulated && target.altitude < GROUND_FADE_END_KM
      ? Math.max(view.altitude, GROUND_FADE_END_KM) : target.altitude;
    logAltitude += (Math.log(chasedAltitude) - logAltitude) * k;
    view.altitude = Math.exp(logAltitude);
    const altitude = view.altitude;
    if (mixFor(altitude) <= 0.001) renderedPosition = cameraPositionKm(view.lat, view.lon, altitude);
    const breatheX = motion ? Math.sin(t * 0.05) * 0.02 * altitude : 0;
    const breatheY = motion ? Math.sin(t * 0.037) * 0.015 * altitude : 0;

    const mix = mixFor(altitude);
    // The ground only shows what it has: after a sleep its tiles land over a
    // few frames, and the planet stays visible underneath until they do.
    const readiness = ground?.readiness() ?? 1;
    groundShown += (readiness - groundShown) * Math.min(1, dt * 6);
    const shown = Number(((1 - mix) * groundShown).toFixed(3));
    if (shown !== lastMix) {
      groundCanvas.style.opacity = String(shown);
      lastMix = shown;
    }
    if (ground && globe) {
      if (mix < 0.999) {
        ground.wake();
        ground.render(altitude, breatheX, breatheY, dt);
      } else if (filmDone && !flight && restPose.altitude > GROUND_FADE_END_KM && (!prototype || target.altitude >= GROUND_FADE_END_KM)) {
        ground.sleep();
      }
      if (mix > 0.001 || (filmDone && !flight)) {
        const p = cameraPositionKm(view.lat, view.lon, altitude);
        position.set(p.x, p.y, p.z);
        const phi = ((90 - view.lat) * Math.PI) / 180;
        const theta = ((view.lon + 180) * Math.PI) / 180;
        east.set(Math.sin(theta), 0, Math.cos(theta));
        north.set(Math.cos(phi) * Math.cos(theta), Math.sin(phi), -Math.cos(phi) * Math.sin(theta));
        position.addScaledVector(east, breatheX).addScaledVector(north, breatheY);
        if (dragCamera) position.copy(dragCamera.resolve(position, reduced ? 1 : cameraDt));
        renderedPosition = { x: position.x, y: position.y, z: position.z };
        globe.render(position, up, altitude, t, motion);
      }
      plates.update(altitude, endAltitude);
      ground.tidy();
    }

    workMs.push(performance.now() - workStart);
    if (workMs.length > 8_000) workMs.splice(0, workMs.length - 8_000);
    if (intervalMs.length > 8_000) {
      intervalMs.splice(0, intervalMs.length - 8_000);
      intervalAt.splice(0, intervalAt.length - 8_000);
    }
    frame = requestAnimationFrame(tick);
  };

  listen(window, "resize", () => {
    dragCamera?.restore();
    aspect = window.innerWidth / window.innerHeight;
    endAltitude = endAltitudeKm(aspect);
    GROUND_FADE_START_KM = GROUND_FADE_START_WIDTH_KM / viewWidthKm(1, aspect);
    GROUND_FADE_END_KM = GROUND_FADE_END_WIDTH_KM / viewWidthKm(1, aspect);
    restPose = destinationPose(destination, aspect);
    if (!flight) target.altitude = filmProgress < 1 ? altitudeForProgress(filmProgress, endAltitude) : restPose.altitude;
    const scale = scaleForViewport();
    ground?.setCeiling(GROUND_FADE_END_KM);
    ground?.resize(scale);
    globe?.resize(scale);
  });
  listen(document, "visibilitychange", () => {
    if (document.hidden) hiddenAt = performance.now();
    else if (hiddenAt !== null) {
      if (!filmDone && filmStart !== 0) filmStart += performance.now() - hiddenAt;
      last = performance.now();
      hiddenAt = null;
    }
  });

  const percentile = (values: number[], q: number): number => {
    const sorted = [...values].sort((a, b) => a - b);
    return Number((sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0).toFixed(2));
  };

  const heroDebug = window.__world = {
    snapshot: () => ({
      filmProgress,
      altitudeKm: view.altitude,
      targetAltitudeKm: target.altitude,
      destination,
      body,
      groundVariant: plates.variant,
      flightActive: Boolean(flight),
      groundZoom: ground?.activeLayerZoom() ?? -1,
      pendingTiles: ground?.pending() ?? 0,
      globeReady: globe?.isReady() ?? false,
      groundMix: mixFor(view.altitude),
      groundFadeKm: [Number(GROUND_FADE_START_KM.toFixed(0)), Number(GROUND_FADE_END_KM.toFixed(0))],
      groundAsleep: ground?.isAsleep() ?? true,
      sceneAlive,
      endAltitudeKm: endAltitude,
    }),
    seek: (progress: number) => {
      filmDone = true;
      filmProgress = clamp01(progress);
      flight = null;
      destination = "home";
      drift = 0;
      target.lat = view.lat = ANCHOR.lat;
      target.lon = view.lon = ANCHOR.lon;
      target.altitude = view.altitude = altitudeForProgress(filmProgress, endAltitude);
      logAltitude = Math.log(view.altitude);
      if (ground && view.altitude < GROUND_FADE_END_KM) ground.wake();
      document.body.classList.remove("film-lock");
      document.body.classList.add("film-complete");
      progressBar.style.transform = `scaleX(${filmProgress})`;
    },
    performance: () => {
      const intervals = intervalMs.slice(1);
      const worst = intervals
        .map((ms, index) => ({ ms: Number(ms.toFixed(1)), atS: Number((intervalAt[index + 1] / 1_000).toFixed(2)) }))
        .filter((sample) => sample.ms > 34)
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 8);
      return {
        samples: workMs.length,
        workP99Ms: percentile(workMs, 0.99),
        intervalP99Ms: percentile(intervals, 0.99),
        intervalsOver34Ms: intervals.filter((sample) => sample > 34).length,
        intervalMaxMs: Number((Math.max(0, ...intervals)).toFixed(2)),
        worst,
      };
    },
  };
  removeDebug = () => { if (window.__world === heroDebug) delete window.__world; };

  const clearJourney = (): void => {
    flight = null;
    destination = "home";
    drift = 0;
    target.lat = ANCHOR.lat;
    target.lon = ANCHOR.lon;
  };
  const controls: WorldControls | undefined = dragCamera ? {
    snapshot: () => {
      const actual = spherical(renderedPosition);
      return { ...heroDebug.snapshot(), mode: dragCamera.snapshot().mode, interaction: dragCamera.snapshot().interaction,
        canDrag: canDrag(), cameraPositionKm: { ...renderedPosition }, radiusKm: actual.radius,
        latitude: actual.latitude, longitude: actual.longitude, sceneTimeSeconds: sceneTime, matchingView, disposed,
        diagnostics: { activeWorlds: disposed ? 0 : 1, rendererCount: Number(Boolean(ground)) + Number(Boolean(globe)), listenerCount } };
    },
    fly, snap, cancelFlight,
    prepareBody: spec => globe!.prepareBody(spec),
    setBody: (spec, material) => { body = spec?.id ?? 'earth'; globe?.setBody(spec, material); if (body !== 'earth') ground?.sleep(); },
    setComposition: (amount, reveal = 1) => globe?.setComposition(amount, reveal),
    setMode: (mode) => { if (!disposed) dragCamera.setMode(mode); },
    match: (name) => {
      if (disposed) return;
      clearJourney();
      matchingView = name;
      sceneTime = 0;
      dragCamera.clear();
      const altitude = name === "road" ? 0.035 : name === "city" ? 3.6 : name === "transition"
        ? (GROUND_FADE_START_KM + GROUND_FADE_END_KM) / 2 : endAltitude;
      heroDebug.seek(progressForAltitude(altitude, endAltitude));
      filmProgress = name === "earth" ? 1 : filmProgress;
      renderedPosition = cameraPositionKm(view.lat, view.lon, view.altitude);
      if (ground && view.altitude < GROUND_FADE_END_KM) ground.warm(view.altitude);
    },
    replay: () => {
      if (disposed) return;
      clearJourney();
      matchingView = null;
      dragCamera.clear();
      sceneTime = 0;
      heroDebug.seek(reduced ? 1 : 0);
      filmDone = reduced;
      filmStart = 0;
      filmDuration = FILM_MS;
      renderedPosition = cameraPositionKm(view.lat, view.lon, view.altitude);
      ground?.warm(view.altitude);
    },
    reset: () => { if (!disposed) { dragCamera.restore(); } },
    scrub: (progress) => {
      if (disposed) return;
        if (filmDone && !flight && !matchingView && filmProgress === clamp01(progress)) {
        dragCamera.restore();
        return;
      }
      clearJourney();
      matchingView = null;
      filmDone = true;
      filmProgress = clamp01(progress);
      dragCamera.restore();
      target.altitude = altitudeForProgress(filmProgress, endAltitude);
      // GroundStage.render preloads around the actual damped view. Warming the
      // faster target every frame recreated layers the visible view just evicted.
      progressBar.style.transform = `scaleX(${filmProgress})`;
    },
    beginDrag: () => !disposed && dragCamera.begin(renderedPosition, canDrag()),
    drag: (x, y) => { if (!disposed) { dragCamera.move(x, y); } },
    endDrag: () => { dragCamera.end(); dragCamera.restore(); },
  } : undefined;

  // The film doubles as the loader: it opens on a finished frame with the
  // planet already on the GPU (its 4096 px uploads are a 230 ms stall if they
  // land mid-film, measured), or after six seconds regardless. A frozen or
  // skipped film needs whatever its altitude shows.
  if (ground && globe) {
    const opening = location.pathname === "/" ? ground.prepare(view.altitude) : Promise.resolve();
    const loaded = Promise.all([opening, globeLoaded]);
    const cap = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const criticalReady = await Promise.race([
      loaded.then(() => true),
      cap(prototype || filmDone ? 12_000 : 6_000).then(() => false),
    ]);
    if (prototype && !criticalReady) {
      dispose();
      throw new Error("Required journey imagery did not load in time");
    }
  }
  if (!sceneAlive) endFilm();
  if (signal?.aborted || disposed) { dispose(); throw new DOMException("World disposed", "AbortError"); }
  host.dataset.ready = "true";
  if (filmDone) {
    document.body.classList.remove("film-lock");
    document.body.classList.add("film-complete");
    hint.textContent = "Choose a place";
    progressBar.style.transform = `scaleX(${filmProgress})`;
  }

  return {
    dispose,
    prototype: controls,
    start(): void {
      if (disposed) return;
      cancelAnimationFrame(frame);
      last = performance.now();
      startedAt = last;
      frame = requestAnimationFrame(tick);
    },
  };
}
