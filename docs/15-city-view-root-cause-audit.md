# City View Root-Cause Audit (Planet ↔ City Visual Pipeline)

## 1) Executive Summary

- Planet View is built from a seed-driven procedural pipeline (profile → generation config → procedural geometry → custom shader material → postfx), while City View is currently a handcrafted board scene with only a thin theme switch.
- City View does **not** inherit the planet’s actual biome/relief/material state; it inherits mostly `archetype` and then maps that to `frozen` vs `neutral`, dropping most profile signals.
- Planet relief comes from layered noise filters on a cube-sphere with per-vertex elevation, while City relief comes from a single plane deformation formula plus a large rectangular shelf mesh, which reads as a stage.
- Planet coloration is shader-driven with elevation/depth gradients, wetness, vegetation, emissive volcanic logic, and slope-aware lighting; City uses simple `MeshStandardMaterial` colors with no terrain shader logic.
- Planet uses postfx (`EffectComposer` + bloom + tuned exposure) and space framing; City uses direct render with fixed exposure and no bloom composer path.
- City slot/pad/building composition is structurally “board game”: fixed layout template, repeated platform pads, primitive proxy buildings, and a fixed camera that emphasizes the board.
- There is no true planet→city continuity: city entry passes settlement id, but City renderer does not receive settlement surface normal/elevation/local biome slice data.
- Root cause: current City renderer is a separate scene architecture, not a local planetary surface-slice renderer.

## 2) How Planet View Works Today

### 2.1 Seed → Planet profile

`planetProfileFromSeed(seed)` builds `PlanetVisualProfile` from a seeded RNG and archetype-specific ranges. It outputs:

- archetype
- oceanLevel
- roughness
- metalness
- reliefStrength
- reliefSharpness
- continentScale
- ridgeScale
- craterScale
- lightIntensity
- atmosphereLightness
- macroBias
- ridgeWeight
- craterWeight
- polarWeight
- humidityStrength
- emissiveIntensity

This is generated in `src/game/world/galaxyGenerator.ts` and typed in `src/game/render/types.ts`.

### 2.2 Runtime rebuild pipeline

At runtime (`PlanetRuntime.rebuildFromSeed`):

1. Seed → `planetProfileFromSeed`
2. Profile → `createPlanetGenerationConfig`
3. Config → `PlanetGenerator.generate` (geometry + material)
4. Generated geometry → `generateSettlementSlots`
5. Settlement slot visuals layered via `SettlementSlotLayer`
6. Postfx configured (`setBloom`) + tone mapping exposure set from config

Key file chain:

- `src/game/planet/runtime/PlanetRuntime.ts`
- `src/game/planet/presets/archetypes.ts`
- `src/game/planet/generation/PlanetGenerator.ts`
- `src/game/planet/runtime/SettlementSlots.ts`
- `src/game/planet/postfx/PlanetPostFx.ts`

### 2.3 Profile → generation config

`createPlanetGenerationConfig` merges archetype preset + profile + jitter:

- chooses resolution (`128` base / `144` high detail)
- adjusts filter strength/roughness/minValue/centers/layers
- computes `surfaceMode` (`water`, `ice`, `lava`)
- computes `surfaceLevel01` (low-surface coverage)
- computes material properties (roughness, metalness, vegetationDensity, wetness, canopy tint, slope/basin/upland/peak tuning, micro-relief/noise, volcanic emissive and fissure controls)
- computes postfx exposure from `lightIntensity`

So profile variables are not decorative—they actively alter geometry, material, and mood.

### 2.4 Planet geometry generation

`PlanetGenerator` builds a cube-sphere by generating 6 faces (`FACE_DIRECTIONS`) and merging.

- Primary path: GPU face generation (`GpuTerrainGenerator`) rendering a compute fragment shader into float render targets, then readback positions + elevations.
- Fallback path: CPU face generation (`CpuTerrainGenerator`) using same filter model.
- Both produce:
  - `positions`
  - `aElevation` attribute
  - `indices`

Noise logic:

- layered filters (`simple` + `ridgid`), with mask from first layer and optional ridged behavior
- unscaled elevation is accumulated, then scaled/clamped

