import * as THREE from 'three';
import { SeededRng } from '@/game/world/rng';
import type { PlanetSettlementSlot } from '@/game/planet/slots/types';

interface SlotCandidate {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  elevation: number;
  slope: number;
  latitude: number;
  longitude: number;
  habitability: number;
}

interface CandidateThresholds {
  minElevationDelta: number;
  maxSlope: number;
  maxLatitudeAbs: number;
  minNormalDot: number;
}

const TARGET_MIN = 10;
const TARGET_MAX = 20;

export class PlanetSlotGenerator {
  generate(seed: number, surfaceGeometry: THREE.BufferGeometry, seaLevel: number): PlanetSettlementSlot[] {
    const rng = new SeededRng((seed ^ 0x51f3c671) >>> 0);
    const targetCount = rng.int(TARGET_MIN, TARGET_MAX);
    const candidates = this.extractCandidates(surfaceGeometry, seaLevel, targetCount);
    if (candidates.length === 0) {
      return this.syntheticFallback(surfaceGeometry, targetCount, seaLevel);
    }

    const selected = this.selectGloballyDistributed(seed, candidates, targetCount);
    const slots: PlanetSettlementSlot[] = selected.map((candidate, index) => ({
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

    while (slots.length < TARGET_MIN) {
      const source = selected[slots.length % selected.length] ?? candidates[slots.length % candidates.length];
      if (!source) break;
      const cloneIndex = slots.length;
      slots.push({
        id: `slot-${String(cloneIndex + 1).padStart(2, '0')}`,
        index: cloneIndex,
        position: [source.position.x, source.position.y, source.position.z],
        normal: [source.normal.x, source.normal.y, source.normal.z],
        elevation: source.elevation,
        slope: source.slope,
        habitability: source.habitability,
        latitude: source.latitude,
        longitude: source.longitude,
        state: 'empty',
      });
    }

    return slots.slice(0, targetCount);
  }

  private extractCandidates(surfaceGeometry: THREE.BufferGeometry, seaLevel: number, targetCount: number) {
    const positionAttr = surfaceGeometry.getAttribute('position');
    const normalAttr = surfaceGeometry.getAttribute('normal');
    const elevationAttr = surfaceGeometry.getAttribute('aElevation');
    if (!positionAttr || !normalAttr || !elevationAttr) return [];

    const thresholds: CandidateThresholds[] = [
      { minElevationDelta: 0.08, maxSlope: 0.24, maxLatitudeAbs: 74, minNormalDot: 0.76 },
      { minElevationDelta: 0.05, maxSlope: 0.29, maxLatitudeAbs: 80, minNormalDot: 0.69 },
      { minElevationDelta: 0.03, maxSlope: 0.34, maxLatitudeAbs: 84, minNormalDot: 0.62 },
      { minElevationDelta: 0.015, maxSlope: 0.41, maxLatitudeAbs: 88, minNormalDot: 0.54 },
    ];

    const sampleStep = Math.max(1, Math.floor(positionAttr.count / 14000));

    for (const threshold of thresholds) {
      const candidates: SlotCandidate[] = [];
      for (let i = 0; i < positionAttr.count; i += sampleStep) {
        const px = positionAttr.getX(i);
        const py = positionAttr.getY(i);
        const pz = positionAttr.getZ(i);
        const nx = normalAttr.getX(i);
        const ny = normalAttr.getY(i);
        const nz = normalAttr.getZ(i);
        const elevation = elevationAttr.getX(i);

        if (![px, py, pz, nx, ny, nz, elevation].every(Number.isFinite)) continue;

        const position = new THREE.Vector3(px, py, pz);
        const radialUp = position.clone().normalize();
        if (radialUp.lengthSq() < 1e-8) continue;

        const normal = new THREE.Vector3(nx, ny, nz).normalize();
        if (normal.lengthSq() < 1e-8) continue;

        const slope = 1 - THREE.MathUtils.clamp(normal.dot(radialUp), -1, 1);
        const elevationDelta = elevation - seaLevel;
        if (elevationDelta < threshold.minElevationDelta) continue;
        if (slope > threshold.maxSlope) continue;
        if (normal.dot(radialUp) < threshold.minNormalDot) continue;

        const latitude = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(radialUp.y, -1, 1)));
        const longitude = THREE.MathUtils.radToDeg(Math.atan2(radialUp.z, radialUp.x));
        if (Math.abs(latitude) > threshold.maxLatitudeAbs) continue;

        const habitability = this.scoreHabitability({ elevationDelta, slope, latitude, normalAlignment: normal.dot(radialUp) });
        if (habitability <= 0.08) continue;

        candidates.push({
          position,
          normal,
          elevation,
          slope,
          latitude,
          longitude,
          habitability,
        });
      }

      if (candidates.length >= targetCount * 4) {
        return candidates;
      }

      if (candidates.length >= TARGET_MIN * 2 && threshold === thresholds[thresholds.length - 1]) {
        return candidates;
      }

      if (threshold === thresholds[thresholds.length - 1] && candidates.length > 0) {
        return candidates;
      }
    }

    return [];
  }

  private scoreHabitability(input: { elevationDelta: number; slope: number; latitude: number; normalAlignment: number }) {
    const flatness = 1 - THREE.MathUtils.clamp(input.slope / 0.38, 0, 1);
    const inlandness = THREE.MathUtils.clamp(input.elevationDelta / 0.34, 0, 1);
    const latitudeComfort = 1 - THREE.MathUtils.clamp(Math.abs(input.latitude) / 90, 0, 1);
    const structuralStability = THREE.MathUtils.clamp((input.normalAlignment - 0.46) / 0.54, 0, 1);
    return THREE.MathUtils.clamp(flatness * 0.45 + inlandness * 0.25 + latitudeComfort * 0.15 + structuralStability * 0.15, 0, 1);
  }

  private selectGloballyDistributed(seed: number, candidates: SlotCandidate[], targetCount: number) {
    const desired = Math.max(TARGET_MIN, Math.min(TARGET_MAX, targetCount));
    const bins = new Map<string, SlotCandidate>();

    for (const candidate of candidates) {
      const latBin = Math.floor((candidate.latitude + 90) / 22.5);
      const lonBin = Math.floor((candidate.longitude + 180) / 22.5);
      const key = `${latBin}:${lonBin}`;
      const existing = bins.get(key);
      if (!existing || candidate.habitability > existing.habitability) {
        bins.set(key, candidate);
      }
    }

    const regionalPool = [...bins.values()]
      .sort((a, b) => b.habitability - a.habitability);

    const fallbackPool = [...candidates]
      .sort((a, b) => b.habitability - a.habitability);

    const selected: SlotCandidate[] = [];
    const rng = new SeededRng((seed ^ 0x2f6e2b1d) >>> 0);

    const seedIndex = Math.min(regionalPool.length - 1, rng.int(0, Math.max(0, Math.floor(regionalPool.length * 0.16))));
    if (seedIndex >= 0 && regionalPool[seedIndex]) {
      selected.push(regionalPool[seedIndex]);
      regionalPool.splice(seedIndex, 1);
    }

    while (selected.length < desired && (regionalPool.length > 0 || fallbackPool.length > 0)) {
      const source = regionalPool.length > 0 ? regionalPool : fallbackPool;
      let bestIndex = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < source.length; i += 1) {
        const candidate = source[i];
        const spacing = selected.length === 0
          ? 1
          : selected.reduce((min, picked) => Math.min(min, candidate.position.clone().normalize().dot(picked.position.clone().normalize())), 1);
        const spacingScore = 1 - (spacing + 1) * 0.5;
        const score = candidate.habitability * 0.62 + spacingScore * 0.38;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex < 0) break;
      const [picked] = source.splice(bestIndex, 1);
      selected.push(picked);
    }

    return selected;
  }

