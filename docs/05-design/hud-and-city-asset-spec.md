# HUD and City Runtime Asset Specification (Production Planning)

## Scope and runtime baseline

This specification is grounded in the currently implemented runtime UI surfaces in this repository:

- Shared world HUD used in **Galaxy** and **Planet** modes.
- Galaxy inspect panel (planet/settlement summary).
- Planet inspect panel (colony entry/management affordance).
- City runtime HUD and city section UI (command/economy/military/defense/research/intelligence/governance/market).
- Runtime building cards/tiles/detail links and queue/status affordances.
- Runtime resource telemetry for ore/stone/iron + population meta.

Out of scope for production now:

- Final unit portrait/thumbnail pipeline.
- Final research node iconography.
- Speculative systems not present in runtime code.

Priority model:

- **P0** = immediate readability blockers for current runtime.
- **P1** = important usability/polish upgrades.
- **P2** = optional visual richness.

Status model:

- **safe-now** = can be produced now without waiting for system changes.
- **blocked** = needs runtime/system change first.
- **later** = intentionally deferred (optional polish).

---

## Naming convention (recommended)

### Base paths

Use runtime-served assets under `assets/` (served by `/assets/<file>` route):

- `assets/ui/hud/`
- `assets/ui/status/`
- `assets/ui/resource/`
- `assets/ui/nav/`
- `assets/building/` (existing folder already in use)

### Filenames

- **Icons (mono/vector preferred):**
  - `cg_{surface}_{semantic}_{size}.svg`
  - Example: `cg_hud_mode_galaxy_20.svg`
- **Raster fallbacks:**
  - `cg_{surface}_{semantic}_{size}.png`
- **State variants:**
  - append `_default`, `_hover`, `_active`, `_disabled`, `_warning`, `_selected`
  - Example: `cg_city_status_locked_16_default.svg`
- **Building art:**
  - `cg_building_{building_id}_{slot}_{size}.png`
  - `slot` in `{card,tile,thumb}`
  - Example: `cg_building_hq_card_256.png`

### Format guidance

- Prefer **SVG** for line icons and status badges.
- Prefer **PNG** for painted building visuals (card/tile art).
- Use **CSS token only** when existing geometry/shape is sufficient and no image is needed.

---

## Surface-by-surface asset specification

## 1) World HUD + navigation (Galaxy/Planet shared + City top mode switch)

| Asset ID | Asset label | Surface | Related component(s) | Gameplay/system element | Asset type | Format | Suggested dimensions | Variants/states | Priority | Needed now? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `hud.mode.galaxy` | Galaxy mode icon | Shared HUD mode switch + City top switch | `GameShell`, `CityFoundationMode` | Mode navigation to galaxy | icon | SVG | 20x20 | default, hover, active, disabled | P0 | yes | safe-now | Currently text glyph `GX`; replace with icon while keeping existing button behavior. |
| `hud.mode.planet` | Planet mode icon | Shared HUD mode switch + City top switch | `GameShell`, `CityFoundationMode` | Mode navigation to planet | icon | SVG | 20x20 | default, hover, active, disabled | P0 | yes | safe-now | Currently `PL` text glyph. |
| `hud.mode.city` | City mode icon | Shared HUD mode switch + City top switch | `GameShell`, `CityFoundationMode` | Mode navigation to city | icon | SVG | 20x20 | default, hover, active, disabled | P0 | yes | safe-now | Currently `CT` text glyph. |
| `planet.action.open_management` | Open management action icon | Planet inspect panel button | `Planet3DMode` | Enter city management view | icon + optional leading badge | SVG | 16x16 | default, hover, active, disabled | P1 | later | safe-now | Text-only button works; icon improves scanability. |
| `planet.action.back_to_galaxy` | Back action icon | Planet inspect panel button | `Planet3DMode` | Return to galaxy | icon | SVG | 16x16 | default, hover, active | P1 | later | safe-now | If adopted, use same icon family as HUD mode switch. |

## 2) City side navigation icons

