# 10 - Browser Game Foundation

## Why Next.js + PixiJS

Coinage needs a browser-native game shell with clean routing and long-term maintainability. Next.js App Router handles page-level structure (`/` landing and `/game` runtime entry), while PixiJS owns real-time rendering and simulation-friendly update loops for the world map.

## Route separation

- `/`: minimal, stylized entry page with a single CTA to start the game session.
- `/game`: dedicated map entry route where the canvas and game renderer become the primary UI.

This keeps web navigation concerns separate from game-scene concerns.

## PixiJS integration details

PixiJS is isolated in `CoinageGameApp`, mounted from a client component (`PixiGameViewport`).

Key integration traits:
- client-side mount/unmount lifecycle
- Pixi Application bootstrap and destroy flow
- resize observer for viewport changes
- ticker update loop
- world container camera basis
- pan input controller with world bounds clamping

React renders the shell only; map objects are rendered by PixiJS, not React.

## Foundation folder structure

```text
src/
  app/
    page.tsx
    game/page.tsx
  components/
    landing/
    game/
  game/
    app/
    core/
    scenes/
    systems/
    world/
    renderers/
    input/
  styles/
```

- `app/` + `components/`: Next.js shell and routing
- `game/`: renderer runtime and world logic
- `world/`: deterministic procedural generation
- `scenes/`: scene-level game view composition

## Renderer architecture

`CoinageGameApp` is the bootstrap owner:
1. initializes Pixi application
2. generates world data from seed
3. mounts `MapViewScene`
4. manages update loop + lifecycle
5. delegates drag-pan to `PanController`

This allows future scene orchestration for Map / Faction / City views without rewriting the renderer base.

## World generation approach

World generation is deterministic via seeded RNG.

Macro logic:
- world size is much larger than viewport
- weighted clusters create density variation
- spatial hash + min-distance rejection preserve spacing and voids
- supports central/peripheral geography with uneven concentration

This avoids a uniform scatter and gives panning meaning.

## Faction generation approach

Each faction is generated with:
- id + generated name
- world position
- size category (small/medium/large)
- base radius
- shape seed + silhouette control points
- slot list

Silhouettes are generated from angular points with constrained wave/noise modulation so islands remain irregular but readable.

## City slot generation approach

Slots are generated per faction using radial sampling constrained by silhouette radius at sampled angles.

Rules:
- 10 to 25 slots depending on size category
- slot points kept within island bounds
- rejection checks reduce overlap
- no grid regularity
- slots include `occupied` state for future ownership systems

## Evolution path

This foundation is designed to evolve toward:
- **Faction View** scene: local faction-island tactical view
- **City View** scene: internal city management layer
- view transitions + camera jumps
- ownership/occupation and later combat/economy systems

The current implementation intentionally stops at map generation + rendering baseline to keep the first milestone stable and extensible.

## Map View fundamental rework (second pass)

The prior visual rework still failed because it over-invested in layered effects while core map fundamentals remained weak. The main issues were:
- island silhouettes still read as generic procedural blobs
- slot placement still looked mathematically sampled instead of settlement-driven
- faction spacing was too cramped in many visible regions
- render cost increased faster than visual quality

### What changed now (fundamentals first)

This pass prioritizes structure before atmosphere:
1. stronger island silhouette families
2. structured slot placement logic
3. improved macro spacing / composition
4. rendering simplification for stable performance

### Faction-island generation rework

Island silhouette generation now uses deterministic family-based profiles instead of generic noise-only modulation.

Implemented families:
- compact
- stretched
- twin-lobed
- broken-coast
- crescent
- plateau

Each family uses controlled directional math (primary axis, orthogonal response, family-specific lobes/cavity/coast roughness) plus restrained micro-jitter. This keeps organic irregularity while producing readable territorial identities.

### City-slot placement rework

Slot placement no longer samples generic random points inside the polygon.

New logic:
- derives structural hubs from each island profile (primary/secondary axis + family center bias)
- places slots around those hubs with directional spread
- validates points against silhouette interior margin
- enforces stronger minimum slot distance

Result: slots read more like intentional settlement anchors following island structure, not uniform scatter.

### World spacing / composition rework

Macro world composition was retuned for breathing room while preserving 500+ deterministic factions:
- larger spacing rejection thresholds
- larger spatial hash cells for conflict checks
- adjusted cluster count and ring distribution
- stronger void pockets and central void preservation
- larger world extents in viewport setup

This improves navigability and strategic geography without turning the world empty.

### Performance optimizations

Rendering was simplified to reduce unnecessary per-frame cost:
- reduced ocean to one animated tiling field + restrained atmospheric pass
- removed extra ocean flow/current layers and dense glint loops
- removed HUD frame overlay pass
- reduced island stack complexity (kept core, one surface pass, limited contour/rim)
- removed per-frame slot pulsing across all factions

The map now favors readable structure and stable runtime over decorative overdraw.

### What remains temporary

- visual kit still uses lightweight generated textures (replaceable by authored assets)
- strategic links are visual hints only (no gameplay pathing semantics yet)
- Map View remains no-free-zoom by design for this phase
- faction/city gameplay ownership systems are not part of this milestone
