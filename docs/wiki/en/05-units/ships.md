# Ships / Naval-Projection Units

## Runtime status
Runtime implemented.

Naval/air-projection units are configured in `CITY_ECONOMY_CONFIG.troops` and gated by `space_dock` + research where required.

## Runtime rules
- Uses same queue/timer flow as other troops.
- Requires required building level and research prerequisite.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
