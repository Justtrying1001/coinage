'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, BlurFilter, Color, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { Faction, WorldModel, WorldSector } from '@/domain/world/types';

type SectorColorInfo = { fill: number; edge: number; glow: number };

const neutralTone: SectorColorInfo = { fill: 0x2a3448, edge: 0x6b7280, glow: 0x5b6478 };

function colorFromHex(value: string, fallback: number) {
  try {
    return new Color(value).toNumber();
  } catch {
    return fallback;
  }
}

function getSectorTone(sector: WorldSector, faction: Faction | null): SectorColorInfo {
  const factionColor = faction ? colorFromHex(faction.color, 0x38bdf8) : 0x38bdf8;
  if (sector.controlState === 'neutral') return neutralTone;
  if (sector.controlState === 'contested') return { fill: 0x5c2f3b, edge: 0xfda4af, glow: 0xfb7185 };
  if (sector.controlState === 'homeland') return { fill: factionColor, edge: 0xffffff, glow: factionColor };
  return { fill: factionColor, edge: 0x9ca3af, glow: factionColor };
}

function blobShape(graphics: Graphics, radius: number) {
  graphics.moveTo(-radius * 0.96, -radius * 0.15);
  graphics.bezierCurveTo(-radius * 1.12, -radius * 0.88, -radius * 0.35, -radius * 1.2, radius * 0.22, -radius * 1.1);
  graphics.bezierCurveTo(radius * 1.2, -radius * 0.85, radius * 1.3, radius * 0.2, radius * 0.82, radius * 0.9);
  graphics.bezierCurveTo(radius * 0.3, radius * 1.22, -radius * 0.88, radius * 1.08, -radius * 1.05, radius * 0.34);
  graphics.closePath();
}

