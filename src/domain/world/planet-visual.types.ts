export type PlanetFamily =
  | 'terrestrial-lush'
  | 'oceanic'
  | 'desert-arid'
  | 'ice-frozen'
  | 'volcanic-infernal'
  | 'barren-rocky'
  | 'toxic-alien'
  | 'gas-giant'
  | 'ringed-giant';

export type PlanetSurfaceModel = 'solid' | 'frozen' | 'volatile' | 'gaseous';
export type PlanetAtmosphereClass = 'none' | 'thin' | 'standard' | 'dense' | 'reactive';
export type PlanetReliefClass = 'flat' | 'gentle' | 'rugged' | 'extreme';
export type PlanetRoughnessClass = 'polished' | 'balanced' | 'coarse';
export type PlanetRadiusClass = 'dwarf' | 'standard' | 'giant';

export interface PlanetIdentity {
  planetId: string;
  planetSeed: string;
  worldSeed: string;
  canonicalSeed: number;
  family: PlanetFamily;
  radiusClass: PlanetRadiusClass;
  worldPosition: { x: number; y: number; z: number };
}

export interface PlanetClassification {
  family: PlanetFamily;
  surfaceModel: PlanetSurfaceModel;
  atmosphereClass: PlanetAtmosphereClass;
  roughnessClass: PlanetRoughnessClass;
  reliefClass: PlanetReliefClass;
  hasOceans: boolean;
  canHaveClouds: boolean;
  canHaveRings: boolean;
}

export interface PlanetVisualDNA {
  paletteId: string;
  colorDeep: [number, number, number];
  colorMid: [number, number, number];
  colorHigh: [number, number, number];
  oceanColor: [number, number, number];
  accentColor: [number, number, number];
  cloudColor: [number, number, number];
  atmosphereTint: [number, number, number];
  oceanCoverage: number;
  cloudCoverage: number;
  atmosphereDensity: number;
  reliefAmplitude: number;
  roughness: number;
  specularStrength: number;
  emissiveIntensity: number;
  bandingStrength: number;
  noiseSeeds: {
    surface: number;
    moisture: number;
    thermal: number;
    clouds: number;
    bands: number;
    rings: number;
  };
  rotation: {
    surfaceSpeed: number;
    cloudSpeed: number;
    axialTilt: number;
  };
}

export interface PlanetGeneratedProfile {
  identity: PlanetIdentity;
  classification: PlanetClassification;
  visualDNA: PlanetVisualDNA;
  physicalRadius: number;
  ring: {
    enabled: boolean;
    innerRadiusRatio: number;
    outerRadiusRatio: number;
    tilt: number;
    opacity: number;
  };
}

export interface PlanetScaleProfile {
  physicalRadius: number;
  renderRadiusBase: number;
  normalizedRadius: number;
  galaxyViewScaleMultiplier: number;
  planetViewScaleMultiplier: number;
  silhouetteProtectedRadius: number;
  minRadiusGuardrail: number;
  maxRadiusGuardrail: number;
}

export interface PlanetRenderProfile {
  planetId: string;
  renderRadius: number;
  scale: PlanetScaleProfile;
  family: PlanetFamily;
  surfaceModel: PlanetSurfaceModel;
  surface: {
    colorDeep: [number, number, number];
    colorMid: [number, number, number];
    colorHigh: [number, number, number];
    oceanColor: [number, number, number];
    accentColor: [number, number, number];
    reliefAmplitude: number;
    roughness: number;
    specularStrength: number;
    emissiveIntensity: number;
    bandingStrength: number;
    noiseScale: number;
    oceanLevel: number;
    noiseSeed: number;
    moistureSeed: number;
    thermalSeed: number;
  };
  clouds: {
    enabled: boolean;
    color: [number, number, number];
    coverage: number;
    opacity: number;
    speed: number;
    stormBanding: number;
    turbulence: number;
    noiseSeed: number;
  };
  atmosphere: {
    enabled: boolean;
    color: [number, number, number];
    density: number;
    thickness: number;
    rimStrength: number;
    mieStrength: number;
    rayleighStrength: number;
  };
  rings: {
    enabled: boolean;
    color: [number, number, number];
    innerRadius: number;
    outerRadius: number;
    tilt: number;
    opacity: number;
    noiseSeed: number;
  };
  debug: {
    paletteId: string;
    activeNoiseFamilies: string[];
  };
}

export interface PlanetViewProfile {
  viewMode: 'galaxy' | 'planet';
  lod: 'low' | 'medium' | 'high';
  meshSegments: number;
  cloudSegments: number;
  atmosphereSegments: number;
  ringSegments: number;
  enableRings: boolean;
  lightingBoost: number;
}

export interface CanonicalPlanet {
  identity: PlanetIdentity;
  classification: PlanetClassification;
  visualDNA: PlanetVisualDNA;
  generated: PlanetGeneratedProfile;
  render: PlanetRenderProfile;
}

export interface PlanetDebugSnapshot {
  planetId: string;
  seed: string;
  family: PlanetFamily;
  radiusClass: PlanetRadiusClass;
  physicalRadius: number;
  renderRadiusBase: number;
  finalMeshScale: number;
  atmosphereThickness: number;
  cloudCoverage: number;
  hasRings: boolean;
  paletteId: string;
  activeNoiseFamilies: string[];
  currentViewMode: PlanetViewProfile['viewMode'];
  currentLOD: PlanetViewProfile['lod'];
}
