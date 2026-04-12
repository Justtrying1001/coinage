# Galaxy2D -> Planet3D Transition Performance Report

## Scope
Hot path only: entering Planet 3D from Galaxy 2D.

## Synchronous bottlenecks identified (pre-change)
1. Mode switch destroyed and recreated full Planet runtime every entry (renderer + postfx + generator allocation).
2. `PlanetRuntime.rebuildFromSeed` synchronously generated full-resolution terrain before first visible frame.
3. `PlanetGenerator.generate` synchronously executed:
   - six face generations (GPU or CPU fallback)
   - geometry merge
   - `mergeVertices`
   - `computeVertexNormals`
4. PostFX was active from frame zero, adding extra composition cost before first useful image.

## Instrumentation added
The following `performance.mark/measure` spans now exist:

- `perf:mode-switch:<from>-><to>`
- `perf:planet3d-mount`
- `perf:renderer-creation`
- `perf:rebuildFromSeed`
- `perf:face-generation:<i>`
- `perf:face-generation:<i>:gpu`
- `perf:face-generation:<i>:cpu-fallback`
- `perf:geometry-merge`
- `perf:mergeVertices`
- `perf:computeVertexNormals`
- `perf:first-render-latency`

## Implemented optimizations
1. **Persistent Planet runtime**
   - Planet mode now reuses the same runtime across mode toggles (detach/reattach canvas instead of destroy/recreate).
2. **Seed-based LRU cache (generator output)**
   - Added LRU cache for generated mesh assets keyed by deterministic config (`seed`, `resolution`, archetype, surface mode).
3. **Low-quality first frame + progressive refinement**
   - Initial preview generation uses lower resolution.
   - Full-resolution regeneration is deferred asynchronously right after first interactive frame.
4. **Shader prewarm (best effort)**
   - Uses `renderer.compileAsync(scene, camera)` when available.
5. **Defer postfx until visible**
   - First render uses direct renderer path.
   - PostFX enabled after first visible frame.

## Before/after timing status
- **In this headless CI environment**: browser GPU timings are not available.
- **In browser runtime**: use the spans above in DevTools Performance to get exact before/after numbers on target hardware.

## Remaining bottlenecks
1. Full-resolution refinement remains CPU/GPU heavy for high-res planets.
2. CPU fallback path can still spike on weaker/unsupported GPUs.
3. Settlement slot generation still runs after geometry generation and can add tail latency.

## Recommended next steps
1. Move CPU face generation and settlement-slot generation to a Web Worker.
2. Add adaptive resolution heuristic based on device class and prior frame time.
3. Add telemetry aggregation for the `perf:*` measures and track p50/p95 in production.
4. Optional: lazy-load Planet 3D module graph if initial page JS size is a startup bottleneck.
