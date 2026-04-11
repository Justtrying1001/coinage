# Coinage Planet Engine Migration Audit (Design-Only)

Date: 2026-04-11
Scope: analysis + migration design only (no implementation)
Implementation status: ✅ Migrated in follow-up commits (`src/game/planet/*` now active; legacy `planetBeauty` and `planetPostFx` removed).

## 1) Executive summary
Coinage currently ships a compact, deterministic, shader-driven `Planet3DMode` rendered directly with Three.js and composed into a mode controller architecture (`galaxy2d` <-> `planet3d`). The donor project (`XenoverseUp/procedural-planets`) has a richer procedural engine centered on cube-face terrain generation, GPGPU vertex generation, and reusable planet/atmosphere shader stages.

Recommended path: keep Coinage shell + mode lifecycle intact, and replace only the internal planet renderer stack with an adapted donor-style engine module exposed behind a thin scene host boundary. Preserve Coinage’s seed/archetype identity model, but map those deterministic presets to donor-style noise-layer + gradient + material params.

## 2) Current Coinage planet architecture (audit)

### Planet rendering
- Entry point and runtime ownership are in `Planet3DMode`, which creates renderer, scene, camera, starfield, and the planet mesh directly. `EffectComposer` is used via a dedicated post-fx helper. (`src/game/render/modes/Planet3DMode.ts`)
- Planet geometry is currently one `SphereGeometry(1, 128, 128)` with vertex displacement in shader. (`src/game/render/modes/Planet3DMode.ts`)

### Planet generation
- Procedural identity comes from `planetProfileFromSeed(seed)` and archetype config ranges in galaxy generator code. (`src/game/world/galaxyGenerator.ts`)
- `createPlanetBeautyUniforms(profile, seed)` maps profile+seed into shader uniforms, atmosphere params, and bloom settings. (`src/game/render/shaders/planetBeauty.ts`)

### Planet shaders
- Shader source strings are embedded in TS: surface vertex/fragment + atmosphere point-cloud shaders + inline simplex/fractal helpers. (`src/game/render/shaders/planetBeauty.ts`)
- Terrain shape comes from shader-side fBM/simplex and archetype-specific constants (`PRESETS`). (`src/game/render/shaders/planetBeauty.ts`)

### Planet post-processing
- Post stack is `RenderPass + UnrealBloomPass + OutputPass`. (`src/game/render/postfx/planetPostFx.ts`)
- Bloom parameters are per-planet from beauty uniform bundle. (`src/game/render/modes/Planet3DMode.ts`, `src/game/render/shaders/planetBeauty.ts`)

### Planet view integration
- React host (`GameRenderViewport`) owns `CoinageRenderApp` lifecycle, while render app switches mode controllers and drives RAF/resize. (`src/components/game/GameRenderViewport.tsx`, `src/game/app/CoinageRenderApp.ts`)
- `GameShell` controls high-level UI mode toggle and selected planet state. (`src/components/game/GameShell.tsx`)

### Seed/archetype/config flow
- Global galaxy seed -> generated nodes each with deterministic planet seed (`hashPlanetSeed`). (`src/game/world/galaxyGenerator.ts`)
- Planet seed -> deterministic archetype + profile -> deterministic shader uniforms. (`src/game/world/galaxyGenerator.ts`, `src/game/render/shaders/planetBeauty.ts`)
- RNG primitive is `SeededRng` (LCG). (`src/game/world/rng.ts`)

### Lifecycle/mode switching
- `CoinageRenderApp` switches between `Galaxy2DMode` and `Planet3DMode`, preserves galaxy view snapshot, and supports re-selection while already in planet mode. (`src/game/app/CoinageRenderApp.ts`)
- Planet mode can request back navigation on `Escape` or button. (`src/game/render/modes/Planet3DMode.ts`)

## 3) Donor architecture summary (what is reusable)

