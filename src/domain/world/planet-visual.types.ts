export type PlanetFamily = 'terrestrial' | 'oceanic' | 'icy' | 'volcanic' | 'barren' | 'toxic' | 'gas-dwarf';
export type PlanetBiomeArchetype = 'lush' | 'desert' | 'rocky' | 'ice' | 'molten' | 'toxic' | 'storm';
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
  biomeArchetype: PlanetBiomeArchetype;
  atmosphereClass: PlanetAtmosphereClass;
  roughnessClass: PlanetRoughnessClass;
  reliefClass: PlanetReliefClass;
  hasOceans: boolean;
  canHaveClouds: boolean;
  canHaveRings: boolean;
}

export interface PlanetVisualDNA {
  paletteId: string;
  baseColor: [number, number, number];
  secondaryColor: [number, number, number];
  oceanColor: [number, number, number];
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
  surface: {
    colorA: [number, number, number];
    colorB: [number, number, number];
    oceanColor: [number, number, number];
    reliefAmplitude: number;
    roughness: number;
    specularStrength: number;
    bandingStrength: number;
    noiseSeed: number;
  };
  clouds: {
    enabled: boolean;
    color: [number, number, number];
    coverage: number;
    opacity: number;
    speed: number;
    noiseSeed: number;
  };
  atmosphere: {
    enabled: boolean;
    color: [number, number, number];
    density: number;
    thickness: number;
    rimStrength: number;
  };
  rings: {
    enabled: boolean;
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
