import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { PlanetVisualProfile, SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { SeededRng } from '@/game/world/rng';
import { PlanetRuntime } from '@/game/planet/runtime/PlanetRuntime';

const CLICK_DRAG_THRESHOLD_PX = 6;

export class Planet3DMode implements RenderModeController {
  readonly id = 'planet3d' as const;

  private runtime: PlanetRuntime | null = null;

  private inspectPanel: HTMLDivElement | null = null;
  private inspectTitle: HTMLHeadingElement | null = null;
  private inspectSubtitle: HTMLParagraphElement | null = null;
  private inspectTags: HTMLDivElement | null = null;
  private slotSummary: HTMLParagraphElement | null = null;
  private slotDetail: HTMLDivElement | null = null;

  private width = 1;
  private height = 1;

  private isDragging = false;
  private pointerId: number | null = null;
  private lastX = 0;
  private lastY = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private dragDistance = 0;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
  ) {}

  mount() {
    this.runtime = new PlanetRuntime(this.context.host);
    this.runtime.rebuildFromSeed(this.selectedPlanet.seed);
    this.mountInspectPanel();

    const canvas = this.runtime.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
  }

  resize(width: number, height: number) {
    this.width = Math.max(width, 1);
    this.height = Math.max(height, 1);
    this.runtime?.resize(this.width, this.height);
  }

  update(deltaMs: number) {
    this.runtime?.update(deltaMs);
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;
    this.runtime?.rebuildFromSeed(nextPlanet.seed);
    const profile = planetProfileFromSeed(nextPlanet.seed);
    this.updateInspectIdentity(nextPlanet, profile);
    this.updateSlotInspectSection();
  }

  destroy() {
    const canvas = this.runtime?.renderer.domElement;
    canvas?.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);

    this.runtime?.destroy();
    this.runtime = null;

    this.inspectPanel?.remove();
    this.inspectPanel = null;
    this.inspectTitle = null;
    this.inspectSubtitle = null;
    this.inspectTags = null;
    this.slotSummary = null;
    this.slotDetail = null;
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.pointerDownX = event.clientX;
    this.pointerDownY = event.clientY;
    this.dragDistance = 0;
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.isDragging || this.pointerId !== event.pointerId || !this.runtime) return;

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    const totalDx = event.clientX - this.pointerDownX;
    const totalDy = event.clientY - this.pointerDownY;
    this.dragDistance = Math.max(this.dragDistance, Math.hypot(totalDx, totalDy));

    this.runtime.rotate(dx * 0.0088, dy * 0.0088, this.runtime.camera);
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;

    const runtime = this.runtime;
    const dragDistance = this.dragDistance;

    this.pointerId = null;
    this.isDragging = false;
    this.dragDistance = 0;

    if (!runtime || dragDistance > CLICK_DRAG_THRESHOLD_PX) return;

    const slotIndex = runtime.pickSlotFromScreen(event.clientX, event.clientY);
    if (slotIndex === null) {
      runtime.clearSelectedSlot();
    } else {
      runtime.setSelectedSlotByIndex(slotIndex);
    }
    this.updateSlotInspectSection();
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.context.onRequestMode('galaxy2d');
    }
  };

  private mountInspectPanel() {
    const panel = document.createElement('div');
    panel.className = 'planet-inspect-panel';

    const title = document.createElement('h2');
    title.className = 'planet-inspect-title';

    const subtitle = document.createElement('p');
    subtitle.className = 'planet-inspect-subtitle';

    const tags = document.createElement('div');
    tags.className = 'planet-inspect-tags';

    const slotSummary = document.createElement('p');
    slotSummary.className = 'planet-slot-summary';

    const slotDetail = document.createElement('div');
    slotDetail.className = 'planet-slot-detail';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'planet-back-button';
    button.textContent = 'Back to Galaxy';
    button.addEventListener('click', () => {
      this.context.onRequestMode('galaxy2d');
    });

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(tags);
    panel.appendChild(slotSummary);
    panel.appendChild(slotDetail);
    panel.appendChild(button);

    this.context.host.appendChild(panel);
    this.inspectPanel = panel;
    this.inspectTitle = title;
    this.inspectSubtitle = subtitle;
    this.inspectTags = tags;
    this.slotSummary = slotSummary;
    this.slotDetail = slotDetail;

    const profile = planetProfileFromSeed(this.selectedPlanet.seed);
    this.updateInspectIdentity(this.selectedPlanet, profile);
    this.updateSlotInspectSection();
  }

  private updateInspectIdentity(planetRef: SelectedPlanetRef, profile: PlanetVisualProfile) {
    if (!this.inspectTitle || !this.inspectSubtitle || !this.inspectTags) return;

    this.inspectTitle.textContent = `Planet ${planetRef.id.toUpperCase()}`;
    this.inspectSubtitle.textContent = `${toDisplayArchetype(profile.archetype)} world · Seed ${planetRef.seed.toString(16).toUpperCase().padStart(8, '0')}`;

    const tags = derivePlanetTags(planetRef.seed, profile);
    this.inspectTags.innerHTML = '';

    for (const tag of tags) {
      const chip = document.createElement('span');
      chip.className = 'planet-inspect-tag';
      chip.textContent = tag;
      this.inspectTags.appendChild(chip);
    }
  }

  private updateSlotInspectSection() {
    if (!this.slotSummary || !this.slotDetail || !this.runtime) return;

    const slots = this.runtime.getSlots();
    const selected = this.runtime.getSelectedSlot();
    const occupiedCount = slots.filter((slot) => slot.state === 'occupied').length;
    const availableCount = Math.max(0, slots.length - occupiedCount);
    this.slotSummary.textContent = `${slots.length} settlement slots · ${occupiedCount} occupied · ${availableCount} available`;

    if (!selected) {
      this.slotDetail.textContent = 'Select a slot to inspect it.';
      return;
    }

    this.slotDetail.innerHTML = '';
    this.slotDetail.appendChild(makeSlotLine('Slot', selected.id));
    this.slotDetail.appendChild(makeSlotLine('State', selected.state));
    this.slotDetail.appendChild(makeSlotLine('Habitability', `${Math.round(selected.habitability * 100)}%`));
    if (selected.occupant?.label) {
      this.slotDetail.appendChild(makeSlotLine('Occupant', selected.occupant.label));
    }
  }
}