### Generation core
- Core model is six terrain faces over cube directions, assembled into a sphere-like planet (face-by-face generation). (`src/components/planet-gpu/planet-gpu.tsx`, donor)
- Elevation synthesis is layered noise filters (simple + ridgid), optional first-layer masking, and min/max tracking. (`src/lib/noise.ts`, `src/components/planet-cpu/mesh-generation.ts`, donor)

### GPU terrain generation
- Donor GPU path runs a compute-like render pass (`vertex-compute.fs`) into float render targets, then reads back positions+elevation and builds mesh buffers. (`src/components/planet-gpu/terrain-face.tsx`, `src/lib/gpu-compute.ts`, `src/glsl/compute/vertex-compute.fs`, donor)
- This is WebGL-compatible GPGPU, not WebGPU-only.

### CPU fallback
- CPU fallback mirrors same face model and noise logic in `MeshGenerator`. (`src/components/planet-cpu/mesh-generation.ts`, `src/components/planet-cpu/terrain-face.tsx`, donor)
- Useful as reliability path (unsupported float readback / mobile regressions / deterministic tests).

### Atmosphere
- Donor atmosphere is a dedicated shell mesh with additive blending and simple view-dependent intensity shader. (`src/components/atmosphere/atmosphere.tsx`, `src/glsl/atmosphere/*`, donor)
- Coinage can adapt this into current mode without donor editor dependencies.

### Noise/filter utilities
- Reusable data model: `SimpleNoiseFilter`, `RidgidNoiseFilter`, filter layering and masking semantics. (`src/lib/noise.ts`, donor)
- Reusable helpers: vector constants, min/max accumulator, cube->sphere mapping helper (`spherize`). (`src/lib/vector.ts`, `src/lib/min-max.ts`, `src/lib/spherize.ts`, donor)

### Shaders
- Reusable shader families:
  - compute vertex generation (`glsl/compute/*`)
  - planet material shaders (`glsl/planet/*`)
  - atmosphere shaders (`glsl/atmosphere/*`)
  (donor)

## 4) Donor parts that should NOT be imported
Do not import the following systems into Coinage:
- Editor shell + HUD + toolbar + control panel workflows. (`src/components/editor/*`, donor)
- Sidebar + UI control widgets for live authoring. (`src/components/ui/sidebar.tsx` and related UI atoms, donor)
- Showcase-only stage, film/polaroid presentation, fun-fact naming surface. (`src/components/showcase/*`, donor)
- Jotai editor-global state layer for live controls. (`src/atoms/settings.ts`, `src/atoms/showcase.ts`, donor)
- Capture/export tooling (screenshots + OBJ export flows). (`src/components/util/capture.tsx`, `src/lib/export-mesh.ts`, donor)
- Misc donor-specific app/tooling dependencies unrelated to runtime planet rendering.

## 5) Recommended target architecture inside Coinage

### A. Keep Coinage shell intact
Keep these as-is conceptually:
- `GameShell` (mode toggle, selected planet app state)
- `GameRenderViewport` (React host wrapper)
- `CoinageRenderApp` mode lifecycle and mode callbacks
- `Galaxy2DMode` and existing galaxy generation/selection flow

### B. Replace internal planet engine behind a thin integration boundary
Use a thin non-React scene host inside `Planet3DMode`:
- `Planet3DMode` remains the mode adapter only (mount/resizer/update/dispose/input/back button/inspect panel)
- Planet creation/rendering delegated to `PlanetRuntime` (new engine module)