After merge:

- vertex dedupe
- submerged relief compression (`applySubmergedReliefCompression`) to shape underwater lowlands
- normal recompute

**What “relief” means concretely**: displacement magnitude and distribution from layered seeded noise filters (frequency, roughness, persistence, minValue, masking), then secondary compression/reshaping for submerged regions.

### 2.5 Planet material/color pipeline

Planet uses a custom `ShaderMaterial` (`createPlanetMaterial`), not stock PBR material.

Core richness sources:

- elevation and depth gradients sampled by normalized height bands
- land/water/ice/lava blending driven by `surfaceLevel01` and blend depth
- macro+micro procedural breakup in shader (noise/fbm)
- slope/basin/upland/peak masks
- archetype toggles (`uDryArchetype`, `uJungleArchetype`)
- vegetation and canopy tint modulation
- coast treatment, shallow brightness, shadow tinting
- micro normal perturbation + micro albedo breakup
- volcanic fissures/hotspots/lava/emissive logic
- custom light response (key/fill/hemi/fresnel/spec variants)

This pipeline gives depth, biome identity, and tonal complexity.

### 2.6 Planet postfx/mood

Planet mood comes from:

- starfield backdrop in `PlanetScene`
- dark space background color
- ACES tone mapping with profile-adjusted exposure
- bloom pipeline (`EffectComposer` + `UnrealBloomPass` + `OutputPass`)
- slightly animated starfield for life/parallax feel

This contributes to “premium” presentation beyond mesh quality.

## 3) How City View Works Today

### 3.1 Data and entry path

City mode is entered from Planet mode by settlement double-click. `CoinageRenderApp` forwards selected planet + settlement id into `City3DMode`.

But City setup only uses:

- `planetProfileFromSeed(seed)` to resolve theme by archetype
- static city layout template
- default placed HQ

There is no transfer of settlement surface data (normal/elevation/lat/long/habitability) into city rendering.

### 3.2 Theme model

`resolveCityTheme(archetype)` maps only:

- `frozen` archetype → `frozen` city theme
- everything else → `neutral`

This collapses eight archetypes and all profile dimensions into 2 coarse presets.

### 3.3 Scene scaffold

`createCityScene(theme, seed)` creates a standalone scene:

- background + fog from theme
- procedural terrain patch from one plane (`PlaneGeometry`) deformed by hardcoded sin/cos + one crater + one plateau + random jitter
- large box “shelf” under terrain
- `addIceOutcrops` called unconditionally (even non-frozen)
- generic hemi + ambient + two directional lights

No postfx composer, no biome shader, no planet-derived surface params.

### 3.4 Slot and building composition

`CitySceneController.buildStaticScene` builds every slot as:

- cylinder pad
- cylinder deck
- ring trim
- four box supports
- child root for building

Slots are from fixed coordinates in `CITY_LAYOUT_TEMPLATE`.

Buildings come from `CityAssetRegistry` and are primitive kits (boxes/cylinders/sphere) with simple standard materials and slight emissive accents.

### 3.5 Camera and render path

City camera is fixed at `(24, 19, 22)` looking near center with FOV 38, reinforcing a tabletop read.

Render path is direct `renderer.render(scene, camera)` (no bloom composer), exposure fixed to `1.12`.

## 4) Planet vs City Gap Analysis

### Geometry / relief

- **Planet**: seed-driven cube-sphere displacement, high vertex count, profile-aware relief.
- **City**: single local plane with canned height formula + stage shelf.
- **Loss**: City has no macro geological continuity with planet and reads as an authored board.

### Material / shader

- **Planet**: custom terrain shader with elevation/depth gradients, biome masks, micro detail, emissive logic.
- **City**: `MeshStandardMaterial` flat tint materials, no elevation/depth pipeline.
- **Loss**: surface richness collapses to flat plastic/metal look.

### Color / biome inheritance

- **Planet**: full profile drives material + lighting + surface mode.
- **City**: profile mostly discarded; only archetype→2-theme mapping.
- **Loss**: frozen/arid/volcanic/mineral/jungle/terrestrial distinctions disappear.

### Atmosphere / framing

