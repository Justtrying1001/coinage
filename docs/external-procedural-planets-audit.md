# External Audit — XenoverseUp/procedural-planets (Rendering Notes)

## Purpose

Capture the rendering concepts from `XenoverseUp/procedural-planets` that Coinage should adapt while keeping Coinage scope bounded.

## Concepts to preserve in Coinage renderer

- **Layered procedural terrain**
  - Multi-octave noise with macro/micro composition.
  - Domain warp style breakup to avoid uniform procedural patterns.
  - Ridge/mountain emphasis and crater/erosion style interruptions.
- **Strong relief language**
  - Visible large-form elevation plus high-frequency breakup.
  - Terrain that reads volumetric from distance, not just tinted smooth spheres.
- **Rich material bands**
  - Distinct terrain regions (water/coast/lowland/highland/ridge/snow-like caps when relevant).
  - Controlled stylization rather than physically strict realism.
- **Atmospheric presence**
  - Halo/fresnel shell treatment where appropriate.
  - Light-weight, additive blending to keep style readability.

## Concepts intentionally not copied

- Editor/showcase UX and tooling.
- Export/bake pipeline and related orchestration.
- Overbuilt app architecture not needed for Coinage MVP.

## Coinage integration constraints

- Deterministic from `worldSeed + planetSeed + visualGenVersion`.
- `PlanetVisualProfile` remains the render contract.
- Visual richness should scale toward many planets by keeping shader/material strategy practical.
