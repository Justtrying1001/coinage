# Cityview Stitch Port Audit

## Stitch extraction audit

Source extracted from `design/stitch_coinage_city_management_interface.zip`.

Identified visual screens:
- `coinage_city_view_refined`: composite city command view with top bar, left nav, center content, right detail panel, bottom queue strip.
- Branch screens:
  - economy, military, defense, research, intelligence, governance, market exchange hub.

Shared layout primitives observed:
1. Top resource/status bar
2. Left branch navigation
3. Central branch content panel
4. Right context/detail panel
5. Bottom queue/operations strip

---

## A) Visual layer

Current city entrypoint:
- `src/game/render/modes/CityFoundationMode.ts` (`city3d` mode)

Canonical target branch model:
- Command/Home
- Economy
- Military
- Defense
- Research
- Intelligence
- Governance
- Market

Canonical existing building visuals (pre-existing in repo): root `assets/*.png`.

---

## B) Gameplay/runtime/data layer

Runtime source of truth:
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/city/economy/cityEconomyConfig.ts`

Runtime-confirmed systems:
- Building upgrades (levels/costs/guards/queue)
- Resource production/caps/population
- Troop training
- Research queue/start
- Intel projects/readiness
- Governance policies
- Derived city stats/effects

Partially supported domain surfaces:
- Defense page: branch-specific non-building operations not fully implemented.
- Market page: exchange execution flow not implemented in runtime (page stays explicit unavailable).
