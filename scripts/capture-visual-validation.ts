import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

import { getGalaxyPlanetManifest } from '../src/domain/world/build-galaxy-planet-manifest';
import type { PlanetFamily } from '../src/domain/world/planet-visual.types';
import { WORLD_SEED } from '../src/domain/world/world.constants';

const BASE_URL = process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:3100';
const OUT_DIR = path.resolve('artifacts/visual-validation/current');

const targetFamilies: PlanetFamily[] = [
  'terrestrial-lush',
  'oceanic',
  'desert-arid',
  'ice-frozen',
  'volcanic-infernal',
  'barren-rocky',
  'toxic-alien',
  'gas-giant',
  'ringed-giant',
];

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function capture() {
  await ensureDir(OUT_DIR);

  const manifest = getGalaxyPlanetManifest(WORLD_SEED);
  const selected: Record<string, string[]> = {};

  for (const family of targetFamilies) {
    const ids = manifest.filter((item) => item.planet.identity.family === family).slice(0, 3).map((item) => item.id);
    if (ids.length < 3) {
      throw new Error(`Not enough planets for family ${family}: got ${ids.length}`);
    }
    selected[family] = ids;
  }

  await fs.writeFile(path.join(OUT_DIR, 'selection.json'), JSON.stringify(selected, null, 2), 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  for (const family of targetFamilies) {
    for (const id of selected[family]!) {
      for (const mode of ['galaxy', 'planet'] as const) {
        const url = `${BASE_URL}/validation/${id}?mode=${mode}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(mode === 'galaxy' ? 1400 : 1700);
        const out = path.join(OUT_DIR, `${family}__${id}__${mode}.png`);
        await page.screenshot({ path: out, fullPage: true });
      }
    }
  }

  await browser.close();

  const sheetRows: Buffer[] = [];
  const tileW = 420;
  const tileH = 300;

  for (const family of targetFamilies) {
    const ids = selected[family]!;
    const rowImages: Buffer[] = [];

    for (const id of ids) {
      const galaxyPath = path.join(OUT_DIR, `${family}__${id}__galaxy.png`);
      const planetPath = path.join(OUT_DIR, `${family}__${id}__planet.png`);

      const [galaxyBuf, planetBuf] = await Promise.all([
        sharp(galaxyPath).resize(tileW, tileH).png().toBuffer(),
        sharp(planetPath).resize(tileW, tileH).png().toBuffer(),
      ]);

      const pair = await sharp({
        create: {
          width: tileW * 2,
          height: tileH,
          channels: 4,
          background: '#050914',
        },
      })
        .composite([
          { input: galaxyBuf, left: 0, top: 0 },
          { input: planetBuf, left: tileW, top: 0 },
        ])
        .png()
        .toBuffer();

      rowImages.push(pair);
    }

    const row = await sharp({
      create: {
        width: tileW * 2 * 3,
        height: tileH,
        channels: 4,
        background: '#020617',
      },
    })
      .composite(rowImages.map((input, i) => ({ input, left: i * tileW * 2, top: 0 })))
      .png()
      .toBuffer();

    sheetRows.push(row);
  }

  const board = await sharp({
    create: {
      width: tileW * 2 * 3,
      height: tileH * sheetRows.length,
      channels: 4,
      background: '#020617',
    },
  })
    .composite(sheetRows.map((input, i) => ({ input, left: 0, top: i * tileH })))
    .png()
    .toFile(path.join(OUT_DIR, 'validation-board.png'));

  console.log('Board generated', board);
}

capture().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