- **Planet**: starfield, tuned postfx bloom/exposure, space composition.
- **City**: fog + static lighting only; no postfx chain.
- **Loss**: less depth and cinematic separation.

### Composition

- **Planet**: whole object read with natural silhouette.
- **City**: rectangular terrain + visible shelf + ring slots + supports + static camera.
- **Loss**: “detached platform” and “prototype board” perception.

### Slot/pad/building language

- **Planet**: markers are lightweight UI layer over world surface.
- **City**: pads are dominant geometry; buildings are proxy primitives.
- **Loss**: colony feels like markers on a board, not embedded infrastructure.

## 5) Root Causes

### RC1 — Missing biome-data inheritance (pipeline disconnect)

- **Files/functions**: `City3DMode` constructor + `setSelectedPlanet`; `resolveCityTheme`; `cityThemePresets`.
- **Issue**: City receives planet seed but only uses archetype → 2 presets.
- **Visible consequence**: most planets share similar city color/material mood.
- **Disconnect effect**: Planet’s rich biome identity is dropped at mode switch.
- **Structural change needed**: City must ingest full `PlanetVisualProfile` + derived `PlanetGenerationConfig` subset, not only coarse theme id.

### RC2 — City terrain is composition mesh, not biome-derived local surface slice

- **Files/functions**: `createTerrainPatch` and shelf mesh in `createCityScene`.
- **Issue**: one deformed plane with canned crater/plateau and edge drop; not sampled from planet surface model.
- **Visible consequence**: stage/board silhouette and synthetic relief.
- **Disconnect effect**: no topological continuity with selected settlement area.
- **Structural change needed**: generate city terrain from the same planetary noise/filters using a local tangent patch around selected settlement.

### RC3 — City materials do not reuse planet shader logic

- **Files/functions**: `createCityScene`, `CitySceneController`, `CityAssetRegistry` vs `createPlanetMaterial`.
- **Issue**: City uses stock standard materials; no gradient/depth/surface-mode shader logic.
- **Visible consequence**: flat albedo, weak terrain breakup, generic PBR sheen.
- **Disconnect effect**: visual language differs from planet instantly.
- **Structural change needed**: shared/adapted terrain shader uniforms for city ground (at minimum: elevation/depth blend, micro relief, biome tints, surface mode, emissive logic where needed).

### RC4 — Lighting/postfx mismatch

- **Files/functions**: City direct render in `CitySceneController.update`; Planet composer in `PlanetPostFx`.
- **Issue**: no city bloom pipeline or profile-driven exposure, static light rig.
- **Visible consequence**: less atmosphere and depth, lower perceived fidelity.
- **Disconnect effect**: transition planet→city feels like switching to a different rendering stack.
- **Structural change needed**: unify camera response/tone mapping strategy and add city postfx path parameterized by planet profile.

### RC5 — Board-first composition and camera reinforce prototype read

- **Files/functions**: fixed layout in `CITY_LAYOUT_TEMPLATE`; slot construction in `buildStaticScene`; camera setup in `CitySceneController`.
- **Issue**: fixed symmetric slot coordinates + elevated pads/supports + high oblique camera.
- **Visible consequence**: tactical-board read dominates scene.
- **Disconnect effect**: colony appears detached from terrain geology.
- **Structural change needed**: terrain-first composition, slot anchors projected onto terrain normals, camera that favors environmental depth + horizon framing.

### RC6 — Slot/pad language is marker-centric instead of infrastructural

- **Files/functions**: `buildStaticScene` pad/deck/ring/support meshes.
- **Issue**: slot hardware is visually dominant and repeated.
- **Visible consequence**: “build markers” rather than integrated foundations.
- **Disconnect effect**: city looks game-UI-ish, not diegetic.
- **Structural change needed**: convert to grounded foundations carved/embedded into terrain with biome-aware materials and local grading.

### RC7 — Building language is intentionally proxy-level

- **Files/functions**: `CityAssetRegistry.createBuildingVisual`.
- **Issue**: primitive kitbash geometry with minimal articulation and no terrain integration.
- **Visible consequence**: blocky prototype structures.
- **Disconnect effect**: mismatch with planet’s sophisticated terrain shading and mood.
- **Structural change needed**: either higher-quality assets or procedural kit with silhouette variety + foundation blending + decal/weathering pass.

