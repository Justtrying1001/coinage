import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { SeededRng } from '@/game/world/rng';
import { CityLayoutStore, type CityLayoutSnapshot } from '@/game/city/layout/cityLayout';
import { createCityBiomeDescriptorFromSeed, type CityBiomeDescriptor } from '@/game/city/biome/cityBiomeDescriptor';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 14;
const SVG_WIDTH = 1200;
const SVG_HEIGHT = 720;

interface LotPatch {
  points: string;
  zone: 'core' | 'expansion';
  grade: number;
}

export class CityFoundationMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private readonly layout = new CityLayoutStore({ width: GRID_WIDTH, height: GRID_HEIGHT });
  private root: HTMLElement | null = null;
  private titleEl: HTMLHeadingElement | null = null;
  private subtitleEl: HTMLParagraphElement | null = null;
  private ambienceEl: HTMLParagraphElement | null = null;
  private stageEl: HTMLDivElement | null = null;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    const root = document.createElement('section');
    root.className = 'city-base-layer-root';

    const hud = this.buildHud();
    const stage = document.createElement('div');
    stage.className = 'city-base-layer-stage';

    root.append(hud, stage);
    this.context.host.appendChild(root);

    this.root = root;
    this.stageEl = stage;
    this.renderBaseLayer();
  }

  resize() {}
  update() {}

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    this.selectedPlanet = nextPlanet;
    this.renderBaseLayer();
  }

  destroy() {
    this.root?.remove();
    this.root = null;
    this.titleEl = null;
    this.subtitleEl = null;
    this.ambienceEl = null;
    this.stageEl = null;
  }

  private buildHud() {
    const panel = document.createElement('div');
    panel.className = 'city-base-layer-hud';

    const title = document.createElement('h2');
    title.className = 'city-base-layer-title';
    this.titleEl = title;

    const subtitle = document.createElement('p');
    subtitle.className = 'city-base-layer-subtitle';
    this.subtitleEl = subtitle;

    const ambience = document.createElement('p');
    ambience.className = 'city-base-layer-ambience';
    this.ambienceEl = ambience;

    const controls = document.createElement('div');
    controls.className = 'city-base-layer-controls';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'city-base-layer-button';
    backButton.textContent = 'Back to Planet';
    backButton.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    controls.append(backButton);
    panel.append(title, subtitle, ambience, controls);
    return panel;
  }

  private renderBaseLayer() {
    if (!this.stageEl) return;

    const descriptor = createCityBiomeDescriptorFromSeed(this.selectedPlanet.seed);
    if (this.titleEl) this.titleEl.textContent = `City View · ${descriptor.archetype.toUpperCase()}`;
    if (this.subtitleEl) this.subtitleEl.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · ${descriptor.landform}`;
    if (this.ambienceEl) this.ambienceEl.textContent = descriptor.ambience;

    this.stageEl.innerHTML = '';
    this.stageEl.dataset.archetype = descriptor.archetype;
    this.stageEl.dataset.perimeterStyle = descriptor.perimeterStyle;

    this.stageEl.style.setProperty('--city-ground-a', descriptor.dominantGround[0]);
    this.stageEl.style.setProperty('--city-ground-b', descriptor.dominantGround[1]);
    this.stageEl.style.setProperty('--city-ground-c', descriptor.dominantGround[2]);
    this.stageEl.style.setProperty('--city-accent-a', descriptor.secondaryAccents[0]);
    this.stageEl.style.setProperty('--city-accent-b', descriptor.secondaryAccents[1]);
    this.stageEl.style.setProperty('--city-accent-c', descriptor.secondaryAccents[2]);
    this.stageEl.style.setProperty('--city-glow', String(descriptor.edgeGlow));

    const svg = this.buildBiomeWorldSvg(descriptor);
    this.stageEl.appendChild(svg);
  }

  private buildBiomeWorldSvg(descriptor: CityBiomeDescriptor) {
    const snapshot = this.layout.getSnapshot();
    const seed = this.selectedPlanet.seed;
    const rng = new SeededRng(seed ^ 0x35caab11);
    const terrainPath = generateTerrainPath(seed, descriptor.relief, descriptor.roughness);
    const rimPath = generateTerrainPath(seed ^ 0x9e3779b9, descriptor.relief * 0.75, descriptor.roughness * 1.1, 0.92);
    const lotPatches = deriveLotPatches(snapshot, seed, descriptor);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'city-base-layer-world');
    svg.setAttribute('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);
    svg.setAttribute('aria-label', `City biome base layer for ${descriptor.archetype}`);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="bg-${seed}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${descriptor.secondaryAccents[0]}" />
        <stop offset="58%" stop-color="${descriptor.secondaryAccents[1]}" />
        <stop offset="100%" stop-color="${descriptor.secondaryAccents[2]}" />
      </linearGradient>
      <linearGradient id="ground-${seed}" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0%" stop-color="${descriptor.dominantGround[0]}" />
        <stop offset="52%" stop-color="${descriptor.dominantGround[1]}" />
        <stop offset="100%" stop-color="${descriptor.dominantGround[2]}" />
      </linearGradient>
      <radialGradient id="rim-${seed}" cx="50%" cy="50%" r="56%">
        <stop offset="0%" stop-color="${descriptor.secondaryAccents[2]}" stop-opacity="0" />
        <stop offset="78%" stop-color="${descriptor.secondaryAccents[1]}" stop-opacity="0.34" />
        <stop offset="100%" stop-color="${descriptor.secondaryAccents[0]}" stop-opacity="0.72" />
      </radialGradient>
      <filter id="grain-${seed}" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="${(seed % 97) + 11}" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.06" />
        </feComponentTransfer>
      </filter>
      <filter id="soft-${seed}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    `;
    svg.appendChild(defs);

    appendSvg(svg, 'rect', {
      class: 'city-world-backdrop',
      x: '0', y: '0', width: String(SVG_WIDTH), height: String(SVG_HEIGHT),
      fill: `url(#bg-${seed})`,
    });

    appendPeripheralLayer(svg, descriptor, rng);

    appendSvg(svg, 'path', {
      class: 'city-world-terrain-rim',
      d: rimPath,
      fill: `url(#rim-${seed})`,
      opacity: String(0.54 + descriptor.edgeGlow * 0.35),
    });

    appendSvg(svg, 'path', {
      class: 'city-world-terrain',
      d: terrainPath,
      fill: `url(#ground-${seed})`,
    });

    appendSvg(svg, 'path', {
      class: 'city-world-terrain-grain',
      d: terrainPath,
      filter: `url(#grain-${seed})`,
    });

    appendBiomeDetails(svg, descriptor, rng, terrainPath, seed);

    for (const patch of lotPatches) {
      appendSvg(svg, 'polygon', {
        class: `city-base-layer-lot is-${patch.zone}`,
        points: patch.points,
        opacity: String(0.55 + patch.grade * 0.3),
      });
    }

    appendSvg(svg, 'path', {
      class: 'city-world-plateau-edge',
      d: terrainPath,
    });

    return svg;
  }
}

