# WIKI Canon Audit

## Scope and method
Audit based on runtime code in `src/game/**`, app routing in `src/app/wiki/**`, and product docs in `docs/**`.

## System status matrix
- **City loop (build/produce/upgrade queues/timers)**: **Implemented in runtime** (`cityEconomySystem.ts`, tests, building tables).
- **Resources/production/storage**: **Implemented in runtime** (`cityEconomyConfig.ts`, `cityEconomySystem.ts`, warehouse/mine/quarry/refinery effects).
- **Buildings data and effects**: **Implemented in runtime** (building catalogs/config + level tables).
- **Units training and stats**: **Partially implemented** (training/runtime stats present; full world combat consumers still partial).
- **Research queue and unlock guards**: **Partially implemented** (queue and gates exist; several research outputs are still meta-only).
- **Galaxy/planet/city navigation/rendering**: **Implemented in runtime** (`render/modes/*`, `world/galaxyGenerator.ts`, planet runtime).
- **Combat**: **Partially implemented** (defense/derived stats and docs exist; full macro battle resolution still incomplete).
- **Colonization**: **Documented only** (docs and unit/research references; no complete runtime colonization loop found).
- **Espionage/intel**: **Design in progress** (building/docs references, no complete spy mission runtime loop detected).
- **Governance/policies/alliances/wars**: **Planned / design in progress** (documented in wiki/docs, no fully wired runtime flow).
- **Market**: **Partially implemented** (market efficiency effects/config present; full player trade loop not fully proven).
- **Token systems / token servers / factions**: **Documented only / planned** (strong doc layer; runtime core loop not found).
- **Shards**: **Documented only** (wiki docs present, no clear runtime economy consumer detected).

## Evidence pointers
- Runtime economy core: `src/game/city/economy/cityEconomySystem.ts`
- Economy config and static data: `src/game/city/economy/cityEconomyConfig.ts`, `cityBuildingLevelTables.ts`, `cityContentCatalog.ts`
- Rendering and world layers: `src/game/render/modes/*`, `src/game/world/galaxyGenerator.ts`, `src/game/planet/runtime/*`
- Canon docs: `docs/wiki/**`, `docs/building/**`, `docs/research/**`, `docs/units/**`
