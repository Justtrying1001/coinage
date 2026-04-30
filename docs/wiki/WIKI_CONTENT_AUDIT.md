# WIKI CONTENT AUDIT — source of truth (2026-04-30)

## Scope and method
Mandatory repo scans were executed over `docs/`, `src/`, and the root (no `app/` directory exists in this repo). Runtime authority is in `src/game/city/economy/*`; docs authority is in `docs/building`, `docs/units`, `docs/research`.

## System audit matrix

### Buildings
- Sources read:
  - `src/game/city/economy/cityEconomyConfig.ts`
  - `src/game/city/economy/cityBuildingLevelTables.ts`
  - `src/game/city/economy/cityContentCatalog.ts`
  - `docs/building/*.md`
- Data found: canonical IDs, unlock gates, prerequisites, level effects, costs, construction times.
- Real status: **Runtime implemented**.
- Wiki pages: `docs/wiki/04-buildings/*` (+ `en/04-buildings/*`).
- To transcribe: complete level tables for all runtime buildings (mine, quarry, refinery, warehouse, hq, barracks, space_dock, research_lab, armament_factory, council_chamber, intelligence_center, market, defensive_wall, skyshield_battery, housing_complex).
- Missing fields: none for core building runtime data.

### Resources
- Sources read: `cityEconomyConfig.ts`, `cityEconomySystem.ts`, `docs/01-Lexique-Ressources.md`.
- Data found: ore/stone/iron production and storage, population and soft economy fields.
- Real status: **Runtime implemented**.
- Wiki pages: `docs/wiki/03-resources-economy/resources.md`, `production.md`, `storage.md`.
- Missing fields: premium shard live loop is absent in runtime.

### Units
- Sources read: `cityEconomyConfig.ts` troops section, runtime guards in `cityEconomySystem.ts`, `docs/units/*.md`.
- Data found: unit costs, durations, stat blocks, building/research gates.
- Real status: **Runtime implemented** for training/config; **Partially implemented** for broader battle usage.
- Wiki pages: `docs/wiki/05-units/*`.

### Research
- Sources read: `cityEconomyConfig.ts`, `cityEconomySystem.ts`, `docs/research/research_matrix.md`, `docs/research/items/*.md`.
- Data found: full research node table, RP costs, durations, prerequisites, effects, unlock links.
- Real status: **Runtime implemented**.
- Wiki pages: `docs/wiki/06-research/*`.

### Queues & timers
- Sources read: `cityEconomySystem.ts`, state types/tests, `CityFoundationMode.ts`.
- Data found: build queue, training queue, research queue, timestamp completion, claim-on-access resource accrual.
- Real status: **Runtime implemented**.
- Wiki pages: `docs/wiki/12-reference/formulas.md`, `tables.md`, combat/colonization where timing is referenced.

### Combat
- Sources read: troop stats + derived combat modifiers in economy layer and city UI helpers.
- Data found: modifiers and readiness values, no dedicated battle resolver module in this runtime slice.
- Real status: **Partially implemented**.
- Wiki pages: `docs/wiki/07-combat/*`.

### Colonization
- Sources read: troop/research gates (`colonization_arkship`, `colony_ark`, `conquest`) + docs.
- Data found: prerequisite and unlock information, limited end-to-end colonization runtime flow.
- Real status: **Partially implemented / Documented only for macro loop**.
- Wiki pages: `docs/wiki/08-colonization/*`.

### Espionage
- Sources read: intelligence center effects, intel projects, cryptography/espionage research, mission guards.
- Data found: local intel readiness/project loop and vault interactions.
- Real status: **Partially implemented**.
- Wiki pages: `docs/wiki/07-combat/scouting-and-espionage.md`, `docs/wiki/06-research/espionage-research.md`.

### Governance
- Sources read: policies in economy config, council progression, governance docs.
- Data found: local city policy application is runtime; alliance governance is doc-level.
- Real status: **Partially implemented**.
- Wiki pages: `docs/wiki/09-alliances-governance/*`.

### Market
- Sources read: market building effects, shipment capacity/guard code, docs/audits.
- Data found: capacity/efficiency stats and guard rails; no full orderbook/live trade runtime.
- Real status: **Partially implemented**.
- Wiki pages: `docs/wiki/03-resources-economy/market.md`, `docs/wiki/04-buildings/market.md`.

### Token systems
- Sources read: token wiki docs + flags in runtime config.
- Data found: feature flags and design intent only.
- Real status: **Documented only / Planned**.
- Wiki pages: `docs/wiki/10-token-systems/*`, `docs/wiki/02-world/token-factions.md`.

## Global blocker list for wiki completion
1. A large set of wiki pages still contains `To complete` / `À compléter` placeholder content.
2. Many FR and EN mirrors are divergent in completeness.
3. Some building pages still present sample-style summaries instead of complete tables.
4. Several macro systems (alliances, token systems, full combat resolution) remain doc-first and not runtime-backed.

## Required next actions (content phase before UI phase)
- Replace all placeholder wiki pages with runtime/doc-backed sections per page standard.
- Generate complete per-level tables from runtime building level tables.
- Use research/unit source catalogs to produce exhaustive tables (no samples).
- Only after full content parity, proceed with premium UI overhaul.
