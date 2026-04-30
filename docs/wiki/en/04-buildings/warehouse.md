# Warehouse

## Overview
- Runtime building id: `warehouse`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 0/0/0 | 0 | 0 | storageCap:{'ore': 300, 'stone': 300, 'iron': 300} |
| 5 | 242/381/130 | 114 | 0 | storageCap:{'ore': 2267, 'stone': 2267, 'iron': 2267} |
| 35 | 7781/12228/5486 | 100587 | 0 | storageCap:{'ore': 28142, 'stone': 28142, 'iron': 28142} |

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