| Asset ID | Asset label | Surface | Related component(s) | Gameplay/system element | Asset type | Format | Suggested dimensions | Variants/states | Priority | Needed now? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `city.nav.command` | Command section icon | City left nav | `CityFoundationMode` | Building command page | icon | SVG | 18x18 | default, hover, active | P0 | yes | safe-now | Replaces `CM` code glyph. |
| `city.nav.economy` | Economy section icon | City left nav | `CityFoundationMode` | Economy page | icon | SVG | 18x18 | default, hover, active | P0 | yes | safe-now | Replaces `EC` glyph. |
| `city.nav.military` | Military section icon | City left nav | `CityFoundationMode` | Military page | icon | SVG | 18x18 | default, hover, active | P0 | yes | safe-now | Replaces `MI` glyph. |
| `city.nav.defense` | Defense section icon | City left nav | `CityFoundationMode` | Defense page | icon | SVG | 18x18 | default, hover, active | P0 | yes | safe-now | Replaces `DF` glyph. |
| `city.nav.research` | Research section icon | City left nav | `CityFoundationMode` | Research page | icon | SVG | 18x18 | default, hover, active | P1 | later | safe-now | Section is runtime-live; icon optional for readability. |
| `city.nav.intelligence` | Intelligence section icon | City left nav | `CityFoundationMode` | Intel page | icon | SVG | 18x18 | default, hover, active | P1 | later | safe-now | Replace `IN` glyph if desired. |
| `city.nav.governance` | Governance section icon | City left nav | `CityFoundationMode` | Governance page | icon | SVG | 18x18 | default, hover, active | P1 | later | safe-now | Replace `GV` glyph if desired. |
| `city.nav.market` | Market section icon | City left nav | `CityFoundationMode` | Market page | icon | SVG | 18x18 | default, hover, active, disabled/partial | P1 | later | safe-now | Market is partial runtime; icon state can show partial/disabled context. |
| `city.nav.badge.core` | Core status badge icon | City left nav lock/status chip | `CityFoundationMode` | Section status indicator | badge | SVG | 14x14 | default | P1 | later | safe-now | Optional replacement of text `Core`. |
| `city.nav.badge.live` | Live status badge icon | City left nav lock/status chip | `CityFoundationMode` | Section status indicator | badge | SVG | 14x14 | default | P1 | later | safe-now | Optional replacement of text `Live`. |
| `city.nav.badge.partial` | Partial status badge icon | City left nav lock/status chip | `CityFoundationMode` | Section status indicator | badge | SVG | 14x14 | default, warning | P1 | later | safe-now | Useful for Market section partial state. |

## 3) Resource icons (runtime resources only)

| Asset ID | Asset label | Surface | Related component(s) | Related gameplay/system element | Asset type | Format | Suggested dimensions | Variants/states | Priority | Needed now? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `resource.ore` | Ore icon | City top HUD resource cards, economy telemetry contexts | `CityFoundationMode` | `ore` stock + rate | icon | SVG | 16x16 + 20x20 | default, warning (near full/low optional) | P0 | yes | safe-now | Currently shown as text glyph `OR`. |
| `resource.stone` | Stone icon | City top HUD resource cards, economy telemetry contexts | `CityFoundationMode` | `stone` stock + rate | icon | SVG | 16x16 + 20x20 | default, warning optional | P0 | yes | safe-now | Currently shown as `ST`. |
| `resource.iron` | Iron icon | City top HUD resource cards, economy telemetry contexts | `CityFoundationMode` | `iron` stock + rate | icon | SVG | 16x16 + 20x20 | default, warning optional | P0 | yes | safe-now | Currently shown as `IR`. |
| `resource.population` | Population icon | City top HUD meta resource card | `CityFoundationMode` | used/cap + storage alert context | icon | SVG | 16x16 | default, warning | P1 | later | safe-now | Optional; population is textual today. |

## 4) Structure/building visuals used in runtime UI

### 4.1 Production-ready now (P0 readability)

All implemented economy buildings are displayed in runtime cards and/or tiles. For readability now:

- **Building card visual**: `256x144 PNG` (used in command cards; existing card image region is 72px high but production master should be larger, downscaled).
- **Building tile visual**: `256x168 PNG` (used in economy tile media region).
- **Small HUD/list icon**: optional P1 (not currently required by code).

