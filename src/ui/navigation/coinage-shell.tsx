'use client';

import { useMemo, useState } from 'react';
import { getMockWorldModel } from '@/domain/world/mock-world';
import type { SelectedViewState } from '@/domain/world/types';
import { CityView } from '@/ui/city/city-view';
import { FactionView } from '@/ui/faction/faction-view';
import { MapView } from '@/ui/map/map-view';

const world = getMockWorldModel();

export function CoinageShell() {
  const [state, setState] = useState<SelectedViewState>({
    view: 'map',
    selectedSectorId: world.sectors[0]?.id ?? null,
    selectedCityId: null,
  });

  const selectedSector = useMemo(
    () => world.sectors.find((sector) => sector.id === state.selectedSectorId) ?? null,
    [state.selectedSectorId],
  );

  const selectedCity = useMemo(() => world.cities.find((city) => city.id === state.selectedCityId) ?? null, [state.selectedCityId]);

  if (state.view === 'faction' && selectedSector) {
    const faction = world.factions.find((entry) => entry.id === selectedSector.controllingFactionId) ?? null;
    const cities = world.cities.filter((city) => selectedSector.citySlots.some((slot) => slot.id === city.slotId));
    return (
      <FactionView
        sector={selectedSector}
        faction={faction}
        cities={cities}
        onBackToMap={() => setState((prev) => ({ ...prev, view: 'map' }))}
        onOpenCity={(cityId) =>
          setState((prev) => ({
            ...prev,
            view: 'city',
            selectedCityId: cityId,
          }))
        }
      />
    );
  }

  if (state.view === 'city' && selectedCity) {
    const faction = world.factions.find((entry) => entry.id === selectedCity.factionId) ?? null;
    return (
      <CityView
        city={selectedCity}
        faction={faction}
        onBackToFaction={() => setState((prev) => ({ ...prev, view: 'faction' }))}
        onBackToMap={() => setState((prev) => ({ ...prev, view: 'map' }))}
      />
    );
  }

  return (
    <MapView
      world={world}
      selectedSectorId={state.selectedSectorId}
      onSelectSector={(sectorId) =>
        setState((prev) => ({
          ...prev,
          selectedSectorId: sectorId,
          selectedCityId: null,
        }))
      }
      onEnterFactionView={() => setState((prev) => ({ ...prev, view: 'faction' }))}
    />
  );
}
