# Military Units (Ground)

## Runtime status
Runtime implemented.

Ground units are defined in `CITY_ECONOMY_CONFIG.troops` with cost, training seconds, combat stats, speed, and guards.

## Core runtime rules
- Requires `barracks` level gates per unit.
- Optional research prerequisite per unit.
- Uses training queue with resource payment and timer completion.

## Data source
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
