import type { CitySlotDefinition } from '@/game/city/data/citySlots';

export interface CityLayoutTemplate {
  id: 'mvp-frozen-ring';
  slots: CitySlotDefinition[];
}

export const CITY_LAYOUT_TEMPLATE: CityLayoutTemplate = {
  id: 'mvp-frozen-ring',
  slots: [
    {
      id: 'slot-hq-core',
      position: { x: 0, y: 0, z: 0 },
      rotationY: 0,
      category: 'hq',
      allowedBuildings: ['hq'],
      scale: 1.12,
    },
    {
      id: 'slot-econ-west',
      position: { x: -8, y: 0, z: -3.5 },
      rotationY: 0.22,
      category: 'economic',
      allowedBuildings: ['mine', 'quarry', 'refinery', 'warehouse'],
    },
    {
      id: 'slot-econ-east',
      position: { x: 8, y: 0, z: -3.2 },
      rotationY: -0.2,
      category: 'economic',
      allowedBuildings: ['mine', 'quarry', 'refinery', 'warehouse'],
    },
    {
      id: 'slot-utility-north',
      position: { x: -2.4, y: 0, z: -9.2 },
      rotationY: 0.12,
      category: 'utility',
      allowedBuildings: ['refinery', 'warehouse', 'housing'],
    },
    {
      id: 'slot-utility-south',
      position: { x: 2.6, y: 0, z: 8.4 },
      rotationY: -0.14,
      category: 'utility',
      allowedBuildings: ['warehouse', 'housing', 'refinery'],
    },
    {
      id: 'slot-mixed-northwest',
      position: { x: -9.5, y: 0, z: 5.8 },
      rotationY: 0.36,
      category: 'mixed',
      allowedBuildings: ['mine', 'quarry', 'warehouse', 'housing'],
    },
    {
      id: 'slot-mixed-southeast',
      position: { x: 9.8, y: 0, z: 5.6 },
      rotationY: -0.34,
      category: 'mixed',
      allowedBuildings: ['mine', 'quarry', 'refinery', 'housing'],
    },
    {
      id: 'slot-future-northeast',
      position: { x: 10.6, y: 0, z: -9.4 },
      rotationY: -0.08,
      category: 'future',
      startsLocked: true,
      unlockAtLevel: 5,
      allowedBuildings: ['refinery', 'warehouse', 'housing'],
    },
  ],
};
