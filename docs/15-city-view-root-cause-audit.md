# City View Root-Cause Audit (Runtime + Architecture)

Date: 2026-04-13
Scope: `src/game/city/**` integration with app mode switching and planet runtime.

## Executive summary

The current City View architecture is **fundamentally board-first**, not environment-first.

The active runtime path instantiates a handcrafted slot board (pads, rings, support legs, blocky kit buildings) on top of a small procedural plane and a giant rectangular shelf. The camera framing and composition center this board language. Biome context is reduced to a narrow color theme mapping (`frozen` vs `neutral`) and does not carry over planetary terrain, material system, atmosphere, or postfx behavior from Planet View.

**Verdict: NUKE AND REBUILD.**

## Current runtime render path (verified)

1. React viewport mounts `CoinageRenderApp` in `GameRenderViewport`.
2. Mode switch to `city3d` creates `City3DMode`.
3. `City3DMode` builds a `CityViewModel` from static `CITY_LAYOUT_TEMPLATE` and archetype-to-theme mapping.
4. `City3DMode.mount()` creates `CitySceneController`.
5. `CitySceneController` initializes `WebGLRenderer`, fixed `PerspectiveCamera`, calls `createCityScene(theme, seed)`.
6. `createCityScene` builds:
   - a procedural `PlaneGeometry` terrain patch,
   - a large box “shelf” under it,
   - decorative outcrop/beacon props,
   - basic lights/fog.
7. `CitySceneController.buildStaticScene()` then adds all gameplay slots as explicit pad/deck/ring/support meshes from static coordinates.
8. `CityAssetRegistry` creates primitive block/cylinder/sphere building kits per slot.
9. Render loop uses direct `renderer.render(scene, camera)` with no composer/postfx.

No other city terrain/shader pipeline is active at runtime.

## Root cause: why City View still reads as board/prototype

### 1) Composition is slot-board-first by construction
- Slot coordinates are hardcoded in a static template and directly instantiated as visible mechanical pads.
- Pads include trim rings and support legs that read as detached platform hardware.
- Buildings are attached to slot roots that float above pad tops, reinforcing game-board language.

### 2) Terrain is subordinate and non-authoritative
- Terrain is a generic plane patch, not sampled from or linked to planet generation.
- Slot Y is effectively fixed by layout data; terrain height does not author slot embedding.
- No CPU authoritative height query exists for city placement/interaction grounding.

### 3) Biome continuity is nominal, not visual/systemic
- Biome input resolves only to `frozen|neutral` color/light presets.
- No reuse of planet profile parameters beyond that binary theme switch.
- City does not consume planet surface geometry, material graph, atmosphere model, or settlement slot provenance.

### 4) Scene language is dominated by prototype geometry
- `BoxGeometry` shelf under terrain reads like a tabletop chunk.
- Building kitbash primitives (boxes/cylinders/spheres) remain clearly blockout assets.
- Outcrops/beacons are decorative ring dressing, not environmental grounding.

### 5) Rendering stack mismatch with Planet View
- Planet mode has dedicated postfx composer and bloom pipeline; city mode has none.
- City uses basic fog and key/rim lights only; no atmospheric depth treatment parity.
- This breaks cross-mode visual continuity even before asset quality is considered.

### 6) Interaction model couples gameplay to visible pads
- Raycasting targets tagged slot/building meshes, and slots are intentionally made conspicuous.
- There is no diegetic interaction layer (e.g., buried foundations/terraces with hidden anchors).

## File-by-file triage

### Keep (concept-only / reusable logic)
- `src/game/city/runtime/cityViewModel.ts`
  - Keep gameplay data model structure (slots, placed buildings, selected target).
  - Remove implicit visual assumptions from slot presentation.
- `src/game/city/interaction/CityRaycaster.ts`
  - Keep raycast utility pattern, but retarget to new diegetic interaction proxies.
- `src/game/city/City3DMode.ts`
  - Keep mode shell and UI panel scaffolding concept; rewrite mount path and interactions.

### Rewrite (high priority)
- `src/game/city/data/cityLayout.ts`
  - Replace fixed board coordinates with biome-terrain anchored site plan generation (deterministic from settlement + seed).
- `src/game/city/themes/cityThemePresets.ts`
  - Replace binary palette presets with parametric biome continuity driven by planet profile + local terrain sample.
- `src/game/city/themes/cityThemeResolver.ts`
  - Expand resolver to full biome/material/atmosphere settings or remove in favor of shared planet visual config adapters.

### Delete entirely (current architecture blockers)
- `src/game/city/scene/CitySceneController.ts`
  - Delete current slot pad/deck/ring/support construction and fixed board camera composition.
