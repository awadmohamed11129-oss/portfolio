import type { PlanetSpec } from './types';

// Viking color imagery sharpened with the Mars Digital Image Mosaic (ASU).
export const moonSpec = (phone: boolean): PlanetSpec => ({
  id: 'mars', map: `/media/mars/color-${phone ? 2048 : 4096}.webp`,
  displacementScaleKm: 0, atmosphere: false, clouds: false,
  sunDir: [.9, .3, .55], exposure: 1.05, brightness: 1.2,
});
