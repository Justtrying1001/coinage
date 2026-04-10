# Galaxy2DMode + Planet3DMode Quality Audit (Three.js Skill Baseline)

Date: 2026-04-10

## Scope and method

Audited files and runtime flow:
- `src/game/render/modes/Galaxy2DMode.ts`
- `src/game/render/modes/Planet3DMode.ts`
- `src/game/app/CoinageRenderApp.ts`
- `src/components/game/GameShell.tsx`
- `src/components/game/GameRenderViewport.tsx`
- `src/game/world/galaxyGenerator.ts`
- `src/styles/globals.css`

Baseline guidance used from `.agents/skills/`:
- `threejs-fundamentals` (renderer/camera lifecycle, DPR, resize, cleanup)
- `threejs-interaction` (pointer handling, drag/click separation, interaction affordance)
- `threejs-lighting` (multi-light staging, environment/IBL options, physically plausible cues)
- `threejs-materials` (material choice consistency and PBR quality)
- `threejs-geometry` (geometry complexity and update cost)

---

## Executive summary

The migration is functionally successful: mode boundaries are clear, lifecycle/disposal is mostly solid, and the core game loop architecture is straightforward. The current result is a good **foundation** but presents as a **prototype visual target** rather than a polished gameplay view.

Primary strengths are deterministic procedural generation, low conceptual complexity, and clean mode switching. Primary gaps are readability at scale in Galaxy2DMode, shallow interaction feedback, limited planetary visual depth (no atmospherics/clouds/IBL), and avoidable performance costs (high sphere subdivision + per-frame full rerender + global event listeners).

The best immediate next step is to implement a **focused "Planet3D visual pass v1"** (lighting/material layering + interaction polish) while preserving current architecture.

---

## Current strengths

### 1) Architecture and mode separation
- `CoinageRenderApp` cleanly encapsulates mode creation, updates, resize handling, and mode handoff through a small `ModeContext` contract. This keeps render-mode logic decoupled and testable.
- Selected-planet state is propagated consistently from galaxy selection into 3D mode and back to boundary callback.
- Destroy paths remove listeners and DOM surfaces, and dispose renderer/geometry/material instances.

### 2) Deterministic content pipeline
- Galaxy layout, node properties, and planet visual profile are generated from deterministic seeds.
- Planet rebuild on selected seed allows stable reproducibility and future caching opportunities.

### 3) UX fundamentals are in place
- Galaxy2D supports pan + zoom + hover + click-select.
- Planet3D supports drag-to-rotate and Escape-to-return.
- Header mode toggles provide explicit fallback navigation even without in-canvas affordances.

### 4) Baseline rendering correctness
- Planet3D uses a sensible basic PBR material (`MeshStandardMaterial`) and normal recomputation after procedural displacement.
- Resize, camera aspect updates, and device pixel ratio setup are all present.

---

## Current weaknesses

### A. Readability

#### Galaxy2D
- All nodes are rendered with very similar color/luminance in a dense field; dense/settled/sparse distinctions are subtle and can collapse visually on typical displays.
- No labels, sectors, route hints, or focus framing means users can lose orientation while panning.
- Hover target ring is subtle at low zoom and crowded regions, reducing confidence in what will be selected.

#### Planet3D
- Planet identity readability is limited: no textual overlay of planet name/id/traits in the viewport itself.
- The scene lacks foreground/background depth cues (atmospheric rim shell, starfield parallax, or cloud layer), making many planets feel compositionally similar.

### B. Interaction quality

#### Galaxy2D
- Drag/click discrimination is basic and works, but interaction events are attached to `window`, which is broader than needed and can produce side effects when multiple viewports exist.
- No inertia/smoothing for pan or zoom, and no double-click zoom/focus behavior.
- No keyboard navigation or accessibility semantics for selecting nodes.

#### Planet3D
- Drag interaction has no pitch clamp, so users can rotate into awkward upside-down states.
- No damping/inertia, no zoom control, and no object picking beyond whole-planet rotation.
- Escape key route exists but no on-screen back affordance inside the canvas itself.

### C. Procedural variation

- Planet displacement and color variation are deterministic but low-frequency/simple (sin/cos waves + vertex HSL jitter).
- No biome masks, no cloud system, no polar/latitude logic, no night-side city emissive patterning.
- Galaxy-side variation is mostly positional + radius/population band; there are no richer classes/rarity signatures that are readable at interaction distance.

