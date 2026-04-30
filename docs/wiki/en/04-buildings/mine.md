# Mine

## Overview
- Runtime building id: `mine`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 3/2/1 | 2 | 1 | orePerHour:8 |
| 5 | 55/59/44 | 33 | 2 | orePerHour:30 |
| 40 | 2877/4628/3448 | 93576 | 4 | orePerHour:275 |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: mine 1.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
