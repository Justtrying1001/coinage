# Council Chamber

## Overview
- Runtime building id: `council_chamber`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 0/0/0 | 0 | 1 | none |
| 5 | 152/93/64 | 128 | 4 | none |
| 25 | 6077/6884/3283 | 46114 | 8 | none |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: market 10, research_lab 15.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
