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

## Map View rework (composition + visual language)

The first prototype proved architecture, but map readability and atmosphere were too debug-like. The rework focuses on map composition and rendering language without adding gameplay systems.

### World composition improvements

- Rebalanced world extents and framing for a better ratio between map size and object spacing.
- Reworked macro distribution to use structured cluster rings plus explicit void pockets.
- Increased spacing constraints with stronger rejection rules to avoid nearby blob stacking.
- Kept deterministic generation and 500+ factions while improving breathing room and strategic legibility.

### Faction-island rendering improvements

- Added layered island rendering (under-glow, core mass, contour, accent shelf, rim).
- Refined silhouette modulation so islands remain irregular but less like flat debug polygons.
- Improved hover/selection emphasis with restrained scale/tint/pulse rather than harsh highlighting.

### City slot rendering improvements

- Replaced debug dots with integrated emplacement markers.
- Each slot now uses a micro marker stack (bed, ring, ticks, core) for strategic readability.
- Markers stay lightweight and neutral-state friendly while preserving future occupied/free differentiation.

### Digital ocean improvements

- Added layered ocean construction: base depth field, haze patches, current-flow lines, sparse glints, and faint structural grid.
- Ocean now contributes to composition and navigation instead of acting as plain background fill.
- Visual treatment remains restrained to keep islands as primary focus.

### Intentionally simple for now

- No zoom system (view scale progression is still intended via Map -> Faction -> City).
- No ownership/combat/economy systems yet.
- No heavy HUD chrome; map remains the primary surface.
