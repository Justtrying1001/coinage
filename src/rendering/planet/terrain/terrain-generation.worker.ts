import type { ProceduralPlanetUniforms } from '../types';
import {
  generateCubeSphereTerrainBuffers,
  type GeneratedCubeSphereTerrainBuffers,
} from './cube-sphere';

const workerScope = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent<TerrainWorkerRequest>) => void) | null;
};

interface TerrainWorkerRequest {
  jobId: number;
  params: ProceduralPlanetUniforms;
}

interface TerrainWorkerSuccess {
  jobId: number;
  ok: true;
  durationMs: number;
  buffers: GeneratedCubeSphereTerrainBuffers;
}

interface TerrainWorkerError {
  jobId: number;
  ok: false;
  error: string;
}

type TerrainWorkerResponse = TerrainWorkerSuccess | TerrainWorkerError;

workerScope.onmessage = (event: MessageEvent<TerrainWorkerRequest>) => {
  const { jobId, params } = event.data;

  try {
    const startedAt = performance.now();
    const buffers = generateCubeSphereTerrainBuffers(params);
    const durationMs = performance.now() - startedAt;

    const payload: TerrainWorkerSuccess = {
      jobId,
      ok: true,
      durationMs,
      buffers,
    };

    workerScope.postMessage(payload, [
      buffers.indices.buffer,
      buffers.positions.buffer,
      buffers.colors.buffer,
      buffers.terrain.buffer,
      buffers.terrainAux.buffer,
      buffers.terrainGeo.buffer,
      buffers.terrainRegion.buffer,
    ]);
  } catch (error) {
    const payload: TerrainWorkerError = {
      jobId,
      ok: false,
      error: error instanceof Error ? error.message : 'unknown-worker-error',
    };
    workerScope.postMessage(payload);
  }
};

export type { TerrainWorkerRequest, TerrainWorkerResponse, TerrainWorkerSuccess, TerrainWorkerError };
