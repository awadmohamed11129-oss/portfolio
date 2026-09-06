import { DESTINATION_PATHS, destinationForPath, type DestinationId } from '../portfolio/contracts';
import { endAltitudeKm } from './hero/math';
import type { FlightView } from './flight';
import type { BodyId, PlanetSpec } from './hero/bodies/types';
export { destinationForPath };
export type DestinationSpec = { id: DestinationId; path: string; body: BodyId; lighting: 'day' | 'night';
  arrival: { kind: 'fly'; pose: (aspect: number) => FlightView } | { kind: 'film'; to: 0 | 1; ms: number } | { kind: 'stay' };
  manifest: { src: string; bytes: number }[]; load?: () => Promise<{ moonSpec: (phone: boolean) => PlanetSpec }> };
export const homePose = (aspect: number): FlightView => ({ lat: 43.7969339, lon: -79.2237139, altitude: endAltitudeKm(aspect) });
export const projectsPose = (aspect: number): FlightView => ({ lat: 12, lon: 8, altitude: endAltitudeKm(aspect) * (aspect < 1 ? 1.15 : 1.08) });
export const experiencePose = (aspect: number): FlightView => ({ lat: 12, lon: 8, altitude: endAltitudeKm(aspect) * (aspect < 1 ? 1.15 : 1.08) });
export const resumePose = (aspect: number): FlightView => ({ lat: 8, lon: -35, altitude: endAltitudeKm(aspect) * (aspect < 1 ? 1.15 : 1.08) });
export const contactPose = (aspect: number): FlightView => ({ lat: 12, lon: 18, altitude: endAltitudeKm(aspect) * (aspect < 1 ? 1.15 : 1.08) });
export const destinations: Record<DestinationId, DestinationSpec> = {
  home: { id: 'home', path: DESTINATION_PATHS.home, body: 'earth', lighting: 'day', arrival: { kind: 'fly', pose: homePose }, manifest: [] },
  projects: { id: 'projects', path: DESTINATION_PATHS.projects, body: 'moon', lighting: 'day', arrival: { kind: 'fly', pose: projectsPose },
    manifest: [{ src: '/media/moon/color-4096.webp', bytes: 3045360 }, { src: '/media/moon/displacement-2048.webp', bytes: 807162 },
      { src: '/media/moon/color-2048.webp', bytes: 789136 }, { src: '/media/moon/displacement-1024.webp', bytes: 246734 }], load: () => import('./hero/bodies/moon') },
  experience: { id: 'experience', path: DESTINATION_PATHS.experience, body: 'jupiter', lighting: 'day', arrival: { kind: 'fly', pose: experiencePose },
    manifest: [{ src: '/media/jupiter/color-3600.webp', bytes: 457204 }, { src: '/media/jupiter/color-2048.webp', bytes: 231300 }], load: () => import('./hero/bodies/jupiter') },
  about: { id: 'about', path: DESTINATION_PATHS.about, body: 'earth', lighting: 'day', arrival: { kind: 'film', to: 0, ms: 6500 }, manifest: [] },
  contact: { id: 'contact', path: DESTINATION_PATHS.contact, body: 'mercury', lighting: 'day', arrival: { kind: 'fly', pose: contactPose },
    manifest: [{ src: '/media/mercury/color-4096.webp', bytes: 3942942 }, { src: '/media/mercury/color-2048.webp', bytes: 1007898 }], load: () => import('./hero/bodies/mercury') },
  resume: { id: 'resume', path: DESTINATION_PATHS.resume, body: 'mars', lighting: 'day', arrival: { kind: 'fly', pose: resumePose },
    manifest: [{ src: '/media/mars/color-4096.webp', bytes: 2077834 }, { src: '/media/mars/color-2048.webp', bytes: 639456 }], load: () => import('./hero/bodies/mars') },
};
export const DESTINATION_REGISTRY = destinations;

export function destinationPose(id: DestinationId, aspect: number): FlightView {
  const arrival = destinations[id].arrival;
  return arrival.kind === 'fly' ? arrival.pose(aspect) : homePose(aspect);
}
