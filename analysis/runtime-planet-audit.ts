import { writeFileSync } from 'node:fs';
import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';
import { applyPlanetRenderLod } from '@/rendering/planet/create-planet-render-instance';

const WORLD_SEED = 'coinage-mvp-seed';
const SAMPLE_SIZE = 100;
const FIXED_CAMERA_ZOOM = 2.85;
const VIEW_HEIGHT = 208.8; // from GalaxyView constants with fieldRadius=360

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
}

function std(values: number[]): number {
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)));
  return sorted[idx] ?? 0;
}

function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

const rows = Array.from({ length: SAMPLE_SIZE }, (_, i) => {
  const planetSeed = `planet-${i}`;
  const profile = generatePlanetVisualProfile({ worldSeed: WORLD_SEED, planetSeed });
  const uniformsPlanet = mapProfileToProceduralUniforms(profile);
  const uniformsGalaxy = applyPlanetRenderLod(uniformsPlanet, 'galaxy');
  const screenHeightRatio = (2 * uniformsGalaxy.radius * FIXED_CAMERA_ZOOM) / VIEW_HEIGHT;
  return {
    i,
    planetSeed,
    profile,
    uniformsPlanet,
    uniformsGalaxy,
    screenHeightRatio,
    pixelDiameterAt1080p: screenHeightRatio * 1080,
  };
});

const archetypeDistribution: Record<string, number> = {};
const macroDistribution: Record<string, number> = {};
const categoryDistribution: Record<string, number> = {};
const terrainDistribution: Record<string, number> = {};
const paletteDistribution: Record<string, number> = {};

for (const row of rows) {
  archetypeDistribution[row.profile.archetype] = (archetypeDistribution[row.profile.archetype] ?? 0) + 1;
  macroDistribution[row.profile.macroStyle] = (macroDistribution[row.profile.macroStyle] ?? 0) + 1;
  categoryDistribution[row.uniformsGalaxy.surfaceCategory] = (categoryDistribution[row.uniformsGalaxy.surfaceCategory] ?? 0) + 1;
  terrainDistribution[row.uniformsGalaxy.terrainProfile] = (terrainDistribution[row.uniformsGalaxy.terrainProfile] ?? 0) + 1;
  paletteDistribution[row.profile.paletteFamily] = (paletteDistribution[row.profile.paletteFamily] ?? 0) + 1;
}

const subSeedSets = {
  base: new Set<number>(),
  shape: new Set<number>(),
  relief: new Set<number>(),
  color: new Set<number>(),
  atmo: new Set<number>(),
  hydro: new Set<number>(),
};

for (const row of rows) {
  subSeedSets.base.add(row.profile.derivedSubSeeds.baseSeed);
  subSeedSets.shape.add(row.profile.derivedSubSeeds.shapeSeed);
  subSeedSets.relief.add(row.profile.derivedSubSeeds.reliefSeed);
  subSeedSets.color.add(row.profile.derivedSubSeeds.colorSeed);
  subSeedSets.atmo.add(row.profile.derivedSubSeeds.atmoSeed);
  subSeedSets.hydro.add(row.profile.derivedSubSeeds.hydroSeed);
}

const numericStats = {
  profile: {
    radius: rows.map((r) => r.profile.shape.radius),
    wobbleFrequency: rows.map((r) => r.profile.shape.wobbleFrequency),
    wobbleAmplitude: rows.map((r) => r.profile.shape.wobbleAmplitude),
    ridgeWarp: rows.map((r) => r.profile.shape.ridgeWarp),
    macroStrength: rows.map((r) => r.profile.relief.macroStrength),
    microStrength: rows.map((r) => r.profile.relief.microStrength),
    roughness: rows.map((r) => r.profile.relief.roughness),
    craterDensity: rows.map((r) => r.profile.relief.craterDensity),
    oceanBias: rows.map((r) => r.profile.hydrology.oceanBias),
  },
  galaxyUniforms: {
    radius: rows.map((r) => r.uniformsGalaxy.radius),
    meshResolution: rows.map((r) => r.uniformsGalaxy.meshResolution),
    oceanLevel: rows.map((r) => r.uniformsGalaxy.oceanLevel),
    mountainLevel: rows.map((r) => r.uniformsGalaxy.mountainLevel),
    simpleStrength: rows.map((r) => r.uniformsGalaxy.simpleStrength),
    ridgedStrength: rows.map((r) => r.uniformsGalaxy.ridgedStrength),
    craterStrength: rows.map((r) => r.uniformsGalaxy.craterStrength),
    thermalActivity: rows.map((r) => r.uniformsGalaxy.thermalActivity),
    bandingStrength: rows.map((r) => r.uniformsGalaxy.bandingStrength),
    colorContrast: rows.map((r) => r.uniformsGalaxy.colorContrast),
    atmosphereIntensity: rows.map((r) => r.uniformsGalaxy.atmosphereIntensity),
    atmosphereThickness: rows.map((r) => r.uniformsGalaxy.atmosphereThickness),
  },
  screen: {
    screenHeightRatio: rows.map((r) => r.screenHeightRatio),
    pixelDiameterAt1080p: rows.map((r) => r.pixelDiameterAt1080p),
  },
};