### RC8 — Wrong architectural model for City View

- **Issue**: system treats City as a standalone board scene, not as “planet close-up slice.”
- **Consequence**: every visual layer (relief/material/mood/composition) diverges.
- **Required structural shift**: city renderer should be a local planet-surface renderer with colony overlays.

## 6) Recommended Rendering Direction for City View

### Core decision

Treat City as **Surface Slice Renderer** (local patch of the selected planet), not as a separate board renderer.

### Reuse directly from planet pipeline

- profile generation (`planetProfileFromSeed`)
- config synthesis (`createPlanetGenerationConfig`)
- noise filter logic (`NoiseFilter`/GPU equivalent)
- terrain shading model concepts from `PlanetMaterial`
- exposure + bloom tuning strategy from planet postfx

### Adapt into city-local pipeline

- Generate a **local tangent patch** centered on selected settlement normal/position.
- Evaluate same noise/filter stack in local patch coordinates to produce matching relief class.
- Use adapted shader variant (`PlanetSurfaceSliceMaterial`) with identical biome logic but local UV/scale controls and optional triplanar assist.
- Derive city fog/light color from profile + archetype rather than static theme presets.

### Do not reuse as-is

- Planet full sphere mesh generation (too heavy for city frame, wrong topology for local scene interaction).
- Planet starfield framing unchanged (city should keep planetary atmosphere/horizon, not deep-space-only framing).
- Current slot ring platform geometry.

### 3D vs hybrid recommendation

- Keep real 3D terrain + buildings (for gameplay readability).
- Add hybrid background framing (horizon cards/volumetric fog cues) if needed for scale.
- Avoid returning to pure painted board.

## 7) Concrete Rebuild Plan

### Phase 0 — Contract/data plumbing (must-do first)

1. Pass selected settlement surface data (position, normal, elevation, lat/long, habitability) from Planet mode into City mode.
2. Pass full `PlanetVisualProfile` (or regenerated from seed) plus resolved `PlanetGenerationConfig` into City renderer.
3. Introduce `CityBiomeContext` object used by all city rendering layers.

### Phase 1 — Terrain architecture replacement

1. Remove current `PlaneGeometry + shelf` terrain scaffold.
2. Implement `generateCitySurfaceSlice(context)`:
   - build local patch grid in tangent space
   - sample planet noise filters with consistent seed offsets
   - compute elevation, normals, slope masks
3. Place slot anchors by sampling patch and projecting to local normals.

### Phase 2 — Shared material language

1. Introduce shared shader core for planet/city terrain color logic.
2. Reuse elevation/depth gradients, micro breakup, surface mode, wetness/vegetation/emissive controls.
3. Add city-specific overlays (paths/foundations/decals) on top of shared base, not instead of it.

### Phase 3 — Composition & camera rewrite

1. Replace board camera with terrain-framing camera rig (lower horizon, parallax depth).
2. Remove prominent pad rings/supports; use embedded foundations.
3. Add biome-appropriate distant framing (ridge silhouettes, haze, atmospheric depth).

### Phase 4 — Lighting/postfx parity

1. Add city `EffectComposer` with bloom/exposure controls tied to profile.
2. Harmonize light color/intensity with planet archetype and lightIntensity/atmosphereLightness.
3. Validate transitions planet↔city for continuity.

### Phase 5 — Building integration

1. Keep gameplay footprint logic but upgrade structure language.
2. Blend structures into terrain with skirts/foundation decals and AO cues.
3. Introduce archetype-dependent material variants/weathering.

### Keep vs rewrite summary

- **Keep**: city interaction model, view-model state, slot/building game rules.
- **Reuse/adapt**: planet biome/profile generation + shader logic + postfx strategy.
- **Rewrite**: city terrain generation, slot grounding geometry, camera/composition, lighting pipeline.

## 8) Validation

Run and report:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 9) Optional next step

If approved, next step is an implementation spike limited to **Phase 0 + Phase 1 scaffolding only** (data plumbing + local surface slice generator), with no final art polish pass yet.
