import * as PIXI from 'pixi.js';
import type { Faction } from '@/game/core/types';

interface FactionRenderNode {
  container: PIXI.Container;
  core: PIXI.Graphics;
  rim: PIXI.Graphics;
  underGlow: PIXI.Graphics;
}

export function buildFactionGraphic(faction: Faction, paletteShift: number): FactionRenderNode {
  const container = new PIXI.Container();
  container.position.set(faction.position.x, faction.position.y);

  const underGlow = new PIXI.Graphics();
  underGlow.ellipse(0, 0, faction.radius * 1.2, faction.radius * 0.86);
  underGlow.fill({
    color: PIXI.Color.shared.setValue(`hsl(${198 + paletteShift}, 72%, 35%)`).toNumber(),
    alpha: 0.08,
  });

  const core = new PIXI.Graphics();
  core.poly(buildPolygon(faction, 1), true);
  core.fill({ color: PIXI.Color.shared.setValue(`hsl(${212 + paletteShift}, 22%, 21%)`).toNumber(), alpha: 0.96 });

  const rim = new PIXI.Graphics();
  rim.poly(buildPolygon(faction, 1.02), true);
  rim.stroke({ color: PIXI.Color.shared.setValue(`hsl(${198 + paletteShift}, 52%, 40%)`).toNumber(), width: 2.3, alpha: 0.72 });

  const contour = new PIXI.Graphics();
  contour.poly(buildPolygon(faction, 0.85), true);
  contour.stroke({ color: PIXI.Color.shared.setValue(`hsl(${205 + paletteShift}, 32%, 30%)`).toNumber(), width: 1.3, alpha: 0.5 });

  const accent = new PIXI.Graphics();
  accent.poly(buildPolygon(faction, 0.68), true);
  accent.fill({ color: PIXI.Color.shared.setValue(`hsl(${214 + paletteShift}, 26%, 17%)`).toNumber(), alpha: 0.55 });

  container.addChild(underGlow, core, accent, contour, rim);

  for (const slot of faction.slots) {
    const marker = new PIXI.Container();

    const bed = new PIXI.Graphics();
    bed.circle(0, 0, 4.8);
    bed.fill({ color: 0x0d1c27, alpha: 0.8 });

    const ring = new PIXI.Graphics();
    ring.circle(0, 0, 4.6);
    ring.stroke({ color: 0x4db4dc, width: 1.25, alpha: slot.occupied ? 0.85 : 0.55 });

    const coreDot = new PIXI.Graphics();
    coreDot.circle(0, 0, 1.3);
    coreDot.fill({ color: slot.occupied ? 0x93f1ff : 0x78caea, alpha: 0.9 });

    const ticks = new PIXI.Graphics();
    ticks.moveTo(-2.8, 0);
    ticks.lineTo(-1.7, 0);
    ticks.moveTo(2.8, 0);
    ticks.lineTo(1.7, 0);
    ticks.moveTo(0, -2.8);
    ticks.lineTo(0, -1.7);
    ticks.moveTo(0, 2.8);
    ticks.lineTo(0, 1.7);
    ticks.stroke({ color: 0x8fe8ff, width: 0.75, alpha: 0.46 });

    marker.position.set(slot.x, slot.y);
    marker.addChild(bed, ring, ticks, coreDot);

    container.addChild(marker);
  }

  return { container, core, rim, underGlow };
}

function buildPolygon(faction: Faction, scale: number): number[] {
  const points: number[] = [];
  for (const vertex of faction.silhouette) {
    const r = faction.radius * vertex.radiusFactor * scale;
    points.push(Math.cos(vertex.angle) * r, Math.sin(vertex.angle) * r);
  }

  return points;
}
