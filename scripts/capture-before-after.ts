import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const CURRENT_URL = process.env.CURRENT_BASE_URL ?? 'http://127.0.0.1:3100';
const BEFORE_URL = process.env.BEFORE_BASE_URL ?? 'http://127.0.0.1:3200';
const OUT_DIR = path.resolve('artifacts/visual-validation/comparison');
const selectionPath = path.resolve('artifacts/visual-validation/current/selection.json');

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const selection = JSON.parse(await fs.readFile(selectionPath, 'utf8')) as Record<string, string[]>;
  const pairs = Object.entries(selection).map(([family, ids]) => ({ family, id: ids[0] }));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  for (const pair of pairs) {
    await page.goto(`${BEFORE_URL}/planet/${pair.id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT_DIR, `${pair.family}__${pair.id}__before.png`), fullPage: true });

    await page.goto(`${CURRENT_URL}/planet/${pair.id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT_DIR, `${pair.family}__${pair.id}__after.png`), fullPage: true });
  }

  await browser.close();

  const tileW = 520;
  const tileH = 320;
  const rows: Buffer[] = [];

  for (const pair of pairs) {
    const before = await sharp(path.join(OUT_DIR, `${pair.family}__${pair.id}__before.png`)).resize(tileW, tileH).png().toBuffer();
    const after = await sharp(path.join(OUT_DIR, `${pair.family}__${pair.id}__after.png`)).resize(tileW, tileH).png().toBuffer();

    const row = await sharp({
      create: {
        width: tileW * 2,
        height: tileH,
        channels: 4,
        background: '#020617',
      },
    })
      .composite([
        { input: before, left: 0, top: 0 },
        { input: after, left: tileW, top: 0 },
      ])
      .png()
      .toBuffer();

    rows.push(row);
  }

  await sharp({
    create: {
      width: tileW * 2,
      height: tileH * rows.length,
      channels: 4,
      background: '#020617',
    },
  })
    .composite(rows.map((input, i) => ({ input, left: 0, top: i * tileH })))
    .png()
    .toFile(path.join(OUT_DIR, 'before-after-board.png'));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
