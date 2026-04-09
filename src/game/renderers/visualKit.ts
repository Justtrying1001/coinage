import * as PIXI from 'pixi.js';

export interface MapVisualKit {
  oceanNoise: PIXI.Texture;
  oceanFlow: PIXI.Texture;
  islandSurface: PIXI.Texture;
  islandVein: PIXI.Texture;
  slotGlyph: PIXI.Texture;
}

let cachedKit: MapVisualKit | null = null;

export function getMapVisualKit(): MapVisualKit {
  if (cachedKit) {
    return cachedKit;
  }

  cachedKit = {
    oceanNoise: makeOceanNoiseTexture(),
    oceanFlow: makeOceanFlowTexture(),
    islandSurface: makeIslandSurfaceTexture(),
    islandVein: makeIslandVeinTexture(),
    slotGlyph: makeSlotGlyphTexture(),
  };

  return cachedKit;
}

function makeOceanNoiseTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 320);
  grad.addColorStop(0, 'rgba(27,59,84,0.18)');
  grad.addColorStop(1, 'rgba(5,11,18,0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1200; i += 1) {
    const x = ((i * 73) % 512) + ((i * 19) % 7);
    const y = ((i * 131) % 512) + ((i * 23) % 11);
    const r = 0.4 + ((i * 17) % 12) / 10;
    const alpha = ((i * 37) % 100) / 1200;
    ctx.fillStyle = `rgba(80,160,210,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return PIXI.Texture.from(canvas);
}

function makeOceanFlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(110,190,230,0.12)';
  ctx.lineWidth = 1;

  for (let y = 20; y < 512; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(160, y + 24, 340, y - 16, 512, y + 8);
    ctx.stroke();
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
  base.addColorStop(0, 'rgba(56,81,105,0.58)');
  base.addColorStop(1, 'rgba(16,26,38,0.35)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 36; i += 1) {
    const x = (i * 41) % 256;
    const y = (i * 67) % 256;
    const alpha = ((i * 17) % 100) / 700;
    ctx.fillStyle = `rgba(118,166,190,${alpha})`;
    ctx.fillRect(x, y, 8 + ((i * 13) % 20), 2 + ((i * 9) % 6));
  }

  return PIXI.Texture.from(canvas);
}

function makeIslandVeinTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  ctx.strokeStyle = 'rgba(132,194,226,0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const y = 20 + i * 28;
    ctx.beginPath();
    ctx.moveTo(8, y);
    ctx.bezierCurveTo(80, y - 16, 180, y + 10, 246, y - 6);
    ctx.stroke();
  }

  return PIXI.Texture.from(canvas);
}

function makeSlotGlyphTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  ctx.translate(16, 16);
  ctx.strokeStyle = 'rgba(142,230,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-5, 0);
  ctx.moveTo(8, 0);
  ctx.lineTo(5, 0);
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -5);
  ctx.moveTo(0, 8);
  ctx.lineTo(0, 5);
  ctx.stroke();

  ctx.fillStyle = 'rgba(145,233,255,0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  return PIXI.Texture.from(canvas);
}
