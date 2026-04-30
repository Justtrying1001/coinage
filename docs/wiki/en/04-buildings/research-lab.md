# Research Lab

## Overview
- Runtime building id: `research_lab`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 100/200/120 | 107 | 3 | researchCapacity:4 |
| 5 | 701/1175/828 | 3997 | 15 | researchCapacity:4 |
| 35 | 7385/9989/8552 | 101135 | 105 | researchCapacity:4 |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: housing_complex 6, barracks 5.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
