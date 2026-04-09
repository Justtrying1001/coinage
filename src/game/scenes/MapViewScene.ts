import * as PIXI from 'pixi.js';
import type { Faction, WorldData } from '@/game/core/types';
import type { GameScene } from '@/game/scenes/GameScene';
import { buildFactionGraphic } from '@/game/renderers/islandRenderer';

export class MapViewScene implements GameScene {
  readonly root = new PIXI.Container();

  private selectedFactionId: string | null = null;

  private factionLayers = new Map<string, { container: PIXI.Container; island: PIXI.Graphics; faction: Faction }>();

  private oceanGrid = new PIXI.Graphics();

  constructor(private readonly world: WorldData) {
    this.drawOcean();
    this.root.addChild(this.oceanGrid);
    this.mountFactions();
  }

  update(deltaMs: number) {
    void deltaMs;
  }

  onResize() {}

  destroy() {
    this.root.destroy({ children: true });
    this.factionLayers.clear();
  }

  private drawOcean() {
    const g = this.oceanGrid;
    g.rect(0, 0, this.world.width, this.world.height);
    g.fill({ color: 0x070b12, alpha: 1 });

    for (let y = 0; y <= this.world.height; y += 380) {
      g.moveTo(0, y);
      g.lineTo(this.world.width, y);
    }

    for (let x = 0; x <= this.world.width; x += 380) {
      g.moveTo(x, 0);
      g.lineTo(x, this.world.height);
    }

    g.stroke({ color: 0x133448, width: 1, alpha: 0.16 });

    for (let i = 0; i < 120; i += 1) {
      const px = (i * 997) % this.world.width;
      const py = (i * 619) % this.world.height;
      const glow = new PIXI.Graphics();
      glow.circle(px, py, 2.2);
      glow.fill({ color: 0x2bd4ff, alpha: 0.17 });
      this.root.addChild(glow);
    }
  }

  private mountFactions() {
    for (const faction of this.world.factions) {
      const { container, island } = buildFactionGraphic(faction, parseInt(faction.id.replace('f-', ''), 10) % 20);
      container.eventMode = 'static';
      container.cursor = 'pointer';

      container.on('pointerover', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1.05);
        }
      });

      container.on('pointerout', () => {
        if (this.selectedFactionId !== faction.id) {
          container.scale.set(1);
          island.alpha = 1;
        }
      });

      container.on('pointertap', () => {
        this.selectFaction(faction.id);
      });

      this.root.addChild(container);
      this.factionLayers.set(faction.id, { container, island, faction });
    }
  }

  private selectFaction(factionId: string) {
    this.selectedFactionId = factionId;

    for (const [id, layer] of this.factionLayers.entries()) {
      const isSelected = id === factionId;
      layer.container.scale.set(isSelected ? 1.1 : 1);
      layer.island.tint = isSelected ? 0x8ce8ff : 0xffffff;
      layer.island.alpha = isSelected ? 1 : 0.98;
    }
  }
}
