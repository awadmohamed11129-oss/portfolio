import type { DeviceId } from "@/lib/portfolio/contracts";

/** World publishes these rectangles in CSS viewport pixels after face-on arrival. */
export type DeviceProjection = {
  device: DeviceId | null;
  left: number;
  top: number;
  width: number;
  height: number;
  ready: boolean;
};

export function readDeviceProjection(value: unknown): DeviceProjection | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.device !== "monitor" && candidate.device !== "phone" && candidate.device !== null) return null;
  if (typeof candidate.ready !== "boolean") return null;
  if (![candidate.left, candidate.top, candidate.width, candidate.height].every(number => typeof number === "number" && Number.isFinite(number))) return null;
  return candidate as DeviceProjection;
}

export function hasReadableProjection(projection: DeviceProjection): boolean {
  return projection.ready && projection.width >= (projection.device === "monitor" ? 560 : 260)
    && projection.height >= 260 && projection.left >= 8 && projection.top >= 76
    && projection.left + projection.width <= window.innerWidth - 8
    && projection.top + projection.height <= window.innerHeight - 8;
}

export function projectionDisposition(projection: DeviceProjection, activeDevice: DeviceId): "wait" | "ignore" | "align" | "expand" {
  if (projection.device !== null && projection.device !== activeDevice) return "ignore";
  // World sends zero-size invalidation during flight/loading. A positive rectangle
  // is emitted after settling, even when clipping makes ready:false.
  if (projection.device === null || projection.width <= 0 || projection.height <= 0) return "wait";
  return hasReadableProjection(projection) ? "align" : "expand";
}
