# Research Overview

Runtime research is fully configured in `CITY_ECONOMY_CONFIG.research` with costs, RP costs, durations, required lab level, and prerequisite research IDs.

## Current implementation
- Implemented in runtime: research unlock guards, RP-capacity checks, resource payment, queue/timer resolution, derived effect application.

## Effect families in runtime
- Production, build speed, training speed
- Defense and anti-air modifiers
- Detection/counter-intel
- Market efficiency

## Data sources
- `src/game/city/economy/cityEconomyConfig.ts` (research definitions)
- `src/game/city/economy/cityEconomySystem.ts` (queue and effect application)
- `src/game/city/economy/cityEconomyState.ts` (queue state)
