# Galaxy2DMode + Planet3DMode Visual/Rendering Audit

Scope: visual rendering only (galaxy map, planet render, and transition feel where relevant). No gameplay, economy, simulation, or product strategy considerations.

## Executive summary

- **Planet3DMode currently reads as the stronger visual system**: it has physically-lit shading (`MeshStandardMaterial`), seed-driven geometry displacement, broad archetype color variation, and interactive silhouette changes through drag rotation.
- **Galaxy2DMode is currently the weaker visual system**: it presents as a mostly uniform point-cloud with limited macro hierarchy, weak pathfinding/readability cues, and minimal “unknown frontier” framing.
- **Single biggest visual weakness:** galaxy map identity/hierarchy is underdeveloped, making discovery feel flatter than the planet view.
- **Highest-leverage next pass:** **Galaxy v2 visual pass** (not planet v3, not transition polish first).

## Current visual strengths

### Galaxy2DMode

- Clean baseline readability: star nodes are legible at a glance, and hover/selection rings communicate focus state reliably.
- Functional visual interaction: panning/zooming and hover tooltip produce immediate feedback and avoid complete visual ambiguity.
- Entry pulse on select provides a minimal “mode switch intent” cue before jumping to planet mode.

### Planet3DMode

- Stronger shape language through true 3D relief: the mesh is displaced per-vertex using layered noise masks (continent/ridge/crater/polar terms), producing visible macro/micro breakup.
- Better material response than the galaxy mode: `MeshStandardMaterial` with roughness/metalness/emissive ranges gives richer light play than flat/unlit rendering.
- Distinct planet-to-planet variation: profile parameters (hue drift, ocean level, relief, roughness, metalness, etc.) create broad visual diversity.
- Lighting stack (ambient + key directional + fill directional + accent rim point light) gives acceptable silhouette readability and prevents fully crushed dark-side values.

## Current visual weaknesses

### Galaxy2DMode

- **Weak hierarchy at map scale:** aside from small radius/alpha shifts and population-band tint changes, nodes cluster into a relatively uniform field; arm structure and regional identity are not strongly surfaced visually.
- **Low map identity:** no distinct sector language, arm gradients, nebula volumes, dust lanes, landmarks, route motifs, or iconography to differentiate “this galaxy” from a generic star scatter.
- **Exploration feel is limited:** nearly all content is immediately rendered with similar treatment; there is little atmospheric depth layering or progressive reveal language.
- **Backdrop treatment is minimal:** sparse backdrop points plus a faint rectangular bounds stroke read more as debug framing than authored art direction.

### Planet3DMode

- **Surface richness ceiling:** color is vertex-derived HSL with no texture stack (normal/roughness/ao maps), so close inspection can appear smooth/procedural rather than materially complex.
- **Lighting realism ceiling:** no IBL/environment map, no atmospheric scattering shell, no shadowing cues from nearby geometry, and no post effects; the result is stylized-clean but not deeply cinematic.
- **Silhouette enhancement is moderate:** relief is present but still subtle at current distance/FOV; no terminator/atmosphere edge treatment to push readability further.

### Transition feel (relevant but secondary)

- Transition is currently mostly a short galaxy-ring pulse followed by hard mode replacement. There is no shared camera language, crossfade, zoom-through, or continuity layer to visually “bridge” scale.

## Single biggest visual weakness

**Galaxy visual hierarchy + identity (Galaxy2DMode) is the biggest current weakness.**

Reason: Planet3DMode already has materially richer rendering primitives (geometry displacement, PBR material response, multi-light setup), while Galaxy2DMode remains visually sparse and comparatively generic at first impression and during exploration.

## Recommended next visual implementation task

## ✅ Recommendation: **Galaxy v2 visual pass**

Implement a focused Galaxy v2 pass that upgrades hierarchy, identity, and exploration atmosphere without touching gameplay systems.

### Suggested implementation target (single pass)

1. **Macro structure layer (highest impact):**
   - Add authored spiral-arm gradient bands + inter-arm falloff haze.
   - Introduce region-scale color temperature variation (core warm shift, rim cool shift, subtle arm tint variance).
2. **Depth/parallax layer:**
   - Split stars into at least 2–3 strata (far dust, mid stars, near stars) with parallax sensitivity to pan/zoom.
   - Use additive bloom-like halos only for selected high-importance nodes.
3. **Node hierarchy language:**
   - Expand population-band differentiation beyond alpha/radius to include glow profile, ring style, and label priority.
   - Reserve stronger visual motifs for key nodes (dense/core-adjacent landmarks).
4. **Exploration framing:**
   - Add subtle fog-of-depth/vignette and sector overlays so movement feels like traversing authored space rather than moving over a flat scatter plot.

This pass should be prioritized before Planet v3 or transition polish because it addresses the most visible comparative quality gap between the two current modes.
