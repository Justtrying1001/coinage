import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import sharp from 'sharp';
import { chromium } from 'playwright';

import { getGalaxyPlanetManifest } from '@/domain/world/build-galaxy-planet-manifest';
import { mapProfileToProceduralUniforms } from '@/rendering/planet/map-profile-to-procedural-uniforms';
import { applyPlanetRenderLod } from '@/rendering/planet/create-planet-render-instance';
import { GALAXY_LAYOUT_RUNTIME_CONFIG } from '@/domain/world/world.constants';

const WORLD_SEED = 'coinage-mvp-seed';
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const REPORT_PATH = 'analysis/reconciliation-report.json';
const VIEWPORT = { width: 1920, height: 1080 };

interface PlanetWithRender {
  id: string;
  x: number;
  y: number;
  archetype: string;
  profile: ReturnType<typeof getGalaxyPlanetManifest>[number]['profile'];
  galaxy: ReturnType<typeof applyPlanetRenderLod>;
}

function euclidean(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    s += d * d;
  }
  return Math.sqrt(s);
}

async function waitForServer(url: string, maxMs: number): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await sleep(750);
  }
  throw new Error('Server did not start in time');
}

async function imageMeanAbsDiffBuffers(bufferA: Buffer, bufferB: Buffer, size = 96): Promise<number> {
  const [a, b] = await Promise.all([
    sharp(bufferA).resize(size, size).removeAlpha().raw().toBuffer(),
    sharp(bufferB).resize(size, size).removeAlpha().raw().toBuffer(),
  ]);
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  }
  return sum / a.length / 255;
}

function featureVector(p: PlanetWithRender): number[] {
  return [
    p.galaxy.oceanLevel,
    p.galaxy.mountainLevel,
    p.galaxy.simpleStrength,
    p.galaxy.ridgedStrength,
    p.galaxy.craterStrength,
    p.galaxy.thermalActivity,
    p.galaxy.bandingStrength,
    p.galaxy.colorContrast,
    p.galaxy.roughness,
    p.galaxy.metalness,
    p.galaxy.atmosphereIntensity,
    p.galaxy.atmosphereThickness,
    ...p.galaxy.baseColor,
    ...p.galaxy.landColor,
  ];
}

function pickRepresentatives(planets: PlanetWithRender[]) {
  const byArchetype = new Map<string, PlanetWithRender[]>();
  for (const p of planets) {
    const bucket = byArchetype.get(p.archetype) ?? [];
    bucket.push(p);
    byArchetype.set(p.archetype, bucket);
  }

  const archetypeReps: PlanetWithRender[] = [];
  for (const [_, arr] of byArchetype.entries()) {
    archetypeReps.push(arr[0]!);
  }

  let sameArchetypePair: [PlanetWithRender, PlanetWithRender] | null = null;
  for (const arr of byArchetype.values()) {
    if (arr.length >= 2) {
      sameArchetypePair = [arr[0]!, arr[1]!];
      break;
    }
  }

  let diffClosest: [PlanetWithRender, PlanetWithRender, number] | null = null;
  let diffFarthest: [PlanetWithRender, PlanetWithRender, number] | null = null;
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const a = planets[i]!;
      const b = planets[j]!;
      if (a.archetype === b.archetype) continue;
      const d = euclidean(featureVector(a), featureVector(b));
      if (!diffClosest || d < diffClosest[2]) diffClosest = [a, b, d];
      if (!diffFarthest || d > diffFarthest[2]) diffFarthest = [a, b, d];
    }
  }

  return { archetypeReps, sameArchetypePair, diffClosest, diffFarthest };
}

function projectToScreen(
  worldX: number,
  worldY: number,
  camX: number,
  camY: number,
  viewWidth: number,
  viewHeight: number,
  zoom: number,
  screenW: number,
  screenH: number,
): { x: number; y: number } {
  const halfW = viewWidth / 2 / zoom;
  const halfH = viewHeight / 2 / zoom;
  const x = screenW / 2 + ((worldX - camX) / halfW) * (screenW / 2);
  const y = screenH / 2 - ((worldY - camY) / halfH) * (screenH / 2);
  return { x, y };
}

