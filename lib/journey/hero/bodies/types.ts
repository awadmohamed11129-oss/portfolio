export type BodyId = 'earth' | 'moon' | 'saturn' | 'jupiter' | 'mars' | 'mercury';
export type PlanetSpec = { id: BodyId; map: string; emissiveMap?: string; roughnessMap?: string; displacementMap?: string;
  ringMap?: string; displacementScaleKm: number; atmosphere: boolean; clouds: boolean; sunDir: readonly [number, number, number]; exposure: number;
  brightness?: number; polarScale?: number };
