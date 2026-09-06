import type { PlanetSpec } from './types';

// MESSENGER final MDIS basemap; enhanced color reveals surface composition.
export const moonSpec = (phone: boolean): PlanetSpec => ({
  id: 'mercury', map: `/media/mercury/color-${phone ? 2048 : 4096}.webp`,
  displacementScaleKm: 0, atmosphere: false, clouds: false,
  sunDir: [.8, .35, .7], exposure: 1.0, brightness: 1.0,
});
