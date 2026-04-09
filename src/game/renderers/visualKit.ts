import * as PIXI from 'pixi.js';

export interface MapVisualKit {
  oceanNebula: PIXI.Texture;
  oceanDataFlow: PIXI.Texture;
  oceanCurrent: PIXI.Texture;
  islandSurface: PIXI.Texture;
  islandRidge: PIXI.Texture;
  islandMicro: PIXI.Texture;
  slotCore: PIXI.Texture;
}

let cachedKit: MapVisualKit | null = null;

export function getMapVisualKit(): MapVisualKit {
  if (cachedKit) {
    return cachedKit;
  }

  cachedKit = {
    oceanNebula: makeOceanNebulaTexture(),
    oceanDataFlow: makeOceanDataFlowTexture(),
    oceanCurrent: makeOceanCurrentTexture(),
    islandSurface: makeIslandSurfaceTexture(),
    islandRidge: makeIslandRidgeTexture(),
    islandMicro: makeIslandMicroTexture(),
    slotCore: makeSlotCoreTexture(),
  };

  return cachedKit;
}

function makeOceanNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  const base = ctx.createLinearGradient(0, 0, 1024, 1024);
  base.addColorStop(0, 'rgba(5,10,18,1)');
  base.addColorStop(0.45, 'rgba(11,21,37,1)');
  base.addColorStop(1, 'rgba(4,8,16,1)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 18; i += 1) {
    const x = 110 + ((i * 389) % 900);
    const y = 120 + ((i * 257) % 860);
    const grad = ctx.createRadialGradient(x, y, 18, x, y, 220 + (i % 5) * 70);
    grad.addColorStop(0, `rgba(${34 + (i % 3) * 18},${74 + (i % 4) * 20},${118 + (i % 3) * 16},0.16)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 250 + (i % 4) * 70, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 2600; i += 1) {
    const x = (i * 73) % 1024;
    const y = (i * 197) % 1024;
    const alpha = i % 21 === 0 ? 0.44 : 0.1;
    const radius = i % 31 === 0 ? 1.4 : 0.55;
    ctx.fillStyle = `rgba(155,218,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return PIXI.Texture.from(canvas);
}

function makeOceanDataFlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  ctx.strokeStyle = 'rgba(116,200,238,0.12)';
  ctx.lineWidth = 1;

  for (let y = -50; y < 820; y += 52) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(210, y + 34, 490, y - 24, 768, y + 16);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(105,184,222,0.08)';
  for (let x = -30; x < 810; x += 88) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 28, 220, x - 24, 540, x + 18, 768);
    ctx.stroke();
  }

  return PIXI.Texture.from(canvas);
}

function makeOceanCurrentTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  for (let i = 0; i < 150; i += 1) {
    const y = 8 + ((i * 41) % 500);
    const x = (i * 59) % 510;
    const length = 20 + ((i * 11) % 45);
    ctx.strokeStyle = i % 9 === 0 ? 'rgba(140,216,246,0.2)' : 'rgba(122,190,228,0.08)';
    ctx.lineWidth = i % 13 === 0 ? 1.3 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + ((i % 4) - 2) * 3);
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
  base.addColorStop(0, 'rgba(40,69,92,0.72)');
  base.addColorStop(0.55, 'rgba(28,46,67,0.58)');
  base.addColorStop(1, 'rgba(17,27,40,0.75)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 180; i += 1) {
    const x = (i * 37) % 256;
    const y = (i * 97) % 256;
    const w = 8 + ((i * 13) % 30);
    const h = 1 + ((i * 7) % 5);
    ctx.fillStyle = `rgba(108,159,191,${0.05 + (i % 11) * 0.007})`;
    ctx.fillRect(x, y, w, h);
  }

  return PIXI.Texture.from(canvas);
}

function makeIslandRidgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  ctx.strokeStyle = 'rgba(158,216,240,0.22)';
  ctx.lineWidth = 1.1;

  for (let i = 0; i < 14; i += 1) {
    const y = 14 + i * 18;
    ctx.beginPath();
    ctx.moveTo(8, y);
    ctx.bezierCurveTo(70, y - 8, 188, y + 12, 248, y - 3);
    ctx.stroke();
  }

  return PIXI.Texture.from(canvas);
}

function makeIslandMicroTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  for (let i = 0; i < 320; i += 1) {
    const x = (i * 43) % 256;
    const y = (i * 71) % 256;
    const radius = i % 17 === 0 ? 1.8 : 0.9;
    const alpha = i % 17 === 0 ? 0.18 : 0.07;
    ctx.fillStyle = `rgba(146,220,245,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return PIXI.Texture.from(canvas);
}

function makeSlotCoreTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return PIXI.Texture.WHITE;

  ctx.translate(32, 32);

  const ring = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
  ring.addColorStop(0, 'rgba(180,245,255,0.85)');
  ring.addColorStop(0.35, 'rgba(122,214,238,0.4)');
  ring.addColorStop(1, 'rgba(122,214,238,0)');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(150,235,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(185,250,255,0.95)';
  ctx.beginPath();
  ctx.arc(0, 0, 2.3, 0, Math.PI * 2);
  ctx.fill();

  return PIXI.Texture.from(canvas);
}
