import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import type { PlanetSettlementSlot } from '@/game/planet/slots/types';
import { SeededRng } from '@/game/world/rng';

interface Candidate {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  elevation: number;
  slope: number;
  latitude: number;
  longitude: number;
  habitability: number;
}

const TARGET_MIN_SLOTS = 10;
const TARGET_MAX_SLOTS = 20;

export class PlanetSlotGenerator {
  generate(config: PlanetGenerationConfig, surfaceMesh: THREE.Mesh): PlanetSettlementSlot[] {
    const slotCount = this.computeTargetSlotCount(config.seed);
    const rng = new SeededRng((config.seed ^ 0x45d9f3b) >>> 0);

    const sampler = new MeshSurfaceSampler(surfaceMesh).build();
    const samples = this.collectSamples(sampler, 1500, config.seed);
    if (samples.length === 0) {
      return this.createFallbackSlots(slotCount, config.seed);
    }

    const seaRadius = this.estimateSeaRadius(samples, config.surfaceLevel01);
    const accepted = this.filterCandidates(samples, seaRadius, config, 0.035, 0.26, 0.93);
    const relaxed = this.filterCandidates(samples, seaRadius, config, 0.02, 0.34, 0.98);

    const selected = this.selectDistributed(slotCount, accepted, relaxed, rng);
    const source = selected.length >= TARGET_MIN_SLOTS ? selected : this.fillWithFallbacks(selected, slotCount, config.seed);

    return source.slice(0, slotCount).map((candidate, index) => ({
      id: `slot-${String(index + 1).padStart(2, '0')}`,
      index,
      position: [candidate.position.x, candidate.position.y, candidate.position.z],
      normal: [candidate.normal.x, candidate.normal.y, candidate.normal.z],
      elevation: candidate.elevation,
      slope: candidate.slope,
      habitability: candidate.habitability,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      state: 'empty',
    }));
  }

  private collectSamples(sampler: MeshSurfaceSampler, sampleCount: number, seed: number) {
    const random = mulberry32((seed ^ 0xa341316c) >>> 0);
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const samples: Candidate[] = [];

    const previous = Math.random;
    Math.random = random;
    try {
      for (let i = 0; i < sampleCount; i += 1) {
        sampler.sample(position, normal);
        if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) continue;
        if (!Number.isFinite(normal.x) || !Number.isFinite(normal.y) || !Number.isFinite(normal.z)) continue;

        const radial = position.clone().normalize();
        const alignedNormal = normal.clone().normalize();
        const slope = 1 - THREE.MathUtils.clamp(alignedNormal.dot(radial), -1, 1);
        const length = position.length();
        const latitude = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(radial.y, -1, 1)));
        const longitude = THREE.MathUtils.radToDeg(Math.atan2(radial.z, radial.x));