function summarize(values: number[]) {
  return {
    min: Math.min(...values),
    p25: quantile(values, 0.25),
    median: quantile(values, 0.5),
    p75: quantile(values, 0.75),
    max: Math.max(...values),
    mean: mean(values),
    std: std(values),
    cv: mean(values) === 0 ? 0 : std(values) / mean(values),
  };
}

const numericSummary = {
  profile: Object.fromEntries(Object.entries(numericStats.profile).map(([k, v]) => [k, summarize(v)])),
  galaxyUniforms: Object.fromEntries(Object.entries(numericStats.galaxyUniforms).map(([k, v]) => [k, summarize(v)])),
  screen: Object.fromEntries(Object.entries(numericStats.screen).map(([k, v]) => [k, summarize(v)])),
};

const features = rows.map((row) => ({
  id: row.planetSeed,
  archetype: row.profile.archetype,
  vector: [
    row.uniformsGalaxy.oceanLevel,
    row.uniformsGalaxy.mountainLevel,
    row.uniformsGalaxy.simpleStrength,
    row.uniformsGalaxy.ridgedStrength,
    row.uniformsGalaxy.craterStrength,
    row.uniformsGalaxy.thermalActivity,
    row.uniformsGalaxy.bandingStrength,
    row.uniformsGalaxy.colorContrast,
    row.uniformsGalaxy.roughness,
    row.uniformsGalaxy.metalness,
    row.uniformsGalaxy.atmosphereIntensity,
    row.uniformsGalaxy.atmosphereThickness,
    ...row.uniformsGalaxy.baseColor,
    ...row.uniformsGalaxy.landColor,
  ],
}));

function clusterCount(threshold: number): number {
  const centers: number[][] = [];
  for (const item of features) {
    let matched = false;
    for (const center of centers) {
      if (euclidean(item.vector, center) <= threshold) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      centers.push(item.vector);
    }
  }
  return centers.length;
}

const familyCounts = {
  threshold_0_12: clusterCount(0.12),
  threshold_0_18: clusterCount(0.18),
  threshold_0_24: clusterCount(0.24),
};

let closestPair: {
  a: string;
  b: string;
  distance: number;
  sameArchetype: boolean;
  aArchetype: string;
  bArchetype: string;
} | null = null;

for (let i = 0; i < features.length; i += 1) {
  for (let j = i + 1; j < features.length; j += 1) {
    const a = features[i]!;
    const b = features[j]!;
    const d = euclidean(a.vector, b.vector);
    if (!closestPair || d < closestPair.distance) {
      closestPair = {
        a: a.id,
        b: b.id,
        distance: d,
        sameArchetype: a.archetype === b.archetype,
        aArchetype: a.archetype,
        bArchetype: b.archetype,
      };
    }
  }
}

const report = {
  worldSeed: WORLD_SEED,
  sampleSize: SAMPLE_SIZE,
  subSeedUniqueness: {
    base: subSeedSets.base.size,
    shape: subSeedSets.shape.size,
    relief: subSeedSets.relief.size,
    color: subSeedSets.color.size,
    atmo: subSeedSets.atmo.size,
    hydro: subSeedSets.hydro.size,
  },
  distinctCounts: {
    archetypes: Object.keys(archetypeDistribution).length,
    macroStyles: Object.keys(macroDistribution).length,
    surfaceCategories: Object.keys(categoryDistribution).length,
    terrainProfiles: Object.keys(terrainDistribution).length,
    paletteFamilies: Object.keys(paletteDistribution).length,
  },
  distributions: {
    archetypeDistribution,
    macroDistribution,
    categoryDistribution,
    terrainDistribution,
    paletteDistribution,
  },
  numericSummary,
  familyCounts,
  closestPair,
  rows: rows.map((r) => ({
    planetSeed: r.planetSeed,
    archetype: r.profile.archetype,
    macroStyle: r.profile.macroStyle,
    paletteFamily: r.profile.paletteFamily,
    materialFamily: r.profile.materialFamily,
    surfaceCategory: r.uniformsGalaxy.surfaceCategory,
    terrainProfile: r.uniformsGalaxy.terrainProfile,
    shapeRadius: r.profile.shape.radius,
    oceanLevelGalaxy: r.uniformsGalaxy.oceanLevel,
    mountainLevelGalaxy: r.uniformsGalaxy.mountainLevel,
    simpleStrengthGalaxy: r.uniformsGalaxy.simpleStrength,
    ridgedStrengthGalaxy: r.uniformsGalaxy.ridgedStrength,
    craterStrengthGalaxy: r.uniformsGalaxy.craterStrength,
    thermalActivityGalaxy: r.uniformsGalaxy.thermalActivity,
    bandingStrengthGalaxy: r.uniformsGalaxy.bandingStrength,
    atmosphereEnabled: r.profile.atmosphere.enabled,
    atmosphereIntensityGalaxy: r.uniformsGalaxy.atmosphereIntensity,
    meshResolutionGalaxy: r.uniformsGalaxy.meshResolution,
    pixelDiameterAt1080p: r.pixelDiameterAt1080p,
  })),
};

writeFileSync('analysis/runtime-planet-audit.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log('Wrote analysis/runtime-planet-audit.json');
