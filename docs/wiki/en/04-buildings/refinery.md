# Refinery

## Overview
- Runtime building id: `refinery`.
- Data-backed from economy config and level tables.

## Current implementation
- Used by runtime construction queue, resource costs, and prerequisite guards.
- Used by city UI detail cards (`CityFoundationMode`).

## Level table (sample)
| Level | Cost (ore/stone/iron) | Build s | Pop | Effect |
|---|---:|---:|---:|---|
| 1 | 5/2/4 | 2 | 1 | ironPerHour:8 |
| 5 | 106/50/72 | 58 | 2 | ironPerHour:30 |
| 40 | 5532/3200/3060 | 76758 | 4 | ironPerHour:275 |

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
