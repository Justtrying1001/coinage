import * as PIXI from 'pixi.js';
import type { Faction } from '@/game/core/types';
import type { MapVisualKit } from '@/game/renderers/visualKit';

interface FactionRenderNode {
  container: PIXI.Container;
  core: PIXI.Graphics;
  rim: PIXI.Graphics;
  underGlow: PIXI.Graphics;
  slotNodes: PIXI.Sprite[];
}

export function buildFactionGraphic(faction: Faction, paletteShift: number, kit: MapVisualKit): FactionRenderNode {
  const container = new PIXI.Container();
  container.position.set(faction.position.x, faction.position.y);

  const underGlow = new PIXI.Graphics();
  underGlow.ellipse(0, 0, faction.radius * 1.35, faction.radius * 0.98);
  underGlow.fill({ color: 0x13324a, alpha: 0.1 });

  const silhouette = buildPolygon(faction, 1);
  const mask = new PIXI.Graphics();
  mask.poly(silhouette, true);
  mask.fill({ color: 0xffffff, alpha: 1 });

  const core = new PIXI.Graphics();
  core.poly(silhouette, true);
  core.fill({ color: familyBaseColor(faction.shapeFamily, paletteShift), alpha: 0.97 });

  const surfaceSpan = faction.radius * 3;
  const surface = new PIXI.TilingSprite({ texture: kit.islandSurface, width: surfaceSpan, height: surfaceSpan });
  surface.anchor.set(0.5);
  surface.alpha = 0.42;
  surface.tint = familySurfaceTint(faction.shapeFamily);
  surface.tilePosition.set((faction.shapeSeed % 71) * 2.1, (faction.shapeSeed % 133) * 1.7);
  surface.mask = mask;

  const interior = new PIXI.Graphics();
  interior.poly(buildPolygon(faction, 0.84), true);
  interior.stroke({ color: 0x2a5268, width: 1.1, alpha: 0.4 });

  const rim = new PIXI.Graphics();
  rim.poly(buildPolygon(faction, 1.01), true);
  rim.stroke({ color: 0x74bddc, width: 1.5, alpha: 0.62 });

  container.addChild(underGlow, core, surface, interior, rim, mask);

  const slotNodes: PIXI.Sprite[] = [];
  for (const slot of faction.slots) {
    const bed = new PIXI.Graphics();
    bed.circle(slot.x, slot.y, 4.8);
    bed.fill({ color: 0x06111b, alpha: 0.7 });
    bed.stroke({ color: 0x365d71, width: 0.8, alpha: 0.58 });

    const node = new PIXI.Sprite(kit.slotCore);
    node.anchor.set(0.5);
    node.position.set(slot.x, slot.y);
    node.scale.set(slot.occupied ? 0.42 : 0.36);
    node.alpha = slot.occupied ? 0.9 : 0.66;

    slotNodes.push(node);
    container.addChild(bed, node);
  }

  return { container, core, rim, underGlow, slotNodes };
}

function familyBaseColor(family: Faction['shapeFamily'], paletteShift: number) {
  const hue = 205 + paletteShift;
  if (family === 'crescent' || family === 'broken-coast') {
    return PIXI.Color.shared.setValue(`hsl(${hue}, 30%, 14%)`).toNumber();
  }
  if (family === 'twin-lobed') {
    return PIXI.Color.shared.setValue(`hsl(${hue}, 34%, 17%)`).toNumber();
  }
  return PIXI.Color.shared.setValue(`hsl(${hue}, 28%, 16%)`).toNumber();
}

function familySurfaceTint(family: Faction['shapeFamily']) {
  switch (family) {
    case 'compact':
      return 0x91d0ea;
    case 'stretched':
      return 0x8ac8de;
    case 'twin-lobed':
      return 0x9ad7ef;
    case 'broken-coast':
      return 0x87bfd8;
    case 'crescent':
      return 0x8bc5df;
    case 'plateau':
      return 0x95d4eb;
    default:
      return 0x8ccde5;
  }
}

function buildPolygon(faction: Faction, scale: number): number[] {
  const points: number[] = [];
  for (const vertex of faction.silhouette) {
    const r = faction.radius * vertex.radiusFactor * scale;
    points.push(Math.cos(vertex.angle) * r, Math.sin(vertex.angle) * r);
  }

  return points;
}