function makeSlotLine(label: string, value: string) {
  const row = document.createElement('p');
  row.className = 'planet-slot-line';
  const key = document.createElement('span');
  key.className = 'planet-slot-line-key';
  key.textContent = `${label}:`;
  const body = document.createElement('span');
  body.className = 'planet-slot-line-value';
  body.textContent = value;
  row.append(key, body);
  return row;
}

function derivePlanetTags(seed: number, profile: PlanetVisualProfile): string[] {
  const rng = new SeededRng(seed ^ 0x9e3779b9);

  const candidates: Array<{ label: string; score: number }> = [
    { label: profile.archetype, score: 1.25 },
    { label: 'high-relief', score: normalize(profile.reliefStrength, 0.12, 0.23) + normalize(profile.ridgeWeight, 0.2, 0.6) * 0.4 },
    { label: 'rifted crust', score: normalize(profile.craterWeight, 0.14, 0.36) + normalize(profile.reliefSharpness, 1.2, 2.3) * 0.35 },
    { label: 'metallic sheen', score: normalize(profile.metalness, 0.06, 0.28) + normalize(0.78 - profile.roughness, 0, 0.45) * 0.22 },
    { label: 'deep basins', score: normalize(profile.oceanLevel, 0.45, 0.82) + normalize(0.1 - profile.macroBias, -0.2, 0.1) * 0.3 },
    { label: 'dry plateaus', score: normalize(0.3 - profile.oceanLevel, 0.02, 0.3) + normalize(profile.macroBias, 0.12, 0.44) * 0.25 },
    { label: 'volatile mantle', score: normalize(profile.emissiveIntensity, 0.03, 0.12) + normalize(profile.lightIntensity, 1.2, 1.95) * 0.24 },
    { label: 'polar stress', score: normalize(profile.polarWeight, 0.14, 0.44) + normalize(profile.atmosphereLightness, 72, 88) * 0.2 },
  ];

  const picked = candidates
    .map((candidate) => ({
      ...candidate,
      score: candidate.score + rng.range(0, 0.06),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => candidate.score > 0.16)
    .slice(0, 3)
    .map((candidate) => candidate.label);

  if (picked.length >= 2) return picked.slice(0, 3);
  if (picked.length === 1) return [picked[0], 'charted'];
  return ['charted', 'stable'];
}

function toDisplayArchetype(archetype: PlanetVisualProfile['archetype']) {
  return `${archetype.charAt(0).toUpperCase()}${archetype.slice(1)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}
