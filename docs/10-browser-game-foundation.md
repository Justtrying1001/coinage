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

## Map View rework (from procedural debug look to hybrid visual kit)

The earlier prototype validated architecture and generation, but remained visually insufficient because final perception relied mostly on primitive fills/strokes/glows. That created a debug-map feeling instead of a game-map identity.

### What changed in rendering strategy

The map remains procedurally generated (world layout, islands, slots), but rendering is now hybrid:
- procedural placement/composition is preserved
- a reusable visual kit provides texture-assisted surface language
- primitives still define structure, while textures/overlays provide art direction

### What remains procedural

- deterministic seeded world generation
- cluster/void composition
- faction positions, sizes, and silhouettes
- city slot placement and neutral occupancy state

### What is now asset-assisted / systematized

A reusable map visual kit now supplies:
- ocean noise field texture
- ocean flow texture
- island surface texture
- island vein/segmentation texture
- slot glyph texture

These are small reusable assets generated once and reused across all factions/tiles for coherence.

### Faction-island rendering now

- multi-layer island stack: under-glow, core silhouette, textured surface pass, vein pass, accent mass, contour, rim
- texture passes are masked by procedural island silhouettes
- result preserves top-down readability while removing flat-blob debug perception

### City slot rendering now

- slots now render as integrated emplacement anchors
- marker stack uses base bed + halo + glyph texture
- markers remain compact/readable and ready for future occupied/free state differentiation

### Digital ocean rendering now

- ocean now combines base depth fill + tiled noise + tiled flow structures + broad field ellipses + sparse glints + faint macro grid
- digital ocean behaves as compositional sea-equivalent (spacing, separation, navigation support)

### Still placeholder for now

- no zoom system (view progression remains Map -> Faction -> City)
- no gameplay ownership/combat/economy systems yet
- visual kit is intentionally lightweight and can later be replaced by authored art assets without changing architecture