| Asset ID | Asset label | Surface | Related component(s) | Building key | Asset type | Format | Suggested dimensions | Variants/states | Priority | Needed now? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `building.hq.card` / `building.hq.tile` | HQ visual | Command card + economy tile | `CityFoundationMode` | `hq` | card visual + tile visual | PNG | 256x144 / 256x168 | default | P0 | yes | safe-now | Existing file exists but naming normalization recommended. |
| `building.mine.card` / `building.mine.tile` | Mine visual | Command card + economy tile | `CityFoundationMode` | `mine` | card visual + tile visual | PNG | 256x144 / 256x168 | default | P0 | yes | safe-now | Currently shares `stone.png` with quarry; split recommended for clarity. |
| `building.quarry.card` / `building.quarry.tile` | Quarry visual | Command card + economy tile | `CityFoundationMode` | `quarry` | card visual + tile visual | PNG | 256x144 / 256x168 | default | P0 | yes | safe-now | Currently same file as mine; needs differentiated art. |
| `building.refinery.card` / `building.refinery.tile` | Refinery visual | Command card + economy tile | `CityFoundationMode` | `refinery` | card visual + tile visual | PNG | 256x144 / 256x168 | default | P0 | yes | safe-now | Existing filename typo `refeniry.png` can be replaced with canonical name. |
| `building.warehouse.card` / `building.warehouse.tile` | Warehouse visual | Command card + economy tile | `CityFoundationMode` | `warehouse` | card visual + tile visual | PNG | 256x144 / 256x168 | default | P0 | yes | safe-now | Existing file present. |
| `building.housing_complex.card` / `building.housing_complex.tile` | Housing Complex visual | Command card + economy tile | `CityFoundationMode` | `housing_complex` | card visual + tile visual | PNG | 256x144 / 256x168 | default | P0 | yes | safe-now | Existing file present. |
| `building.barracks.card` / `building.barracks.tile` | Barracks visual | Command card | `CityFoundationMode` | `barracks` | card visual (+tile optional) | PNG | 256x144 | default | P0 | yes | safe-now | Used in command section; tile not currently in economy list but keep optional if reused elsewhere. |
| `building.space_dock.card` / `building.space_dock.tile` | Space Dock visual | Command card | `CityFoundationMode` | `space_dock` | card visual (+tile optional) | PNG | 256x144 | default | P0 | yes | safe-now | Existing file present. |
| `building.defensive_wall.card` / `building.defensive_wall.tile` | Defensive Wall visual | Command card | `CityFoundationMode` | `defensive_wall` | card visual | PNG | 256x144 | default | P0 | yes | safe-now | Existing file present. |
| `building.skyshield_battery.card` / `building.skyshield_battery.tile` | Skyshield Battery visual | Command card | `CityFoundationMode` | `skyshield_battery` | card visual | PNG | 256x144 | default | P0 | yes | safe-now | Existing file present. |
| `building.intelligence_center.card` / `building.intelligence_center.tile` | Intelligence Center visual | Command card | `CityFoundationMode` | `intelligence_center` | card visual | PNG | 256x144 | default | P0 | yes | safe-now | Existing file present. |
| `building.research_lab.card` / `building.research_lab.tile` | Research Lab visual | Command card | `CityFoundationMode` | `research_lab` | card visual | PNG | 256x144 | default | P0 | yes | safe-now | Existing file present. |
| `building.market.card` / `building.market.tile` | Market visual | Command card | `CityFoundationMode` | `market` | card visual | PNG | 256x144 | default | P0 | yes | safe-now | Existing file present. |
| `building.council_chamber.card` / `building.council_chamber.tile` | Council Chamber visual | Command card | `CityFoundationMode` | `council_chamber` | card visual | PNG | 256x144 | default | P0 | yes | safe-now | Existing file present, filename typo normalization recommended (`councill`). |
| `building.armament_factory.card` / `building.armament_factory.tile` | Armament Factory visual | Command card | `CityFoundationMode` | `armament_factory` | card visual | PNG | 256x144 | default + fallback/empty | P0 | yes | safe-now | **Missing today** (no entry in `BUILDING_ASSETS`) causing `No Art` fallback; immediate P0 production target. |

### 4.2 Optional later (P1/P2)

| Asset ID | Asset label | Surface | Related component(s) | Asset type | Format | Suggested dimensions | Variants/states | Priority | Needed now? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `building.{id}.thumb` | Small building thumbnail set | Link rows/detail headers | `CityFoundationMode` | thumbnail icon | PNG/SVG | 48x48 | default | P1 | later | safe-now | Not required by current rendering, useful if rows gain icons. |
| `building.{id}.world_tile` | In-city world/canvas sprite | Future city-canvas building placement | (no active runtime hook) | tile/sprite | PNG | 128x128 | default, selected | P2 | later | blocked | No runtime city-canvas renderer currently consumes building sprites. |

## 5) Status / action icons mapped to real runtime needs

