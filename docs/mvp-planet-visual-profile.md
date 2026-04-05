# MVP PlanetVisualProfile Generator

## Purpose

The `PlanetVisualProfile` generator is the first renderer coding slice for Coinage MVP.

It provides a **pure, deterministic, renderer-oriented data profile** for each planet, without any rendering, DB, or gameplay dependencies.

This profile is intended to be consumed later by the actual rendering layer (mesh/material/shader setup), while keeping generation logic testable and stable.

## Seed contract

Inputs:
- `worldSeed` (global deterministic world identity)
- `planetSeed` (stable per-planet identity)
- optional `visualGenVersion` override

Determinism rule:
- same `worldSeed` + `planetSeed` + `visualGenVersion` => identical profile output
- derived sub-seeds (`shape`, `relief`, `color`, `atmo`) are deterministic from those inputs

Runtime randomness rule:
- The final runtime generation path must not use `Math.random()`
- Generation relies only on deterministic seeded RNG utilities

## Profile shape overview

`PlanetVisualProfile` includes MVP-practical rendering inputs:
- identity and version metadata (`id`, `visualGenVersion`, seed inputs)
- derived sub-seeds
- size category + radius
- silhouette/shape parameters (wobble frequency/amplitude, ridge warp)
- relief/noise parameters (macro/micro strength, roughness, crater density)
- surface stratification controls (ocean level, biome scale, heat/moisture bias, ridge sharpness)
- material + palette family
- color parameters (hue shift, saturation, lightness, accent mix)
- optional atmosphere block (enabled/intensity/thickness/tint shift)

All key numeric values are generated within explicit bounded ranges defined in constants.

## Intentionally deferred

This slice intentionally does **not** include:
- Three.js or any renderer implementation
- mesh/material construction logic
- galaxy scene integration
- camera/movement/interaction behavior
- DB/Prisma integration
- gameplay/auth/session logic

Those will be implemented in later slices after this deterministic profile layer is validated.
