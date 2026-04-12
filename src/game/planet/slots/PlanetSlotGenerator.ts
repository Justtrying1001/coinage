import * as THREE from 'three';
import type { PlanetGenerationConfig } from '@/game/planet/types';
import type { PlanetSettlementSlot, PlanetSlotState } from '@/game/planet/slots/types';

interface SlotCandidate {
  position: THREE.Vector3;
  radialUp: THREE.Vector3;
  normal: THREE.Vector3;
  elevation: number;
  slope: number;
  habitability: number;
  latitude: number;
  longitude: number;
}

const MIN_SLOTS = 10;
const MAX_SLOTS = 20;
const LAT_BINS = 6;
const LON_BINS = 12;
const MAX_PER_BIN = 3;

export class PlanetSlotGenerator {
  generate(surfaceGeometry: THREE.BufferGeometry, config: PlanetGenerationConfig): PlanetSettlementSlot[] {
    const candidates = this.collectCandidates(surfaceGeometry, config);
    const targetCount = this.targetSlotCount(config);
    const selected = this.selectDistributed(candidates, targetCount);
    if (selected.length >= MIN_SLOTS) {
      return selected.map((candidate, index) => this.toSlot(candidate, index));
    }

    const relaxed = this.collectCandidates(surfaceGeometry, config, true);
    const fallbackSelected = this.selectDistributed(relaxed, targetCount);
    if (fallbackSelected.length > 0) {
      const filled = this.ensureMinimumSlots(fallbackSelected, relaxed, MIN_SLOTS);
      return filled.map((candidate, index) => this.toSlot(candidate, index));
    }

    const emergency = this.collectEmergency(surfaceGeometry, config);
    const emergencySelected = this.selectDistributed(emergency, MIN_SLOTS);
    const filled = this.ensureMinimumSlots(emergencySelected, emergency, MIN_SLOTS);
    return filled.map((candidate, index) => this.toSlot(candidate, index));
  }

  private collectCandidates(surfaceGeometry: THREE.BufferGeometry, config: PlanetGenerationConfig, relaxed = false): SlotCandidate[] {
    const positions = surfaceGeometry.getAttribute('position');
    const normals = surfaceGeometry.getAttribute('normal');
    const elevations = surfaceGeometry.getAttribute('aElevation');
    if (!positions || !normals || !elevations) return [];

    const count = positions.count;
    const stride = Math.max(1, Math.floor(count / 14000));
    const fluidMargin = this.fluidMargin(config, relaxed);
    const slopeMax = this.slopeThreshold(config, relaxed);
    const polarLimit = relaxed ? 0.975 : 0.94;

    const candidates: SlotCandidate[] = [];
    const up = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let i = 0; i < count; i += stride) {
      pos.set(positions.getX(i), positions.getY(i), positions.getZ(i));
      normal.set(normals.getX(i), normals.getY(i), normals.getZ(i));
      const elevation = elevations.getX(i);

      if (!Number.isFinite(pos.x + pos.y + pos.z + normal.x + normal.y + normal.z + elevation)) continue;
      if (pos.lengthSq() <= 1e-12 || normal.lengthSq() <= 1e-12) continue;

      up.copy(pos).normalize();
      normal.normalize();
      const slope = 1 - THREE.MathUtils.clamp(normal.dot(up), -1, 1);
      const latitude = Math.asin(THREE.MathUtils.clamp(up.y, -1, 1));
      const longitude = Math.atan2(up.z, up.x);

      if (Math.abs(up.y) >= polarLimit) continue;
      if (elevation <= config.seaLevel + fluidMargin) continue;
      if (Math.abs(elevation - config.surfaceLevel01) <= config.blendDepth * (relaxed ? 1.4 : 2.2)) continue;
      if (slope > slopeMax) continue;

      const habitability = this.scoreCandidate({ elevation, slope, latitude }, config);
      candidates.push({
        position: pos.clone(),
        radialUp: up.clone(),
        normal: normal.clone(),
        elevation,
        slope,
        habitability,
        latitude,
        longitude,
      });
    }

