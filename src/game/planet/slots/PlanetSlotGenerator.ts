import * as THREE from 'three';
import { SeededRng } from '@/game/world/rng';
import { generateSphericalFibonacciDirections } from '@/game/planet/slots/sphericalFibonacci';
import type {
  PlanetSlot,
  PlanetSlotCandidate,
  PlanetSlotGenerationInput,
  PlanetSlotGenerationResult,
  PlanetSlotThresholds,
  PlanetSurfaceSample,
} from '@/game/planet/slots/types';

const DEFAULT_THRESHOLDS: PlanetSlotThresholds = {
  coastMargin: 0.04,
  lavaMargin: 0.08,
  maxSlopeRad: 0.46,
  maxSlopeMetric: 1 - Math.cos(0.46),
  localProbeCount: 4,
  localProbeRadiusRad: 0.03,
  maxNormalVariance: 0.22,
  maxElevationVariance: 0.045,
  minSpacingRad: 0.4,
};

const CANDIDATE_COUNT = 320;
const MIN_SLOT_COUNT = 10;
const MAX_SLOT_COUNT = 20;

export class PlanetSlotGenerator {
  private readonly raycaster = new THREE.Raycaster();

  generate(input: PlanetSlotGenerationInput): PlanetSlotGenerationResult {
    const geom = input.surfaceMesh.geometry;
    const aElevation = geom.getAttribute('aElevation');
    const index = geom.getIndex();

    if (!aElevation || !index) {
      return {
        slots: [],
        debug: {
          attempts: 0,
          candidateCount: 0,
          projectedCount: 0,
          validCount: 0,
          targetCount: 0,
          relaxedThresholds: 0,
        },
      };
    }

    const radius = input.surfaceMesh.geometry.boundingSphere?.radius
      ?? this.estimateRadius(input.surfaceMesh.geometry.getAttribute('position'));
    const targetCount = resolveTargetCount(input);

    let relaxationStep = 0;
    let selected: PlanetSlot[] = [];
    let validCandidates: PlanetSlotCandidate[] = [];
    let projectedCount = 0;

    while (relaxationStep <= 5) {
      const thresholds = thresholdsForRelaxation(input.config.surfaceMode, relaxationStep);
      const directions = generateSphericalFibonacciDirections(CANDIDATE_COUNT, input.seed ^ (relaxationStep * 0x9e3779b1));
      const candidates: PlanetSlotCandidate[] = [];

      for (const direction of directions) {
        const sample = sampleSurfaceAtDirection(input.surfaceMesh, direction, radius, this.raycaster, input.minElevation, input.maxElevation);
        if (!sample) continue;
        projectedCount += 1;

        if (!passesSurfaceMode(sample, input, thresholds)) continue;

        const radialUp = sample.point.clone().normalize();
        const slopeMetric = 1 - THREE.MathUtils.clamp(sample.normal.dot(radialUp), -1, 1);
        if (slopeMetric > thresholds.maxSlopeMetric) continue;

        const probe = evaluateLocalStability(input.surfaceMesh, sample, thresholds, radius, this.raycaster, input.minElevation, input.maxElevation);
        if (!probe) continue;

        const qualityScore = scoreCandidate(sample, slopeMetric, probe.normalVariance, probe.elevationVariance, input, thresholds);
        candidates.push({
          direction,
          sample,
          slopeMetric,
          localNormalVariance: probe.normalVariance,
          localElevationVariance: probe.elevationVariance,
          qualityScore,
        });
      }

      validCandidates = candidates;
      selected = selectSpreadSlots(candidates, targetCount, thresholds, input.seed);
      if (selected.length >= Math.min(targetCount, MIN_SLOT_COUNT)) {
        break;
      }

      relaxationStep += 1;
    }

    return {
      slots: selected,
      debug: {
        attempts: relaxationStep + 1,
        candidateCount: CANDIDATE_COUNT,
        projectedCount,
        validCount: validCandidates.length,
        targetCount,
        relaxedThresholds: relaxationStep,
      },
    };
  }

  private estimateRadius(position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
    let max = 1;
    for (let i = 0; i < position.count; i += 1) {
      const len = Math.hypot(position.getX(i), position.getY(i), position.getZ(i));
      if (len > max) max = len;
    }
    return max;
  }
}

function resolveTargetCount(input: PlanetSlotGenerationInput) {
  const { config } = input;
  let habitability = 0.45;

  if (config.surfaceMode === 'water') habitability += 0.15;
  if (config.surfaceMode === 'ice') habitability -= 0.1;
  if (config.surfaceMode === 'lava') habitability -= 0.22;

  habitability += (config.material.vegetationDensity - 0.25) * 0.4;
  habitability += (config.material.wetness - 0.4) * 0.2;
  habitability -= config.material.emissiveStrength * 0.12;

  return THREE.MathUtils.clamp(Math.round(10 + habitability * 10), MIN_SLOT_COUNT, MAX_SLOT_COUNT);
}

