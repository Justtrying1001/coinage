# Defensive Wall

## Overview
- Runtime building id: `defensive_wall`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 400/350/200 | 80 | 2 | groundWallDefensePct:3.7, groundWallBaseDefense:1.5 |
| 5 | 400/1750/1175 | 3249 | 13 | groundWallDefensePct:19.7, groundWallBaseDefense:7.9 |
| 25 | 400/8750/6899 | 58506 | 84 | groundWallDefensePct:141.9, groundWallBaseDefense:56.8 |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: barracks 3.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
