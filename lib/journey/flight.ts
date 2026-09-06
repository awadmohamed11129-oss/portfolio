import { cameraPositionKm, clamp01, destinationFlightDuration, distanceKm, flightArcKm, lerpAltitude, smoothstep } from './hero/math';

export type FlightView = { lat: number; lon: number; altitude: number };
export type FlightPlan = { from: FlightView; to: FlightView; duration: number; distance: number; arc: number };
export type TransitPhase = 'idle' | 'leave' | 'empty' | 'arrive';
export function flightPlan(from: FlightView, to: FlightView, reduced = false): FlightPlan {
  const distance = distanceKm(cameraPositionKm(from.lat, from.lon, from.altitude), cameraPositionKm(to.lat, to.lon, to.altitude));
  return { from: { ...from }, to: { ...to }, distance, duration: reduced ? 0 : destinationFlightDuration(distance) * 1000, arc: flightArcKm(distance) };
}
export function flightPose(plan: FlightPlan, raw: number): FlightView {
  const p = smoothstep(clamp01(raw));
  const look = smoothstep(clamp01(raw * 1.4));
  return { lat: plan.from.lat + (plan.to.lat - plan.from.lat) * look,
    lon: plan.from.lon + (((plan.to.lon - plan.from.lon + 540) % 360) - 180) * look,
    altitude: lerpAltitude(plan.from.altitude, plan.to.altitude, p) + Math.sin(p * Math.PI) * plan.arc };
}
export function contentTiming(elapsed: number, duration: number): TransitPhase {
  if (duration === 0) return 'arrive';
  if (elapsed < 300) return 'leave';
  // The reference's empty beat ends at 900ms; text finishes fading at 1150ms.
  return elapsed < 900 ? 'empty' : 'arrive';
}
