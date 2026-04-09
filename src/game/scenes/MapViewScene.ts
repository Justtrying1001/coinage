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
}

export class MapViewScene implements GameScene {
  readonly root = new PIXI.Container();

  private selectedFactionId: string | null = null;

  private elapsed = 0;

  private readonly kit: MapVisualKit;

  private factionLayers = new Map<string, FactionLayer>();

  constructor(private readonly world: WorldData) {
    this.kit = getMapVisualKit();
    this.drawOcean();
    this.mountFactions();
  }

  update(deltaMs: number) {
    this.elapsed += deltaMs;

    if (!this.selectedFactionId) return;
    const selected = this.factionLayers.get(this.selectedFactionId);
    if (!selected) return;

    const pulse = 0.74 + Math.sin(this.elapsed * 0.0048) * 0.1;
    selected.rim.alpha = pulse;
    selected.underGlow.alpha = 0.11 + Math.sin(this.elapsed * 0.0035) * 0.05;
  }

  onResize() {}

  destroy() {
    this.root.destroy({ children: true });
    this.factionLayers.clear();
  }

  private drawOcean() {
    const base = new PIXI.Graphics();
    base.rect(0, 0, this.world.width, this.world.height);
    base.fill({ color: 0x040911, alpha: 1 });
    this.root.addChild(base);

    const noise = new PIXI.TilingSprite({ texture: this.kit.oceanNoise, width: this.world.width, height: this.world.height });
    noise.alpha = 0.5;
    noise.tileScale.set(2.2, 2.2);
    this.root.addChild(noise);

    const flow = new PIXI.TilingSprite({ texture: this.kit.oceanFlow, width: this.world.width, height: this.world.height });
    flow.alpha = 0.22;
    flow.tileScale.set(1.8, 1.4);
    this.root.addChild(flow);

    const largeField = new PIXI.Graphics();
    for (let i = 0; i < 8; i += 1) {
      const x = ((i * 2399 + this.world.seed * 13) % this.world.width) - 250;
      const y = ((i * 1601 + this.world.seed * 11) % this.world.height) - 220;
      largeField.ellipse(x, y, 1800 + (i % 3) * 280, 1200 + (i % 4) * 180);
    }
    largeField.fill({ color: 0x10243a, alpha: 0.07 });
    this.root.addChild(largeField);

    const grid = new PIXI.Graphics();
    for (let y = 0; y <= this.world.height; y += 760) {
      grid.moveTo(0, y);
      grid.lineTo(this.world.width, y);
    }
    for (let x = 0; x <= this.world.width; x += 760) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.world.height);
    }
    grid.stroke({ color: 0x18384d, width: 1, alpha: 0.06 });
    this.root.addChild(grid);

    for (let i = 0; i < 180; i += 1) {
      const glint = new PIXI.Graphics();
      const x = (i * 887 + this.world.seed * 29) % this.world.width;
      const y = (i * 521 + this.world.seed * 31) % this.world.height;
      const radius = i % 9 === 0 ? 2.4 : 1.1;
      glint.circle(x, y, radius);
      glint.fill({ color: 0x6fcce8, alpha: i % 9 === 0 ? 0.15 : 0.06 });
      this.root.addChild(glint);
    }
  }

  private mountFactions() {
    for (const faction of this.world.factions) {
      const shadeOffset = parseInt(faction.id.replace('f-', ''), 10) % 16;
      const { container, core, rim, underGlow } = buildFactionGraphic(faction, shadeOffset, this.kit);
      container.eventMode = 'static';
      container.cursor = 'pointer';

      container.on('pointerover', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1.035);
          rim.alpha = 0.85;
          underGlow.alpha = 0.12;
        }
      });

      container.on('pointerout', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1);
          rim.alpha = 0.72;
          underGlow.alpha = 0.08;
        }
      });

      container.on('pointertap', () => {
        this.selectFaction(faction.id);
      });

      this.root.addChild(container);
      this.factionLayers.set(faction.id, { container, core, rim, underGlow, faction });
    }
  }

  private selectFaction(factionId: string) {
    this.selectedFactionId = factionId;

    for (const [id, layer] of this.factionLayers.entries()) {
      const isSelected = id === factionId;
      layer.container.scale.set(isSelected ? 1.06 : 1);
      layer.core.tint = isSelected ? 0xc1f2ff : 0xffffff;
      layer.rim.tint = isSelected ? 0xb3edff : 0xffffff;
      layer.rim.alpha = isSelected ? 0.84 : 0.72;
      layer.underGlow.alpha = isSelected ? 0.13 : 0.08;
    }
  }
}
