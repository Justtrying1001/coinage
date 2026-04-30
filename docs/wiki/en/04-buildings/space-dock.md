# Space Dock

## Overview
- Runtime building id: `space_dock`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 400/200/100 | 95 | 4 | trainingSpeedPct:0 |
| 5 | 1703/968/587 | 2794 | 4 | trainingSpeedPct:4 |
| 30 | 8540/5605/4215 | 44565 | 4 | trainingSpeedPct:29 |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: mine 15, refinery 10.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