    return candidates;
  }

  private collectEmergency(surfaceGeometry: THREE.BufferGeometry, config: PlanetGenerationConfig): SlotCandidate[] {
    const positions = surfaceGeometry.getAttribute('position');
    const normals = surfaceGeometry.getAttribute('normal');
    const elevations = surfaceGeometry.getAttribute('aElevation');
    if (!positions || !normals || !elevations) return [];

    const count = positions.count;
    const stride = Math.max(1, Math.floor(count / 10000));
    const candidates: SlotCandidate[] = [];
    const pos = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let i = 0; i < count; i += stride) {
      pos.set(positions.getX(i), positions.getY(i), positions.getZ(i));
      normal.set(normals.getX(i), normals.getY(i), normals.getZ(i));
      const elevation = elevations.getX(i);

      if (!Number.isFinite(pos.x + pos.y + pos.z + normal.x + normal.y + normal.z + elevation)) continue;
      if (pos.lengthSq() <= 1e-12 || normal.lengthSq() <= 1e-12) continue;

      const up = pos.clone().normalize();
      normal.normalize();
      const slope = 1 - THREE.MathUtils.clamp(normal.dot(up), -1, 1);
      const latitude = Math.asin(THREE.MathUtils.clamp(up.y, -1, 1));
      const longitude = Math.atan2(up.z, up.x);
      if (Math.abs(up.y) >= 0.985) continue;
      if (elevation <= config.seaLevel + config.blendDepth * 0.2) continue;

      const habitability = this.scoreCandidate({ elevation, slope, latitude }, config) * 0.9;
      candidates.push({
        position: pos.clone(),
        radialUp: up,
        normal: normal.clone(),
        elevation,
        slope,
        habitability,
        latitude,
        longitude,
      });
    }

    return candidates;
  }

  private scoreCandidate(input: { elevation: number; slope: number; latitude: number }, config: PlanetGenerationConfig) {
    const elevationDistance = input.elevation - config.seaLevel;
    const elevationScore = THREE.MathUtils.clamp(elevationDistance / Math.max(config.blendDepth * 7, 0.08), 0, 1);
    const flatness = 1 - THREE.MathUtils.clamp(input.slope / this.slopeThreshold(config, false), 0, 1);
    const latitudeScore = 1 - THREE.MathUtils.clamp(Math.abs(input.latitude) / (Math.PI * 0.48), 0, 1);
    return flatness * 0.65 + elevationScore * 0.22 + latitudeScore * 0.13;
  }

  private selectDistributed(candidates: SlotCandidate[], targetCount: number): SlotCandidate[] {
    if (candidates.length === 0) return [];
    const bins = new Map<string, SlotCandidate[]>();
    for (const candidate of candidates) {
      const latNorm = THREE.MathUtils.clamp((candidate.latitude + Math.PI / 2) / Math.PI, 0, 0.999999);
      const lonNorm = THREE.MathUtils.clamp((candidate.longitude + Math.PI) / (Math.PI * 2), 0, 0.999999);
      const latBin = Math.floor(latNorm * LAT_BINS);
      const lonBin = Math.floor(lonNorm * LON_BINS);
      const key = `${latBin}:${lonBin}`;
      const list = bins.get(key) ?? [];
      list.push(candidate);
      bins.set(key, list);
    }

    const pooled: SlotCandidate[] = [];
    bins.forEach((list) => {
      list.sort((a, b) => b.habitability - a.habitability);
      pooled.push(...list.slice(0, MAX_PER_BIN));
    });
    pooled.sort((a, b) => b.habitability - a.habitability);

    const selections: SlotCandidate[] = [];
    const minCosByPass = [
      Math.cos(0.7),
      Math.cos(0.58),
      Math.cos(0.46),
      Math.cos(0.35),
      Math.cos(0.24),
    ];

    for (const minCos of minCosByPass) {
      for (const candidate of pooled) {
        if (selections.length >= targetCount) break;
        if (this.hasSpacingConflict(selections, candidate, minCos)) continue;
        selections.push(candidate);
      }
      if (selections.length >= targetCount) break;
    }

    if (selections.length < targetCount) {
      for (const candidate of pooled) {
        if (selections.length >= targetCount) break;
        if (selections.includes(candidate)) continue;
        selections.push(candidate);
      }
    }

    return selections.slice(0, targetCount);
  }

  private hasSpacingConflict(selected: SlotCandidate[], next: SlotCandidate, maxDot: number) {
    for (const item of selected) {
      if (item.radialUp.dot(next.radialUp) > maxDot) return true;
    }
    return false;
  }

  private ensureMinimumSlots(selected: SlotCandidate[], source: SlotCandidate[], minimum: number) {
    const output = [...selected];
    if (output.length >= minimum) return output.slice(0, MAX_SLOTS);

    source.sort((a, b) => b.habitability - a.habitability);
    for (const candidate of source) {
      if (output.length >= minimum) break;
      if (output.includes(candidate)) continue;
      output.push(candidate);
    }
    return output.slice(0, Math.min(MAX_SLOTS, Math.max(minimum, output.length)));
  }

  private targetSlotCount(config: PlanetGenerationConfig) {
    const modeBase: Record<PlanetGenerationConfig['surfaceMode'], number> = {
      water: 12,
      ice: 14,
      lava: 11,
    };
    const byResolution = Math.round(config.resolution / 22);
    return THREE.MathUtils.clamp(modeBase[config.surfaceMode] + byResolution - 5, MIN_SLOTS, MAX_SLOTS);
  }

  private fluidMargin(config: PlanetGenerationConfig, relaxed: boolean) {
    const modeBoost = config.surfaceMode === 'lava' ? 1.6 : config.surfaceMode === 'ice' ? 1.35 : 1.2;
    return config.blendDepth * modeBoost * (relaxed ? 0.55 : 1.0);
  }

  private slopeThreshold(config: PlanetGenerationConfig, relaxed: boolean) {
    const base = config.surfaceMode === 'water' ? 0.18 : config.surfaceMode === 'ice' ? 0.22 : 0.24;
    return base + (relaxed ? 0.09 : 0);
  }

  private toSlot(candidate: SlotCandidate, index: number): PlanetSettlementSlot {
    const state: PlanetSlotState = 'empty';
    return {
      id: `slot-${String(index + 1).padStart(2, '0')}`,
      index,
      position: [candidate.position.x, candidate.position.y, candidate.position.z],
      normal: [candidate.normal.x, candidate.normal.y, candidate.normal.z],
      elevation: candidate.elevation,
      slope: candidate.slope,
      habitability: THREE.MathUtils.clamp(candidate.habitability, 0, 1),
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      state,
    };
  }
}
