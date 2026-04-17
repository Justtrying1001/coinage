# Cityview Stitch Port Summary

## 1) What was changed
- Replaced the previous city command deck visual shell with a Stitch-faithful city management shell featuring:
  - fixed top command/resource bar
  - fixed left branch navigation
  - central branch card canvas
  - fixed right contextual detail panel
  - fixed bottom queue/ops/status strip
- Kept all core actions wired to the real city runtime/persistence stack:
  - building upgrade
  - troop training
  - research start
  - intel project start
  - policy set
- Added mapping for real building visual assets into the new card layout.
- Added a code-only assets route (`src/app/assets/[file]/route.ts`) so existing root `assets/` files are served directly without duplicating binaries.
- Updated city mode tests to assert against the new Stitch-port DOM/class structure.

## 2) Files changed
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `src/game/render/modes/CityFoundationMode.test.ts`
- `docs/cityview-stitch-port-audit.md`
- `docs/cityview-stitch-port-summary.md`
- `src/app/assets/[file]/route.ts` (serves canonical root `assets/` files at `/assets/:file`)

## 3) Fully wired to real data/actions
- Top resource strip: real resources, production rates, storage usage, and population snapshot.
- Building cards: real building order by active branch, unlock state, level, next cost/guard state.
- Right detail panel:
  - selected building real effect text + next upgrade/cost/duration
  - upgrade CTA wired to `startCityBuildingUpgrade`
  - military troop actions wired to `startCityTroopTraining` with real guards
  - research actions wired to `startCityResearch` with real guards
  - intel actions wired to `startCityIntelProject` and real intel guards/readiness
  - governance actions wired to `setCityPolicy` with real guards
  - derived city effects from `getCityDerivedStats`
- Bottom strip:
  - real construction queue with remaining durations
  - real queue counters for training/research/intel
  - real queue slot usage status

## 4) Visually present but intentionally disabled/unavailable
- Defense/market branch-specific non-building operation modules are shown as visual branch context blocks with explicit unavailable messaging (no invented backend actions).
- Premium/wallet/special systems remain explicitly disabled (`MVP MICRO only · premium/wallet/special disabled`).

## 5) Follow-up items / risks
- Stitch export includes multiple branch-specific compositions with unique sub-layouts. Current port unifies those into one shared shell + branch content cards while preserving strict visual language and fixed-region composition.
- If strict per-branch one-to-one scene composition is required (beyond common shell fidelity), additional branch-specific templates can be added over this base wiring.
- Material Symbols glyph rendering depends on host font availability; icon fallback remains text-safe.


## 6) Branch coverage in current shell
- Command / Home
- Economy
- Military
- Defense
- Research
- Intelligence
- Governance
- Market

Legacy overlap correction:
- City mode now clears host content before mounting Stitch shell, and global game header is hidden while in city mode to prevent dual top bars.
