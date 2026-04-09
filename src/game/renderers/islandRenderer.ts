import * as PIXI from 'pixi.js';
import type { Faction } from '@/game/core/types';

export function buildFactionGraphic(faction: Faction, paletteShift: number) {
  const container = new PIXI.Container();
  container.position.set(faction.position.x, faction.position.y);

  const island = new PIXI.Graphics();
  const baseColor = PIXI.Color.shared.setValue(`hsl(${200 + paletteShift}, 24%, 19%)`).toNumber();
  const rimColor = PIXI.Color.shared.setValue(`hsl(${195 + paletteShift}, 46%, 34%)`).toNumber();

  island.poly(buildPolygon(faction), true);
  island.fill({ color: baseColor, alpha: 0.97 });
  island.stroke({ color: rimColor, width: 3, alpha: 0.85 });

  const ambient = new PIXI.Graphics();
  ambient.circle(0, 0, faction.radius * 1.12);
  ambient.fill({
    color: PIXI.Color.shared.setValue('hsl(191, 78%, 40%)').toNumber(),
    alpha: 0.05,
  });

  container.addChild(ambient, island);

  for (const slot of faction.slots) {
    const slotDot = new PIXI.Graphics();
    slotDot.circle(slot.x, slot.y, 4.8);
    slotDot.fill({ color: 0x7ad5ff, alpha: slot.occupied ? 0.92 : 0.66 });
    slotDot.stroke({ color: 0x153649, width: 1.5, alpha: 0.95 });
    container.addChild(slotDot);
  }

  return { container, island };
}

function buildPolygon(faction: Faction): number[] {
  const points: number[] = [];
  for (const vertex of faction.silhouette) {
    const r = faction.radius * vertex.radiusFactor;
    points.push(Math.cos(vertex.angle) * r, Math.sin(vertex.angle) * r);
  }

  return points;
}
