# Formulas

## Queues and timers formulas (runtime-backed)
- Construction duration uses per-level base `buildSeconds` plus world-speed reference transform in economy runtime.
- Production claim uses elapsed time since last update/claim and per-hour production, then clamps by storage cap.
- Training/research complete when queue item `endsAtMs <= nowMs`.

## Source notes
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyState.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
