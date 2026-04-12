import * as THREE from 'three';
import { SeededRng } from '@/game/world/rng';
import type { PlanetGenerationConfig } from '@/game/planet/types';

export interface SettlementSlot {
  id: string;
  index: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  elevation: number;
  radialUp: THREE.Vector3;
  slope: number;
  latitude: number;
  longitude: number;
  habitability: number;
  state: 'empty';
}

interface SlotCandidate {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  elevation: number;
  radialUp: THREE.Vector3;
  slope: number;
  latitude: number;
  longitude: number;
  habitability: number;
  score: number;
  binKey: string;
  angle: number;
}

const MIN_SLOTS = 10;
const MAX_SLOTS = 20;
const BIN_LAT_COUNT = 5;
const BIN_LON_COUNT = 8;

export function generateSettlementSlots(
  geometry: THREE.BufferGeometry,
  config: PlanetGenerationConfig,
): SettlementSlot[] {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const elevations = geometry.getAttribute('aElevation');
  if (!positions || !normals || !elevations) {
    return [];
  }

  let minElevation = Number.POSITIVE_INFINITY;
  let maxElevation = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < elevations.count; i += 1) {
    const elevation = elevations.getX(i);
    if (!Number.isFinite(elevation)) continue;
    minElevation = Math.min(minElevation, elevation);
    maxElevation = Math.max(maxElevation, elevation);
  }

  if (!Number.isFinite(minElevation) || !Number.isFinite(maxElevation)) {
    return [];
  }

  const seed = (config.seed ^ 0x5bd1e995) >>> 0;
  const rng = new SeededRng(seed);
  const target = rng.int(MIN_SLOTS, MAX_SLOTS);
  const candidates: SlotCandidate[] = [];

  const coastMargin = config.surfaceMode === 'water' ? 0.035 : config.surfaceMode === 'ice' ? 0.03 : 0.055;
  const minBuildElevation01 = clamp(config.surfaceLevel01 + coastMargin, 0, 0.98);
  const maxBuildElevation01 = 0.96;
  const maxLatitudeDeg = config.surfaceMode === 'ice' ? 78 : 74;

  for (let i = 0; i < positions.count; i += 1) {
    const px = positions.getX(i);
    const py = positions.getY(i);
    const pz = positions.getZ(i);
    const nx = normals.getX(i);
    const ny = normals.getY(i);
    const nz = normals.getZ(i);
    const elevation = elevations.getX(i);

    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) continue;
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) continue;
    if (!Number.isFinite(elevation)) continue;

    const position = new THREE.Vector3(px, py, pz);
    const radialUp = position.clone().normalize();
    if (!Number.isFinite(radialUp.x) || !Number.isFinite(radialUp.y) || !Number.isFinite(radialUp.z)) continue;

    const normal = new THREE.Vector3(nx, ny, nz).normalize();
    const slopeDot = clamp(normal.dot(radialUp), -1, 1);
    const slope = Math.acos(Math.max(0, slopeDot));
    if (slope > THREE.MathUtils.degToRad(30)) continue;

    const elevation01 = normalize(elevation, minElevation, maxElevation);
    if (elevation01 < minBuildElevation01 || elevation01 > maxBuildElevation01) continue;

    const latitude = THREE.MathUtils.radToDeg(Math.asin(clamp(radialUp.y, -1, 1)));
    if (Math.abs(latitude) > maxLatitudeDeg) continue;
    const longitude = THREE.MathUtils.radToDeg(Math.atan2(radialUp.z, radialUp.x));

    const habitability = computeHabitability({ slope, latitude, elevation01, surfaceMode: config.surfaceMode });
    if (habitability < 0.18) continue;

    const latBin = latToBin(latitude);
    const lonBin = lonToBin(longitude);
    const binKey = `${latBin}:${lonBin}`;
    const score = habitability * 0.7 + (1 - slope / THREE.MathUtils.degToRad(30)) * 0.2 + (1 - Math.abs(latitude) / 90) * 0.1;

    candidates.push({
      position,
      normal,
      elevation,
      radialUp,
      slope,
      latitude,
      longitude,
      habitability,
      score,
      binKey,
      angle: 0,
    });
  }

  if (candidates.length === 0) {
    return [];
  }

  const lonJitter = rng.range(-8, 8);
  for (const candidate of candidates) {
    const theta = ((candidate.longitude + lonJitter + 180) / 360) * Math.PI * 2;
    candidate.angle = theta;
  }

  const byBin = new Map<string, SlotCandidate[]>();
  for (const candidate of candidates) {
    if (!byBin.has(candidate.binKey)) byBin.set(candidate.binKey, []);
    byBin.get(candidate.binKey)?.push(candidate);
  }
  for (const list of byBin.values()) {
    list.sort((a, b) => b.score - a.score);
  }

  const selected: SlotCandidate[] = [];
  const used = new Set<SlotCandidate>();
  const orderedBins = Array.from(byBin.entries())
    .sort((a, b) => {
      const ad = Math.abs(binLatCenter(a[0]));
      const bd = Math.abs(binLatCenter(b[0]));
      if (ad !== bd) return ad - bd;
      return a[0] < b[0] ? -1 : 1;
    })
    .map(([key]) => key);

  const minAngles = [0.72, 0.6, 0.5, 0.42, 0.32, 0.2, 0];
  for (const minAngle of minAngles) {
    for (let pass = 0; pass < orderedBins.length && selected.length < target; pass += 1) {
      for (const binKey of orderedBins) {
        if (selected.length >= target) break;
        const list = byBin.get(binKey);
        if (!list || list.length === 0) continue;
        const next = list.find((candidate) => !used.has(candidate) && isAngularlySeparated(candidate, selected, minAngle));
        if (!next) continue;
        selected.push(next);
        used.add(next);
      }
    }
    if (selected.length >= target) break;
  }

  if (selected.length < MIN_SLOTS) {
    const remainder = candidates.filter((candidate) => !used.has(candidate)).sort((a, b) => b.score - a.score);
    for (const candidate of remainder) {
      selected.push(candidate);
      used.add(candidate);
      if (selected.length >= MIN_SLOTS) break;
    }
  }

  const finalSelection = selected
    .slice(0, Math.max(MIN_SLOTS, Math.min(target, MAX_SLOTS)))
    .sort((a, b) => a.angle - b.angle)
    .map<SettlementSlot>((candidate, index) => ({
      id: `slot-${String(index + 1).padStart(2, '0')}`,
      index,
      position: candidate.position,
      normal: candidate.normal,
      elevation: candidate.elevation,
      radialUp: candidate.radialUp,
      slope: candidate.slope,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      habitability: candidate.habitability,
      state: 'empty',
    }));

  return finalSelection;
}

