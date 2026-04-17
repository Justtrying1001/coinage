# CityView readability pass audit (second pass) — 2026-04-17

## 1) Central-stage spatial problems
- Hotspots were still manually packed and branch-specific spacing was uneven.
- Inline district chips added too much text directly on stage.
- Selected node was visible but not dominant enough versus neighboring nodes.
- Non-selected nodes had similar visual weight, reducing branch hierarchy clarity.

## 2) Overlap / collision causes
- Static per-building coordinate map + extra label chips in same layer.
- Similar node sizing for all buildings regardless of role (anchor vs secondary).
- No progressive label mode (too much always-on stage text).

## 3) Panel hierarchy problems
- Right panel stacked many blocks with close visual weight.
- "What matters now" (selected building + next action) competed with secondary info.
- Advanced details were always visible, raising scan cost.

## 4) Information overload problems
- Too many always-on explanatory lines.
- Branch operations and local effects were displayed at similar prominence.
- Queue summaries existed but could be better grouped/scannable.

## 5) Changes implemented in this pass
- Rebuilt stage layout by branch with clearer non-overlapping node maps and node tiers.
- Removed always-on stage chips; kept stage labels minimal and selection-first.
- Strengthened selected/available/locked visual states and quieted inactive nodes.
- Refactored right panel into clear tiers: hero -> action -> branch context -> collapsible advanced details.
- Kept all micro runtime actions connected (upgrade/training/research/intel/policies).
