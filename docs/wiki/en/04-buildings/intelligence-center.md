# Intelligence Center

## Overview
- Runtime building id: `intelligence_center`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 200/400/700 | 37 | 3 | detectionPct:3, counterIntelPct:4 |
| 5 | 1621/2000/2980 | 1949 | 7 | detectionPct:15, counterIntelPct:20 |
| 10 | 3991/4000/5560 | 10694 | 10 | detectionPct:30, counterIntelPct:40 |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: market 4, warehouse 7.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
