import { describe, expect, test } from 'vitest';
import * as THREE from 'three';
import { generateSettlementSlots } from '@/game/planet/runtime/SettlementSlots';
import type { PlanetGenerationConfig } from '@/game/planet/types';

function buildGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 5);
  geometry.computeVertexNormals();

  const positions = geometry.getAttribute('position');
  const elevations = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const signal = Math.sin(x * 4.1) * 0.08 + Math.sin(y * 3.7) * 0.06 + Math.cos(z * 2.8) * 0.05;
    elevations[i] = 1 + signal;
  }

  geometry.setAttribute('aElevation', new THREE.BufferAttribute(elevations, 1));
  return geometry;
}

const baseConfig: PlanetGenerationConfig = {
  seed: 123456,
  archetype: 'terrestrial',
  resolution: 128,
  radius: 1,
  filters: [],
  elevationGradient: [],
  depthGradient: [],
  blendDepth: 0.01,
  seaLevel: 1,
  surfaceLevel01: 0.55,
  surfaceMode: 'water',
  material: {
    roughness: 0.5,
    metalness: 0.1,
    vegetationDensity: 0.5,
    wetness: 0.6,
    canopyTint: [0.1, 0.2, 0.1],
    submergedFlattening: 0.8,
    slopeDarkening: 0.3,
    basinDarkening: 0.3,
    uplandLift: 0.2,
    peakLift: 0.2,
    shadowTint: [0.1, 0.1, 0.1],
    shadowTintStrength: 0.2,
    coastTintStrength: 0.2,
    shallowSurfaceBrightness: 0.1,
    microReliefStrength: 0.1,
    microReliefScale: 10,
    microNormalStrength: 0.1,
    microAlbedoBreakup: 0.1,
    hotspotCoverage: 0,
    hotspotIntensity: 0,
    fissureScale: 10,
    fissureSharpness: 2,
    lavaAccentStrength: 0,
    emissiveStrength: 0,
    basaltContrast: 0,
  },
  postfx: {
    bloom: { strength: 0.01, radius: 0.1, threshold: 0.8 },
    exposure: 1.1,
  },
};

describe('generateSettlementSlots', () => {
  test('returns deterministic 10-20 empty slots with stable ids', () => {
    const geometry = buildGeometry();
    const first = generateSettlementSlots(geometry, baseConfig);
    const second = generateSettlementSlots(geometry, baseConfig);

    expect(first.length).toBeGreaterThanOrEqual(10);
    expect(first.length).toBeLessThanOrEqual(20);
    expect(second.map((slot) => slot.id)).toEqual(first.map((slot) => slot.id));
    expect(second.map((slot) => slot.position.toArray())).toEqual(first.map((slot) => slot.position.toArray()));
    expect(first.every((slot) => slot.state === 'empty')).toBe(true);
    geometry.dispose();
  });

  test('spreads chosen slots across multiple hemisphere regions', () => {
    const geometry = buildGeometry();
    const slots = generateSettlementSlots(geometry, { ...baseConfig, seed: 987654 });
    const quadrants = new Set(slots.map((slot) => `${Math.sign(slot.latitude)}:${Math.sign(slot.longitude)}`));

    expect(slots.length).toBeGreaterThanOrEqual(10);
    expect(quadrants.size).toBeGreaterThanOrEqual(3);
    geometry.dispose();
  });
});
