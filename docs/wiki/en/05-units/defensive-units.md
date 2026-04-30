# Defensive Units

## Runtime status
Partially implemented.

There is no separate standalone defensive-unit config group; defense behavior is derived from unit stats plus building/research/policy modifiers.

## What is runtime-backed
- Unit defense stats (`defenseBlunt`, `defenseSharp`, `defenseDistance`, naval defense where present).
- City-defense-only modifiers from `defensive_wall` and `skyshield_battery`.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
