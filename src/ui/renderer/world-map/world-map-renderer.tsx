'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, BlurFilter, Color, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { Faction, WorldModel, WorldSector } from '@/domain/world/types';

type Vec2 = { x: number; y: number };
type SectorTone = { fill: number; edge: number; glow: number; accent: number };

const NEUTRAL_TONE: SectorTone = { fill: 0x1f2937, edge: 0x6b7280, glow: 0x334155, accent: 0x94a3b8 };

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function toColor(value: string, fallback: number) {
  try {
    return new Color(value).toNumber();
  } catch {
    return fallback;
  }
}

function sectorTone(sector: WorldSector, faction: Faction | null): SectorTone {
  const factionColor = faction ? toColor(faction.color, 0x22d3ee) : 0x22d3ee;
  if (sector.controlState === 'neutral') return NEUTRAL_TONE;
  if (sector.controlState === 'contested') return { fill: 0x3c1f29, edge: 0xfb7185, glow: 0xe11d48, accent: 0xfda4af };
  if (sector.controlState === 'homeland') return { fill: factionColor, edge: 0xffffff, glow: factionColor, accent: 0xe2e8f0 };
  return { fill: factionColor, edge: 0xcbd5e1, glow: factionColor, accent: 0xbfdbfe };
}

function buildPlatePoints(seed: string, radius: number, variance = 0.34, points = 14): Vec2[] {
  const n = Math.max(points, 10);
  const out: Vec2[] = [];
  const seedValue = hashSeed(seed) * 8;
  for (let i = 0; i < n; i += 1) {
    const a = (Math.PI * 2 * i) / n;
    const wobble = Math.sin(a * 3 + seedValue) * variance * 0.45 + Math.cos(a * 5 + seedValue * 0.7) * variance * 0.3;
    const r = radius * (1 - variance * 0.5 + wobble + (i % 2) * 0.08);
    out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return out;
}

function drawPolygon(graphics: Graphics, points: Vec2[]) {
  if (!points.length) return;
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.closePath();
}

function createHudFrame(width: number, height: number) {
  const frame = new Graphics();
  frame.rect(18, 18, width - 36, height - 36).stroke({ color: 0x334155, width: 1, alpha: 0.5 });

  const corners: Array<[number, number, number, number]> = [
    [18, 18, 64, 18],
    [18, 18, 18, 64],
    [width - 18, 18, width - 64, 18],
    [width - 18, 18, width - 18, 64],
    [18, height - 18, 64, height - 18],
    [18, height - 18, 18, height - 64],
    [width - 18, height - 18, width - 64, height - 18],
    [width - 18, height - 18, width - 18, height - 64],
  ];

  for (const [x1, y1, x2, y2] of corners) {
    frame.moveTo(x1, y1);
    frame.lineTo(x2, y2);
  }
  frame.stroke({ color: 0x38bdf8, width: 1.5, alpha: 0.7 });
  return frame;
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
  const backgroundRef = useRef<Container | null>(null);
  const worldRef = useRef<Container | null>(null);
  const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);

  const factionsById = useMemo(() => new Map(factions.map((f) => [f.id, f])), [factions]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let detachListeners = () => {};

    void app
      .init({
        antialias: true,
        backgroundAlpha: 0,
        resizeTo: host,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      })
      .then(() => {
        if (!hostRef.current) return;
        hostRef.current.appendChild(app.canvas);
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';

        appRef.current = app;
        const background = new Container();
        const worldLayer = new Container();
        backgroundRef.current = background;
        worldRef.current = worldLayer;
        app.stage.addChild(background, worldLayer);

        const wheel = (event: Event) => onWheel(event as WheelEvent);
        const pointerDown = (event: PointerEvent) => onPointerDown(event);
        const pointerMove = (event: PointerEvent) => onPointerMove(event);
        const pointerUp = () => onPointerUp();

        app.canvas.addEventListener('wheel', wheel, { passive: false });
        app.canvas.addEventListener('pointerdown', pointerDown);
        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerUp);

        detachListeners = () => {
          app.canvas.removeEventListener('wheel', wheel);
          app.canvas.removeEventListener('pointerdown', pointerDown);
          window.removeEventListener('pointermove', pointerMove);
          window.removeEventListener('pointerup', pointerUp);
        };
      });

    return () => {
      detachListeners();
      app.destroy(true, { children: true });
      appRef.current = null;
      backgroundRef.current = null;
      worldRef.current = null;
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onWheel]);

  useEffect(() => {
    const app = appRef.current;
    const background = backgroundRef.current;
    if (!app || !background) return;

    background.removeChildren();
    const { width, height } = app.screen;

    const deepSpace = new Graphics();
    deepSpace.rect(0, 0, width, height).fill({ color: 0x020617, alpha: 1 });
    background.addChild(deepSpace);

    const nebulaSeeds = [
      { x: width * 0.2, y: height * 0.25, r: 340, c: 0x0ea5e9 },
      { x: width * 0.72, y: height * 0.28, r: 300, c: 0x7c3aed },
      { x: width * 0.55, y: height * 0.68, r: 420, c: 0xf97316 },
      { x: width * 0.32, y: height * 0.7, r: 260, c: 0x1d4ed8 },
    ];

    for (const nebula of nebulaSeeds) {
      const aura = new Graphics();
      aura.circle(nebula.x, nebula.y, nebula.r).fill({ color: nebula.c, alpha: 0.055 });
      aura.filters = [new BlurFilter({ strength: 45 })];
      background.addChild(aura);
    }

    const starfield = new Graphics();
    for (let i = 0; i < 420; i += 1) {
      const x = hashSeed(`sx-${i}`) * width;
      const y = hashSeed(`sy-${i}`) * height;
      const alpha = 0.22 + hashSeed(`sa-${i}`) * 0.7;
      const radius = hashSeed(`sr-${i}`) > 0.86 ? 1.8 : 0.7;
      starfield.circle(x, y, radius).fill({ color: 0xe2e8f0, alpha: alpha * 0.55 });
    }
    background.addChild(starfield);

    const hud = createHudFrame(width, height);
    background.addChild(hud);
  }, [world.sectors.length]);

  useEffect(() => {
    const app = appRef.current;
    const worldLayer = worldRef.current;
    if (!app || !worldLayer) return;

    worldLayer.removeChildren();
    worldLayer.position.set(app.screen.width * 0.5 + offset.x, app.screen.height * 0.52 + offset.y);
    worldLayer.scale.set(zoom);

    const contestedRings: Graphics[] = [];
    const selected = selectedSectorId;

    const decorativeTerritories = Array.from({ length: 22 }, (_, index) => {
      const x = (hashSeed(`dx-${index}`) - 0.5) * 1900;
      const y = (hashSeed(`dy-${index}`) - 0.5) * 1200;
      const scale = 0.75 + hashSeed(`ds-${index}`) * 1.3;
      return { x, y, scale, id: `decor-${index}` };
    });

    for (const decor of decorativeTerritories) {
      const plate = new Graphics();
      const points = buildPlatePoints(decor.id, 68 * decor.scale, 0.5, 11);
      drawPolygon(plate, points);
      plate.fill({ color: 0x0f172a, alpha: 0.18 });
      plate.stroke({ color: 0x334155, width: 1.1, alpha: 0.28 });
      plate.position.set(decor.x, decor.y);
      worldLayer.addChild(plate);
    }

    const closestLinks = new Set<string>();
    for (const sector of world.sectors) {
      const nearest = [...world.sectors]
        .filter((target) => target.id !== sector.id)
        .map((target) => ({ target, d: Math.hypot(target.position.x - sector.position.x, target.position.y - sector.position.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      for (const item of nearest) {
        const key = [sector.id, item.target.id].sort().join('|');
        closestLinks.add(key);
      }
    }

    for (const key of closestLinks) {
      const [aId, bId] = key.split('|');
      const a = world.sectors.find((s) => s.id === aId);
      const b = world.sectors.find((s) => s.id === bId);
      if (!a || !b) continue;

      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const distance = Math.hypot(dx, dy);
      const curve = Math.min(80, distance * 0.18);
      const mx = (a.position.x + b.position.x) * 0.5 - dy * 0.08;
      const my = (a.position.y + b.position.y) * 0.5 + dx * 0.08;

      const link = new Graphics();
      link.moveTo(a.position.x, a.position.y);
      link.quadraticCurveTo(mx, my, b.position.x, b.position.y);
      link.stroke({ color: 0x38bdf8, width: 1.1, alpha: 0.16 + Math.max(0, (240 - distance) / 1600) + curve * 0.0002 });
      worldLayer.addChild(link);
    }

    for (const cluster of world.clusters) {
      const clusterName = new Text({
        text: cluster.label.toUpperCase(),
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 14, fill: 0x94a3b8, fontWeight: '600', letterSpacing: 2 }),
      });
      clusterName.anchor.set(0.5);
      clusterName.position.set(cluster.center.x, cluster.center.y - 150);
      clusterName.alpha = 0.55;
      worldLayer.addChild(clusterName);
    }

    for (const sector of world.sectors) {
      const faction = sector.controllingFactionId ? factionsById.get(sector.controllingFactionId) ?? null : null;
      const tone = sectorTone(sector, faction);
      const isSelected = selected === sector.id;
      const isHovered = hoveredSectorId === sector.id;

      const group = new Container();
      group.position.set(sector.position.x, sector.position.y);

      const radius = 52 + sector.citySlots.length * 6;
      const shape = buildPlatePoints(sector.id, radius, 0.42, 16);

      const glow = new Graphics();
      drawPolygon(glow, shape);
      glow.fill({ color: tone.glow, alpha: isSelected ? 0.35 : isHovered ? 0.24 : 0.16 });
      glow.filters = [new BlurFilter({ strength: isSelected ? 26 : 16 })];
      group.addChild(glow);

      const territory = new Graphics();
      drawPolygon(territory, shape);
      territory.fill({ color: tone.fill, alpha: sector.controlState === 'neutral' ? 0.56 : 0.68 });
      territory.stroke({ color: tone.edge, width: isSelected ? 3.8 : 2.1, alpha: 0.85 });
      territory.eventMode = 'static';
      territory.cursor = 'pointer';
      territory.on('pointertap', () => onSelectSector(sector.id));
      territory.on('pointerover', () => setHoveredSectorId(sector.id));
      territory.on('pointerout', () => setHoveredSectorId((current) => (current === sector.id ? null : current)));
      group.addChild(territory);

      const ridgeLines = new Graphics();
      for (let i = 0; i < 4; i += 1) {
        const y = -radius * 0.35 + i * radius * 0.2;
        ridgeLines.moveTo(-radius * 0.62, y);
        ridgeLines.bezierCurveTo(-radius * 0.2, y - 4, radius * 0.2, y + 6, radius * 0.62, y + 2);
      }
      ridgeLines.stroke({ color: tone.accent, width: 0.8, alpha: 0.26 });
      group.addChild(ridgeLines);

      const activity = new Graphics();
      const pointCount = 3 + Math.round(hashSeed(`${sector.id}-pts`) * 4);
      for (let i = 0; i < pointCount; i += 1) {
        const px = (hashSeed(`${sector.id}-px-${i}`) - 0.5) * radius * 1.1;
        const py = (hashSeed(`${sector.id}-py-${i}`) - 0.5) * radius * 1.1;
        activity.circle(px, py, 1.6 + hashSeed(`${sector.id}-pr-${i}`) * 1.5).fill({ color: tone.accent, alpha: 0.52 });
      }
      group.addChild(activity);

      if (sector.controlState === 'homeland') {
        const anchorRing = new Graphics();
        anchorRing.circle(0, 0, radius + 16).stroke({ color: 0xffffff, width: 1.5, alpha: 0.72 });
        group.addChild(anchorRing);
      }

      if (sector.controlState === 'contested') {
        const alarm = new Graphics();
        alarm.circle(0, 0, radius + 12).stroke({ color: 0xfb7185, width: 2.2, alpha: 0.8 });
        contestedRings.push(alarm);
        group.addChild(alarm);
      }

      const labelPlate = new Graphics();
      const labelWidth = 118;
      labelPlate.roundRect(-labelWidth * 0.5, radius + 13, labelWidth, 28, 7).fill({ color: 0x020617, alpha: 0.78 });
      labelPlate.roundRect(-labelWidth * 0.5, radius + 13, labelWidth, 28, 7).stroke({ color: 0x475569, width: 1, alpha: 0.75 });

      const label = new Text({
        text: sector.name,
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: 0xe2e8f0, fontWeight: '700' }),
      });
      label.anchor.set(0.5);
      label.position.set(0, radius + 22);

      const meta = new Text({
        text: `SV ${sector.strategicValue} • ${sector.citySlots.length} slots`,
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 9, fill: 0x94a3b8, fontWeight: '600' }),
      });
      meta.anchor.set(0.5);
      meta.position.set(0, radius + 34);

      group.addChild(labelPlate, label, meta);
      worldLayer.addChild(group);
    }

    const ticker = Ticker.shared;
    const animate = () => {
      const t = performance.now() * 0.003;
      for (const ring of contestedRings) {
        ring.alpha = 0.35 + (Math.sin(t) + 1) * 0.28;
      }
    };
    ticker.add(animate);

    return () => {
      ticker.remove(animate);
      for (const child of worldLayer.children) {
        child.removeAllListeners?.();
      }
    };
  }, [factionsById, hoveredSectorId, offset.x, offset.y, onSelectSector, selectedSectorId, world.clusters, world.sectors, zoom]);

  return <div ref={hostRef} className="h-full w-full" style={{ cursor }} />;
}
