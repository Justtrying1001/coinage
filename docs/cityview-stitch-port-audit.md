# Cityview Stitch Port Audit

## Stitch extraction audit

Source extracted from `design/stitch_coinage_city_management_interface.zip`.

Identified visual screens:
- `coinage_city_view_refined`: composite city command view with top bar, left nav, center cards, right detail panel, bottom queue strip.
- Branch-specific screens:
  - `economy_branch`
  - `military_branch`
  - `defense_branch`
  - `research_branch`
  - `intelligence_branch`
  - `governance_branch`
  - `market_branch_exchange_hub`

Shared Stitch layout primitives observed:
1. **Top resource/status bar**: fixed `h-16`, dark obsidian background, gold brand, compact resource boxes, population/storage telemetry and icons.
2. **Left navigation rail**: vertical branch rail, fixed width, active tab highlighted with left accent.
3. **Central content zone**: branch-specific cards/boards/modules, heavy use of surface layers instead of light cards.
4. **Right detail/context panel**: fixed contextual panel for selected building/action details.
5. **Bottom operations/queue bar**: fixed strip with queue/task snapshots.
6. **Card patterns**: hard corners, tonal layers, subtle ghost borders, uppercase label hierarchy.
7. **Typography/color/borders**: Space Grotesk + Manrope, primary gold + cyan accents, no rounded corners, dark surface stack.

---

## A) Visual layer (current Coinage cityview before port)

Current cityview entrypoint:
- `src/game/render/modes/CityFoundationMode.ts` mounted under render mode `city3d`.

Current visual characteristics:
- Existing UI used custom `citycmd` and `city-management` classes.
- Visual structure already had top section, left rail, center stage, right context, and queue strip but did **not** match Stitch exported layouts faithfully (different composition/spacing/card treatment).
- Style definitions were concentrated in `src/styles/globals.css` under `.citycmd*` and `.city-management*` blocks.

Primary visual files audited:
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`

Canonical existing building visuals (pre-existing in repo): root `assets/*.png` (e.g., `HQ.png`, `housing.png`, `market.png`, `researchlabs.png`, `spycenter.png`, `warehouse.png`, etc.).

---

## B) Gameplay/runtime/data layer (functional source of truth)

Runtime sources used by cityview:
- **State + derived stats + guards/actions**: `src/game/city/economy/cityEconomySystem.ts`
- **Persistence and mutation wrappers**: `src/game/city/economy/cityEconomyPersistence.ts`
- **Content definitions** (buildings/research/troops/policies + branch ordering): `src/game/city/economy/cityEconomyConfig.ts`

Real systems confirmed as implemented and usable in city UI wiring:
- Buildings + upgrade levels + unlock requirements + upgrade costs/timers.
- Construction queue slots/cap and queue timers.
- Resource stock + production/hour + storage caps.
- Population cap/usage snapshots.
- Troop training queue and guards.
- Research queue and guards.
- Intelligence project queue/readiness and guards.
- Governance policies and guards.
- Derived effects (defense, mitigation, detection, counter-intel, training speed, market efficiency, etc.).

Systems visually represented but branch-specific deep operations still limited by runtime scope:
- Dedicated defense board actions beyond building upgrade are not separately implemented.
- Dedicated market exchange operations beyond building/effect layer are not separately implemented.

Port strategy:
- Keep runtime and mutation calls grounded in these real modules.
- Replace the city visual shell with Stitch-faithful layout primitives.
- Keep non-implemented branch-specific operations visually present with disabled/unavailable messaging instead of invented behavior.


Current Stitch replacement target branches: Command, Economy, Military, Defense, Research, Intelligence, Governance, Market.
