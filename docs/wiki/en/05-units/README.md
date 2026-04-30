# Units Overview

Runtime units are fully configured in `CITY_ECONOMY_CONFIG.troops` with costs, training duration, population cost, required building, and optional required research.

## Current implementation
- Implemented in runtime: unit unlock guards, cost payments, training queue/timers, completion application.
- Categories present: militia, ground, naval.

## Data sources
- `src/game/city/economy/cityEconomyConfig.ts` (unit definitions)
- `src/game/city/economy/cityEconomySystem.ts` (training queue + guards)
- `src/game/city/economy/cityEconomyState.ts` (queue state)
