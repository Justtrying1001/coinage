import * as PIXI from 'pixi.js';

export interface MapVisualKit {
  oceanField: PIXI.Texture;
  islandSurface: PIXI.Texture;
  slotCore: PIXI.Texture;
}

let cachedKit: MapVisualKit | null = null;

export function getMapVisualKit(): MapVisualKit {
  if (cachedKit) {
    return cachedKit;
  }

  cachedKit = {
    oceanField: makeOceanFieldTexture(),
    islandSurface: makeIslandSurfaceTexture(),
    slotCore: makeSlotCoreTexture(),
  };

  return cachedKit;
}

function makeOceanFieldTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  const base = ctx.createLinearGradient(0, 0, 1024, 1024);
  base.addColorStop(0, 'rgba(5,9,16,1)');
  base.addColorStop(0.5, 'rgba(10,21,35,1)');
  base.addColorStop(1, 'rgba(4,8,14,1)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 12; i += 1) {
    const x = 80 + ((i * 347) % 920);
    const y = 90 + ((i * 239) % 900);
    const grad = ctx.createRadialGradient(x, y, 10, x, y, 220 + (i % 3) * 80);
    grad.addColorStop(0, 'rgba(58,104,148,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 260, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 1200; i += 1) {
    const x = (i * 67) % 1024;
    const y = (i * 157) % 1024;
    const alpha = i % 27 === 0 ? 0.32 : 0.08;
    ctx.fillStyle = `rgba(144,213,240,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  return PIXI.Texture.from(canvas);
}

function makeIslandSurfaceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  const base = ctx.createLinearGradient(0, 0, 256, 256);
  base.addColorStop(0, 'rgba(46,77,100,0.72)');
  base.addColorStop(1, 'rgba(17,29,42,0.72)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 140; i += 1) {
    const x = (i * 37) % 256;
    const y = (i * 79) % 256;
    ctx.fillStyle = `rgba(124,178,206,${0.05 + (i % 9) * 0.01})`;
    ctx.fillRect(x, y, 10 + (i % 4) * 6, 1 + (i % 3));
  }

  return PIXI.Texture.from(canvas);
}

function makeSlotCoreTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  ctx.translate(24, 24);
  const ring = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
  ring.addColorStop(0, 'rgba(180,248,255,0.9)');
  ring.addColorStop(0.55, 'rgba(120,215,235,0.35)');
  ring.addColorStop(1, 'rgba(120,215,235,0)');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(187,251,255,0.95)';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  return PIXI.Texture.from(canvas);
}
