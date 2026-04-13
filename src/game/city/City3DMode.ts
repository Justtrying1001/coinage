import type { ModeContext, RenderModeController } from '@/game/render/modes/RenderModeController';
import type { SelectedPlanetRef } from '@/game/render/types';
import { planetProfileFromSeed } from '@/game/world/galaxyGenerator';
import { BUILDING_DEFINITIONS, toBuildingLabel, type BuildingType } from '@/game/city/data/cityBuildings';
import { CITY_LAYOUT_TEMPLATE } from '@/game/city/data/cityLayout';
import type { CitySlotId } from '@/game/city/data/citySlots';
import { CitySceneControllerV2 } from '@/game/city/scene/CitySceneControllerV2';
import { createCityViewModel, getSlotById, type CityViewModel } from '@/game/city/runtime/cityViewModel';
import { resolveCityTheme } from '@/game/city/themes/cityThemeResolver';

export class City3DMode implements RenderModeController {
  readonly id = 'city3d' as const;

  private scene: CitySceneControllerV2 | null = null;
  private panel: HTMLDivElement | null = null;
  private headerTitle: HTMLHeadingElement | null = null;
  private headerSubtitle: HTMLParagraphElement | null = null;
  private sectionMeta: HTMLDivElement | null = null;
  private sectionActions: HTMLDivElement | null = null;

  private viewModel: CityViewModel;

  private pointerId: number | null = null;
  private downX = 0;
  private downY = 0;

  constructor(
    private selectedPlanet: SelectedPlanetRef,
    private readonly context: ModeContext,
    private readonly settlementId: string | null,
  ) {
    const profile = planetProfileFromSeed(selectedPlanet.seed);
    const cityTheme = resolveCityTheme(profile.archetype);
    this.viewModel = createCityViewModel({
      cityId: `city-${selectedPlanet.id}`,
      planetId: selectedPlanet.id,
      theme: cityTheme,
      layout: CITY_LAYOUT_TEMPLATE,
    });
  }

