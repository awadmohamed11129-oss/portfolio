import type { PlanetSpec } from './types';

// Cassini's global photographic mosaic, PIA07782. Native source is 3600 × 1800.
export const moonSpec = (phone: boolean): PlanetSpec => ({
  id: 'jupiter', map: `/media/jupiter/color-${phone ? 2048 : 3600}.webp`,
  displacementScaleKm: 0, atmosphere: false, clouds: false,
  sunDir: [.85, .35, .65], exposure: 1.0, brightness: 1.0, polarScale: .935,
});