- `src/game/city/scene/createCityScene.ts`
  - Delete isolated city scene scaffold (plane+shelf+prop ring) and rebuild environment-first scene builder.
- `src/game/city/assets/CityAssetRegistry.ts`
  - Delete primitive kit-bashed building visuals (blockout language locked into runtime look).

### Misleading / dead-effect code
- City fog and terrain deformation logic in `createCityScene` is technically active but visually insufficient and misleading as “biome integration”.
- Theme variables suggest rich theming but currently only recolor the same board architecture.

## Three.js technical diagnosis

### Scene composition
- Current root is a board patch with centered slots; composition guarantees prototype read.

### Camera framing
- Single fixed camera (`position: 24,19,22` looking near scene center) frames all pads at once, emphasizing layout map over lived environment.

### BufferGeometry terrain generation
- A small `PlaneGeometry` is displaced via sin/cos/noise; fine for placeholder, not for colony-grade grounded terrain.

### CPU authoritative height sampling
- Missing in city path. Slot/building placement is not terrain-authoritative.

### Raycast reliability
- Technically reliable for current meshes, but semantically wrong target layer (visible pads as gameplay affordances).

### Material architecture
- All `MeshStandardMaterial`; no shared advanced planet material system, no physically cohesive ground/building integration strategy.

### ShaderMaterial vs onBeforeCompile
- No city shader pipeline in active path; any “shader-driven city terrain” claim would be non-runtime or nonexistent here.

### Fog / depth / atmospheric layering
- Basic linear fog only; insufficient volumetric depth cues and biome atmosphere continuity.

### EffectComposer / bloom / tone mapping
- City has ACES exposure but no composer stack. Planet has composer+bloom. Visual language mismatch is structural.

### Slot integration into terrain
- Not integrated. Slots are explicit above-ground pads and deck assemblies.

### Building foundations and diegetic embedding
- Not present. Buildings are attached to pad roots; no cut/fill, retaining structures, trenching, or terrain-adaptive foundations.

## Final verdict

# **B. NUKE AND REBUILD**

Reason: the current active renderer encodes the wrong worldview (board-first gameplay geometry as primary scene language). Refactoring around this base would preserve the core anti-goal and create incremental “fake progress.”

## What to remove (exactly)

- `src/game/city/scene/CitySceneController.ts`
- `src/game/city/scene/createCityScene.ts`
- `src/game/city/assets/CityAssetRegistry.ts`

Also delete any imports/usages tied to these modules from `City3DMode` during implementation.

## Concepts to abandon

- Visible pad/deck/ring/support slot representation.
- Fixed static board slot coordinates as render truth.
- Isolated city terrain plane + box shelf chunk.
- Binary city theme recolor as primary biome mechanism.

## New clean architecture (minimum viable correct base)

1. **CitySiteContext (authoritative inputs)**
   - Inputs: selected settlement id, planet seed/profile, deterministic local transform.
   - Outputs: local terrain sampler + biome parameters + anchor points.

2. **CityTerrainRuntime (environment-first)**
   - Build local terrain chunk from shared planet generation primitives (or deterministic projection from planet surface sample).
   - Expose CPU `sampleHeightNormal(x,z)` for all placement and interaction.

3. **CitySlotAnchors (hidden gameplay layer)**
   - Generate fixed slot anchors from gameplay rules, then project onto terrain.
   - Render diegetic foundations/terraces/construction clearings, not pads.
   - Keep slots fixed in logic, hidden in environment visually.

4. **CityStructureRuntime (building embedding)**
   - Place foundations first (cut/fill, retaining edges), then structures.
   - Building footprint adapts to sampled slope/height.

5. **CityAtmosphereAndPostFx**
   - Use `EffectComposer` parity with Planet View (at minimum consistent exposure/bloom/fog response).
   - Add depth layering (fog tuning tied to biome).

6. **CitySceneControllerV2**
   - Thin orchestrator over the above subsystems.
   - Camera framing favors immersive oblique framing with terrain dominance and occlusion depth.

## First clean implementation phases

### Phase 0 — Foundation (no polish)
- New city scene boots with terrain-dominant composition.
- Hidden slot anchors projected to terrain with reliable raycast proxies.
- No visible pads.

### Phase 1 — Diegetic slot readability
- Add construction terraces/foundations at slot anchors.
- Ensure click targets remain stable and discoverable without board visuals.

### Phase 2 — Building embedding
- Footprint-aware placement on terrain.
- Basic retaining/foundation mesh pass per building footprint.

### Phase 3 — Continuity parity
- Pull atmosphere/postfx alignment with Planet View.
- Validate biome continuity per archetype (beyond recolor).