function thresholdsForRelaxation(surfaceMode: PlanetSlotGenerationInput['config']['surfaceMode'], step: number): PlanetSlotThresholds {
  const slopeRad = DEFAULT_THRESHOLDS.maxSlopeRad + step * 0.03;
  const probeRadius = Math.max(0.018, DEFAULT_THRESHOLDS.localProbeRadiusRad - step * 0.002);
  const coastMargin = Math.max(0.015, DEFAULT_THRESHOLDS.coastMargin - step * 0.004);
  const lavaMargin = Math.max(0.04, DEFAULT_THRESHOLDS.lavaMargin - step * 0.006);

  const iceStrictness = surfaceMode === 'ice' ? 0.9 : 1;
  return {
    ...DEFAULT_THRESHOLDS,
    coastMargin,
    lavaMargin,
    maxSlopeRad: slopeRad * iceStrictness,
    maxSlopeMetric: 1 - Math.cos(slopeRad * iceStrictness),
    localProbeRadiusRad: probeRadius,
    maxNormalVariance: DEFAULT_THRESHOLDS.maxNormalVariance + step * 0.03,
    maxElevationVariance: DEFAULT_THRESHOLDS.maxElevationVariance + step * 0.007,
    minSpacingRad: Math.max(0.27, DEFAULT_THRESHOLDS.minSpacingRad - step * 0.025),
  };
}

function sampleSurfaceAtDirection(
  surfaceMesh: THREE.Mesh,
  direction: THREE.Vector3,
  radius: number,
  raycaster: THREE.Raycaster,
  minElevation: number,
  maxElevation: number,
): PlanetSurfaceSample | null {
  const origin = direction.clone().multiplyScalar(radius * 1.8);
  const rayDirection = origin.clone().multiplyScalar(-1).normalize();
  raycaster.set(origin, rayDirection);
  const hits = raycaster.intersectObject(surfaceMesh, false);
  if (!hits.length) return null;
  const hit = hits[0];
  if (!hit.face || hit.faceIndex === undefined || hit.faceIndex === null) return null;

  const geometry = surfaceMesh.geometry;
  const position = geometry.getAttribute('position');
  const elevationAttr = geometry.getAttribute('aElevation');
  const index = geometry.getIndex();
  if (!position || !elevationAttr || !index) return null;

  const ia = hit.face.a;
  const ib = hit.face.b;
  const ic = hit.face.c;

  if (!Number.isFinite(ia) || !Number.isFinite(ib) || !Number.isFinite(ic)) return null;

  const triA = new THREE.Vector3(position.getX(ia), position.getY(ia), position.getZ(ia));
  const triB = new THREE.Vector3(position.getX(ib), position.getY(ib), position.getZ(ib));
  const triC = new THREE.Vector3(position.getX(ic), position.getY(ic), position.getZ(ic));

  const barycoord = new THREE.Vector3();
  THREE.Triangle.getBarycoord(hit.point, triA, triB, triC, barycoord);
  if (!Number.isFinite(barycoord.x) || !Number.isFinite(barycoord.y) || !Number.isFinite(barycoord.z)) return null;

  const elevation = (
    elevationAttr.getX(ia) * barycoord.x
    + elevationAttr.getX(ib) * barycoord.y
    + elevationAttr.getX(ic) * barycoord.z
  );

  const normal = hit.normal?.clone();
  if (!normal) return null;
  normal.normalize();

  const elevSpan = Math.max(1e-6, maxElevation - minElevation);
  const elev01 = THREE.MathUtils.clamp((elevation - minElevation) / elevSpan, 0, 1);

  return {
    point: hit.point.clone(),
    normal,
    direction: hit.point.clone().normalize(),
    elevation,
    elev01,
    faceIndex: hit.faceIndex,
  };
}

function passesSurfaceMode(sample: PlanetSurfaceSample, input: PlanetSlotGenerationInput, thresholds: PlanetSlotThresholds) {
  if (input.config.surfaceMode === 'water') {
    return sample.elev01 >= input.config.surfaceLevel01 + thresholds.coastMargin;
  }
  if (input.config.surfaceMode === 'lava') {
    return sample.elev01 >= input.config.surfaceLevel01 + thresholds.lavaMargin;
  }
  return sample.elev01 >= input.config.surfaceLevel01 - 0.08;
}

function makeTangentBasis(normalizedDirection: THREE.Vector3) {
  const helper = Math.abs(normalizedDirection.y) > 0.85
    ? new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3(0, 1, 0);
  const tangent = helper.clone().cross(normalizedDirection).normalize();
  const bitangent = normalizedDirection.clone().cross(tangent).normalize();
  return { tangent, bitangent };
}

