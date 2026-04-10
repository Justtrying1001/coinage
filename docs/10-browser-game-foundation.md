# 10 - Browser Game Foundation

## Why the Map View renderer pivoted from PixiJS to Three.js

The original PixiJS Map View validated route separation, deterministic world generation, and panning, but it failed to deliver the intended game-map presence.

Primary reasons for the pivot:
- faction-islands still read as technical procedural blobs
- city slot markers still looked like abstract UI markers
- map mass/depth remained too flat to feel like a premium strategy world
- additional 2D layers/effects did not resolve the core artistic problem

Coinage now uses **Three.js for Map View rendering only**, keeping the broader Next.js game architecture intact.

## Why orthographic 2.5D was chosen

The target is not a cinematic free-camera 3D world. The target is strategic readability with stronger territorial presence.

Orthographic 2.5D gives:
- Grepolis-like map readability at command scale
- believable island thickness/mass without diorama framing
- stable strategic composition with no perspective distortion
- a clean progression path for view transitions (**Map -> Faction -> City**) without free zoom

## Route separation (unchanged)

- `/`: landing page
- `/game`: playable runtime shell with map canvas

React/Next.js continue to own shell + routing. Three.js owns realtime map rendering in `/game`.

## Updated foundation structure

```text
src/
  app/
    page.tsx
    game/page.tsx
  components/
    landing/
    game/
      GameShell.tsx
      ThreeGameViewport.tsx
  game/
    app/
      CoinageGameApp.ts
    core/
      types.ts
    scenes/
      MapViewScene.ts
    input/
      PanController.ts
    world/
      worldGenerator.ts
      rng.ts
  styles/
```

## Renderer architecture (Three.js)

`CoinageGameApp` now owns Three.js runtime lifecycle:
1. generate deterministic world from seed
2. create WebGL renderer and mount canvas
3. create `MapViewScene` (scene graph + orthographic camera)
4. attach `PanController` (panning + world bounds clamp)
5. run RAF loop for update/render
6. cleanly dispose on unmount

This preserves browser-game architecture while replacing only the map rendering layer.

## Orthographic Map View behavior

Map View camera:
- uses `OrthographicCamera`
- fixed frustum (no free zoom)
- top-down strategic framing
- panning only
- clamped world bounds

Interaction:
- pointer hover/select via raycasting against faction meshes
- subtle emissive/rim feedback for selection readability

## Faction-island representation (2.5D)

Each faction-island is now rendered as a layered 2.5D territorial mass:
- silhouette-derived `Shape`
- lightly extruded body (`ExtrudeGeometry`) for thickness
- distinct top surface mesh (`ShapeGeometry`) for readable territory plate
- contour rim line for strategic edge definition
- per-size palette/depth variation (small/medium/large)

This shifts islands from flat-debug blobs to structured strategic landmasses while keeping top-down readability.

## City slot representation

City slots remain generated from faction silhouettes/sizes and remain directly visible on islands.

Rendering approach:
- all slot pads rendered with one `InstancedMesh` for performance
- compact embedded circular anchor pads
- slight variation in rotation/scale to avoid graph-node uniformity
- z-layered onto faction top surfaces so slots feel integrated, not overlaid UI dots

## Digital ocean representation

The ocean is now a large world plane with a restrained shader-driven look:
- dark depth gradient foundation
- subtle flow-distortion to imply digital current motion
- faint linefield accents for command-grid atmosphere
- restrained luminance to keep islands as primary focus

The ocean now acts as compositional space (clusters + voids) rather than empty background fill.

## Performance decisions

Map View stays browser-practical by design:
- single orthographic pass, no expensive post-processing chain
- one shared shader material for ocean
- instanced slot rendering across all factions
- lightweight materials (`Lambert` / `Basic`) and restrained animation
- fixed camera scale (no free zoom complexity)

## What remains temporary / placeholder

Current renderer intentionally remains a foundation layer:
- faction surface art is procedural/material-driven, not final authored art assets
- slot pads are stylized anchors, not final faction-specific structures
- no ownership/combat/economy simulation rendering yet
- no Map->Faction->City transition animation pass yet

## Core truths preserved

- deterministic seeded world generation
- 500+ factions
- faction size variation and slot-count coupling
- visible city slots directly on faction-islands
- neutral launch-state assumptions
- world panning with bounds
- Map View as main strategic play surface