### D. Lighting/material quality

- Planet lighting is a minimal 3-light equivalent (ambient + directional + accent point). It is functional but lacks cinematic depth and physically plausible environmental response.
- No environment map / IBL, so `MeshStandardMaterial` cannot realize its potential.
- No post-processing pass (bloom/glow/subtle tone mapping control) to support sci-fi readability.

### E. Performance structure

- `IcosahedronGeometry(1, 6)` is relatively heavy for a single hero mesh and may become costly on lower-end GPUs when adding atmosphere/cloud overlays later.
- Planet mode rerenders every frame even when static (including when not dragging and after auto-rotation could be optional).
- Galaxy mode redraws full canvas on invalidation; currently acceptable at 560 nodes but layering and effects will need batching or offscreen caching.
- Event listeners are bound at window scope for pointer move/up in both modes; local pointer capture patterns would reduce global event load.

### F. Extensibility toward future city view

- Current `Planet3DMode` is monolithic; there is no internal scene graph contract (planet body, atmos, clouds, markers, city anchors).
- No explicit transition controller (camera tween / state machine) between galaxy selection and planet inspection.
- Node data model lacks explicit attributes that would naturally seed city-view generation (e.g., climate bands, resource tags, urbanization metrics beyond `populationBand`).

---

## Quick wins (low effort, high leverage)

1. **Interaction polish in Planet3D**
   - Clamp rotation X range.
   - Add simple inertial damping on drag release.
   - Add visible in-canvas "Back to Galaxy" affordance.

2. **Galaxy readability polish**
   - Increase selected/hover contrast and radius scaling at low zoom.
   - Add lightweight tooltip/overlay for hovered node (`name`, population band).
   - Add subtle vignette + center guidance reticle for orientation.

3. **Performance hygiene**
   - Replace window-level pointer tracking with `setPointerCapture` and element-scoped listeners where possible.
   - Cap renderer DPR with `Math.min(devicePixelRatio, 2)` in Planet3D.

---

## Medium improvements

1. **Planet visual layering v1**
   - Add atmosphere shell (fresnel-ish additive material) and cloud shell rotation.
   - Introduce hemisphere/fill balancing and tune key/rim ratios.
   - Add optional static environment map for PBR response.

2. **Galaxy information architecture**
   - Add semantic classes (star type/faction/resource signature) and encode with shape+color, not color alone.
   - Introduce zoom-level dependent detail (cluster haze at far zoom; details when close).

3. **Transition quality**
   - Implement camera-to-target transition when selecting a galaxy node before entering planet mode.
   - Persist contextual breadcrumb (selected node highlight retained when returning from planet).

---

## Major next-step work

1. **Scene composition refactor for Planet3D extensibility**
   - Split into modular layers/components (`PlanetBody`, `PlanetAtmosphere`, `PlanetClouds`, `OrbitalProps`, `HUDAnchors`).
   - Establish a typed "planet scene descriptor" generated from seed + gameplay metadata.

2. **Unified interaction framework**
   - Shared pointer/keyboard interaction manager across modes.
   - Standardized pick/hover/select contracts and feedback states.

3. **City-view readiness pipeline**
   - Extend world-gen schema to include city-seeding parameters.
   - Add progressive LOD strategy and transition state machine (Galaxy2D -> Planet3D -> CityView).

---

## Prioritized implementation plan

### Priority 0 (next 1-2 tasks)
1. Planet3D interaction polish + DPR cap + on-canvas back affordance.
2. Planet3D visual pass v1 (atmosphere + clouds + retuned light ratios).

### Priority 1
3. Galaxy2D readability pass (hover/selection contrast, tooltip, zoom-aware styling).
4. Localized pointer event capture refactor in both modes.

### Priority 2
5. Transition tween system between galaxy select and planet inspect.
6. Data model extension for city-view precursor metadata.

### Priority 3
7. Planet scene modularization and LOD preparation for city-entry transitions.

---

## Recommendation for immediate next implementation task

Implement **Planet3D Visual + Interaction Pass v1** as a bounded vertical slice:
- add atmosphere shell + cloud shell,
- clamp/soften drag rotation,
- add lightweight back button overlay,
- cap pixel ratio and preserve current lifecycle contracts.

This improves perceived quality quickly, aligns with the imported Three.js skills baseline (fundamentals + lighting + materials + interaction), and creates reusable scaffolding for later city-view transitions.
