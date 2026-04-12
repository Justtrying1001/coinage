import * as THREE from 'three';
import type { PlanetSettlementSlot, PlanetSlotGenerationInput } from '@/game/planet/slots/types';

interface Candidate {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  elevation: number;
  slope: number;
  latitude: number;
  longitude: number;
  habitability: number;
  region: string;
}

const ARCHETYPE_BASE_TARGET: Record<PlanetSlotGenerationInput['archetype'], number> = {
  jungle: 18,
  terrestrial: 17,
  arid: 16,
  mineral: 15,
  oceanic: 13,
  frozen: 12,
  volcanic: 11,
  barren: 10,
};

export class PlanetSlotGenerator {
  generate(geometry: THREE.BufferGeometry, input: PlanetSlotGenerationInput): PlanetSettlementSlot[] {
    const positionAttr = geometry.getAttribute('position');
    const normalAttr = geometry.getAttribute('normal');
    const elevationAttr = geometry.getAttribute('aElevation');
    if (!positionAttr || !normalAttr || !elevationAttr) return [];

    const candidates: Candidate[] = [];
    const point = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const radialUp = new THREE.Vector3();

    const coastMargin = input.surfaceMode === 'lava' ? 0.08 : input.surfaceMode === 'ice' ? 0.07 : 0.06;
    const minElevation = input.seaLevel + coastMargin;
    const maxSlope = 0.19;

    for (let i = 0; i < positionAttr.count; i += 1) {
      point.fromBufferAttribute(positionAttr as THREE.BufferAttribute, i);
      normal.fromBufferAttribute(normalAttr as THREE.BufferAttribute, i);
      const elevation = elevationAttr.getX(i);
      if (!Number.isFinite(point.x + point.y + point.z + elevation + normal.x + normal.y + normal.z)) continue;

      radialUp.copy(point).normalize();
      normal.normalize();
      const slope = 1 - THREE.MathUtils.clamp(normal.dot(radialUp), -1, 1);
      if (slope > maxSlope || elevation < minElevation) continue;

      const latitude = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(radialUp.y, -1, 1)));
      if (Math.abs(latitude) > 76) continue;
      const longitude = THREE.MathUtils.radToDeg(Math.atan2(radialUp.z, radialUp.x));

      const coastDistance = THREE.MathUtils.clamp((elevation - minElevation) / 0.18, 0, 1);
      const flatness = 1 - THREE.MathUtils.clamp(slope / maxSlope, 0, 1);
      const latitudeScore = 1 - Math.pow(THREE.MathUtils.clamp(Math.abs(latitude) / 76, 0, 1), 1.6);
      const habitability = THREE.MathUtils.clamp(flatness * 0.48 + coastDistance * 0.34 + latitudeScore * 0.16 + this.seedJitter(input.seed, i) * 0.02, 0, 1);
      if (habitability < 0.38) continue;

      const region = this.regionKey(latitude, longitude);
      candidates.push({
        position: point.clone(),
        normal: radialUp.clone(),
        elevation,
        slope,
        latitude,
        longitude,
        habitability,
        region,
      });
    }

    if (candidates.length === 0) return [];

    const target = this.resolveTargetCount(candidates, positionAttr.count, input);
    const selected = this.selectGloballyDistributed(candidates, target);

    return selected.map((candidate, index) => ({
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

  private resolveTargetCount(candidates: Candidate[], vertexCount: number, input: PlanetSlotGenerationInput) {
    const base = ARCHETYPE_BASE_TARGET[input.archetype];
    const top = [...candidates].sort((a, b) => b.habitability - a.habitability).slice(0, 200);
    const quality = top.reduce((acc, candidate) => acc + candidate.habitability, 0) / Math.max(1, top.length);
    const density = THREE.MathUtils.clamp((candidates.length / Math.max(1, vertexCount)) * 42, 0, 1);
    const adjustment = Math.round((quality - 0.5) * 4 + (density - 0.45) * 3);
    return THREE.MathUtils.clamp(base + adjustment, 10, 20);
  }

  private selectGloballyDistributed(candidates: Candidate[], target: number): Candidate[] {
    const byRegion = new Map<string, Candidate[]>();
    for (const candidate of candidates) {
      if (!byRegion.has(candidate.region)) byRegion.set(candidate.region, []);
      byRegion.get(candidate.region)!.push(candidate);
    }

    const regionBuckets = [...byRegion.values()]
      .map((bucket) => bucket.sort((a, b) => b.habitability - a.habitability).slice(0, 8))
      .sort((a, b) => b[0].habitability - a[0].habitability);

    const selected: Candidate[] = [];
    const baseSpacing = THREE.MathUtils.clamp(2.7 / Math.sqrt(target), 0.44, 0.72);

    for (let relaxation = 1; relaxation >= 0.6 && selected.length < target; relaxation -= 0.08) {
      const minAngle = baseSpacing * relaxation;
      let added = false;

      for (let round = 0; round < 8 && selected.length < target; round += 1) {
        for (const bucket of regionBuckets) {
          const candidate = bucket[round];
          if (!candidate) continue;
          if (!this.isSpaced(candidate, selected, minAngle)) continue;
          selected.push(candidate);
          added = true;
          if (selected.length >= target) break;
        }
      }

      if (!added) {
        const flattened = regionBuckets.flat().sort((a, b) => b.habitability - a.habitability);
        for (const candidate of flattened) {
          if (selected.length >= target) break;
          if (selected.includes(candidate)) continue;
          if (!this.isSpaced(candidate, selected, minAngle * 0.9)) continue;
          selected.push(candidate);
        }
      }
    }

    if (selected.length < target) {
      const fallback = candidates
        .filter((candidate) => !selected.includes(candidate))
        .sort((a, b) => b.habitability - a.habitability);
      for (const candidate of fallback) {
        if (selected.length >= target) break;
        if (this.isSpaced(candidate, selected, 0.24)) selected.push(candidate);
      }
    }

    return selected.slice(0, target);
  }

  private isSpaced(candidate: Candidate, selected: Candidate[], minAngle: number) {
    for (const existing of selected) {
      const dot = THREE.MathUtils.clamp(candidate.normal.dot(existing.normal), -1, 1);
      const angle = Math.acos(dot);
      if (angle < minAngle) return false;
    }
    return true;
  }

  private regionKey(latitude: number, longitude: number) {
    const latBands = 6;
    const lonBands = 12;
    const latIndex = THREE.MathUtils.clamp(Math.floor(((latitude + 90) / 180) * latBands), 0, latBands - 1);
    const lonIndex = THREE.MathUtils.euclideanModulo(Math.floor(((longitude + 180) / 360) * lonBands), lonBands);
    return `${latIndex}:${lonIndex}`;
  }

  private seedJitter(seed: number, index: number) {
    const x = Math.sin((seed ^ (index * 374761393)) * 0.000001) * 43758.5453;
    return x - Math.floor(x);
  }
}
