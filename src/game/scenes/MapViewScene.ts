import * as PIXI from 'pixi.js';
import type { Faction, WorldData } from '@/game/core/types';
import { buildFactionGraphic } from '@/game/renderers/islandRenderer';
import { getMapVisualKit, type MapVisualKit } from '@/game/renderers/visualKit';
import type { GameScene } from '@/game/scenes/GameScene';

interface FactionLayer {
  container: PIXI.Container;
  core: PIXI.Graphics;
  rim: PIXI.Graphics;
  underGlow: PIXI.Graphics;
  faction: Faction;
  slotNodes: PIXI.Sprite[];
}

export class MapViewScene implements GameScene {
  readonly root = new PIXI.Container();

  private selectedFactionId: string | null = null;

  private elapsed = 0;

  private readonly kit: MapVisualKit;

  private factionLayers = new Map<string, FactionLayer>();

  private oceanNebulaLayer: PIXI.TilingSprite | null = null;

  private oceanDataFlowLayer: PIXI.TilingSprite | null = null;

  private oceanCurrentLayer: PIXI.TilingSprite | null = null;

  private hudFrame = new PIXI.Container();

  constructor(private readonly world: WorldData) {
    this.kit = getMapVisualKit();
    this.drawOcean();
    this.drawStrategicLinks();
    this.mountFactions();
    this.root.addChild(this.hudFrame);
  }

  update(deltaMs: number) {
    this.elapsed += deltaMs;

    if (this.oceanNebulaLayer) {
      this.oceanNebulaLayer.tilePosition.x += deltaMs * 0.003;
      this.oceanNebulaLayer.tilePosition.y += deltaMs * 0.0018;
    }
    if (this.oceanDataFlowLayer) {
      this.oceanDataFlowLayer.tilePosition.x -= deltaMs * 0.013;
      this.oceanDataFlowLayer.tilePosition.y += deltaMs * 0.004;
    }
    if (this.oceanCurrentLayer) {
      this.oceanCurrentLayer.tilePosition.x += deltaMs * 0.023;
      this.oceanCurrentLayer.tilePosition.y -= deltaMs * 0.006;
    }

    for (const layer of this.factionLayers.values()) {
      const pulseBase = 0.6 + Math.sin(this.elapsed * 0.003 + layer.faction.shapeSeed * 0.0001) * 0.08;
      for (const slotNode of layer.slotNodes) {
        slotNode.alpha = slotNode.alpha * 0.65 + pulseBase * 0.35;
      }
    }

    if (!this.selectedFactionId) return;
    const selected = this.factionLayers.get(this.selectedFactionId);
    if (!selected) return;

    const pulse = 0.74 + Math.sin(this.elapsed * 0.0048) * 0.14;
    selected.rim.alpha = pulse;
    selected.underGlow.alpha = 0.13 + Math.sin(this.elapsed * 0.0035) * 0.06;
  }

  onResize(width: number, height: number) {
    this.drawHudFrame(width, height);
  }

  destroy() {
    this.root.destroy({ children: true });
    this.factionLayers.clear();
  }

  private drawOcean() {
    const base = new PIXI.Graphics();
    base.rect(0, 0, this.world.width, this.world.height);
    base.fill({ color: 0x040914, alpha: 1 });
    this.root.addChild(base);

    this.oceanNebulaLayer = new PIXI.TilingSprite({ texture: this.kit.oceanNebula, width: this.world.width, height: this.world.height });
    this.oceanNebulaLayer.alpha = 0.8;
    this.oceanNebulaLayer.tileScale.set(1.2, 1.2);
    this.root.addChild(this.oceanNebulaLayer);

    const darken = new PIXI.Graphics();
    darken.rect(0, 0, this.world.width, this.world.height);
    darken.fill({ color: 0x02050b, alpha: 0.2 });
    this.root.addChild(darken);

    this.oceanDataFlowLayer = new PIXI.TilingSprite({ texture: this.kit.oceanDataFlow, width: this.world.width, height: this.world.height });
    this.oceanDataFlowLayer.alpha = 0.32;
    this.oceanDataFlowLayer.tileScale.set(1.4, 1.2);
    this.root.addChild(this.oceanDataFlowLayer);

    this.oceanCurrentLayer = new PIXI.TilingSprite({ texture: this.kit.oceanCurrent, width: this.world.width, height: this.world.height });
    this.oceanCurrentLayer.alpha = 0.24;
    this.oceanCurrentLayer.tileScale.set(1.8, 1.8);
    this.root.addChild(this.oceanCurrentLayer);

    const atmosphere = new PIXI.Graphics();
    for (let i = 0; i < 18; i += 1) {
      const x = ((i * 1889 + this.world.seed * 17) % this.world.width) - 380;
      const y = ((i * 1177 + this.world.seed * 23) % this.world.height) - 290;
      atmosphere.ellipse(x, y, 1400 + (i % 5) * 380, 950 + (i % 6) * 210);
    }
    atmosphere.fill({ color: 0x143151, alpha: 0.09 });
    this.root.addChild(atmosphere);

    const stars = new PIXI.Graphics();
    for (let i = 0; i < 520; i += 1) {
      const x = (i * 887 + this.world.seed * 29) % this.world.width;
      const y = (i * 521 + this.world.seed * 31) % this.world.height;
      const radius = i % 27 === 0 ? 1.5 : 0.72;
      stars.circle(x, y, radius);
      stars.fill({ color: 0x7fd1ef, alpha: i % 27 === 0 ? 0.17 : 0.06 });
    }
    this.root.addChild(stars);
  }