| Asset ID | Asset label | Surface | Related component(s) | Related runtime need | Asset type | Format | Suggested dimensions | Variants/states | Priority | Needed now? | Status | Blocking reason if blocked | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `status.available` | Available status badge | Building cards/research/intel/military cards | `CityFoundationMode`, `cityViewUiHelpers` | `AVAILABLE` states | badge | SVG | 14x14 or 16x16 | default, active | P0 | yes | safe-now | — | Text exists today; icon badge can complement color text. |
| `status.locked` | Locked status badge | Building/research cards | `CityFoundationMode`, `cityViewUiHelpers` | `LOCKED`/requirement blocked | badge | SVG | 14x14 | default | P0 | yes | safe-now | — | Mirrors `city-stitch__state--locked`. |
| `status.max_level` | Max level badge | Building card/detail | `CityFoundationMode`, `cityViewUiHelpers` | `MAX LEVEL` | badge | SVG | 14x14 | default, muted | P1 | later | safe-now | — | Optional; textual state is clear. |
| `status.queue_full` | Queue full warning icon | HUD alerts / button disabled copy | `CityFoundationMode` | Queue capacity reached | badge | SVG | 14x14 | warning | P0 | yes | safe-now | — | `getHudAlert()` uses explicit “Build queue full”. |
| `status.pop_cap` | Population cap warning icon | HUD alerts / build button disabled copy | `CityFoundationMode` | Population cap reached | badge | SVG | 14x14 | warning | P0 | yes | safe-now | — | `getHudAlert()` uses explicit “Population cap reached”. |
| `status.idle` | Idle status icon | Queue module | `CityFoundationMode` | Build idle state | badge | SVG | 14x14 | default | P1 | later | safe-now | — | Complements `Build 0/2 · idle` line. |
| `status.progress` | Progress marker icon | Queue row header | `CityFoundationMode` | Active timed task | badge | SVG | 12x12 | default | P1 | later | safe-now | — | Could pair with existing progress bar. |
| `action.upgrade` | Upgrade action icon | Upgrade button | `CityFoundationMode` | Start building upgrade | icon | SVG | 16x16 | default, disabled | P1 | later | safe-now | — | Purely optional polish. |
| `action.train` | Train action icon | Train button | `CityFoundationMode` | Start troop training | icon | SVG | 16x16 | default, disabled | P2 | later | safe-now | Unit art scope is deferred; icon not mandatory now. |
| `action.research` | Research action icon | Start research button | `CityFoundationMode` | Start research queue entry | icon | SVG | 16x16 | default, disabled | P2 | later | safe-now | Research visuals not P0. |

## 6) City/colony panel visual tokens (reusable UI pieces)

These are not full art illustrations; they are reusable visual tokens for consistency.

| Asset ID | Asset label | Surface | Related component(s) | Asset type | Format | Suggested dimensions | Variants/states | Priority | Needed now? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `token.panel.corner` | Panel corner motif | HUD frame, inspect panels, city panels | shared CSS surfaces | panel token | SVG or CSS token only | 12x12 corner element | default | P1 | later | safe-now | Existing CSS already provides borders/glows; token optional. |
| `token.slot.placeholder` | Empty building slot placeholder | Missing art fallback (`No Art`) | `CityFoundationMode` | panel token | SVG | 64x64 (scales) | default | P0 | yes | safe-now | Immediate replacement for plain fallback text improves readability. |
| `token.selection.marker` | Selected structure marker | Building card selected state | `CityFoundationMode` | panel token | SVG/CSS | 24x24 corner accent | selected | P0 | yes | safe-now | Currently only border highlight; marker improves target recognition. |
| `token.queue.progress_cap` | Queue/progress end-cap ornament | Queue progress bar | `CityFoundationMode` | panel token | SVG/CSS | 8x8 / 12x12 | default | P1 | later | safe-now | Optional polish; progress bars already functional. |
| `token.section.status_core_live_partial` | Section state mini-token set | Left nav status chip | `CityFoundationMode` | badge | SVG | 12x12 | core/live/partial | P1 | later | safe-now | Can accompany existing text, not replace immediately. |

---

## Existing iso asset coverage assessment

Repository audit result for `public/assets/iso/*` and equivalent runtime path usage:

- `public/` directory: **not present in this repository**.
- `public/assets/iso/*`: **not present**.
- Any `assets/iso/*` directory under repo root: **not present**.
- Runtime references to `/assets/iso/...`: **none found**.

Assessment table:

| File path | Probable intended building match | Matches current runtime structure? | Currently used? | Reusable? | Deprecate? | Notes |
|---|---|---|---|---|---|---|
| _None found_ | — | — | — | — | — | No iso asset files exist in repo at audit time. |

Interpretation:

- There is **no current iso asset inventory** to reuse for runtime building visuals.
- Reuse strategy should focus on existing `assets/building/*.png` files (non-iso) and produce missing standardized variants.

---

## P0 production list (actionable now)

1. Replace text glyph mode/nav identifiers with icon set:
   - Mode switch: galaxy/planet/city.
   - City section nav: command/economy/military/defense minimum.
2. Deliver runtime resource icon set:
   - ore, stone, iron.
3. Fill building visual gaps and normalize:
   - provide missing `armament_factory` card visual.
   - split mine vs quarry visual identity.
   - normalize typo-prone legacy names into canonical naming.
4. Deliver status/warning badges:
   - available, locked, queue-full, population-cap.
5. Deliver fallback/selection tokens:
   - empty-slot placeholder token.
   - selected-structure marker token.

---

## Blocked/future appendix (explicitly not current production scope)

- Unit portrait/card art families (military roster) → **blocked for this pass** by mission scope.
- Research iconography atlas for all nodes → **blocked for this pass** by mission scope.
- Full in-world city canvas tile/sprite system for placed buildings → **later/blocked** until runtime renderer consumes building sprite assets directly.
