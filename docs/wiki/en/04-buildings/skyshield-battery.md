# Skyshield Battery

## Overview
- Runtime building id: `skyshield_battery`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 400/350/200 | 80 | 2 | airWallDefensePct:2.2, airWallBaseDefense:3.3 |
| 5 | 400/1750/1175 | 3249 | 13 | airWallDefensePct:11.8, airWallBaseDefense:17.7 |
| 20 | 400/7000/5397 | 43774 | 65 | airWallDefensePct:62.0, airWallBaseDefense:93.0 |

## Requirements / unlocks
- Unlock at HQ: `1`.
- Prerequisites: space_dock 3.

## Strategy notes
- Prioritize this building when its effect is a direct bottleneck (production, storage, training, or combat modifiers).

## Related systems
- Construction queue, population usage, research and troop guards, and derived stats.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