  private drawStrategicLinks() {
    const links = new PIXI.Graphics();
    const batches = 220;
    for (let i = 0; i < batches; i += 1) {
      const a = this.world.factions[(i * 17 + this.world.seed) % this.world.factions.length];
      const b = this.world.factions[(i * 43 + this.world.seed * 3) % this.world.factions.length];

      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const sq = dx * dx + dy * dy;
      if (sq < 300 * 300 || sq > 1400 * 1400) continue;

      const midX = (a.position.x + b.position.x) * 0.5;
      const midY = (a.position.y + b.position.y) * 0.5;
      const bendX = midX + ((i % 3) - 1) * 22;
      const bendY = midY + ((i % 5) - 2) * 16;
      links.moveTo(a.position.x, a.position.y);
      links.quadraticCurveTo(bendX, bendY, b.position.x, b.position.y);
    }
    links.stroke({ color: 0x79bddc, width: 1, alpha: 0.08 });
    this.root.addChild(links);
  }

  private mountFactions() {
    for (const faction of this.world.factions) {
      const shadeOffset = parseInt(faction.id.replace('f-', ''), 10) % 18;
      const { container, core, rim, underGlow, slotNodes } = buildFactionGraphic(faction, shadeOffset, this.kit);
      container.eventMode = 'static';
      container.cursor = 'pointer';

      container.on('pointerover', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1.03);
          rim.alpha = 0.84;
          underGlow.alpha = 0.14;
        }
      });

      container.on('pointerout', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1);
          rim.alpha = 0.68;
          underGlow.alpha = 0.1;
        }
      });

      container.on('pointertap', () => {
        this.selectFaction(faction.id);
      });

      this.root.addChild(container);
      this.factionLayers.set(faction.id, { container, core, rim, underGlow, faction, slotNodes });
    }
  }

  private selectFaction(factionId: string) {
    this.selectedFactionId = factionId;

    for (const [id, layer] of this.factionLayers.entries()) {
      const isSelected = id === factionId;
      layer.container.scale.set(isSelected ? 1.05 : 1);
      layer.core.tint = isSelected ? 0xc7f4ff : 0xffffff;
      layer.rim.tint = isSelected ? 0xbaf1ff : 0xffffff;
      layer.rim.alpha = isSelected ? 0.86 : 0.68;
      layer.underGlow.alpha = isSelected ? 0.18 : 0.1;
      for (const slotNode of layer.slotNodes) {
        slotNode.scale.set(isSelected ? 0.42 : 0.34);
      }
    }
  }

  private drawHudFrame(width: number, height: number) {
    this.hudFrame.removeChildren();

    const frame = new PIXI.Graphics();
    frame.roundRect(12, 12, Math.max(120, width - 24), Math.max(120, height - 24), 14);
    frame.stroke({ color: 0x74bfdc, width: 1, alpha: 0.22 });

    const corners = new PIXI.Graphics();
    const cornerLen = 30;
    const inset = 20;
    const r = 2;
    corners.roundRect(inset, inset, cornerLen, r, 1);
    corners.roundRect(inset, inset, r, cornerLen, 1);
    corners.roundRect(width - inset - cornerLen, inset, cornerLen, r, 1);
    corners.roundRect(width - inset - r, inset, r, cornerLen, 1);
    corners.roundRect(inset, height - inset - r, cornerLen, r, 1);
    corners.roundRect(inset, height - inset - cornerLen, r, cornerLen, 1);
    corners.roundRect(width - inset - cornerLen, height - inset - r, cornerLen, r, 1);
    corners.roundRect(width - inset - r, height - inset - cornerLen, r, cornerLen, 1);
    corners.fill({ color: 0x8de0fb, alpha: 0.3 });

    const readout = new PIXI.Graphics();
    readout.roundRect(width - 240, 26, 200, 34, 8);
    readout.fill({ color: 0x04121d, alpha: 0.42 });
    readout.stroke({ color: 0x7bc8e5, width: 1, alpha: 0.25 });

    this.hudFrame.addChild(frame, corners, readout);
  }
}
