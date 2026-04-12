import type { PlanetArchetype } from '@/game/render/types';
import type { PlanetCitySlot } from '@/game/planet/slots/types';

const OCCUPANCY_BY_ARCHETYPE: Record<PlanetArchetype, number> = {
  terrestrial: 0.42,
  jungle: 0.43,
  arid: 0.32,
  mineral: 0.36,
  frozen: 0.3,
  volcanic: 0.27,
  barren: 0.25,
  oceanic: 0.28,
};

export function applyDemoSlotOccupancy(
  slots: PlanetCitySlot[],
  seed: number,
  archetype: PlanetArchetype,
): PlanetCitySlot[] {
  if (slots.length === 0) return [];
  const targetRatio = OCCUPANCY_BY_ARCHETYPE[archetype];
  const occupantTarget = Math.max(1, Math.round(slots.length * targetRatio));

  const ranked = slots
    .map((slot) => ({ slot, roll: hash01(seed ^ 0x2f5b08d3, slot.index) }))
    .sort((a, b) => a.roll - b.roll);

  const occupiedIds = new Set(ranked.slice(0, occupantTarget).map((entry) => entry.slot.id));

  return slots.map((slot) => {
    if (!occupiedIds.has(slot.id)) {
      return {
        ...slot,
        state: 'empty',
        occupant: undefined,
      };
    }

    const label = buildOccupantLabel(seed, slot.index);
    return {
      ...slot,
      state: 'occupied',
      occupant: {
        id: `occ-${slot.id}`,
        label,
      },
    };
  });
}

function buildOccupantLabel(seed: number, index: number) {
  const n = Math.floor(hash01(seed ^ 0x96e3b7d1, index) * 26);
  const letter = String.fromCharCode(65 + n);
  const code = Math.floor(hash01(seed ^ 0x74f1d54b, index + 17) * 9) + 1;
  return `Colony ${letter}${code}`;
}

function hash01(seed: number, index: number) {
  const mixed = Math.imul((seed ^ (index * 0x9e3779b9)) >>> 0, 1597334677) >>> 0;
  return mixed / 0xffffffff;
}
