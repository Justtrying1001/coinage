# Post-Planet-v2 Connected Flow Audit

Date: 2026-04-10

## Scope
- Galaxy2DMode
- galaxy selection behavior
- galaxy→planet transition
- Planet3DMode
- inspect identity layer
- return flow to galaxy

## Executive summary
The connected Galaxy→Planet loop is now coherent and significantly more legible than prior audits, with strong deterministic identity in planet visuals and a clean return-to-context flow. The highest-leverage next step is **Planet v3: Inspect Decision Layer** (not more rendering complexity, and not city view yet): add one compact, deterministic, player-meaningful comparison layer in Planet3D that answers "why inspect this planet next".

## What improved most since previous audit
1. Planet distinctiveness increased materially via deterministic archetypes and archetype-scoped profile generation.
2. Surface readability improved through archetype-influenced macro bias, relief weighting, and secondary pattern controls.
3. Inspect panel coherence improved by showing archetype in subtitle and ensuring archetype-forward tags.

## Current strongest part
**Flow continuity and deterministic identity handoff** is the strongest area:
- Selection in Galaxy2D is explicit and drives mode switch through app-level context callbacks.
- Return preserves the prior galaxy view transform (map position/zoom), reducing disorientation.
- Planet visuals are now more uniquely tied to seed through archetype + profile controls.

## Current weakest part
**Player-facing inspect payoff depth** is now the weakest link:
- Planet3D interaction is still mostly rotate + read compact tags.
- The inspect layer gives identity descriptors but limited comparative meaning/actionability.
- Transition and return are clean, but repeated loops can still feel observational rather than decisional.

## Biggest remaining product risk
Retention risk from a **shallow decision gradient**: players can browse and admire planets, but there is still limited strategic reason to prefer one inspected planet over another inside this loop.

## Recommended single immediate next implementation task
Implement **Planet v3: Inspect Decision Layer (compact)**:
- Keep current renderer architecture and visuals.
- Add a deterministic 2–3 metric strip (e.g., stability/resource volatility/surface harshness) derived from existing seed/profile fields.
- Show one short “notable trait” sentence and one “compare cue” against galaxy median/cluster context.
- Keep panel premium and compact; no city view mechanics yet.

Why this is highest leverage:
- Converts visual identity into player-facing meaning.
- Strengthens repeat-loop motivation without heavy systems.
- De-risks eventual City View by clarifying what data and fantasy must carry forward.

## Should City View still wait?
**Yes.** City View should still wait until Planet3D delivers a stronger inspect-to-decision loop. Otherwise City View risks becoming a feature jump that amplifies current meaning gaps instead of compounding strengths.