function appendPeripheralLayer(svg: SVGSVGElement, descriptor: CityBiomeDescriptor, rng: SeededRng) {
  const features = Math.round(8 + descriptor.peripheralDensity * 18);
  for (let i = 0; i < features; i += 1) {
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('class', 'city-world-periphery');
    ellipse.setAttribute('cx', String(rng.range(-50, SVG_WIDTH + 50)));
    ellipse.setAttribute('cy', String(rng.range(-30, SVG_HEIGHT + 40)));
    ellipse.setAttribute('rx', String(rng.range(40, 190)));
    ellipse.setAttribute('ry', String(rng.range(26, 120)));
    ellipse.setAttribute('opacity', String(rng.range(0.09, 0.24)));
    svg.appendChild(ellipse);
  }
}

function appendBiomeDetails(svg: SVGSVGElement, descriptor: CityBiomeDescriptor, rng: SeededRng, terrainPath: string, seed: number) {
  const detailCount = Math.round(8 + descriptor.relief * 18);

  for (let i = 0; i < detailCount; i += 1) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const startX = rng.range(220, SVG_WIDTH - 220);
    const startY = rng.range(120, SVG_HEIGHT - 120);
    const endX = startX + rng.range(-120, 120);
    const endY = startY + rng.range(-70, 70);
    const controlX = (startX + endX) * 0.5 + rng.range(-35, 35);
    const controlY = (startY + endY) * 0.5 + rng.range(-28, 28);

    line.setAttribute('class', 'city-world-detail-line');
    line.setAttribute('d', `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
    line.setAttribute('opacity', String(rng.range(0.15, 0.42)));
    svg.appendChild(line);
  }

  if (descriptor.surfaceMode === 'lava') {
    for (let i = 0; i < 7; i += 1) {
      const fissure = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const x = rng.range(270, SVG_WIDTH - 250);
      const y = rng.range(150, SVG_HEIGHT - 110);
      fissure.setAttribute('class', 'city-world-thermal-fissure');
      fissure.setAttribute('d', `M ${x} ${y} C ${x + rng.range(-40, 40)} ${y + rng.range(-25, 25)}, ${x + rng.range(25, 80)} ${y + rng.range(-8, 40)}, ${x + rng.range(50, 140)} ${y + rng.range(10, 55)}`);
      svg.appendChild(fissure);
    }
  }

  if (descriptor.surfaceMode === 'ice') {
    for (let i = 0; i < 8; i += 1) {
      const crack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const x = rng.range(250, SVG_WIDTH - 230);
      const y = rng.range(130, SVG_HEIGHT - 120);
      crack.setAttribute('class', 'city-world-ice-crack');
      crack.setAttribute('d', `M ${x} ${y} L ${x + rng.range(28, 130)} ${y + rng.range(-12, 22)}`);
      svg.appendChild(crack);
    }
  }

  const shade = appendSvg(svg, 'path', {
    class: 'city-world-terrain-shadow',
    d: terrainPath,
    filter: `url(#soft-${seed})`,
  });
  shade.setAttribute('opacity', String(0.2 + descriptor.roughness * 0.22));
}