function evaluateLocalStability(
  surfaceMesh: THREE.Mesh,
  sample: PlanetSurfaceSample,
  thresholds: PlanetSlotThresholds,
  radius: number,
  raycaster: THREE.Raycaster,
  minElevation: number,
  maxElevation: number,
) {
  const { tangent, bitangent } = makeTangentBasis(sample.direction);
  let normalVariance = 0;
  let elevationVariance = 0;
  let probeHits = 0;

  for (let i = 0; i < thresholds.localProbeCount; i += 1) {
    const angle = (Math.PI * 2 * i) / thresholds.localProbeCount;
    const offset = tangent.clone().multiplyScalar(Math.cos(angle))
      .add(bitangent.clone().multiplyScalar(Math.sin(angle)))
      .multiplyScalar(Math.sin(thresholds.localProbeRadiusRad));

    const probeDir = sample.direction.clone()
      .multiplyScalar(Math.cos(thresholds.localProbeRadiusRad))
      .add(offset)
      .normalize();

    const probe = sampleSurfaceAtDirection(surfaceMesh, probeDir, radius, raycaster, minElevation, maxElevation);
    if (!probe) continue;

    probeHits += 1;
    const angular = Math.acos(THREE.MathUtils.clamp(sample.normal.dot(probe.normal), -1, 1));
    const elevDelta = Math.abs(probe.elev01 - sample.elev01);

    normalVariance += angular;
    elevationVariance += elevDelta;
  }

  if (probeHits < Math.ceil(thresholds.localProbeCount / 2)) return null;

  normalVariance /= probeHits;
  elevationVariance /= probeHits;

  if (normalVariance > thresholds.maxNormalVariance) return null;
  if (elevationVariance > thresholds.maxElevationVariance) return null;

  return {
    normalVariance,
    elevationVariance,
  };
}

function scoreCandidate(
  sample: PlanetSurfaceSample,
  slopeMetric: number,
  normalVariance: number,
  elevationVariance: number,
  input: PlanetSlotGenerationInput,
  thresholds: PlanetSlotThresholds,
) {
  const lowSurfaceThreshold = input.config.surfaceLevel01
    + (input.config.surfaceMode === 'lava' ? thresholds.lavaMargin : thresholds.coastMargin);

  const safeHeight = THREE.MathUtils.clamp((sample.elev01 - lowSurfaceThreshold) / 0.2, 0, 1);
  const slopeSafety = 1 - THREE.MathUtils.clamp(slopeMetric / Math.max(1e-6, thresholds.maxSlopeMetric), 0, 1);
  const normalStability = 1 - THREE.MathUtils.clamp(normalVariance / thresholds.maxNormalVariance, 0, 1);
  const elevationStability = 1 - THREE.MathUtils.clamp(elevationVariance / thresholds.maxElevationVariance, 0, 1);

  return safeHeight * 0.32 + slopeSafety * 0.28 + normalStability * 0.22 + elevationStability * 0.18;
}

function selectSpreadSlots(
  candidates: PlanetSlotCandidate[],
  targetCount: number,
  thresholds: PlanetSlotThresholds,
  seed: number,
): PlanetSlot[] {
  if (!candidates.length) return [];

  const rng = new SeededRng(seed ^ 0x4f1bbcdc);
  const pool = [...candidates].sort((a, b) => {
    const scoreDelta = b.qualityScore - a.qualityScore;
    if (Math.abs(scoreDelta) > 1e-9) return scoreDelta;
    return a.sample.faceIndex - b.sample.faceIndex;
  });

  const chosen: PlanetSlotCandidate[] = [];
  chosen.push(pool.shift() as PlanetSlotCandidate);

  while (chosen.length < targetCount && pool.length > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < pool.length; i += 1) {
      const candidate = pool[i];
      let minAngularDistance = Infinity;

      for (const selected of chosen) {
        const dot = THREE.MathUtils.clamp(candidate.sample.direction.dot(selected.sample.direction), -1, 1);
        const distance = Math.acos(dot);
        if (distance < minAngularDistance) minAngularDistance = distance;
      }

      const spacingFitness = THREE.MathUtils.clamp(minAngularDistance / thresholds.minSpacingRad, 0, 1.2);
      const combined = candidate.qualityScore * 0.62 + spacingFitness * 0.38 + rng.range(0, 1e-5);
      if (combined > bestScore) {
        bestScore = combined;
        bestIndex = i;
      }
    }

    if (bestIndex < 0) break;
    const [picked] = pool.splice(bestIndex, 1);
    chosen.push(picked);
  }

  return chosen.slice(0, targetCount).map((slot, index) => ({
    index,
    position: slot.sample.point.clone(),
    normal: slot.sample.normal.clone(),
    direction: slot.sample.direction.clone(),
    elevation: slot.sample.elevation,
    elev01: slot.sample.elev01,
    score: slot.qualityScore,
  }));
}
