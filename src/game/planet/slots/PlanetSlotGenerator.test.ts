import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PlanetSlotGenerator } from '@/game/planet/slots/PlanetSlotGenerator';
import { createPlanetGenerationConfig } from '@/game/planet/presets/archetypes';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';

function buildTestMesh() {
  const geometry = new THREE.SphereGeometry(1, 56, 38);
  const position = geometry.getAttribute('position');
  const elevations = new Float32Array(position.count);
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    const elevation = 1 + y * 0.2;
    elevations[i] = elevation;
    if (elevation < min) min = elevation;
    if (elevation > max) max = elevation;
  }

  geometry.setAttribute('aElevation', new THREE.BufferAttribute(elevations, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  return { mesh, min, max };
}

describe('PlanetSlotGenerator', () => {
  it('is deterministic, returns 10..20 slots, and keeps spread', () => {
    const { mesh, min, max } = buildTestMesh();
    const seed = 424242;
    const config = createPlanetGenerationConfig(seed, planetProfileFromSeed(seed));
    const generator = new PlanetSlotGenerator();

    const first = generator.generate({
      seed,
      surfaceMesh: mesh,
      config,
      minElevation: min,
      maxElevation: max,
    });

    const second = generator.generate({
      seed,
      surfaceMesh: mesh,
      config,
      minElevation: min,
      maxElevation: max,
    });

    expect(first.slots.length).toBeGreaterThanOrEqual(10);
    expect(first.slots.length).toBeLessThanOrEqual(20);
    expect(first.slots.map((slot) => slot.position.toArray())).toEqual(second.slots.map((slot) => slot.position.toArray()));

    let minAngularDistance = Infinity;
    for (let i = 0; i < first.slots.length; i += 1) {
      for (let j = i + 1; j < first.slots.length; j += 1) {
        const dot = THREE.MathUtils.clamp(first.slots[i].direction.dot(first.slots[j].direction), -1, 1);
        const angular = Math.acos(dot);
        minAngularDistance = Math.min(minAngularDistance, angular);
      }
    }

    expect(minAngularDistance).toBeGreaterThan(0.18);
  });

  it('avoids low lava surface margins', () => {
    const { mesh, min, max } = buildTestMesh();
    const seed = 99;
    const baseConfig = createPlanetGenerationConfig(seed, planetProfileFromSeed(seed));
    const config = {
      ...baseConfig,
      surfaceMode: 'lava' as const,
      surfaceLevel01: 0.6,
    };

    const generator = new PlanetSlotGenerator();
    const result = generator.generate({
      seed,
      surfaceMesh: mesh,
      config,
      minElevation: min,
      maxElevation: max,
    });

    expect(result.slots.length).toBeGreaterThan(0);
    for (const slot of result.slots) {
      expect(slot.elev01).toBeGreaterThanOrEqual(0.6 + 0.04);
    }
  });
});