function deriveLotPatches(snapshot: CityLayoutSnapshot, seed: number, descriptor: CityBiomeDescriptor): LotPatch[] {
  const rng = new SeededRng(seed ^ 0x77a5641d);
  const patches: LotPatch[] = [];

  for (let y = 2; y < snapshot.grid.height - 2; y += 2) {
    for (let x = 2; x < snapshot.grid.width - 2; x += 2) {
      const key = `${x},${y}`;
      if (snapshot.blocked.has(key) || snapshot.roads.has(key)) continue;
      if (rng.next() > 0.64 + descriptor.peripheralDensity * 0.08) continue;

      const zone: 'core' | 'expansion' = snapshot.expansion.has(key) ? 'expansion' : 'core';
      const centerX = ((x + 0.5) / snapshot.grid.width) * (SVG_WIDTH * 0.66) + SVG_WIDTH * 0.17;
      const centerY = ((y + 0.5) / snapshot.grid.height) * (SVG_HEIGHT * 0.58) + SVG_HEIGHT * 0.2;
      const w = zone === 'core' ? rng.range(70, 126) : rng.range(54, 92);
      const h = zone === 'core' ? rng.range(42, 78) : rng.range(36, 62);
      const skew = rng.range(-22, 22);

      const polygon = [
        `${centerX - w * 0.52},${centerY - h * 0.5 + skew * 0.05}`,
        `${centerX + w * 0.54},${centerY - h * 0.46 - skew * 0.03}`,
        `${centerX + w * 0.5},${centerY + h * 0.46 + skew * 0.04}`,
        `${centerX - w * 0.56},${centerY + h * 0.48 - skew * 0.06}`,
      ].join(' ');

      patches.push({
        points: polygon,
        zone,
        grade: zone === 'core' ? rng.range(0.4, 1) : rng.range(0.18, 0.72),
      });
    }
  }

  return patches.slice(0, 72);
}

function generateTerrainPath(seed: number, relief: number, roughness: number, scale = 1) {
  const rng = new SeededRng(seed ^ 0xc2b2ae35);
  const centerX = SVG_WIDTH * 0.5;
  const centerY = SVG_HEIGHT * 0.52;
  const baseRX = SVG_WIDTH * 0.33 * scale;
  const baseRY = SVG_HEIGHT * 0.29 * scale;
  const points: Array<{ x: number; y: number }> = [];
  const count = 20;

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const radialJitter = 1 + rng.range(-0.16, 0.16) * (0.45 + relief * 0.7) + Math.sin(angle * 3.2 + rng.range(-0.4, 0.4)) * 0.05;
    const squash = 1 + Math.cos(angle * 2.1 + rng.range(-0.3, 0.3)) * 0.06 * (0.4 + roughness * 0.8);
    points.push({
      x: centerX + Math.cos(angle) * baseRX * radialJitter,
      y: centerY + Math.sin(angle) * baseRY * radialJitter * squash,
    });
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const cx = (current.x + next.x) / 2;
    const cy = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${cx} ${cy}`;
  }

  return `${path} Z`;
}

function appendSvg(svg: SVGSVGElement, tag: string, attrs: Record<string, string>) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  svg.appendChild(el);
  return el;
}
