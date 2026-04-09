import * as PIXI from 'pixi.js';
import type { Faction } from '@/game/core/types';
import type { MapVisualKit } from '@/game/renderers/visualKit';

interface FactionRenderNode {
  container: PIXI.Container;
  core: PIXI.Graphics;
  rim: PIXI.Graphics;
  underGlow: PIXI.Graphics;
}

export function buildFactionGraphic(faction: Faction, paletteShift: number, kit: MapVisualKit): FactionRenderNode {
  const container = new PIXI.Container();
  container.position.set(faction.position.x, faction.position.y);

  const underGlow = new PIXI.Graphics();
  underGlow.ellipse(0, 0, faction.radius * 1.26, faction.radius * 0.9);
  underGlow.fill({
    color: PIXI.Color.shared.setValue(`hsl(${198 + paletteShift}, 72%, 35%)`).toNumber(),
    alpha: 0.08,
  });

  const core = new PIXI.Graphics();
  core.poly(buildPolygon(faction, 1), true);
  core.fill({ color: PIXI.Color.shared.setValue(`hsl(${212 + paletteShift}, 22%, 21%)`).toNumber(), alpha: 0.97 });

  const mask = new PIXI.Graphics();
  mask.poly(buildPolygon(faction, 0.98), true);
  mask.fill({ color: 0xffffff, alpha: 1 });

  const span = faction.radius * 2.8;
  const surface = new PIXI.TilingSprite({ texture: kit.islandSurface, width: span, height: span });
  surface.anchor.set(0.5);
  surface.alpha = 0.34;
  surface.tint = PIXI.Color.shared.setValue(`hsl(${202 + paletteShift}, 38%, 54%)`).toNumber();
  surface.tilePosition.set((faction.shapeSeed % 97) * 1.7, (faction.shapeSeed % 61) * 2.1);

  const veins = new PIXI.TilingSprite({ texture: kit.islandVein, width: span, height: span });
  veins.anchor.set(0.5);
  veins.alpha = 0.2;
  veins.tint = 0x9fdff7;
  veins.tilePosition.set((faction.shapeSeed % 149) * 1.2, (faction.shapeSeed % 47) * 1.4);

  surface.mask = mask;
  veins.mask = mask;

  const rim = new PIXI.Graphics();
  rim.poly(buildPolygon(faction, 1.01), true);
  rim.stroke({ color: PIXI.Color.shared.setValue(`hsl(${198 + paletteShift}, 52%, 42%)`).toNumber(), width: 2.4, alpha: 0.72 });

  const contour = new PIXI.Graphics();
  contour.poly(buildPolygon(faction, 0.84), true);
  contour.stroke({ color: PIXI.Color.shared.setValue(`hsl(${205 + paletteShift}, 32%, 30%)`).toNumber(), width: 1.2, alpha: 0.48 });

  const accent = new PIXI.Graphics();
  accent.poly(buildPolygon(faction, 0.66), true);
  accent.fill({ color: PIXI.Color.shared.setValue(`hsl(${214 + paletteShift}, 26%, 17%)`).toNumber(), alpha: 0.53 });

  container.addChild(underGlow, core, surface, veins, accent, contour, rim, mask);

  for (const slot of faction.slots) {
    const marker = new PIXI.Container();

    const bed = new PIXI.Graphics();
    bed.circle(0, 0, 5.2);
    bed.fill({ color: 0x09131d, alpha: 0.78 });
    bed.stroke({ color: 0x294557, width: 1, alpha: 0.62 });

    const glyph = new PIXI.Sprite(kit.slotGlyph);
    glyph.anchor.set(0.5);
    glyph.scale.set(0.6);
    glyph.alpha = slot.occupied ? 0.98 : 0.8;

    const halo = new PIXI.Graphics();
    halo.circle(0, 0, 8.2);
    halo.stroke({ color: 0x7fe2ff, width: 1, alpha: slot.occupied ? 0.45 : 0.24 });

    marker.position.set(slot.x, slot.y);
    marker.addChild(halo, bed, glyph);

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