  private syntheticFallback(surfaceGeometry: THREE.BufferGeometry, targetCount: number, seaLevel: number): PlanetSettlementSlot[] {
    const positionAttr = surfaceGeometry.getAttribute('position');
    const normalAttr = surfaceGeometry.getAttribute('normal');
    const elevationAttr = surfaceGeometry.getAttribute('aElevation');
    if (!positionAttr || !normalAttr || !elevationAttr) return [];

    const created: PlanetSettlementSlot[] = [];
    const step = Math.max(1, Math.floor(positionAttr.count / Math.max(TARGET_MIN, targetCount * 3)));
    for (let i = 0; i < positionAttr.count && created.length < Math.max(TARGET_MIN, targetCount); i += step) {
      const position = new THREE.Vector3(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i));
      const normal = new THREE.Vector3(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i)).normalize();
      const elevation = elevationAttr.getX(i);
      if (!Number.isFinite(elevation) || elevation <= seaLevel) continue;

      const radialUp = position.clone().normalize();
      const slope = 1 - THREE.MathUtils.clamp(normal.dot(radialUp), -1, 1);
      const latitude = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(radialUp.y, -1, 1)));
      const longitude = THREE.MathUtils.radToDeg(Math.atan2(radialUp.z, radialUp.x));

      const idx = created.length;
      created.push({
        id: `slot-${String(idx + 1).padStart(2, '0')}`,
        index: idx,
        position: [position.x, position.y, position.z],
        normal: [normal.x, normal.y, normal.z],
        elevation,
        slope,
        habitability: this.scoreHabitability({
          elevationDelta: elevation - seaLevel,
          slope,
          latitude,
          normalAlignment: normal.dot(radialUp),
        }),
        latitude,
        longitude,
        state: 'empty',
      });
    }

    return created;
  }
}
