import type { NoiseFilterConfig } from '@/game/planet/types';
import type { Vector3Tuple } from '@/game/planet/utils/vector';
import { generateCpuFace } from '@/game/planet/generation/cpu/faceGenerationCore';

interface GenerateFacesMessage {
  type: 'generate_faces';
  requestId: number;
  resolution: number;
  filters: NoiseFilterConfig[];
  seed: number;
  faceDirections: Vector3Tuple[];
}

interface WorkerFaceResult {
  positions: Float32Array;
  elevations: Float32Array;
  indices: Uint32Array;
}

const workerScope: Worker = self as unknown as Worker;

workerScope.onmessage = (event: MessageEvent<GenerateFacesMessage>) => {
  if (!event.data || event.data.type !== 'generate_faces') return;

  const start = performance.now();
  const { requestId, resolution, filters, seed, faceDirections } = event.data;
  const faces: WorkerFaceResult[] = [];
  const perFaceMs: number[] = [];

  for (const direction of faceDirections) {
    const faceStart = performance.now();
    faces.push(generateCpuFace(direction, resolution, filters, seed));
    perFaceMs.push(performance.now() - faceStart);
  }

  const transferables: Transferable[] = [];
  for (const face of faces) {
    transferables.push(face.positions.buffer, face.elevations.buffer, face.indices.buffer);
  }

  workerScope.postMessage(
    {
      type: 'generate_faces_result',
      requestId,
      faces,
      totalMs: performance.now() - start,
      perFaceMs,
    },
    transferables,
  );
};

export {};
