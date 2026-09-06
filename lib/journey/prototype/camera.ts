import { altitudeForProgress, cameraPositionKm, EARTH_RADIUS_KM, smoothstep, type Vec3 } from "../hero/math";
export type CameraMode = "directed" | "earth-drag";
type Interaction = "authored" | "dragging" | "held" | "returning";
export function spherical(position: Vec3) {
  const radius = Math.hypot(position.x, position.y, position.z);
  return { radius, latitude: Math.asin(position.y / radius) * 180 / Math.PI,
    longitude: Math.atan2(position.z, -position.x) * 180 / Math.PI - 180 };
}
const longitudeDelta = (from: number, to: number) => ((to - from) % 360 + 540) % 360 - 180;

/** Only the globe camera is overridden. Capture its actual radius, including
 * authored breathing, so grabbing never changes the apparent size. */
export class EarthDragCamera {
  private interaction: Interaction = "authored";
  private latitude = 0;
  private longitude = 0;
  private radius = 1;
  private returnTime = 0;
  constructor(private mode: CameraMode) {}
  get manipulated(): boolean { return this.interaction !== "authored"; }
  get holdsOrbit(): boolean { return this.interaction === "dragging" || this.interaction === "held"; }
  begin(position: Vec3, allowed: boolean): boolean {
    if (this.mode !== "earth-drag" || !allowed) return false;
    Object.assign(this, spherical(position));
    this.interaction = "dragging";
    return true;
  }
  move(x: number, y: number): void {
    if (this.interaction !== "dragging") return;
    this.longitude -= x * 0.18;
    this.latitude = Math.max(-70, Math.min(70, this.latitude - y * 0.18));
  }
  end(): void { if (this.interaction === "dragging") this.interaction = "held"; }
  restore(): void {
    if (!this.manipulated || this.interaction === "returning") return;
    this.interaction = "returning";
    this.returnTime = 0;
  }
  clear(): void { this.interaction = "authored"; this.returnTime = 0; }
  setMode(mode: CameraMode): void { this.mode = mode; if (mode === "directed") this.restore(); }
  resolve(position: Vec3, dt: number): Vec3 {
    if (!this.manipulated) return position;
    if (this.interaction !== "returning") return cameraPositionKm(this.latitude, this.longitude, this.radius - EARTH_RADIUS_KM);
    this.returnTime += dt;
    if (this.returnTime >= 0.8) { this.clear(); return position; }
    const authored = spherical(position);
    const k = smoothstep(this.returnTime / 0.8);
    return cameraPositionKm(this.latitude + (authored.latitude - this.latitude) * k,
      this.longitude + longitudeDelta(this.longitude, authored.longitude) * k,
      this.radius + (authored.radius - this.radius) * k - EARTH_RADIUS_KM);
  }
  snapshot() { return { mode: this.mode, latitude: this.latitude, longitude: this.longitude, radiusKm: this.radius, interaction: this.interaction }; }
}
export function progressForAltitude(altitude: number, endAltitude: number): number {
  let low = 0; let high = 1;
  for (let i = 0; i < 48; i++) {
    const middle = (low + high) / 2;
    if (altitudeForProgress(middle, endAltitude) < altitude) low = middle; else high = middle;
  }
  return (low + high) / 2;
}
