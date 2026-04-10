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

  private oceanLayer: PIXI.TilingSprite | null = null;

  constructor(private readonly world: WorldData) {
    this.kit = getMapVisualKit();
    this.drawOcean();
    this.drawStrategicLinks();
    this.mountFactions();
  }

  update(deltaMs: number) {
    this.elapsed += deltaMs;

    if (this.oceanLayer) {
      this.oceanLayer.tilePosition.x += deltaMs * 0.0025;
      this.oceanLayer.tilePosition.y += deltaMs * 0.0012;
    }

    if (!this.selectedFactionId) return;
    const selected = this.factionLayers.get(this.selectedFactionId);
    if (!selected) return;

    const pulse = 0.72 + Math.sin(this.elapsed * 0.0046) * 0.1;
    selected.rim.alpha = pulse;
  }

  onResize(width: number, height: number) {
    void width;
    void height;
  }

  destroy() {
    this.root.destroy({ children: true });
    this.factionLayers.clear();
  }

  private drawOcean() {
    const base = new PIXI.Graphics();
    base.rect(0, 0, this.world.width, this.world.height);
    base.fill({ color: 0x030711, alpha: 1 });
    this.root.addChild(base);

    this.oceanLayer = new PIXI.TilingSprite({ texture: this.kit.oceanField, width: this.world.width, height: this.world.height });
    this.oceanLayer.alpha = 0.78;
    this.oceanLayer.tileScale.set(1.15, 1.15);
    this.root.addChild(this.oceanLayer);

    const field = new PIXI.Graphics();
    for (let i = 0; i < 8; i += 1) {
      const x = ((i * 1733 + this.world.seed * 13) % this.world.width) - 290;
      const y = ((i * 997 + this.world.seed * 11) % this.world.height) - 250;
      field.ellipse(x, y, 1100 + (i % 3) * 260, 800 + (i % 4) * 170);
    }
    field.fill({ color: 0x122a42, alpha: 0.08 });
    this.root.addChild(field);
  }

  private drawStrategicLinks() {
    const links = new PIXI.Graphics();
    for (let i = 0; i < 140; i += 1) {
      const a = this.world.factions[(i * 19 + this.world.seed) % this.world.factions.length];
      const b = this.world.factions[(i * 47 + this.world.seed * 2) % this.world.factions.length];

      const dx = a.position.x - b.position.x;
      const dy = a.position.y - b.position.y;
      const sq = dx * dx + dy * dy;
      if (sq < 460 * 460 || sq > 1300 * 1300) continue;

      const midX = (a.position.x + b.position.x) * 0.5;
      const midY = (a.position.y + b.position.y) * 0.5;
      links.moveTo(a.position.x, a.position.y);
      links.quadraticCurveTo(midX + ((i % 3) - 1) * 16, midY + ((i % 5) - 2) * 14, b.position.x, b.position.y);
    }
    links.stroke({ color: 0x6dafcd, width: 1, alpha: 0.07 });
    this.root.addChild(links);
  }

  private mountFactions() {
    for (const faction of this.world.factions) {
      const shadeOffset = parseInt(faction.id.replace('f-', ''), 10) % 16;
      const { container, core, rim, underGlow, slotNodes } = buildFactionGraphic(faction, shadeOffset, this.kit);
      container.eventMode = 'static';
      container.cursor = 'pointer';

      container.on('pointerover', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1.03);
          rim.alpha = 0.79;
          underGlow.alpha = 0.13;
        }
      });

      container.on('pointerout', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1);
          rim.alpha = 0.62;
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
      layer.core.tint = isSelected ? 0xc5f0ff : 0xffffff;
      layer.rim.tint = isSelected ? 0xb7ebff : 0xffffff;
      layer.rim.alpha = isSelected ? 0.82 : 0.62;
      layer.underGlow.alpha = isSelected ? 0.16 : 0.1;

      for (const slotNode of layer.slotNodes) {
        slotNode.alpha = isSelected ? Math.max(0.84, slotNode.alpha) : Math.min(slotNode.alpha, 0.66);
      }
    }
  }
}
