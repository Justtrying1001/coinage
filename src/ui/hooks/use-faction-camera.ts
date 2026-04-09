'use client';

import { useMapCamera } from './use-map-camera';

export function useFactionCamera() {
  return useMapCamera({ minZoom: 0.8, maxZoom: 2.8, initialZoom: 1.1 });
}
