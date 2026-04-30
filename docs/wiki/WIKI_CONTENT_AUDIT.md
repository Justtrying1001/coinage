# Wiki Content Audit (Global, runtime-backed)

## 1) World / navigation
- Sources: `src/lib/wikiNav.ts`, `src/app/wiki/[[...slug]]/page.tsx`, `src/game/world/*`, `src/game/planet/*`.
- Status: **Partially implemented**.
- Wiki scope: routing, wiki categories, galaxy/planet generation concepts; avoid claiming full meta-world gameplay loops.

## 2) Resources
- Sources: `cityEconomyConfig.ts`, `cityEconomySystem.ts`, `CityFoundationMode.ts`, docs in `docs/01-Lexique-Ressources.md`.
- Data: ore/stone/iron + population meta.
- Status: **Runtime implemented**.

## 3) Production
- Sources: `cityEconomySystem.ts`, building effects tables.
- Data: per-hour production from mine/quarry/refinery + claim-on-access.
- Status: **Runtime implemented**.

## 4) Storage
- Sources: warehouse levels in `cityBuildingLevelTables.ts`, storage cap helpers in `cityEconomySystem.ts`.
- Status: **Runtime implemented**.

## 5) Buildings
- Sources: `CITY_ECONOMY_CONFIG.buildings`, `CITY_BUILDING_LEVEL_TABLES`, `cityContentCatalog.ts`.
- Status: **Runtime implemented** (some UI surfaces partial).

## 6) Units
- Sources: `CITY_ECONOMY_CONFIG.troops`, training queue in runtime.
- Status: **Runtime implemented** for unit config + training loop, **partial** for full macro combat ecosystem.

## 7) Research
- Sources: `CITY_ECONOMY_CONFIG.research`, research queue/runtime checks.
- Status: **Runtime implemented**.

## 8) Queues / timers
- Sources: `cityEconomyState.ts`, `cityEconomySystem.ts`.
- Data: construction queue, training queue, research queue, queue caps, timestamps.
- Status: **Runtime implemented**.

## 9) Combat
- Sources: troop stats/config + derived modifiers in economy runtime and tests.
- Status: **Partially implemented** (modifiers/guards exist; full battle engine docs incomplete).

## 10) Colonization
- Sources: colonization troop + research entries, wiki/docs pages.
- Status: **Partially implemented / planned**.

## 11) Espionage / intel
- Sources: intelligence center levels/effects, research modifiers, intel project loop in runtime.
- Status: **Partially implemented**.

## 12) Governance / policies
- Sources: `CITY_ECONOMY_CONFIG.policies`, council chamber progression.
- Status: **Partially implemented** (local policy layer runtime; alliance governance mostly docs/planned).

## 13) Market
- Sources: market building + shipment capacity + dispatch guards.
- Status: **Partially implemented** (core capacity guards runtime, full trade UX incomplete).

## 14) Shards / premium economy
- Sources: feature flags in economy config (`shardsEnabled`, premium flags).
- Status: **Planned / disabled**.

## 15) Token systems / factions / servers
- Sources: wiki docs + config flags (`holdingMultiplierEnabled` false).
- Status: **Documented only / planned**.

## Pages corrected in this pass
- Buildings: index + detailed runtime pages.
- Resources/Economy: market/shards clarified.
- Units: overview + category pages with runtime/partial status.
- Research: overview + branch pages statusized.
- Combat/Colonization/Governance/Token: placeholders replaced by explicit runtime truth labels.
- Reference formulas updated for queue/timer runtime behavior.
