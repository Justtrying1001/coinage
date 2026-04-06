import { ARCHETYPE_IDENTITY_RULES, MIN_GAMEPLAY_LAND_RATIO } from './planet-identity.constants';
import type {
  PlanetArchetype,
  PlanetIdentity,
  PlanetRenderTuning,
  PlanetVisualProfile,
} from './planet-visual.types';
import { createSeededRng, pickWeighted, range } from './seeded-rng';

function pickOne<T>(rng: () => number, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)] ?? values[values.length - 1]!;
}

function withoutForbidden(
  allowed: readonly PlanetIdentity['allowedEffects'][number][],
  forbidden: readonly PlanetIdentity['forbiddenEffects'][number][],
): PlanetIdentity['allowedEffects'] {
  return allowed.filter((effect) => !forbidden.includes(effect));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveArchetypeRenderTuning(archetype: PlanetArchetype, rng: () => number): PlanetRenderTuning {
  const jitter = (amount: number) => (rng() - 0.5) * amount;
  switch (archetype) {
    case 'oceanic':
      return { colorPresence: 0.34 + jitter(0.03), craterBoost: 0.28, thermalActivity: 0.06, bandingStrength: 0.08, bandingFrequency: 2.6, colorContrast: 1.08, oceanLevelOffset: 0.06, mountainLevelOffset: -0.03 };
    case 'icy':
      return { colorPresence: 0.44 + jitter(0.03), craterBoost: 0.42, thermalActivity: 0.1, bandingStrength: 0.24, bandingFrequency: 4.4, colorContrast: 1.16, oceanLevelOffset: 0.02, mountainLevelOffset: -0.01 };
    case 'arid':
      return { colorPresence: 0.58 + jitter(0.03), craterBoost: 0.72, thermalActivity: 0.24, bandingStrength: 0.15, bandingFrequency: 3.2, colorContrast: 1.14, oceanLevelOffset: -0.12, mountainLevelOffset: 0.03 };
    case 'lush':
      return { colorPresence: 0.34 + jitter(0.03), craterBoost: 0.26, thermalActivity: 0.08, bandingStrength: 0.12, bandingFrequency: 2.9, colorContrast: 1.12, oceanLevelOffset: 0.01, mountainLevelOffset: 0.01 };
    case 'volcanic':
      return { colorPresence: 0.62 + jitter(0.03), craterBoost: 1.2, thermalActivity: 0.92, bandingStrength: 0.1, bandingFrequency: 3.8, colorContrast: 1.34, oceanLevelOffset: -0.16, mountainLevelOffset: 0.08 };
    case 'dead':
      return { colorPresence: 0.62 + jitter(0.03), craterBoost: 1.14, thermalActivity: 0.24, bandingStrength: 0.08, bandingFrequency: 3.1, colorContrast: 1.2, oceanLevelOffset: -0.1, mountainLevelOffset: 0.05 };
    case 'toxic':
      return { colorPresence: 0.52 + jitter(0.03), craterBoost: 0.58, thermalActivity: 0.66, bandingStrength: 0.28, bandingFrequency: 5.2, colorContrast: 1.28, oceanLevelOffset: -0.03, mountainLevelOffset: 0.04 };
    case 'mineral':
      return { colorPresence: 0.62 + jitter(0.03), craterBoost: 0.86, thermalActivity: 0.34, bandingStrength: 0.14, bandingFrequency: 3.6, colorContrast: 1.22, oceanLevelOffset: -0.09, mountainLevelOffset: 0.06 };
    case 'clouded':
      return { colorPresence: 0.44 + jitter(0.03), craterBoost: 0.3, thermalActivity: 0.14, bandingStrength: 0.34, bandingFrequency: 6.4, colorContrast: 1.15, oceanLevelOffset: 0.03, mountainLevelOffset: -0.02 };
    case 'exotic':
      return { colorPresence: 0.52 + jitter(0.03), craterBoost: 0.56, thermalActivity: 0.54, bandingStrength: 0.38, bandingFrequency: 5.9, colorContrast: 1.3, oceanLevelOffset: -0.02, mountainLevelOffset: 0.02 };
    case 'fragmented':
      return { colorPresence: 0.58 + jitter(0.03), craterBoost: 0.9, thermalActivity: 0.36, bandingStrength: 0.22, bandingFrequency: 4.8, colorContrast: 1.26, oceanLevelOffset: -0.12, mountainLevelOffset: 0.06 };
    case 'superterran':
      return { colorPresence: 0.34 + jitter(0.03), craterBoost: 0.22, thermalActivity: 0.12, bandingStrength: 0.06, bandingFrequency: 2.2, colorContrast: 1.12, oceanLevelOffset: -0.01, mountainLevelOffset: 0.01 };
  }
}

export function generatePlanetIdentity(input: {
  archetype: PlanetArchetype;
  baseSeed: number;
}): PlanetIdentity {
  const rule = ARCHETYPE_IDENTITY_RULES[input.archetype];
  const rng = createSeededRng(input.baseSeed >>> 0);

  const sizeCategory = pickOne(rng, rule.allowedSizeCategories);
  const shapeFamily = pickOne(rng, rule.allowedShapeFamilies);
  const reliefFamily = pickOne(rng, rule.allowedReliefFamilies);
  const hydrologyFamily = pickOne(rng, rule.allowedHydrologyFamilies);
  const surfaceFamily = pickOne(rng, rule.allowedSurfaceFamilies);
  const paletteFamily = pickOne(rng, rule.allowedPaletteFamilies);
  const atmosphereFamily = pickOne(rng, rule.allowedAtmosphereFamilies);

  const minGameplayLandRatio = MIN_GAMEPLAY_LAND_RATIO;
  const effectiveMinLandRatio = Math.max(rule.targetLandRatio.min, minGameplayLandRatio);
  const effectiveMaxLandRatio = Math.max(rule.targetLandRatio.max, effectiveMinLandRatio);

  const targetLandRatio = clamp(range(rng, effectiveMinLandRatio, effectiveMaxLandRatio), minGameplayLandRatio, 0.95);
  const rawOceanRatio = clamp(range(rng, rule.targetOceanRatio.min, rule.targetOceanRatio.max), 0, 0.8);
  const maxOceanByLand = clamp(1 - targetLandRatio - 0.06, 0, 0.8);
  const targetOceanRatio = Math.min(rawOceanRatio, maxOceanByLand);

  const rareTraitRoll = rng();
  const specialTraits = rareTraitRoll > 0.9 && rule.rareTraits?.length
    ? [pickOne(rng, rule.rareTraits)]
    : [];

  return {
    archetype: input.archetype,
    sizeCategory,
    shapeFamily,
    reliefFamily,
    hydrologyFamily,
    surfaceFamily,
    paletteFamily,
    atmosphereFamily,
    targetLandRatio,
    targetOceanRatio,
    allowedTerrainProfiles: [...rule.allowedTerrainProfiles],
    allowedEffects: withoutForbidden(rule.allowedEffects, rule.forbiddenEffects),
    forbiddenEffects: [...rule.forbiddenEffects],
    visualConstraints: {
      minLandRatio: effectiveMinLandRatio,
      maxOceanRatio: rule.targetOceanRatio.max,
      minElevationCap: rule.elevationCapRange.min,
      maxElevationCap: rule.elevationCapRange.max,
    },
    renderTuning: resolveArchetypeRenderTuning(input.archetype, rng),
    specialTraits,
  };
}

export function validatePlanetIdentity(identity: PlanetIdentity): string[] {
  const issues: string[] = [];

  if (identity.visualConstraints.minLandRatio < MIN_GAMEPLAY_LAND_RATIO) {
    issues.push('visualConstraints.minLandRatio below gameplay minimum');
  }

  if (identity.targetLandRatio < MIN_GAMEPLAY_LAND_RATIO) {
    issues.push('targetLandRatio below gameplay minimum');
  }

  if (identity.targetLandRatio < identity.visualConstraints.minLandRatio) {
    issues.push('targetLandRatio below minLandRatio constraint');
  }

  if (identity.targetOceanRatio > identity.visualConstraints.maxOceanRatio) {
    issues.push('targetOceanRatio above maxOceanRatio constraint');
  }

  if (identity.targetLandRatio + identity.targetOceanRatio > 1.08) {
    issues.push('targetLandRatio + targetOceanRatio exceeds plausible envelope');
  }

  for (const effect of identity.forbiddenEffects) {
    if (identity.allowedEffects.includes(effect)) {
      issues.push(`effect ${effect} cannot be both allowed and forbidden`);
    }
  }

  if (identity.atmosphereFamily === 'none' && identity.allowedEffects.includes('aurora')) {
    issues.push('aurora effect not allowed when atmosphereFamily is none');
  }

  if (identity.archetype === 'volcanic' && identity.targetOceanRatio > 0.12) {
    issues.push('volcanic identity ocean ratio too high');
  }

  if (identity.archetype === 'oceanic' && identity.targetOceanRatio < 0.28) {
    issues.push('oceanic identity ocean ratio too low');
  }

  return issues;
}

export function validateProfileIdentity(profile: PlanetVisualProfile): string[] {
  const issues = validatePlanetIdentity(profile.identity);

  if (profile.identity.archetype !== profile.archetype) {
    issues.push('profile archetype and identity archetype mismatch');
  }

  if (profile.identity.sizeCategory !== profile.sizeCategory) {
    issues.push('profile sizeCategory and identity sizeCategory mismatch');
  }

  if (profile.identity.paletteFamily !== profile.paletteFamily) {
    issues.push('profile paletteFamily and identity paletteFamily mismatch');
  }

  return issues;
}

export function pickArchetypeFromIdentityRules(rng: () => number): PlanetArchetype {
  return pickWeighted(
    rng,
    (Object.entries(ARCHETYPE_IDENTITY_RULES) as Array<[PlanetArchetype, (typeof ARCHETYPE_IDENTITY_RULES)[PlanetArchetype]]>)
      .map(([archetype, rule]) => ({ value: archetype, weight: rule.weight })),
  );
}
