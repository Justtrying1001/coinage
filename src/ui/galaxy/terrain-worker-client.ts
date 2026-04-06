import type { ProceduralPlanetUniforms } from '@/rendering/planet/types';
import {
  generateCubeSphereTerrainBuffers,
  type GeneratedCubeSphereTerrainBuffers,
} from '@/rendering/planet/terrain/cube-sphere';

import type {
  TerrainWorkerRequest,
  TerrainWorkerResponse,
} from '@/rendering/planet/terrain/terrain-generation.worker';

export interface TerrainGenerationResult {
  buffers: GeneratedCubeSphereTerrainBuffers;
  generationMs: number;
  source: 'worker' | 'main-thread-fallback';
}

interface QueuedJob {
  id: number;
  params: ProceduralPlanetUniforms;
  resolve: (value: TerrainGenerationResult) => void;
  reject: (reason?: unknown) => void;
}

interface InFlightJob {
  id: number;
  params: ProceduralPlanetUniforms;
  resolve: (value: TerrainGenerationResult) => void;
  reject: (reason?: unknown) => void;
}

export class TerrainWorkerClient {
  private readonly maxConcurrent: number;

  private readonly worker: Worker | null;

  private readonly queue: QueuedJob[] = [];

  private readonly inFlight = new Map<number, InFlightJob>();

  private nextJobId = 1;

  private terminated = false;

  private workerHealthy = true;

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = Math.max(1, maxConcurrent);

    if (typeof Worker === 'undefined') {
      this.worker = null;
      this.workerHealthy = false;
      return;
    }

    this.worker = new Worker(
      new URL('../../rendering/planet/terrain/terrain-generation.worker.ts', import.meta.url),
      { type: 'module' },
    );

    this.worker.onmessage = (event: MessageEvent<TerrainWorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };

    this.worker.onerror = () => {
      this.workerHealthy = false;
      this.flushQueuedAsFallback();
    };
  }

  enqueue(params: ProceduralPlanetUniforms): Promise<TerrainGenerationResult> {
    if (this.terminated) {
      return Promise.reject(new Error('terrain-worker-client-terminated'));
    }

    if (!this.worker || !this.workerHealthy) {
      return Promise.resolve(this.generateFallback(params));
    }

    return new Promise<TerrainGenerationResult>((resolve, reject) => {
      const job: QueuedJob = {
        id: this.nextJobId,
        params,
        resolve,
        reject,
      };

      this.nextJobId += 1;
      this.queue.push(job);
      this.pumpQueue();
    });
  }

  getQueueDepth(): number {
    return this.queue.length;
  }

  getInFlightCount(): number {
    return this.inFlight.size;
  }

  dispose(): void {
    this.terminated = true;

    this.worker?.terminate();
    this.inFlight.forEach(({ reject }) => reject(new Error('terrain-worker-client-disposed')));
    this.inFlight.clear();

    while (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.reject(new Error('terrain-worker-client-disposed'));
    }
  }

  private handleWorkerMessage(response: TerrainWorkerResponse): void {
    const current = this.inFlight.get(response.jobId);
    if (!current) {
      return;
    }

    this.inFlight.delete(response.jobId);

    if (!response.ok) {
      this.workerHealthy = false;
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[GalaxyPerf] Terrain worker failed, switching to main-thread fallback:', response.error);
      }
      current.resolve(this.generateFallback(current.params));
      this.flushQueuedAsFallback();
      return;
    }

    current.resolve({
      buffers: response.buffers,
      generationMs: response.durationMs,
      source: 'worker',
    });

    this.pumpQueue();
  }

  private pumpQueue(): void {
    if (!this.worker || !this.workerHealthy || this.terminated) {
      return;
    }

    while (this.inFlight.size < this.maxConcurrent && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        break;
      }

      this.inFlight.set(job.id, {
        id: job.id,
        params: job.params,
        resolve: job.resolve,
        reject: job.reject,
      });

      const payload: TerrainWorkerRequest = {
        jobId: job.id,
        params: job.params,
      };
      this.worker.postMessage(payload);
    }
  }

  private flushQueuedAsFallback(): void {
    while (this.queue.length > 0) {
      const queued = this.queue.shift();
      if (!queued) {
        continue;
      }

      queued.resolve(this.generateFallback(queued.params));
    }

    this.inFlight.forEach((entry) => {
      entry.resolve(this.generateFallback(entry.params));
    });
    this.inFlight.clear();
  }

  private generateFallback(params: ProceduralPlanetUniforms): TerrainGenerationResult {
    const startedAt = performance.now();
    const buffers = generateCubeSphereTerrainBuffers(params);
    const generationMs = performance.now() - startedAt;

    return {
      buffers,
      generationMs,
      source: 'main-thread-fallback',
    };
  }

}
