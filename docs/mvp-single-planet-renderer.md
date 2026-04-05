# MVP Single-Planet Renderer Prototype

## Rendering strategy chosen

For this slice, Coinage uses a **single-planet Three.js prototype** driven by `PlanetVisualProfile`.

The approach is intentionally simple:
- one mesh (`IcosahedronGeometry`) with deterministic vertex displacement
- one standard material (`MeshStandardMaterial`) derived from profile material/palette/color values
- optional lightweight atmosphere shell when `profile.atmosphere.enabled` is true
- static camera framing (no movement, no zoom controls)

This validates visual direction without introducing galaxy-scene complexity.

## How PlanetVisualProfile maps to visual output

`PlanetVisualProfile` inputs map as follows:
- `shape.radius` -> base geometry size
- `shape.wobbleFrequency`, `shape.ridgeWarp` -> low-frequency silhouette distortion characteristics
- `relief.macroStrength`, `relief.microStrength`, `relief.craterDensity` -> deterministic displacement amplitude/composition
- `paletteFamily` + `color` block -> base and emissive color tuning
- `materialFamily` + `relief.roughness` -> metalness/roughness feel
- `atmosphere` block -> optional additive halo color/intensity shell

All geometry deformation is deterministic from profile data and derived seeds.

## What worked

- Deterministic `PlanetVisualProfile` changes produce reproducible visual differences.
- Relief and silhouette variation are visible without custom shader complexity.
- Palette/material families produce meaningfully different planet looks.
- Atmosphere layer is lightweight and optional.

## Current limitations

- Single planet only (no multi-planet batching/culling).
- No camera movement/panning/zoom.
- No interaction/selection pipeline.
- CPU-side displacement for prototype only; not yet optimized for large counts.
- No advanced physically-based shader stack.

## Intentionally deferred before galaxy integration

- Multi-planet scene architecture and performance budgeting at galaxy scale.
- Camera/navigation controls and interaction systems.
- Selection/join gameplay hooks.
- Any DB/auth/gameplay coupling.
- Editor/export tooling.

This slice is a rendering-direction validation step only.
