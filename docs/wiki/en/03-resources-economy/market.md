# Market

## Runtime status
Partially implemented.

## What exists in runtime
- `market` building levels define `shipmentCapacity` per level.
- Dispatch guard checks capacity and available resources before transfer.
- UI exposes market level and transfer-capacity probe in city view.

## What is not complete
- Full player-facing exchange/order-book style trade flow is not implemented.

## Source notes
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/render/modes/CityFoundationMode.ts`
