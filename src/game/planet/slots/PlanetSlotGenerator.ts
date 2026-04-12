import * as THREE from 'three';
import type { PlanetArchetype } from '@/game/render/types';
import type { PlanetCitySlot, PlanetSlotGenerationOptions } from '@/game/planet/slots/types';

interface SlotCandidate {
  index: number;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  radialUp: THREE.Vector3;
  elevation: number;
  slope: number;
  latitude: number;
  longitude: number;
  habitability: number;
  jitter: number;
}

const MIN_SLOTS = 10;
const MAX_SLOTS = 20;

const ARCHETYPE_SLOPE_MAX: Record<PlanetArchetype, number> = {
  terrestrial: 0.32,
  jungle: 0.31,
  arid: 0.33,
  mineral: 0.34,
  frozen: 0.28,
  volcanic: 0.27,
  barren: 0.3,
  oceanic: 0.27,
};

const ARCHETYPE_COUNT_BIAS: Record<PlanetArchetype, number> = {
  terrestrial: 1,
  jungle: 1,
  arid: 0,
  mineral: 0,
  frozen: -2,
  volcanic: -3,
  barren: -2,
  oceanic: -3,
};

export class PlanetSlotGenerator {
  generate(geometry: THREE.BufferGeometry, options: PlanetSlotGenerationOptions): PlanetCitySlot[] {
    const candidates = this.collectCandidates(geometry, options);
    if (candidates.length === 0) return [];

    const targetCount = this.resolveTargetCount(candidates, options.archetype);
    const selected = this.selectSpacedCandidates(candidates, targetCount);

    const ordered = [...selected].sort((a, b) => {
      if (a.longitude !== b.longitude) return a.longitude - b.longitude;
      return a.latitude - b.latitude;
    });

    return ordered.map((slot, index) => ({
      id: `slot-${String(index + 1).padStart(2, '0')}`,
      index,
      position: slot.position.toArray() as [number, number, number],
      normal: slot.normal.toArray() as [number, number, number],
      elevation: slot.elevation,
      slope: slot.slope,
      habitability: slot.habitability,
      latitude: slot.latitude,
      longitude: slot.longitude,
      state: 'empty',
    }));
  }

  private collectCandidates(geometry: THREE.BufferGeometry, options: PlanetSlotGenerationOptions): SlotCandidate[] {
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const elevation = geometry.getAttribute('aElevation');
    if (!position || !normal || !elevation) return [];

    const landMinElevation = Math.max(options.seaLevel + options.blendDepth * 1.2, 1.0 + Math.max(0.015, options.blendDepth * 1.5));
    const slopeMax = ARCHETYPE_SLOPE_MAX[options.archetype];
    const results: SlotCandidate[] = [];

    const pos = new THREE.Vector3();
    const nrm = new THREE.Vector3();
    const up = new THREE.Vector3();

    for (let i = 0; i < position.count; i += 1) {
      pos.fromBufferAttribute(position, i);
      nrm.fromBufferAttribute(normal, i);
      const elev = elevation.getX(i);
      if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z) || !Number.isFinite(elev)) continue;
      up.copy(pos).normalize();
      nrm.normalize();
      const slope = 1 - THREE.MathUtils.clamp(nrm.dot(up), -1, 1);
      const latitude = Math.asin(THREE.MathUtils.clamp(up.y, -1, 1));
      const longitude = Math.atan2(up.z, up.x);

      if (elev < landMinElevation) continue;
      if (slope > slopeMax) continue;
      if (Math.abs(latitude) > 1.34) continue;

      const inlandSafety = THREE.MathUtils.clamp((elev - landMinElevation) / 0.2, 0, 1);
      const flatness = 1 - THREE.MathUtils.clamp(slope / slopeMax, 0, 1);
      const latitudeFactor = 1 - THREE.MathUtils.clamp(Math.abs(latitude) / 1.45, 0, 1);
      const habitability = flatness * 0.62 + inlandSafety * 0.28 + latitudeFactor * 0.1;

      if (habitability < 0.12) continue;

      results.push({
        index: i,
        position: pos.clone(),
        normal: nrm.clone(),
        radialUp: up.clone(),
        elevation: elev,
        slope,
        latitude,
        longitude,
        habitability,
        jitter: hash01(options.seed ^ 0x51ed270b, i),
      });
    }

    return results.sort((a, b) => (b.habitability + b.jitter * 0.05) - (a.habitability + a.jitter * 0.05));
  }

  private resolveTargetCount(candidates: SlotCandidate[], archetype: PlanetArchetype) {
    const quality = candidates.reduce((sum, candidate) => sum + (1 - candidate.slope), 0) / Math.max(1, candidates.length);
    const countFactor = THREE.MathUtils.clamp(candidates.length / 3400, 0, 1);
    const qualityFactor = THREE.MathUtils.clamp((quality - 0.7) / 0.28, 0, 1);
    const base = 10 + Math.round(countFactor * 7 + qualityFactor * 3);
    return THREE.MathUtils.clamp(base + ARCHETYPE_COUNT_BIAS[archetype], MIN_SLOTS, MAX_SLOTS);
  }

  private selectSpacedCandidates(candidates: SlotCandidate[], targetCount: number): SlotCandidate[] {
    if (candidates.length <= targetCount) return candidates.slice(0, targetCount);
    const passes = [0.62, 0.5, 0.4, 0.32];

    for (const minAngle of passes) {
      const selected = this.tryGreedySelect(candidates, targetCount, minAngle);
      if (selected.length >= targetCount) return selected.slice(0, targetCount);
    }

    return candidates.slice(0, targetCount);
  }

  private tryGreedySelect(candidates: SlotCandidate[], targetCount: number, minAngle: number): SlotCandidate[] {
    const selected: SlotCandidate[] = [];

    for (const candidate of candidates) {
      const tooClose = selected.some((picked) => angularDistance(candidate.radialUp, picked.radialUp) < minAngle);
      if (tooClose) continue;
      selected.push(candidate);
      if (selected.length >= targetCount) break;
    }

    return selected;
  }
}

function angularDistance(a: THREE.Vector3, b: THREE.Vector3) {
  return Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
}

function hash01(seed: number, index: number) {
  const mixed = Math.imul((seed ^ (index * 0x9e3779b9)) >>> 0, 2246822519) >>> 0;
  return mixed / 0xffffffff;
}
