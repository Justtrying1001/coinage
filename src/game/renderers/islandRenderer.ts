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

  const silhouette = buildPolygon(faction, 1);
  const mask = new PIXI.Graphics();
  mask.poly(silhouette, true);
  mask.fill({ color: 0xffffff, alpha: 1 });

  const underGlow = new PIXI.Graphics();
  underGlow.ellipse(0, 0, faction.radius * 1.55, faction.radius * 1.12);
  underGlow.fill({
    color: PIXI.Color.shared.setValue(`hsl(${204 + paletteShift}, 66%, 34%)`).toNumber(),
    alpha: 0.1,
  });

  const shadow = new PIXI.Graphics();
  shadow.poly(buildPolygon(faction, 1.02), true);
  shadow.fill({ color: 0x02060c, alpha: 0.68 });
  shadow.y = 5;

  const core = new PIXI.Graphics();
  core.poly(silhouette, true);
  core.fill({ color: PIXI.Color.shared.setValue(`hsl(${212 + paletteShift}, 32%, 15%)`).toNumber(), alpha: 0.98 });

  const span = faction.radius * 3.2;
  const surface = new PIXI.TilingSprite({ texture: kit.islandSurface, width: span, height: span });
  surface.anchor.set(0.5);
  surface.alpha = 0.54;
  surface.tint = PIXI.Color.shared.setValue(`hsl(${202 + paletteShift}, 46%, 52%)`).toNumber();
  surface.tileScale.set(1.35, 1.35);
  surface.tilePosition.set((faction.shapeSeed % 97) * 2.2, (faction.shapeSeed % 61) * 2.8);

  const ridge = new PIXI.TilingSprite({ texture: kit.islandRidge, width: span, height: span });
  ridge.anchor.set(0.5);
  ridge.alpha = 0.27;
  ridge.tint = 0xb5e7fb;
  ridge.tileScale.set(1.25, 1.25);
  ridge.tilePosition.set((faction.shapeSeed % 149) * 1.1, (faction.shapeSeed % 47) * 2.1);

  const micro = new PIXI.TilingSprite({ texture: kit.islandMicro, width: span, height: span });
  micro.anchor.set(0.5);
  micro.alpha = 0.2;
  micro.tint = 0x9fd9f1;
  micro.tileScale.set(1.2, 1.2);
  micro.tilePosition.set((faction.shapeSeed % 79) * 1.8, (faction.shapeSeed % 193) * 1.6);

  surface.mask = mask;
  ridge.mask = mask;
  micro.mask = mask;

  const interiorBand = new PIXI.Graphics();
  interiorBand.poly(buildPolygon(faction, 0.82), true);
  interiorBand.fill({ color: PIXI.Color.shared.setValue(`hsl(${213 + paletteShift}, 26%, 11%)`).toNumber(), alpha: 0.6 });

  const contourA = new PIXI.Graphics();
  contourA.poly(buildPolygon(faction, 0.9), true);
  contourA.stroke({ color: PIXI.Color.shared.setValue(`hsl(${206 + paletteShift}, 44%, 34%)`).toNumber(), width: 1.1, alpha: 0.45 });

  const contourB = new PIXI.Graphics();
  contourB.poly(buildPolygon(faction, 0.7), true);
  contourB.stroke({ color: PIXI.Color.shared.setValue(`hsl(${208 + paletteShift}, 36%, 31%)`).toNumber(), width: 0.9, alpha: 0.3 });

  const rim = new PIXI.Graphics();
  rim.poly(buildPolygon(faction, 1.01), true);
  rim.stroke({ color: PIXI.Color.shared.setValue(`hsl(${197 + paletteShift}, 62%, 46%)`).toNumber(), width: 1.8, alpha: 0.68 });

  container.addChild(underGlow, shadow, core, surface, ridge, micro, interiorBand, contourA, contourB, rim, mask);

  const slotNodes: PIXI.Sprite[] = [];
  for (const slot of faction.slots) {
    const pad = new PIXI.Graphics();
    pad.circle(slot.x, slot.y, 5.8);
    pad.fill({ color: 0x03090f, alpha: 0.62 });
    pad.stroke({ color: 0x2d5468, width: 0.9, alpha: 0.7 });

    const anchor = new PIXI.Graphics();
    anchor.roundRect(slot.x - 4.4, slot.y - 1, 8.8, 2, 1);
    anchor.fill({ color: 0x84d8f4, alpha: slot.occupied ? 0.8 : 0.45 });

    const node = new PIXI.Sprite(kit.slotCore);
    node.anchor.set(0.5);
    node.position.set(slot.x, slot.y);
    node.scale.set(slot.occupied ? 0.37 : 0.32);
    node.alpha = slot.occupied ? 0.95 : 0.72;

    slotNodes.push(node);
    container.addChild(pad, anchor, node);
  }

  return { container, core, rim, underGlow, slotNodes };
}

function buildPolygon(faction: Faction, scale: number): number[] {
  const points: number[] = [];
  for (const vertex of faction.silhouette) {
    const r = faction.radius * vertex.radiusFactor * scale;
    points.push(Math.cos(vertex.angle) * r, Math.sin(vertex.angle) * r);
  }

  return points;
}
