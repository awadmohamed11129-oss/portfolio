// Every number the hero's camera depends on, in one place, with no DOM and no
// three.js so tests can pin them.
export const EARTH_RADIUS_KM = 6_371;
export const FILM_SECONDS = 12.5;
export const FOV_DEG = 40;
export const START_ALTITUDE_KM = 0.015;
/** Web Mercator circumference in metres. */
const EQUATOR_M = 40_075_016.686;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(value: number): number {
  const n = clamp01(value);
  return n * n * (3 - 2 * n);
}

/** The reference's warp: keeps the rate of scale change feeling constant
 *  instead of "slow, then a rush". */
export function filmProgress(progress: number): number {
  const n = clamp01(progress);
  return 0.45 * n + (0.55 * Math.expm1(5.2 * n)) / Math.expm1(5.2);
}

/** Altitude at which the globe fills `fill` of the narrower viewport
 *  dimension. A portrait phone needs a much higher wide shot than a 16:10
 *  desktop, which is the reference's 2.14x mobile pull-back, derived rather
 *  than hard-coded. */
export function endAltitudeKm(aspect: number, fovDeg = FOV_DEG, fill = 0.78): number {
  const halfVertical = (fovDeg * Math.PI) / 360;
  const halfNarrow = aspect < 1 ? Math.atan(Math.tan(halfVertical) * aspect) : halfVertical;
  const angularRadius = Math.atan(Math.tan(halfNarrow) * fill);
  return EARTH_RADIUS_KM / Math.sin(angularRadius) - EARTH_RADIUS_KM;
}

/** Geometric ramp: alt = a0 * (a1 / a0) ^ warp(progress). */
export function altitudeForProgress(progress: number, endKm: number): number {
  return START_ALTITUDE_KM * Math.pow(endKm / START_ALTITUDE_KM, filmProgress(progress));
}

export function destinationFlightDuration(distanceKm: number): number {
  return Math.min(5, 2.2 + Math.max(0, distanceKm) / 1_400);
}

export function flightArcKm(distanceKm: number): number {
  return Math.min(900, Math.max(60, distanceKm * 0.12));
}

/** Interpolate altitude in log space so a descent from orbit to a road spends
 *  its time evenly across scales instead of slamming into the ground. */
export function lerpAltitude(fromKm: number, toKm: number, t: number): number {
  const a = Math.log(Math.max(1e-6, fromKm));
  const b = Math.log(Math.max(1e-6, toKm));
  return Math.exp(a + (b - a) * t);
}

export type Vec3 = { x: number; y: number; z: number };

/** Camera position in km for a lat/lon/altitude, in the globe's frame
 *  (y up, matching the sphere's texture mapping). */
export function cameraPositionKm(lat: number, lon: number, altitudeKm: number): Vec3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const r = EARTH_RADIUS_KM + altitudeKm;
  return {
    x: -Math.sin(phi) * Math.cos(theta) * r,
    y: Math.cos(phi) * r,
    z: Math.sin(phi) * Math.sin(theta) * r,
  };
}

export function distanceKm(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export type TileCoordinate = { x: number; y: number; z: number };

export function mercatorFraction(lat: number, lon: number, z: number): { x: number; y: number } {
  const scale = 2 ** z;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: ((lon + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale,
  };
}

export function tileForCoordinate(lat: number, lon: number, z: number): TileCoordinate {
  const f = mercatorFraction(lat, lon, z);
  return { x: Math.floor(f.x), y: Math.floor(f.y), z };
}

export function tileWidthMetres(lat: number, z: number): number {
  return (EQUATOR_M * Math.cos((lat * Math.PI) / 180)) / 2 ** z;
}

/** Ground width the camera sees at this altitude, in km. */
export function viewWidthKm(altitudeKm: number, aspect: number, fovDeg = FOV_DEG): number {
  return 2 * altitudeKm * Math.tan((fovDeg * Math.PI) / 360) * aspect;
}

/** The tile zoom whose ground resolution is between 1x and 2x what the render
 *  needs: never sharper than the screen can show, never softer than a 2x
 *  upsample. `renderWidthPx` is capped so a 4K monitor asks for a zoom the
 *  bounded tile store still covers. */
export function groundZoom(
  altitudeKm: number,
  aspect: number,
  renderWidthPx: number,
  lat: number,
  minZoom: number,
  maxZoom: number,
): number {
  const neededMetresPerPixel = (viewWidthKm(altitudeKm, aspect) * 1_000) / Math.min(1_500, renderWidthPx);
  const zoom = Math.floor(Math.log2(tileWidthMetres(lat, 0) / 256 / neededMetresPerPixel));
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}
