# Barracks

## Overview
- Runtime building id: `barracks`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 70/20/40 | 634 | 1 | trainingSpeedPct:0 |
| 5 | 499/294/477 | 4742 | 8 | trainingSpeedPct:4 |
| 30 | 4438/5859/7531 | 44535 | 83 | trainingSpeedPct:29 |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: refinery 1, housing_complex 3, mine 1.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