async function main() {
  const manifest = getGalaxyPlanetManifest(WORLD_SEED);
  const planets: PlanetWithRender[] = manifest.map((m) => {
    const base = mapProfileToProceduralUniforms(m.profile);
    const galaxy = applyPlanetRenderLod(base, 'galaxy');
    return {
      id: m.id,
      x: m.x,
      y: m.y,
      archetype: m.profile.archetype,
      profile: m.profile,
      galaxy,
    };
  });

  const fieldRadius = GALAXY_LAYOUT_RUNTIME_CONFIG.fieldRadius ?? 84;
  const viewHeight = Math.min(380, Math.max(140, fieldRadius * 0.58));
  const zoom = 2.55;
  const viewWidth = viewHeight * (VIEWPORT.width / VIEWPORT.height);
  const camX = manifest.reduce((s, p) => s + p.x, 0) / manifest.length;
  const camY = manifest.reduce((s, p) => s + p.y, 0) / manifest.length;
  const halfW = viewWidth / 2 / zoom;
  const halfH = viewHeight / 2 / zoom;
  const visiblePlanets = planets.filter(
    (p) => Math.abs(p.x - camX) <= halfW * 0.98 && Math.abs(p.y - camY) <= halfH * 0.98,
  );

  const reps = pickRepresentatives(visiblePlanets);
  const selected = new Map<string, PlanetWithRender>();
  for (const p of reps.archetypeReps) selected.set(p.id, p);
  if (reps.sameArchetypePair) {
    selected.set(reps.sameArchetypePair[0].id, reps.sameArchetypePair[0]);
    selected.set(reps.sameArchetypePair[1].id, reps.sameArchetypePair[1]);
  }
  if (reps.diffClosest) {
    selected.set(reps.diffClosest[0].id, reps.diffClosest[0]);
    selected.set(reps.diffClosest[1].id, reps.diffClosest[1]);
  }
  if (reps.diffFarthest) {
    selected.set(reps.diffFarthest[0].id, reps.diffFarthest[0]);
    selected.set(reps.diffFarthest[1].id, reps.diffFarthest[1]);
  }

  const dev = spawn('npm', ['run', 'dev', '--', '-H', '127.0.0.1', '-p', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer(`${BASE_URL}/galaxy`, 120000);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: VIEWPORT });

    await page.goto(`${BASE_URL}/galaxy`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const galaxyFullBuffer = await page.screenshot({ fullPage: true });
    const galaxyCropById = new Map<string, Buffer>();
    const planetCropById = new Map<string, Buffer>();

    for (const p of selected.values()) {
      const projected = projectToScreen(
        p.x,
        p.y,
        camX,
        camY,
        viewWidth,
        viewHeight,
        zoom,
        VIEWPORT.width,
        VIEWPORT.height,
      );
      const diameterPx = Math.max(32, Math.round(((2 * p.galaxy.radius * zoom) / viewHeight) * VIEWPORT.height));
      const size = Math.round(diameterPx * 1.6);
      const left = Math.max(0, Math.min(VIEWPORT.width - size, Math.round(projected.x - size / 2)));
      const top = Math.max(0, Math.min(VIEWPORT.height - size, Math.round(projected.y - size / 2)));
      const galaxyCrop = await sharp(galaxyFullBuffer)
        .extract({ left, top, width: size, height: size })
        .png()
        .toBuffer();
      galaxyCropById.set(p.id, galaxyCrop);

      await page.goto(`${BASE_URL}/planet/${p.id}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const planetFullBuffer = await page.screenshot({ fullPage: true });
      const planetCrop = await sharp(planetFullBuffer)
        .extract({ left: 520, top: 120, width: 880, height: 880 })
        .png()
        .toBuffer();
      planetCropById.set(p.id, planetCrop);
    }

    await browser.close();

    const pairMetrics: Record<string, unknown> = {};
    if (reps.sameArchetypePair) {
      const [a, b] = reps.sameArchetypePair;
      pairMetrics.sameArchetype = {
        pair: [a.id, b.id],
        archetype: a.archetype,
        featureDistance: euclidean(featureVector(a), featureVector(b)),
        galaxyImageMad96: await imageMeanAbsDiffBuffers(galaxyCropById.get(a.id)!, galaxyCropById.get(b.id)!),
        largeImageMad96: await imageMeanAbsDiffBuffers(planetCropById.get(a.id)!, planetCropById.get(b.id)!),
      };
    }
    if (reps.diffClosest) {
      const [a, b, d] = reps.diffClosest;
      pairMetrics.diffArchetypeClosest = {
        pair: [a.id, b.id],
        archetypes: [a.archetype, b.archetype],
        featureDistance: d,
        galaxyImageMad96: await imageMeanAbsDiffBuffers(galaxyCropById.get(a.id)!, galaxyCropById.get(b.id)!),
        largeImageMad96: await imageMeanAbsDiffBuffers(planetCropById.get(a.id)!, planetCropById.get(b.id)!),
      };
    }
    if (reps.diffFarthest) {
      const [a, b, d] = reps.diffFarthest;
      pairMetrics.diffArchetypeFarthest = {
        pair: [a.id, b.id],
        archetypes: [a.archetype, b.archetype],
        featureDistance: d,
        galaxyImageMad96: await imageMeanAbsDiffBuffers(galaxyCropById.get(a.id)!, galaxyCropById.get(b.id)!),
        largeImageMad96: await imageMeanAbsDiffBuffers(planetCropById.get(a.id)!, planetCropById.get(b.id)!),
      };
    }

    const perceptualPairMatrix: Array<{
      a: string;
      aArch: string;
      b: string;
      bArch: string;
      galaxyMad96: number;
      largeMad96: number;
    }> = [];

    for (let i = 0; i < reps.archetypeReps.length; i += 1) {
      for (let j = i + 1; j < reps.archetypeReps.length; j += 1) {
        const a = reps.archetypeReps[i]!;
        const b = reps.archetypeReps[j]!;
        perceptualPairMatrix.push({
          a: a.id,
          aArch: a.archetype,
          b: b.id,
          bArch: b.archetype,
          galaxyMad96: await imageMeanAbsDiffBuffers(galaxyCropById.get(a.id)!, galaxyCropById.get(b.id)!),
          largeMad96: await imageMeanAbsDiffBuffers(planetCropById.get(a.id)!, planetCropById.get(b.id)!),
        });
      }
    }

    const report = {
      worldSeed: WORLD_SEED,
      sampleCount: planets.length,
      selectedCount: selected.size,
      representatives: {
        archetypeReps: reps.archetypeReps.map((p) => ({ id: p.id, archetype: p.archetype })),
      },
      camera: {
        viewport: VIEWPORT,
        fieldRadius,
        viewHeight,
        viewWidth,
        zoom,
        cameraCenter: { x: camX, y: camY },
      },
      pairMetrics,
      perceptualPairMatrix,
      selectedPlanets: Array.from(selected.values()).map((p) => ({
        id: p.id,
        archetype: p.archetype,
        surfaceCategory: p.galaxy.surfaceCategory,
        terrainProfile: p.galaxy.terrainProfile,
        radius: p.galaxy.radius,
        oceanLevel: p.galaxy.oceanLevel,
        mountainLevel: p.galaxy.mountainLevel,
        bandingStrength: p.galaxy.bandingStrength,
        thermalActivity: p.galaxy.thermalActivity,
        craterStrength: p.galaxy.craterStrength,
        atmosphereIntensity: p.galaxy.atmosphereIntensity,
      })),
    };

    writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${REPORT_PATH}`);
  } finally {
    dev.kill('SIGTERM');
    await sleep(500);
    if (!dev.killed) dev.kill('SIGKILL');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
