import type * as THREE from 'three';

export type PlanetSlotState = 'empty';

export interface PlanetSettlementSlot {
  id: string;
  index: number;
  position: [number, number, number];
  normal: [number, number, number];
  elevation: number;
  slope: number;
  habitability: number;
  latitude: number;
  longitude: number;
  state: PlanetSlotState;
}

export interface PlanetSlotRenderItem {
  slot: PlanetSettlementSlot;
  decalMesh: THREE.Mesh;
  beaconMesh: THREE.Mesh;
  pickMesh: THREE.Mesh;
}

export interface PlanetSlotRenderState {
  root: THREE.Group;
  items: PlanetSlotRenderItem[];
}
