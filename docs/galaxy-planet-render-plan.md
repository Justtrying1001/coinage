# Coinage Galaxy Planet Render Plan (MVP)

## 1) Goal

Define a practical, implementation-ready rendering plan for **Coinage MVP Galaxy View** that delivers visually distinct 3D planets without overbuilding post-MVP systems.

For MVP, Galaxy View rendering must achieve:
- Render planets in **3D** within the galaxy scene.
- Provide a convincing visual feel of relief/material richness (not flat circles).
- Generate visuals **deterministically from seeds**.
- Keep a **static zoom level** for MVP.
- Allow camera/player movement in all directions across the galaxy field.
- Support simple selection/highlight interaction for gameplay navigation.

For MVP, Galaxy View rendering does **not** need:
- Full interactive “planet viewer” mode.
- Continuous per-planet rotation by default.
- Planet-inspection cinematic transitions.

Rationale:
- Internal Coinage audit confirms the repo is bootstrap-only and needs controlled, scoped implementation next.
- External audit conclusion confirms we should not directly import/reuse the full `XenoverseUp/procedural-planets` app; we should build a Coinage-native renderer inspired by its techniques.

---

## 2) Inputs / deterministic seed contract

### Seed model

Use a deterministic seed hierarchy:
- `worldSeed` (global; from environment/config)
- `planetSeed` (stable per-planet identifier input)
- Optional derived sub-seeds:
  - `shapeSeed`
  - `reliefSeed`
  - `colorSeed`
  - `atmoSeed`

### Deterministic contract

Given identical inputs (`worldSeed`, `planetSeed`, config version), the output **must be identical**:
- same silhouette parameters
- same relief/noise parameters
- same palette/material preset
- same atmosphere flag/intensity (if enabled)

### Runtime randomness rule

- **Forbidden in final runtime render path:** `Math.random()`.
- All stochastic-looking values must come from seeded deterministic generators.
- `Math.random()` may be used only in local experiments/prototypes not committed to final render logic.

### Versioning note

Introduce a small `visualGenVersion` constant in the profile generator contract so future visual updates can be controlled without silent drift.

---

## 3) Visual requirements for MVP

Each MVP planet should include:
- **Silhouette variation**
  - radius bands, subtle shape distortion parameters, or profile presets.
- **Surface relief impression**
  - visible pseudo-topography from layered noise / normal perturbation / material roughness variation.
- **Color/material variation**
  - deterministic palette families (rocky, metallic, dusty, icy-like stylization, etc.) with controlled ranges.
- **Optional atmosphere/glow**
  - lightweight halo shell or post-style glow where appropriate.
- **Uniqueness floor**
  - enough parameter diversity to avoid obvious repeated clones when scanning nearby planets.

What is explicitly **not required yet**:
- Planet editor tooling.
- Asset export pipeline.
- Planet rotation logic.
- Advanced custom shader stack beyond MVP clarity/perf needs.
- Ultra-high-fidelity physical terrain simulation.

---

## 4) Technical rendering strategy

## Recommended MVP strategy

Build a **Coinage-native simplified renderer inspired by procedural-planets**, not a direct reuse.

### Inspiration to take

From the external audit conclusions, reuse concepts only:
- Layered procedural noise mindset (macro + micro variation).
- Practical material/shader ideas for relief and richness.
- Optional atmosphere shell/halo pattern.

### What we do NOT reuse directly

- External editor/showcase app structure.
- Export pipeline and related tooling.
- Worker/export orchestration built for asset production.
- Heavy multi-pass/high-cost GPU orchestration that is not required for MVP gameplay.

### Why this is the right trade-off

- Aligns with Coinage MVP scope guardrails.
- Preserves deterministic, stylized uniqueness.
- Avoids importing architecture debt from a project with different goals.

---

## 5) Performance budget

Define pragmatic MVP constraints:

- **Visible planets target:** ~40–80 simultaneously visible in typical galaxy viewport (tunable after first measurements).
- **Planet mesh complexity target:** low/medium poly budget suitable for many instances on screen.
- **Material strategy:** prefer shared base materials/shader programs with per-planet uniform/profile variation.
- **Texture strategy:** avoid heavy unique high-resolution textures per planet in MVP.
- **Generation strategy:** avoid per-frame expensive regeneration; compute profile once, reuse.

Likely performance traps to avoid:
- Unique shader/material program per planet.
- Excessive draw calls from per-planet custom pipelines.
- Expensive dynamic noise evaluation every frame for all planets.
- Atmospheric effects with high overdraw cost on large planet counts.

---

## 6) Architecture proposal

Proposed internal module shape for future implementation:

1. **Planet visual profile generator (pure, deterministic)**
   - Input: `worldSeed`, `planetSeed`, optional generation config.
   - Output: `PlanetVisualProfile` (shape params, relief params, palette/material params, atmosphere params).
   - No rendering library imports.

2. **Planet visual profile types/constants**
   - Typed schema for profile fields.
   - Constrained parameter ranges and preset catalogs.
   - Includes `visualGenVersion`.

3. **Planet renderer/material layer**
   - Consumes `PlanetVisualProfile`.
   - Builds/updates mesh + material from profile.
   - Supports shared material strategy and controlled per-instance overrides.

4. **Galaxy scene integration layer**
   - Maps gameplay/world planet records to render entities.
   - Handles placement, culling policy, selection highlight state.
   - Keeps camera movement and scene controls separated from profile generation.

5. **Interaction layer (MVP-minimal)**
   - Hover/select/click for navigation intents.
   - No deep planet-inspection sub-scene in first slice.

This keeps deterministic logic testable and renderer concerns isolated.

---

## 7) Recommended implementation sequence

1. **Step 1 — Deterministic visual profile generator**
   - Implement pure seeded generator + types + parameter clamps.
   - Add deterministic tests (same seed => same profile).

2. **Step 2 — Single-planet renderer prototype**
   - Render one planet from a `PlanetVisualProfile`.
   - Validate silhouette + relief + palette + optional halo.

3. **Step 3 — Multi-planet galaxy integration**
   - Render many planets with shared material strategy.
   - Validate uniqueness and frame-time behavior.

4. **Step 4 — Galaxy movement/panning controls**
   - Add all-direction movement at fixed zoom.
   - Keep control model simple and deterministic-friendly.

5. **Step 5 — MVP interaction layer**
   - Hover/selection feedback and callback hooks for route/game actions.

6. **Step 6 — Budget pass and guardrail hardening**
   - Profile draw calls and frame times.
   - Reduce complexity where needed before adding any visual extras.

---

## 8) Explicit non-goals

Do **not** implement in first renderer slice:
- Full planet viewer mode.
- Planet rotation system.
- Procedural planet editor UI.
- Export/bake pipeline.
- Worker farm/gpu compute orchestration for offline generation.
- V0/V1+ visuals tied to combat/governance/alliances/market systems.
- Unbounded shader experimentation without performance budget checks.

---

## 9) Final recommendation

Proceed with a **Coinage-native deterministic profile + shared-material multi-planet renderer** as the next coding slice.

Start by implementing the pure profile generator first, then a single-planet proof, then controlled multi-planet integration in galaxy view.

This sequence maximizes determinism, reduces scope risk, and matches the current repository maturity and MVP boundaries.
