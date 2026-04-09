'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, BlurFilter, Color, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { City, Faction, WorldSector } from '@/domain/world/types';

type Vec2 = { x: number; y: number };

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

function territoryPoints(seed: string, radius: number, points = 18): Vec2[] {
  const out: Vec2[] = [];
  const s = hashSeed(seed) * 6;
  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 * i) / points;
    const wobble = Math.sin(angle * 3 + s) * 0.14 + Math.cos(angle * 4 + s * 0.8) * 0.18;
    const r = radius * (0.82 + wobble + (i % 2) * 0.06);
    out.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return out;
}

function drawPoly(g: Graphics, points: Vec2[]) {
  if (!points.length) return;
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    g.lineTo(points[i].x, points[i].y);
  }
  g.closePath();
}

function slotPosition(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / Math.max(1, total) - Math.PI / 2;
  const ring = 190 + (index % 3) * 24;
  return { x: Math.cos(angle) * ring, y: Math.sin(angle) * ring };
}

export function FactionMapRenderer({
  sector,
  cities,
  faction,
  selectedSlotId,
  selectedCityId,
  zoom,
  offset,
  cursor,
  onSelectSlot,
  onOpenCity,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  sector: WorldSector;
  cities: City[];
  faction: Faction | null;
  selectedSlotId: string | null;
  selectedCityId: string | null;
  zoom: number;
  offset: { x: number; y: number };
  cursor: string;
  onSelectSlot: (slotId: string) => void;
  onOpenCity: (cityId: string) => void;
  onWheel: (event: WheelEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

  const factionColor = useMemo(() => toColor(faction?.color ?? '#22d3ee', 0x22d3ee), [faction?.color]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let detachListeners = () => {};

    void app
      .init({ antialias: true, backgroundAlpha: 0, resizeTo: host, resolution: Math.min(window.devicePixelRatio || 1, 2) })
      .then(() => {
        if (!hostRef.current) return;
        hostRef.current.appendChild(app.canvas);
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';
        appRef.current = app;

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
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onWheel]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    app.stage.removeChildren();

    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x020617, alpha: 1 });
    app.stage.addChild(bg);

    const halo = new Graphics();
    halo.circle(app.screen.width * 0.45, app.screen.height * 0.52, Math.min(app.screen.height, app.screen.width) * 0.42).fill({ color: factionColor, alpha: 0.09 });
    halo.filters = [new BlurFilter({ strength: 42 })];
    app.stage.addChild(halo);

    const stars = new Graphics();
    for (let i = 0; i < 220; i += 1) {
      const x = hashSeed(`f-sx-${i}`) * app.screen.width;
      const y = hashSeed(`f-sy-${i}`) * app.screen.height;
      stars.circle(x, y, hashSeed(`f-sr-${i}`) > 0.85 ? 1.8 : 0.7).fill({ color: 0xe2e8f0, alpha: 0.3 + hashSeed(`f-sa-${i}`) * 0.4 });
    }
    app.stage.addChild(stars);

    const world = new Container();
    world.position.set(app.screen.width * 0.5 + offset.x, app.screen.height * 0.54 + offset.y);
    world.scale.set(zoom);
    app.stage.addChild(world);

    const landmass = new Graphics();
    const points = territoryPoints(sector.id, 260, 20);
    drawPoly(landmass, points);
    landmass.fill({ color: 0x111827, alpha: 0.9 });
    landmass.stroke({ color: 0x334155, width: 2.2, alpha: 0.85 });
    world.addChild(landmass);

    const contour = new Graphics();
    const innerPoints = territoryPoints(`${sector.id}-inner`, 205, 18);
    drawPoly(contour, innerPoints);
    contour.stroke({ color: factionColor, width: 1.4, alpha: 0.55 });
    world.addChild(contour);

    const terrainLines = new Graphics();
    for (let i = 0; i < 8; i += 1) {
      const y = -125 + i * 32;
      terrainLines.moveTo(-180, y);
      terrainLines.bezierCurveTo(-72, y - 14, 54, y + 14, 178, y + 4);
    }
    terrainLines.stroke({ color: 0x475569, width: 0.9, alpha: 0.35 });
    world.addChild(terrainLines);

    const centerHub = new Graphics();
    centerHub.roundRect(-44, -26, 88, 52, 8).fill({ color: 0x0b1220, alpha: 0.95 });
    centerHub.roundRect(-44, -26, 88, 52, 8).stroke({ color: factionColor, width: 2, alpha: 0.75 });
    world.addChild(centerHub);

    const name = new Text({
      text: sector.name,
      style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: 0xe2e8f0, fontWeight: '700' }),
    });
    name.anchor.set(0.5);
    name.position.set(0, -2);
    world.addChild(name);

    for (const [index, slot] of sector.citySlots.entries()) {
      const city = cities.find((entry) => entry.slotId === slot.id) ?? null;
      const isHovered = hoveredSlotId === slot.id;
      const isSelected = selectedSlotId === slot.id || (city && selectedCityId === city.id);
      const pos = slotPosition(index, sector.citySlots.length);

      const branch = new Graphics();
      branch.moveTo(0, 0);
      branch.quadraticCurveTo(pos.x * 0.4, pos.y * 0.35, pos.x, pos.y);
      branch.stroke({ color: city ? factionColor : 0x475569, width: 1.4, alpha: city ? 0.5 : 0.28 });
      world.addChild(branch);

      const slotNode = new Container();
      slotNode.position.set(pos.x, pos.y);

      const base = new Graphics();
      const size = slot.isCapitalSlot ? 24 : 18;
      base.roundRect(-size, -size * 0.7, size * 2, size * 1.4, 5).fill({ color: 0x0f172a, alpha: 0.95 });
      base.roundRect(-size, -size * 0.7, size * 2, size * 1.4, 5).stroke({ color: city ? factionColor : 0x64748b, width: isSelected ? 2.6 : 1.6, alpha: 0.9 });
      slotNode.addChild(base);

      const antenna = new Graphics();
      antenna.moveTo(0, -size * 0.7);
      antenna.lineTo(0, -size * 1.3);
      antenna.stroke({ color: 0x94a3b8, width: 1, alpha: 0.6 });
      antenna.circle(0, -size * 1.38, 2.4).fill({ color: city ? factionColor : 0x94a3b8, alpha: 0.85 });
      slotNode.addChild(antenna);

      if (city) {
        const cityCore = new Graphics();
        cityCore.rect(-6, -4, 12, 8).fill({ color: factionColor, alpha: 0.9 });
        cityCore.circle(0, 0, 5).stroke({ color: 0xffffff, width: 1.2, alpha: 0.75 });
        slotNode.addChild(cityCore);
      } else {
        const freeMarker = new Graphics();
        freeMarker.rect(-5, -1, 10, 2).fill({ color: 0x64748b, alpha: 0.85 });
        slotNode.addChild(freeMarker);
      }

      if (isSelected || isHovered) {
        const focus = new Graphics();
        focus.roundRect(-size - 6, -size, size * 2 + 12, size * 1.9, 8).stroke({ color: 0x38bdf8, width: 1.4, alpha: isSelected ? 0.9 : 0.55 });
        slotNode.addChild(focus);
      }

      base.eventMode = 'static';
      base.cursor = city ? 'pointer' : 'default';
      base.on('pointerover', () => setHoveredSlotId(slot.id));
      base.on('pointerout', () => setHoveredSlotId((current) => (current === slot.id ? null : current)));
      base.on('pointertap', () => {
        onSelectSlot(slot.id);
        if (city) onOpenCity(city.id);
      });

      const cartouche = new Graphics();
      cartouche.roundRect(-44, size + 12, 88, 20, 5).fill({ color: 0x020617, alpha: 0.76 });
      cartouche.roundRect(-44, size + 12, 88, 20, 5).stroke({ color: 0x334155, width: 1, alpha: 0.7 });
      slotNode.addChild(cartouche);

      const label = new Text({
        text: slot.label,
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: 0xe2e8f0, fontWeight: '600' }),
      });
      label.anchor.set(0.5);
      label.position.set(0, size + 22);
      slotNode.addChild(label);

      world.addChild(slotNode);
    }
  }, [cities, factionColor, hoveredSlotId, offset.x, offset.y, onOpenCity, onSelectSlot, sector, selectedCityId, selectedSlotId, zoom]);

  return <div ref={hostRef} className="h-full w-full" style={{ cursor }} />;
}
