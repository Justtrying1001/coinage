import * as PIXI from 'pixi.js';
import type { Faction, WorldData } from '@/game/core/types';
import type { GameScene } from '@/game/scenes/GameScene';
import { buildFactionGraphic } from '@/game/renderers/islandRenderer';

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

  private factionLayers = new Map<string, FactionLayer>();

  constructor(private readonly world: WorldData) {
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
    base.fill({ color: 0x050a12, alpha: 1 });
    this.root.addChild(base);

    const hazeColors = [0x0f2133, 0x0c1928, 0x10243a, 0x0a1624];
    for (let i = 0; i < 18; i += 1) {
      const haze = new PIXI.Graphics();
      const x = ((i * 1837 + this.world.seed * 13) % this.world.width) + (i % 2 === 0 ? -120 : 80);
      const y = ((i * 1291 + this.world.seed * 7) % this.world.height) + (i % 3 === 0 ? -100 : 60);
      const rx = 520 + ((i * 97) % 520);
      const ry = 390 + ((i * 113) % 430);
      haze.ellipse(x, y, rx, ry);
      haze.fill({ color: hazeColors[i % hazeColors.length], alpha: 0.08 });
      this.root.addChild(haze);
    }

    const currentLines = new PIXI.Graphics();
    for (let y = 260; y < this.world.height; y += 420) {
      currentLines.moveTo(0, y);
      currentLines.bezierCurveTo(this.world.width * 0.25, y + 55, this.world.width * 0.65, y - 55, this.world.width, y + 5);
    }
    currentLines.stroke({ color: 0x2a5a75, width: 1, alpha: 0.16 });
    this.root.addChild(currentLines);

    const grid = new PIXI.Graphics();
    for (let y = 0; y <= this.world.height; y += 620) {
      grid.moveTo(0, y);
      grid.lineTo(this.world.width, y);
    }
    for (let x = 0; x <= this.world.width; x += 620) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.world.height);
    }
    grid.stroke({ color: 0x18384d, width: 1, alpha: 0.08 });
    this.root.addChild(grid);

    for (let i = 0; i < 220; i += 1) {
      const glint = new PIXI.Graphics();
      const x = (i * 631 + this.world.seed * 17) % this.world.width;
      const y = (i * 997 + this.world.seed * 19) % this.world.height;
      const radius = i % 7 === 0 ? 2 : 1.2;
      glint.circle(x, y, radius);
      glint.fill({ color: 0x63c5ea, alpha: i % 7 === 0 ? 0.16 : 0.09 });
      this.root.addChild(glint);
    }
  }

  private mountFactions() {
    for (const faction of this.world.factions) {
      const shadeOffset = parseInt(faction.id.replace('f-', ''), 10) % 16;
      const { container, core, rim, underGlow } = buildFactionGraphic(faction, shadeOffset);
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
