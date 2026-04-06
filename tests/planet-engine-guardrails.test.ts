import test from 'node:test';
import assert from 'node:assert/strict';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { generatePlanetVisualProfile } from '@/domain/world/generate-planet-visual-profile';
import { resolvePlanetIdentity } from '@/domain/world/resolve-planet-identity';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';
import {
  generateCubeSphereTerrainBuffers,
  resolveTerrainHydrology,
} from '@/rendering/planet/terrain/cube-sphere';

function toNormalizedElevations(buffers: ReturnType<typeof generateCubeSphereTerrainBuffers>, baseRadius: number): number[] {
  const elevations: number[] = [];
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < buffers.positions.length; i += 3) {
    const x = buffers.positions[i]!;
    const y = buffers.positions[i + 1]!;
    const z = buffers.positions[i + 2]!;
    const radius = Math.hypot(x, y, z);
    const elevation = radius / Math.max(0.0001, baseRadius) - 1;
    elevations.push(elevation);
    min = Math.min(min, elevation);
    max = Math.max(max, elevation);
  }

  const span = Math.max(0.0001, max - min);
  return elevations.map((value) => (value - min) / span);
}

test('terrain generation enforces gameplay and visual land floor on final geometry', () => {
  for (let i = 0; i < 72; i += 1) {
    const profile = generatePlanetVisualProfile({
      worldSeed: 'coinage-mvp-seed',
      planetSeed: `terrain-guardrail-${i}`,
    });
    const uniforms = mapProfileToProceduralUniforms(profile);
    const buffers = generateCubeSphereTerrainBuffers(uniforms);
    const normalizedElevations = toNormalizedElevations(buffers, uniforms.radius);
    const hydrology = resolveTerrainHydrology(normalizedElevations, uniforms);

    assert.ok(
      hydrology.strictLandRatio >= 0.46,
      `strict land ratio dropped below gameplay floor: ${hydrology.strictLandRatio} (${profile.id})`,
    );
  }
});

test('terrain generation exports extended geographic fields with deterministic sizing and bounded ranges', () => {
  const profile = generatePlanetVisualProfile({
    worldSeed: 'coinage-mvp-seed',
    planetSeed: 'terrain-geo-fields',
  });
  const uniforms = mapProfileToProceduralUniforms(profile);
  const buffers = generateCubeSphereTerrainBuffers(uniforms);

  assert.equal(buffers.terrainAux.length, buffers.terrain.length, 'terrainAux should keep 1:1 vertex packing (vec4)');
  assert.equal(buffers.terrainGeo.length, buffers.terrain.length, 'terrainGeo should keep 1:1 vertex packing (vec4)');
  assert.equal(buffers.terrainRegion.length, buffers.terrain.length, 'terrainRegion should keep 1:1 vertex packing (vec4)');

  for (let i = 0; i < buffers.terrainAux.length; i += 4) {
    const signedCoastDistance = buffers.terrainAux[i]!;
    const inlandness = buffers.terrainAux[i + 1]!;
    const oceanDepth = buffers.terrainAux[i + 2]!;
    const shelfSignal = buffers.terrainAux[i + 3]!;
    const ridgeStrength = buffers.terrainGeo[i]!;
    const basinLikelihood = buffers.terrainGeo[i + 1]!;
    const curvatureApprox = buffers.terrainGeo[i + 2]!;
    const constructibility = buffers.terrainGeo[i + 3]!;
    const macroRegion = buffers.terrainRegion[i]!;
    const plateauMask = buffers.terrainRegion[i + 1]!;
    const wetnessProxy = buffers.terrainRegion[i + 2]!;
    const erosionProxy = buffers.terrainRegion[i + 3]!;

    assert.ok(signedCoastDistance >= -1 && signedCoastDistance <= 1, `signed coast distance out of range at vertex ${i / 4}`);
    assert.ok(inlandness >= 0 && inlandness <= 1, `inlandness out of range at vertex ${i / 4}`);
    assert.ok(oceanDepth >= 0 && oceanDepth <= 1, `ocean depth out of range at vertex ${i / 4}`);
    assert.ok(shelfSignal >= 0 && shelfSignal <= 1, `shelf signal out of range at vertex ${i / 4}`);
    assert.ok(ridgeStrength >= 0 && ridgeStrength <= 1, `ridge strength out of range at vertex ${i / 4}`);
    assert.ok(basinLikelihood >= 0 && basinLikelihood <= 1, `basin likelihood out of range at vertex ${i / 4}`);
    assert.ok(curvatureApprox >= 0 && curvatureApprox <= 1, `curvature out of range at vertex ${i / 4}`);
    assert.ok(constructibility >= 0 && constructibility <= 1, `constructibility out of range at vertex ${i / 4}`);
    assert.ok(macroRegion >= 0 && macroRegion <= 1, `macro region out of range at vertex ${i / 4}`);
    assert.ok(plateauMask >= 0 && plateauMask <= 1, `plateau mask out of range at vertex ${i / 4}`);
    assert.ok(wetnessProxy >= 0 && wetnessProxy <= 1, `wetness proxy out of range at vertex ${i / 4}`);
    assert.ok(erosionProxy >= 0 && erosionProxy <= 1, `erosion proxy out of range at vertex ${i / 4}`);
  }
});

test('galaxy manifest and renderer mapping keep radius fidelity and avoid tiny planets', () => {
  const manifest = getGalaxyPlanetManifest('coinage-mvp-seed');

  assert.ok(manifest.length > 0, 'manifest should not be empty');

  for (const planet of manifest) {
    const uniforms = mapProfileToProceduralUniforms(planet.profile);
    assert.ok(uniforms.radius >= 2.16, `render radius too small for ${planet.id}: ${uniforms.radius}`);
    assert.ok(uniforms.radius <= 5.6, `render radius too large for ${planet.id}: ${uniforms.radius}`);
    assert.ok(
      Math.abs(planet.radius - planet.profile.shape.radius * 0.97) < 1e-6,
      `manifest radius drift for ${planet.id}`,
    );
  }
});

test('planet view resolution uses the exact manifest profile (no downstream reinterpretation)', () => {
  const manifest = getGalaxyPlanetManifest('coinage-mvp-seed');
  const sample = manifest[42] ?? manifest[0];
  assert.ok(sample, 'manifest sample should exist');

  const resolved = resolvePlanetIdentity('coinage-mvp-seed', sample.id);
  assert.ok(resolved, `expected resolved planet for ${sample.id}`);
  assert.deepEqual(resolved?.profile, sample.profile);
});
