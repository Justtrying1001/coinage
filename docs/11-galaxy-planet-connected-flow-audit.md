# Galaxy → Planet Connected Flow Audit (Player-Facing)

Date: 2026-04-10

## Skills baseline used

This audit uses the repository Three.js skills as the baseline for evaluation:
- `.agents/skills/threejs-fundamentals/SKILL.md`
- `.agents/skills/threejs-interaction/SKILL.md`

These were applied to assess scene lifecycle, camera/renderer behavior, pointer handling, selection feedback, and control affordances across the **end-to-end** flow (Galaxy2D → transition → Planet3D → return).

## Audit scope

- `src/game/render/modes/Galaxy2DMode.ts`
- `src/game/render/modes/Planet3DMode.ts`
- `src/game/app/CoinageRenderApp.ts`
- `src/components/game/GameShell.tsx`
- `src/components/game/GameRenderViewport.tsx`

---

## Executive summary

As a connected player journey, the current experience is **coherent, functional, and already enjoyable for short sessions**, but it still reads as a **strong prototype** rather than a polished product loop.

The core flow is successful:
1. You can explore the galaxy.
2. Hover and select a planet with readable contextual info.
3. Transition quickly into a rotatable 3D planet.
4. Return cleanly to galaxy with map state preserved.

What is still missing is **flow texture**: stronger “you are here / what you can do now” cues, richer transition continuity, and tighter interaction ergonomics. The largest product risk is not renderer architecture—it is that the current loop may feel mechanically complete but emotionally flat after initial novelty.

---

## Strongest parts of the current experience

### 1) Flow continuity and state handoff are solid
- `CoinageRenderApp` preserves selected planet and restores `Galaxy2D` view snapshot when returning, which avoids disorientation and supports “inspect then continue browsing” behavior.
- Mode switching is explicit and stable via a narrow context API (`onSelectPlanet`, `onRequestMode`).

### 2) Galaxy interaction baseline is clear
- Galaxy supports pan, zoom-at-cursor, hover targeting, and click-to-select with drag-vs-click thresholding.
- Hover/selection halos + node emphasis + HUD panel create a usable selection loop.

### 3) Planet interaction baseline is intuitive
- Planet supports direct drag rotation with clamped pitch and inertial carryover.
- Escape key plus in-canvas “Back to Galaxy” button gives redundant return paths.

### 4) Transition is present (not absent)
- Galaxy click triggers a short entry transition window before mode request, so the flow already has a perceptible “commit to inspect” beat instead of a hard cut.

---

## Weakest parts of the current experience

### UX issues
- **Intent communication is still light.** The flow works, but first-time players get limited guidance on goals, success criteria, or what to compare between planets.
- **Identity continuity is weak during transition.** The selected planet’s identity (name/traits) does not strongly bridge from galaxy HUD into planet scene.
- **Mode controls compete slightly.** Header mode toggles are always visible, but in-flow context mostly lives in canvas, creating two parallel navigation idioms.

### Visual issues
- **Galaxy readability drops in dense regions.** Population bands are differentiated, but hue/luminance spacing remains subtle at scale.
- **Planet scenes are attractive but still sparse.** Single-body presentation lacks atmospheric/parallax layers or stronger staging signals that elevate “inspection value.”
- **Transition aesthetics are minimal.** Functional pulse/entry timing exists, but no stronger cinematic or semantic continuity (e.g., camera-led dive feel).

### Interaction issues
- **Pointer handling is globally attached on `window`** in both modes, which is functional but less robust than canvas pointer-capture patterns for long-term UI coexistence.
- **Galaxy targeting confidence varies by zoom density.** Hit areas are reasonable, but crowded selection can still feel approximate.
- **Planet interaction has limited action vocabulary.** Rotation and return are good foundations, yet there is little inspect-level interaction beyond looking.

### Architectural limitations
- **Planet mode remains monolithic.** Visual layers, interaction zones, and data hooks are not yet structured as composable sub-systems.
- **No explicit transition controller/state machine.** Current transition is mode-local timing rather than a shared flow orchestration primitive.
- **Metadata depth is still thin for future escalation.** Enough for visuals now, but limited hooks for richer downstream inspect interactions.

---

## Biggest remaining product risk

The biggest risk is **retention risk through shallow inspect payoff**: players can perform the loop, but the Planet3D step may not yet deliver enough differentiated “why this planet matters” value to sustain repeated exploration.

In product terms: the loop is navigable, but its reward gradient is still modest.

---

## Prioritized next steps

1. **Increase inspect payoff in Planet3D (highest priority).**
   - Add immediate planet identity overlay (name + key generated traits).
   - Introduce one additional visual layer (e.g., subtle atmosphere shell) that reinforces uniqueness.
   - Keep interaction simple; prioritize clarity over adding many controls.

2. **Strengthen Galaxy→Planet continuity.**
   - Carry selected node identity into the first seconds of Planet3D via persistent badge/breadcrumb.
   - Make return state explicit (“Back to Galaxy: [planet name]”).

3. **Refine selection confidence in Galaxy2D.**
   - Slightly stronger contrast ladder for population bands.
   - Zoom-aware halo/hit tuning in high-density clusters.

4. **Harden interaction plumbing (targeted, not architectural overhaul).**
   - Move to element-scoped pointer capture where practical.
   - Keep current mode boundaries; avoid broad redesign.

5. **Prepare a lightweight transition orchestration primitive.**
   - Minimal shared transition state descriptor between modes, without renderer rewrite.

---

## Recommended single immediate next implementation task

### Implement a **Planet Inspect Identity Layer v1**

**Why this is highest leverage now:**
- It directly improves player-facing payoff at the moment of focus (the planet view).
- It strengthens connected-flow continuity without major architectural changes.
- It can be delivered as a bounded slice and validated quickly.

**Task contents (bounded):**
- Add a small in-canvas overlay in `Planet3DMode` with:
  - planet name/id,
  - 2–3 generated descriptive tags derived from existing seed/profile,
  - persistent “Back to Galaxy” grouping.
- Keep existing controls unchanged except minor ergonomics if needed.
- No city-view expansion, no renderer redesign.

**Definition of done:**
- On selection, players can immediately answer: “Which planet is this and what’s distinctive about it?”
- On return, players feel they came back from that specific inspected planet, not from a generic modal detour.

