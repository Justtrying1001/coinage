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

## Map View art-direction reset (from failed debug-map to command-world prototype)

The previous Map View failed visually because it looked like rendering diagnostics, not a strategy-game world. Islands read as flat procedural blobs, slot points read as generic markers, and the ocean behaved like empty canvas filler. The result did not meet the Coinage DA target.

### Visual target now followed

The active target is a dense, dark, premium command-map language aligned with the provided reference direction:
- many faction-islands visible in one frame
- layered digital-ocean atmosphere
- textured territorial island masses
- integrated settlement anchors
- subtle strategic connection hints
- restrained command-center framing

### Density and composition changes

- world generation keeps deterministic seeded behavior and 500+ factions, but placement now uses denser spacing and smaller average island radii
- cluster strategy increased local concentration while reducing oversized void pockets
- viewport now reads as a populated strategic surface rather than sparse isolated samples

### Island rendering changes

Island rendering moved to a stronger layered stack:
- under-glow and shadow base for grounding
- core mass silhouette for territory readability
- masked surface/ridge/micro texture passes for material variation
- interior band + contour hierarchy for map-native structure
- restrained faction rim for interaction feedback

This keeps islands top-down and readable, but removes the flat-blob prototype look.

### Slot rendering changes

Slot presentation now uses integrated settlement-anchor language:
- dark embedded pad tied to island surface
- thin anchor bar to imply emplacement
- luminous micro-node core (occupied-ready visual state)

Slots stay visible and playable while feeling attached to the landmass.

### Ocean/background rendering changes

The ocean is now a layered digital field:
- deep dark base
- nebula-like atmospheric tiling layer
- flowing data-current passes
- broad haze ellipses
- sparse glints/star points

This increases depth and premium atmosphere without overpowering island readability.

### Strategic links + command-map framing

- subtle, low-alpha curved inter-island traces now provide strategic network hints without turning the map into a graph
- restrained HUD-style edge frame and corner readouts add command-center presentation tone with minimal clutter

### What remains temporary

- visual kit still uses generated lightweight textures (replaceable later with authored art packs)
- no free zoom remains intentional for Map View phase
- no faction/city gameplay ownership layer yet (visual-only milestone)
