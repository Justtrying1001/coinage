'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, BlurFilter, Color, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { City, Faction, WorldSector } from '@/domain/world/types';

function terrainColor(terrain: WorldSector['citySlots'][number]['terrain']) {
  if (terrain === 'coast') return 0x38bdf8;
  if (terrain === 'ridge') return 0xf59e0b;
  if (terrain === 'urban') return 0xa78bfa;
  return 0x94a3b8;
}

function computeSlotPosition(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;
  const radius = 165 + (index % 2) * 26;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
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
  const [hoverSlotId, setHoverSlotId] = useState<string | null>(null);
  const factionColor = useMemo(() => {
    try {
      return faction ? new Color(faction.color).toNumber() : 0x22d3ee;
    } catch {
      return 0x22d3ee;
    }
  }, [faction]);

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

      const wheel = (event: Event) => onWheel(event as WheelEvent);
      const pointerDown = (event: PointerEvent) => onPointerDown(event);
      const pointerMove = (event: PointerEvent) => onPointerMove(event);
      const pointerUp = () => onPointerUp();

      app.canvas.addEventListener('wheel', wheel, { passive: false });
      app.canvas.addEventListener('pointerdown', pointerDown);
      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);

      return () => {
        app.canvas.removeEventListener('wheel', wheel);
        app.canvas.removeEventListener('pointerdown', pointerDown);
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
      };
    });

    return () => {
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onWheel]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    app.stage.removeChildren();
    const background = new Container();
    const worldLayer = new Container();
    app.stage.addChild(background, worldLayer);

    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x030712, alpha: 1 });
    const localHalo = new Graphics();
    localHalo.circle(app.screen.width * 0.5, app.screen.height * 0.52, Math.min(app.screen.width, app.screen.height) * 0.34).fill({ color: factionColor, alpha: 0.1 });
    localHalo.filters = [new BlurFilter({ strength: 28 })];
    background.addChild(bg, localHalo);

    worldLayer.position.set(app.screen.width * 0.5 + offset.x, app.screen.height * 0.52 + offset.y);
    worldLayer.scale.set(zoom);

    const ring = new Graphics();
    ring.circle(0, 0, 230).stroke({ color: 0x1e293b, width: 2.5, alpha: 0.85 });
    worldLayer.addChild(ring);

    const inner = new Graphics();
    inner.circle(0, 0, 78).fill({ color: factionColor, alpha: 0.16 });
    inner.circle(0, 0, 58).stroke({ color: 0xe2e8f0, width: 2, alpha: 0.65 });
    worldLayer.addChild(inner);

    const sectorTitle = new Text({
      text: sector.name,
      style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 13, fill: 0xe2e8f0, fontWeight: '700' }),
    });
    sectorTitle.anchor.set(0.5);
    sectorTitle.position.set(0, 0);
    worldLayer.addChild(sectorTitle);

    for (const [index, slot] of sector.citySlots.entries()) {
      const slotCity = cities.find((city) => city.slotId === slot.id) ?? null;
      const isSelected = selectedSlotId === slot.id || (slotCity !== null && selectedCityId === slotCity.id);
      const isHovered = hoverSlotId === slot.id;
      const slotPosition = computeSlotPosition(index, sector.citySlots.length);

      const link = new Graphics();
      link.moveTo(0, 0);
      link.lineTo(slotPosition.x, slotPosition.y);
      link.stroke({ color: 0x334155, width: 1.2, alpha: 0.7 });
      worldLayer.addChild(link);

      const slotNode = new Container();
      slotNode.position.set(slotPosition.x, slotPosition.y);

      const shell = new Graphics();
      shell.circle(0, 0, slot.isCapitalSlot ? 34 : 27).fill({ color: 0x0f172a, alpha: 0.92 });
      shell.circle(0, 0, slot.isCapitalSlot ? 34 : 27).stroke({ color: terrainColor(slot.terrain), width: isSelected ? 3.8 : 2, alpha: 0.88 });

      const pulse = new Graphics();
      pulse.circle(0, 0, slot.isCapitalSlot ? 42 : 34).stroke({ color: slotCity ? factionColor : 0x64748b, width: 1.2, alpha: isSelected || isHovered ? 0.72 : 0.32 });

      const core = new Graphics();
      if (slotCity) {
        core.circle(0, 0, slot.isCapitalSlot ? 17 : 13).fill({ color: factionColor, alpha: 0.9 });
        core.circle(0, 0, slot.isCapitalSlot ? 23 : 18).stroke({ color: 0xffffff, width: 1.3, alpha: 0.6 });
      } else {
        core.circle(0, 0, 9).fill({ color: 0x334155, alpha: 0.8 });
      }

      shell.eventMode = 'static';
      shell.cursor = slotCity ? 'pointer' : 'default';
      shell.on('pointerover', () => setHoverSlotId(slot.id));
      shell.on('pointerout', () => setHoverSlotId((current) => (current === slot.id ? null : current)));
      shell.on('pointertap', () => {
        onSelectSlot(slot.id);
        if (slotCity) onOpenCity(slotCity.id);
      });

      const label = new Text({
        text: slot.label,
        style: new TextStyle({ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: 0xcbd5e1, fontWeight: '600' }),
      });
      label.anchor.set(0.5);
      label.position.set(0, slot.isCapitalSlot ? 48 : 40);

      slotNode.addChild(pulse, shell, core, label);
      worldLayer.addChild(slotNode);
    }
  }, [cities, factionColor, hoverSlotId, offset.x, offset.y, onOpenCity, onSelectSlot, sector, selectedCityId, selectedSlotId, zoom]);

  return <div ref={hostRef} className="h-full w-full" style={{ cursor }} />;
}