### C. Recommended folder/module structure
Proposed structure:
- `src/game/planet/runtime/PlanetRuntime.ts` (renderer+scene owner for planet subsystem)
- `src/game/planet/runtime/PlanetScene.ts` (planet root, starfield, light rig, camera rig helpers)
- `src/game/planet/generation/PlanetGenerator.ts` (high-level generate entry)
- `src/game/planet/generation/gpu/GpuTerrainGenerator.ts`
- `src/game/planet/generation/cpu/CpuTerrainGenerator.ts`
- `src/game/planet/generation/noise/NoiseFilter.ts`
- `src/game/planet/generation/noise/NoisePresets.ts`
- `src/game/planet/generation/noise/seededNoise.ts` (deterministic seeding adapter)
- `src/game/planet/materials/PlanetMaterial.ts`
- `src/game/planet/materials/AtmosphereMaterial.ts`
- `src/game/planet/shaders/compute/*.glsl.ts` (or raw glsl files, depending on build strategy)
- `src/game/planet/shaders/planet/*.glsl.ts`
- `src/game/planet/shaders/atmosphere/*.glsl.ts`
- `src/game/planet/postfx/PlanetPostFx.ts`
- `src/game/planet/presets/archetypes.ts` (Coinage canonical archetype presets)
- `src/game/planet/types.ts` (engine-facing config contracts)
- `src/game/planet/utils/{minMax,vector,spherize,clamp}.ts`

### D. Seed/archetype/config flow (target)
- Keep galaxy-level seed/node generation untouched.
- Keep planet selection contract (`SelectedPlanetRef` with `seed`).
- Add deterministic mapping layer:
  - `planetProfileFromSeed(seed)` -> `PlanetArchetypeProfile`
  - `PlanetArchetypeProfile + seed` -> `PlanetGenerationConfig`
  - `PlanetGenerationConfig` -> GPU/CPU terrain + material uniforms + postfx values
- Mode code should pass only `{seed, archetype/profile?}` into runtime; runtime should not read global app state.

### E. Integration approach
Prefer a thin scene host (non-R3F) because Coinage currently owns raw Three.js lifecycle centrally. This avoids introducing React reconciler complexity inside mode controllers and keeps migration scope controlled.

## 6) Archetype preset model design (Coinage canonical)
For each archetype (`oceanic`, `terrestrial`, `arid`, `frozen`, `volcanic`, `mineral`, `barren`), define deterministic preset bundles with:

1. `generation`
- `baseRadius`
- `resolution` (or quality tiers)
- `filters[]` (simple/ridgid, strength, roughness, persistence, baseRoughness, minValue, layerCount, mask flag)
- `ridgeWarp`, `craterBias`, `macroMaskWeight`

2. `surface`
- `elevationGradient[]`
- `depthGradient[]`
- `blendMode` (smooth/harsh thresholds)
- `metalnessCurve`, `roughnessCurve`

3. `atmosphere`
- `enabled`
- `color`
- `intensity`
- `falloff`
- `shellScale`

4. `postfx`
- `bloom {strength, radius, threshold}`
- optional tone exposure override

5. `metadata`
- tag generation hints for inspect chips
- tuning ranges for seeded perturbation

Archetype intent examples:
- `oceanic`: lower macro relief, deeper depth gradient contrast, stronger atmosphere scattering.
- `terrestrial`: balanced elevation bands and moderate atmosphere.
- `arid`: high ridge masks, desaturated depth, thin atmosphere.
- `frozen`: flatter highlands with bright elevation caps, cool atmosphere tint.
- `volcanic`: ridgid-heavy filters, emissive-biased hot bands.
- `mineral`: metallic response bias and stepped strata colors.
- `barren`: dry low-ocean profile, sparse atmosphere, crater-forward masking.

## 7) Determinism plan

### Deterministic rule
- Hard requirement: same `seed + archetype preset schema version + quality tier` => identical mesh and material output.

### Remove non-deterministic randomness
- Eliminate `Math.random()` in render path (donor currently uses random seed refs in places).
- Replace all random centers/jitters with seeded PRNG draws derived from stable hash streams:
  - stream A: macro terrain filters
  - stream B: material hue/gradient perturbation
  - stream C: atmosphere particle/shell params
- Keep stream splitting explicit to avoid output drift when adding parameters.

### Seeded variation location
- Variation only at config build stage (before generation), never from frame time.
- Runtime animation (`time`) may animate appearance but must not alter persistent planet identity geometry.
- If fallback path used (CPU/GPU), enforce equivalent equations and precision policy to minimize divergence; allow tiny float epsilon differences only.