interface HabitabilityInput {
  slope: number;
  latitude: number;
  elevation01: number;
  surfaceMode: PlanetGenerationConfig['surfaceMode'];
}

function computeHabitability(input: HabitabilityInput) {
  const slopeScore = 1 - clamp(input.slope / THREE.MathUtils.degToRad(30), 0, 1);
  const latitudeScore = 1 - clamp(Math.abs(input.latitude) / 82, 0, 1);
  const elevIdeal = input.surfaceMode === 'lava' ? 0.72 : input.surfaceMode === 'ice' ? 0.58 : 0.64;
  const elevScore = 1 - clamp(Math.abs(input.elevation01 - elevIdeal) / 0.5, 0, 1);
  const surfacePenalty = input.surfaceMode === 'lava' ? 0.72 : input.surfaceMode === 'ice' ? 0.9 : 1;
  return clamp((slopeScore * 0.5 + latitudeScore * 0.24 + elevScore * 0.26) * surfacePenalty, 0.05, 0.99);
}

function isAngularlySeparated(candidate: SlotCandidate, selected: SlotCandidate[], minAngle: number) {
  if (selected.length === 0 || minAngle <= 0) return true;
  for (const other of selected) {
    const dot = clamp(candidate.radialUp.dot(other.radialUp), -1, 1);
    const angle = Math.acos(dot);
    if (angle < minAngle) return false;
  }
  return true;
}

function latToBin(latitude: number) {
  const t = clamp((latitude + 90) / 180, 0, 0.999999);
  return Math.floor(t * BIN_LAT_COUNT);
}

function lonToBin(longitude: number) {
  const t = clamp((longitude + 180) / 360, 0, 0.999999);
  return Math.floor(t * BIN_LON_COUNT);
}

function binLatCenter(binKey: string) {
  const [latBinText] = binKey.split(':');
  const latBin = Number.parseInt(latBinText, 10);
  const t = (latBin + 0.5) / BIN_LAT_COUNT;
  return t * 180 - 90;
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
