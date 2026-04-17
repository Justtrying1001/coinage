# Cityview Stitch audit + correction report (2026-04-17)

## 1) Executive summary
- Rebuilt `city3d` UI shell to align with Stitch reference structure: top bar, left branch rail, central branch canvas, right detail panel, and bottom operations strip.
- Reworked each real Coinage branch (`command`, `economy`, `military`, `defense`, `research`, `intelligence`, `governance`, `market`) with distinct page structure instead of generic repeated layouts.
- Kept runtime truth fully grounded in existing systems (`cityEconomySystem` + persistence actions): no invented branch, no invented runtime action.
- Corrected building visual mapping to available repo assets, including `space_dock` now mapped to `assets/spacedock.png` and explicit fallback for buildings with no dedicated art (`armament_factory`).
- Removed overlap risk from legacy city layers by keeping render host exclusively on `.city-stitch` classes.

## 2) Skill usage report
Skills loaded from `skill/taste-skill-main.zip`:
- `stitch-skill`: used for shell composition parity and branch-level visual hierarchy replication.
- `redesign-skill`: used to audit weak generic repeated patterns and replace with branch-distinct composition.
- `taste-skill`: used for density, spacing, readability, and anti-slop cleanup (wrapping, rhythm, panel structuring).

## 3) Audit report (branch by branch)

### Command
- Stitch reference: macro city overview with grouped infrastructure zones + card deck + right building detail + bottom queue.
- Before: mixed command lists and cards but spacing/composition too generic and weakly segmented.
- Fixes: dedicated `command-zones` row with 3 grouped blocks + full building card matrix; retained real building IDs and upgrade wiring.

### Economy
- Stitch reference: economy-focused production tiles + telemetry + right detail.
- Before: generic ops rows without clear production-tile hierarchy.
- Fixes: building production tile grid + throughput telemetry + building intel list, all wired to real production/storage data.

### Military
- Stitch reference: strong training roster focus + activity feed.
- Before: acceptable wiring, but page lacked distinct structure and looked like reused ops list.
- Fixes: separate training roster, feed panel, and support structures panel, still using real troop guard/training actions.

### Defense
- Stitch reference: defense metrics + hardening statuses + structure list.
- Before: partially aligned but insufficient visual differentiation.
- Fixes: metric cards + hardening list + defense structure controls with real derived defense stats.

### Research
- Stitch reference: node list + queue context + detail side.
- Before: flat list rendering.
- Fixes: explicit node board + queue block with real research guard/start/queue state.

### Intelligence
- Stitch reference: active ops board + readiness + queue.
- Before: functionally correct but visually generic.
- Fixes: readiness board and active queue blocks with real intel project actions.

### Governance
- Stitch reference: directive application panel + impact/risk contextual panel.
- Before: generic structure.
- Fixes: directive action board + impact panel driven by policy and derived city context.

### Market
- Stitch reference: exchange-focused control surface + presets + auth state.
- Before: generic rows, unclear branch identity.
- Fixes: exchange ops + quick presets + infrastructure; runtime-unavailable trade execution stays explicit/unavailable (no fake runtime).

## 4) Runtime wiring report
- Fully wired runtime actions:
  - Building upgrades (`startCityBuildingUpgrade`)
  - Troop training (`startCityTroopTraining`)
  - Research start (`startCityResearch`)
  - Intel start (`startCityIntelProject`)
  - Policy set (`setCityPolicy`)
- Fully wired runtime data:
  - Resource stocks/rates/storage caps
  - Population snapshot
  - Build/training/research/intel queues
  - Derived city effects
- Visual-only / unavailable by runtime:
  - Market trade execution remains unavailable (explicitly labeled and disabled)

## 5) Asset mapping report
- Updated mapping table in `CityFoundationMode.ts`:
  - `hq -> /assets/HQ.png`
  - `mine -> /assets/stone.png` (shared extraction art)
  - `quarry -> /assets/stone.png` (shared extraction art)
  - `refinery -> /assets/refeniry.png`
  - `warehouse -> /assets/warehouse.png`
  - `housing_complex -> /assets/housing.png`
  - `barracks -> /assets/barrack.png`
  - `space_dock -> /assets/spacedock.png` (fixed)
  - `defensive_wall -> /assets/walls.png`
  - `watch_tower -> /assets/watchtower.png`
  - `intelligence_center -> /assets/spycenter.png`
  - `research_lab -> /assets/researchlabs.png`
  - `market -> /assets/market.png`
  - `council_chamber -> /assets/councill.png`
  - `armament_factory -> fallback placeholder (no dedicated asset present in repo)`

## 6) Legacy cleanup report
- City render root remains `.city-stitch` only.
- No `.city-management` / `.citycmd` layer mounted by `CityFoundationMode`.
- Preserved explicit test assertions to prevent legacy shell regression.

## 7) File list changed
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `src/game/render/modes/CityFoundationMode.test.ts`
- `docs/18-cityview-stitch-audit-correction.md`

## 8) Commands run
- `rg --files -g 'AGENTS.md'`
- `find / -name AGENTS.md 2>/dev/null | head -n 50`
- `rg --files`
- `sed -n ... src/components/game/GameShell.tsx`
- `sed -n ... src/components/game/GameRenderViewport.tsx`
- `sed -n ... src/game/app/CoinageRenderApp.ts`
- `sed -n ... src/game/render/modes/CityFoundationMode.ts`
- `rg -n "city-stitch" src/styles/globals.css`
- `unzip ... design/stitch_coinage_city_management_interface.zip`
- `unzip ... skill/taste-skill-main.zip`
- `sed -n ... /tmp/taste_skill/.../stitch-skill/SKILL.md`
- `sed -n ... /tmp/taste_skill/.../redesign-skill/SKILL.md`
- `sed -n ... /tmp/taste_skill/.../taste-skill/SKILL.md`
- `sed -n ... /tmp/stitch_ref/.../code.html`
- `sed -n ... src/game/city/economy/cityEconomyConfig.ts`
- `sed -n ... src/game/render/modes/CityFoundationMode.test.ts`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 9) Results
See terminal run for exact pass/fail.