        samples.push({
          position: position.clone(),
          normal: alignedNormal,
          elevation: length,
          slope,
          latitude,
          longitude,
          habitability: 0,
        });
      }
    } finally {
      Math.random = previous;
    }

    return samples;
  }

  private estimateSeaRadius(samples: Candidate[], surfaceLevel01: number) {
    const sorted = samples
      .map((sample) => sample.elevation)
      .sort((a, b) => a - b);
    const index = Math.floor(THREE.MathUtils.clamp(surfaceLevel01, 0.04, 0.92) * (sorted.length - 1));
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 1;
  }

  private filterCandidates(
    samples: Candidate[],
    seaRadius: number,
    config: PlanetGenerationConfig,
    fluidMargin: number,
    maxSlope: number,
    maxAbsLatitude: number,
  ) {
    const candidates: Candidate[] = [];
    const maxLat = maxAbsLatitude * 90;

    for (const sample of samples) {
      if (!Number.isFinite(sample.elevation) || !Number.isFinite(sample.slope)) continue;
      if (sample.elevation <= seaRadius + fluidMargin) continue;
      if (sample.slope > maxSlope) continue;
      if (Math.abs(sample.latitude) > maxLat) continue;

      const depthMargin = THREE.MathUtils.clamp((sample.elevation - (seaRadius + fluidMargin)) / 0.12, 0, 1);
      const slopeScore = 1 - THREE.MathUtils.clamp(sample.slope / Math.max(maxSlope, 1e-4), 0, 1);
      const latitudeScore = 1 - THREE.MathUtils.clamp(Math.abs(sample.latitude) / 80, 0, 1);
      const modeBoost = config.surfaceMode === 'water' ? 0.05 : 0;

      sample.habitability = THREE.MathUtils.clamp(depthMargin * 0.42 + slopeScore * 0.4 + latitudeScore * 0.18 + modeBoost, 0, 1);
      candidates.push(sample);
    }

    return candidates;
  }

  private selectDistributed(targetCount: number, strict: Candidate[], relaxed: Candidate[], rng: SeededRng) {
    const primary = strict.length >= targetCount ? strict : relaxed;
    const bins = new Map<string, Candidate[]>();

    for (const candidate of primary) {
      const latBin = Math.floor((candidate.latitude + 90) / 45);
      const lonBin = Math.floor((candidate.longitude + 180) / 60);
      const key = `${latBin}:${lonBin}`;
      const list = bins.get(key) ?? [];
      list.push(candidate);
      bins.set(key, list);
    }

    for (const list of bins.values()) {
      list.sort((a, b) => b.habitability - a.habitability);
    }

    const binKeys = Array.from(bins.keys()).sort((a, b) => a.localeCompare(b));
    const chosen: Candidate[] = [];
    let minAngle = THREE.MathUtils.degToRad(40);

    while (chosen.length < targetCount && minAngle >= THREE.MathUtils.degToRad(8)) {
      let progressed = false;
      for (const key of binKeys) {
        if (chosen.length >= targetCount) break;
        const list = bins.get(key);
        if (!list || list.length === 0) continue;
        const top = this.pickTop(list, rng);
        if (!top) continue;
        if (this.meetsSpacing(top, chosen, minAngle)) {
          chosen.push(top);
          progressed = true;
        }
      }
      if (!progressed) minAngle *= 0.82;
    }

    if (chosen.length < targetCount) {
      const fallback = [...primary].sort((a, b) => b.habitability - a.habitability);
      for (const candidate of fallback) {
        if (chosen.length >= targetCount) break;
        if (chosen.some((item) => item.position.distanceToSquared(candidate.position) < 1e-8)) continue;
        chosen.push(candidate);
      }
    }

    return chosen;
  }

  private pickTop(list: Candidate[], rng: SeededRng) {
    const shortlist = list.slice(0, Math.min(3, list.length));
    if (shortlist.length === 0) return null;
    const chosen = shortlist[rng.int(0, shortlist.length - 1)];
    const idx = list.indexOf(chosen);
    if (idx >= 0) list.splice(idx, 1);
    return chosen;
  }

  private meetsSpacing(candidate: Candidate, selected: Candidate[], minAngle: number) {
    const candidateDir = candidate.position.clone().normalize();
    for (const existing of selected) {
      const existingDir = existing.position.clone().normalize();
      const angle = candidateDir.angleTo(existingDir);
      if (angle < minAngle) return false;
    }
    return true;
  }

  private fillWithFallbacks(selected: Candidate[], slotCount: number, seed: number) {
    const fallback = [...selected];
    const rng = new SeededRng(seed ^ 0x99f2ab31);

    while (fallback.length < slotCount) {
      const theta = rng.range(0, Math.PI * 2);
      const phi = Math.acos(rng.range(-0.85, 0.85));
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      const position = new THREE.Vector3(x, y, z);
      fallback.push({
        position,
        normal: position.clone().normalize(),
        elevation: 1,
        slope: 0,
        latitude: THREE.MathUtils.radToDeg(Math.asin(y)),
        longitude: THREE.MathUtils.radToDeg(Math.atan2(z, x)),
        habitability: 0.4,
      });
    }

    return fallback;
  }

  private createFallbackSlots(slotCount: number, seed: number): PlanetSettlementSlot[] {
    const fallback = this.fillWithFallbacks([], slotCount, seed);
    return fallback.map((candidate, index) => ({
      id: `slot-${String(index + 1).padStart(2, '0')}`,
      index,
      position: [candidate.position.x, candidate.position.y, candidate.position.z],
      normal: [candidate.normal.x, candidate.normal.y, candidate.normal.z],
      elevation: candidate.elevation,
      slope: candidate.slope,
      habitability: candidate.habitability,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      state: 'empty',
    }));
  }

  private computeTargetSlotCount(seed: number) {
    const rng = new SeededRng(seed ^ 0x6c8e9cf5);
    return THREE.MathUtils.clamp(rng.int(TARGET_MIN_SLOTS, TARGET_MAX_SLOTS), TARGET_MIN_SLOTS, TARGET_MAX_SLOTS);
  }
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6D2B79F5;
    let v = Math.imul(t ^ (t >>> 15), 1 | t);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}
