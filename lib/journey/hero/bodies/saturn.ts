import type { PlanetSpec } from './types';

export const moonSpec = (): PlanetSpec => ({
  id: 'saturn', map: '/media/saturn/color-2048.jpg', ringMap: '/media/saturn/rings-2048.png', displacementScaleKm: 0,
  atmosphere: false, clouds: false, sunDir: [-.65, .8, 1.4], exposure: .95,
});