export function WorldMapRenderer({
  world,
  factions,
  selectedSectorId,
  zoom,
  offset,
  cursor,
  onSelectSector,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  world: WorldModel;
  factions: Faction[];
  selectedSectorId: string | null;
  zoom: number;
  offset: { x: number; y: number };
  cursor: string;
  onSelectSector: (sectorId: string) => void;
  onWheel: (event: WheelEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const worldLayerRef = useRef<Container | null>(null);
  const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);

  const factionMap = useMemo(() => new Map(factions.map((entry) => [entry.id, entry])), [factions]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    void app.init({
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: host,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    }).then(() => {
      if (!hostRef.current) return;
      hostRef.current.appendChild(app.canvas);
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.display = 'block';

      appRef.current = app;
      const baseLayer = new Container();
      const worldLayer = new Container();
      worldLayerRef.current = worldLayer;
      app.stage.addChild(baseLayer);
      app.stage.addChild(worldLayer);

      const redrawBackground = () => {
        baseLayer.removeChildren();
        const { width, height } = app.screen;
        const bg = new Graphics();
        bg.rect(0, 0, width, height).fill({ color: 0x020617 });
        for (let i = 0; i < 4; i += 1) {
          const aura = new Graphics();
          aura.circle(width * (0.2 + i * 0.24), height * (0.3 + (i % 2) * 0.18), 180 + i * 45).fill({
            color: i % 2 === 0 ? 0x0ea5e9 : 0xd946ef,
            alpha: 0.055,
          });
          aura.filters = [new BlurFilter({ strength: 26 })];
          baseLayer.addChild(aura);
        }
        const vignette = new Graphics();
        vignette.rect(0, 0, width, height).fill({ color: 0x01040d, alpha: 0.35 });
        baseLayer.addChild(bg, vignette);
      };

      redrawBackground();
      app.renderer.on('resize', redrawBackground);

      const canvas = app.canvas;
      const wheel = (event: Event) => onWheel(event as WheelEvent);
      const pointerDown = (event: PointerEvent) => onPointerDown(event);
      const pointerMove = (event: PointerEvent) => onPointerMove(event);
      const pointerUp = () => onPointerUp();

      canvas.addEventListener('wheel', wheel, { passive: false });
      canvas.addEventListener('pointerdown', pointerDown);
      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);

      return () => {
        app.renderer.off('resize', redrawBackground);
        canvas.removeEventListener('wheel', wheel);
        canvas.removeEventListener('pointerdown', pointerDown);
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
      };
    });

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
      worldLayerRef.current = null;
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onWheel]);

  useEffect(() => {
    const app = appRef.current;
    const worldLayer = worldLayerRef.current;
    if (!app || !worldLayer) return;

    worldLayer.removeChildren();
    worldLayer.position.set(app.screen.width * 0.5 + offset.x, app.screen.height * 0.52 + offset.y);
    worldLayer.scale.set(zoom);

    const selected = selectedSectorId;
    const ticker = Ticker.shared;
    const contestedNodes: Graphics[] = [];


    for (const source of world.sectors) {
      for (const target of world.sectors) {
        if (source.id >= target.id) continue;
        const dx = source.position.x - target.position.x;
        const dy = source.position.y - target.position.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 250) continue;
        const sameCluster = source.clusterId === target.clusterId;
        const link = new Graphics();
        link.moveTo(source.position.x, source.position.y);
        link.lineTo(target.position.x, target.position.y);
        link.stroke({ color: sameCluster ? 0x1d4ed8 : 0x64748b, width: sameCluster ? 2.2 : 1.2, alpha: sameCluster ? 0.32 : 0.16 });
        worldLayer.addChild(link);
      }
    }

    for (const cluster of world.clusters) {
      const label = new Text({
        text: cluster.label,
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 16, fill: 0x9ca3af, letterSpacing: 2, fontWeight: '600' }),
      });
      label.anchor.set(0.5);
      label.position.set(cluster.center.x, cluster.center.y - 72);
      label.alpha = 0.75;
      worldLayer.addChild(label);
    }

    for (const sector of world.sectors) {
      const faction = sector.controllingFactionId ? factionMap.get(sector.controllingFactionId) ?? null : null;
      const tone = getSectorTone(sector, faction);
      const isSelected = selected === sector.id;
      const isHovered = hoveredSectorId === sector.id;
      const radius = 42 + sector.citySlots.length * 4;

      const glow = new Graphics();
      glow.circle(0, 0, radius + 15).fill({ color: tone.glow, alpha: isSelected ? 0.32 : isHovered ? 0.2 : 0.12 });
      glow.filters = [new BlurFilter({ strength: isSelected ? 20 : 13 })];

      const territory = new Graphics();
      territory.alpha = isSelected ? 1 : 0.93;
      territory.beginPath();
      blobShape(territory, radius);
      territory.fill({ color: tone.fill, alpha: 0.84 });
      territory.stroke({ color: tone.edge, width: isSelected ? 4 : 2.2, alpha: 0.86 });

      if (sector.controlState === 'homeland') {
        const homelandRing = new Graphics();
        homelandRing.circle(0, 0, radius + 10).stroke({ color: 0xe2e8f0, width: 1.5, alpha: 0.7 });
        territory.addChild(homelandRing);
      }

      if (sector.controlState === 'contested') {
        const contestedRing = new Graphics();
        contestedRing.circle(0, 0, radius + 8).stroke({ color: 0xfda4af, width: 2, alpha: 0.85 });
        contestedNodes.push(contestedRing);
        territory.addChild(contestedRing);
      }

      territory.eventMode = 'static';
      territory.cursor = 'pointer';
      territory.on('pointertap', () => onSelectSector(sector.id));
      territory.on('pointerover', () => setHoveredSectorId(sector.id));
      territory.on('pointerout', () => setHoveredSectorId((current) => (current === sector.id ? null : current)));

      const group = new Container();
      group.position.set(sector.position.x, sector.position.y);
      group.addChild(glow, territory);

      const nameText = new Text({
        text: sector.name,
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 12, fill: 0xe2e8f0, fontWeight: '700' }),
      });
      nameText.anchor.set(0.5);
      nameText.position.set(0, -4);
      const slotText = new Text({
        text: `${sector.citySlots.length} slots • SV ${sector.strategicValue}`,
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: 0x94a3b8, fontWeight: '600' }),
      });
      slotText.anchor.set(0.5);
      slotText.position.set(0, 14);

      group.addChild(nameText, slotText);
      worldLayer.addChild(group);
    }

    const tick = () => {
      const t = performance.now() * 0.003;
      for (const ring of contestedNodes) {
        ring.alpha = 0.35 + (Math.sin(t) + 1) * 0.3;
      }
    };

    ticker.add(tick);

    return () => {
      ticker.remove(tick);
      for (const child of worldLayer.children) {
        child.removeAllListeners?.();
      }
    };
  }, [factionMap, hoveredSectorId, offset.x, offset.y, onSelectSector, selectedSectorId, world.clusters, world.sectors, zoom]);

  return <div ref={hostRef} className="h-full w-full" style={{ cursor }} />;
}