  mount() {
    this.scene = new CitySceneControllerV2(this.context.host, this.viewModel, this.selectedPlanet.seed, this.settlementId);
    this.scene.mount();
    this.mountOverlayPanel();

    const canvas = this.scene.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);
    window.addEventListener('keydown', this.onKeyDown);
  }

  resize(width: number, height: number) {
    this.scene?.resize(width, height);
  }

  update() {
    this.scene?.update();
  }

  setSelectedPlanet(nextPlanet: SelectedPlanetRef) {
    if (nextPlanet.id === this.selectedPlanet.id && nextPlanet.seed === this.selectedPlanet.seed) return;
    this.selectedPlanet = nextPlanet;

    const profile = planetProfileFromSeed(nextPlanet.seed);
    const cityTheme = resolveCityTheme(profile.archetype);
    this.viewModel = createCityViewModel({
      cityId: `city-${nextPlanet.id}`,
      planetId: nextPlanet.id,
      theme: cityTheme,
      layout: CITY_LAYOUT_TEMPLATE,
    });

    this.scene?.destroy();
    this.scene = new CitySceneControllerV2(this.context.host, this.viewModel, this.selectedPlanet.seed, this.settlementId);
    this.scene.mount();
    this.refreshPanel();
  }

  destroy() {
    const canvas = this.scene?.renderer.domElement;
    canvas?.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerCancel);
    window.removeEventListener('keydown', this.onKeyDown);

    this.scene?.destroy();
    this.scene = null;

    this.panel?.remove();
    this.panel = null;
    this.headerTitle = null;
    this.headerSubtitle = null;
    this.sectionMeta = null;
    this.sectionActions = null;
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.downX = event.clientX;
    this.downY = event.clientY;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;

    const clickDistance = Math.hypot(event.clientX - this.downX, event.clientY - this.downY);
    if (clickDistance < 5 && this.scene) {
      const target = this.scene.pickTarget(event.clientX, event.clientY);
      this.viewModel = {
        ...this.viewModel,
        selectedTarget: target,
      };
      this.scene.setViewModel(this.viewModel);
      this.refreshPanel();
    }

    this.pointerId = null;
  };

  private readonly onPointerCancel = () => {
    this.pointerId = null;
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.context.onRequestMode('planet3d');
    }
  };

  private mountOverlayPanel() {
    const panel = document.createElement('div');
    panel.className = 'city-panel';

    const title = document.createElement('h2');
    title.className = 'city-panel__title';

    const subtitle = document.createElement('p');
    subtitle.className = 'city-panel__subtitle';

    const meta = document.createElement('div');
    meta.className = 'city-panel__meta';

    const actions = document.createElement('div');
    actions.className = 'city-panel__actions';

    const buttonRow = document.createElement('div');
    buttonRow.className = 'city-panel__row';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'city-panel__button';
    backButton.textContent = 'Back to Planet';
    backButton.addEventListener('click', () => this.context.onRequestMode('planet3d'));

    const galaxyButton = document.createElement('button');
    galaxyButton.type = 'button';
    galaxyButton.className = 'city-panel__button city-panel__button--ghost';
    galaxyButton.textContent = 'Galaxy';
    galaxyButton.addEventListener('click', () => this.context.onRequestMode('galaxy2d'));

    buttonRow.append(backButton, galaxyButton);
    panel.append(title, subtitle, meta, actions, buttonRow);

    this.context.host.appendChild(panel);
    this.panel = panel;
    this.headerTitle = title;
    this.headerSubtitle = subtitle;
    this.sectionMeta = meta;
    this.sectionActions = actions;
    this.refreshPanel();
  }

  private refreshPanel() {
    if (!this.headerTitle || !this.headerSubtitle || !this.sectionMeta || !this.sectionActions) return;

    this.headerTitle.textContent = `${this.viewModel.cityTheme.displayName} // City View`;
    this.headerSubtitle.textContent = `Planet ${this.selectedPlanet.id.toUpperCase()} · ${this.settlementId ? `Settlement ${this.settlementId.toUpperCase()}` : "City Core"}`;

    this.sectionMeta.innerHTML = '';
    this.sectionActions.innerHTML = '';

    const builtCount = Object.values(this.viewModel.placedBuildings).filter(Boolean).length;
    const summary = document.createElement('p');
    summary.className = 'city-panel__line';
    summary.textContent = `Structures: ${builtCount}/${this.viewModel.layout.slots.length}`;
    this.sectionMeta.appendChild(summary);

    const selected = this.viewModel.selectedTarget;
    if (selected.type === 'none') {
      this.appendLine(this.sectionActions, 'Click a slot to build or inspect.');
      return;
    }

    const slot = getSlotById(this.viewModel.layout, selected.slotId);
    const placed = this.viewModel.placedBuildings[slot.id];

    if (!placed && !this.viewModel.selectableSlots.includes(slot.id)) {
      this.appendLine(this.sectionActions, `Slot ${slot.id} is locked (future expansion).`);
      return;
    }

    if (selected.type === 'slot' && !placed) {
      this.appendLine(this.sectionActions, `Build on ${slot.id}`);
      for (const buildingType of slot.allowedBuildings) {
        this.sectionActions.appendChild(this.makeActionButton(`Build ${toBuildingLabel(buildingType)}`, () => {
          this.placeBuilding(slot.id, buildingType);
        }));
      }
      return;
    }

    if (placed) {
      this.appendLine(this.sectionActions, `${BUILDING_DEFINITIONS[placed.buildingType].label} · Level ${placed.level}`);
      this.sectionActions.appendChild(this.makeActionButton('Upgrade', () => {
        this.upgradeBuilding(slot.id);
      }));
      return;
    }

    this.appendLine(this.sectionActions, 'No action available.');
  }

  private placeBuilding(slotId: CitySlotId, buildingType: BuildingType) {
    this.viewModel = {
      ...this.viewModel,
      placedBuildings: {
        ...this.viewModel.placedBuildings,
        [slotId]: { slotId, buildingType, level: 1 },
      },
      selectedTarget: { type: 'building', slotId },
    };
    this.scene?.setViewModel(this.viewModel);
    this.refreshPanel();
  }

  private upgradeBuilding(slotId: CitySlotId) {
    const placed = this.viewModel.placedBuildings[slotId];
    if (!placed) return;

    this.viewModel = {
      ...this.viewModel,
      placedBuildings: {
        ...this.viewModel.placedBuildings,
        [slotId]: { ...placed, level: placed.level + 1 },
      },
      selectedTarget: { type: 'building', slotId },
    };
    this.scene?.setViewModel(this.viewModel);
    this.refreshPanel();
  }

  private makeActionButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-panel__button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  private appendLine(container: HTMLElement, text: string) {
    const line = document.createElement('p');
    line.className = 'city-panel__line';
    line.textContent = text;
    container.appendChild(line);
  }
}
