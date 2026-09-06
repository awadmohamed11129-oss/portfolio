import type { PlanetSpec } from './types';
export const moonSpec = (phone: boolean): PlanetSpec => ({ id: 'moon', map: `/media/moon/color-${phone ? 2048 : 4096}.webp`,
  displacementMap: `/media/moon/displacement-${phone ? 1024 : 2048}.webp`, displacementScaleKm: 72,
  atmosphere: false, clouds: false, sunDir: [0.65, 0.25, 0.72], exposure: 1.05 });