## 8) Exact migration plan with files

### Files to add (planned)
- `src/game/planet/types.ts`
- `src/game/planet/runtime/PlanetRuntime.ts`
- `src/game/planet/runtime/PlanetScene.ts`
- `src/game/planet/generation/PlanetGenerator.ts`
- `src/game/planet/generation/gpu/GpuTerrainGenerator.ts`
- `src/game/planet/generation/cpu/CpuTerrainGenerator.ts`
- `src/game/planet/generation/noise/NoiseFilter.ts`
- `src/game/planet/generation/noise/NoisePresets.ts`
- `src/game/planet/generation/noise/seededNoise.ts`
- `src/game/planet/materials/PlanetMaterial.ts`
- `src/game/planet/materials/AtmosphereMaterial.ts`
- `src/game/planet/shaders/compute/buffer.vs` (or `.ts` string module)
- `src/game/planet/shaders/compute/vertex-compute.fs`
- `src/game/planet/shaders/planet/planet.vs`
- `src/game/planet/shaders/planet/planet.fs`
- `src/game/planet/shaders/atmosphere/atmosphere.vs`
- `src/game/planet/shaders/atmosphere/atmosphere.fs`
- `src/game/planet/postfx/PlanetPostFx.ts`
- `src/game/planet/presets/archetypes.ts`
- `src/game/planet/utils/minMax.ts`
- `src/game/planet/utils/vector.ts`
- `src/game/planet/utils/spherize.ts`

### Files to modify (planned)
- `src/game/render/modes/Planet3DMode.ts`
  - strip direct shader/mesh construction
  - delegate to `PlanetRuntime`
- `src/game/render/types.ts`
  - add planet engine config contracts/version markers as needed
- `src/game/world/galaxyGenerator.ts`
  - keep profile generation, but map to new preset config adapter hooks
- `src/game/app/CoinageRenderApp.ts`
  - minimal changes only if new runtime init params are required

### Files to delete/deprecate (planned)
- `src/game/render/shaders/planetBeauty.ts` (fully replaced by new planet module)
- `src/game/render/postfx/planetPostFx.ts` (moved to new planet module)

### Dependencies to add (if needed)
Minimal path (preferred):
- add `simplex-noise` (for deterministic CPU-side mirror and config tooling)

Optional path (only if chosen):
- `three-custom-shader-material` if you choose donor material composition style (not required if staying with raw `ShaderMaterial`)

Avoid adding donor UI stack dependencies (`jotai`, `framer-motion-3d`, Radix UI set, capture/export stack) for this migration.

### Implementation order
1. Introduce new `src/game/planet/*` scaffolding and types.
2. Port deterministic noise/filter model and utility helpers.
3. Port GPU terrain generator with Coinage-compatible shader loading strategy.
4. Port CPU fallback and parity tests (seed snapshots).
5. Port planet material + atmosphere shaders.
6. Port postfx to new module.
7. Refactor `Planet3DMode` to use `PlanetRuntime` adapter.
8. Wire archetype mapping from Coinage profile -> new generation config.
9. Remove legacy `planetBeauty` and legacy postfx modules.
10. Run visual parity checks + deterministic snapshot tests.

## 9) Risks / caveats
- **Shader pipeline mismatch risk**: donor uses Vite raw shader imports and R3F patterns; Coinage uses Next + direct Three. Need explicit asset/shader loading strategy.
- **GPU readback compatibility risk**: float render target + `readRenderTargetPixels` can vary by platform; fallback path is mandatory.
- **Determinism drift risk**: introducing new params without stream-splitting can shift all old outputs.
- **Performance risk**: high mesh resolution across six faces can exceed current single-sphere cost.
- **State ownership risk**: importing donor Jotai-first architecture would conflict with Coinage mode controllers; avoid it.
- **Visual expectation risk**: donor editor is tuned for authoring; runtime presets need rebalancing for Coinage’s inspect fantasy.
